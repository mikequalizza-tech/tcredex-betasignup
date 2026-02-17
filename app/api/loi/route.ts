/**
 * tCredex LOI API
 *
 * GET /api/loi - List LOIs (filtered by query params)
 * POST /api/loi - Create new LOI
 *
 * CRITICAL: All endpoints require authentication and org filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { getLOIService } from "@/lib/loi";
import { CreateLOIInput, LOIStatus } from "@/types/loi";
import {
  requireAuth,
  handleAuthError,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/notifications/emit";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { loiInputSchema } from "@/lib/api/schemas";

// =============================================================================
// GET /api/loi
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("deal_id");
    const cdeId = searchParams.get("cde_id");
    const sponsorId = searchParams.get("sponsor_id");
    const statusParam = searchParams.get("status");

    const service = getLOIService();
    const status = statusParam?.split(",") as LOIStatus[] | undefined;

    let lois;

    if (dealId) {
      // CRITICAL: Verify user can access this deal
      await verifyDealAccess(request, user, dealId, "view");
      lois = await service.getByDeal(dealId);
    } else if (cdeId) {
      if (
        user.organizationType !== "cde" &&
        user.organizationType !== "admin"
      ) {
        return NextResponse.json(
          { success: false, error: "You are not authorized to view CDE LOIs" },
          { status: 403 },
        );
      }
      // CRITICAL: Verify user's org is the CDE or user is admin
      if (user.organizationType === "cde") {
        const myCdeId = await getCdeIdForOrganization(
          supabase,
          user.organizationId,
        );
        if (!myCdeId || myCdeId !== cdeId) {
          return NextResponse.json(
            {
              success: false,
              error: "You can only view LOIs for your organization",
            },
            { status: 403 },
          );
        }
      }
      lois = await service.getByCDE(cdeId, status);
    } else if (sponsorId) {
      if (
        user.organizationType !== "sponsor" &&
        user.organizationType !== "admin"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not authorized to view sponsor LOIs",
          },
          { status: 403 },
        );
      }
      // CRITICAL: Verify user's org is the sponsor or user is admin
      if (user.organizationType === "sponsor") {
        const mySponsorId = await getSponsorIdForOrganization(
          supabase,
          user.organizationId,
        );
        if (!mySponsorId || mySponsorId !== sponsorId) {
          return NextResponse.json(
            {
              success: false,
              error: "You can only view LOIs for your organization",
            },
            { status: 403 },
          );
        }
      }
      lois = await service.getBySponsor(sponsorId, status);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Must provide deal_id, cde_id, or sponsor_id",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      lois,
      total: lois.length,
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/loi
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    if (user.organizationType !== "cde" && user.organizationType !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only CDE users can create LOIs" },
        { status: 403 },
      );
    }

    const body = await parseBody(request, loiInputSchema);
    if (isValidationError(body)) return body;
    const { input } = body as { input: CreateLOIInput };

    // CRITICAL: Verify user's org is the CDE issuing the LOI
    if (user.organizationType === "cde") {
      const supabase = getSupabaseAdmin();
      const myCdeId = await getCdeIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (!myCdeId || myCdeId !== input.cde_id) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only issue LOIs for your organization",
          },
          { status: 403 },
        );
      }
    }

    // CRITICAL: Verify user can access the deal
    await verifyDealAccess(request, user, input.deal_id, "view");

    const service = getLOIService();
    const loi = await service.create(input, user.id);

    // Send notification to sponsor about new LOI
    try {
      const supabase = getSupabaseAdmin();

      // Get deal info for notification
      const { data: deal } = await supabase
        .from("deals")
        .select("project_name")
        .eq("id", input.deal_id)
        .single();

      // Get CDE info for notification
      const { data: cde } = await supabase
        .from("cdes_merged")
        .select("name")
        .eq("id", input.cde_id)
        .single();

      if (deal && cde) {
        const allocationFormatted = input.allocation_amount
          ? `$${(input.allocation_amount / 1000000).toFixed(1)}M`
          : "TBD";

        await notify.loiReceived(
          input.deal_id,
          deal.project_name || "Your Project",
          cde.name || "A CDE",
          allocationFormatted,
        );
      }
    } catch (notifyError) {
      console.error("Failed to send LOI notification:", notifyError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      loi,
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getCdeIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("cdes")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  if (data) {
    return (data as { id: string }).id;
  }

  const { data: mergedData } = await supabase
    .from("cdes_merged")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1)
    .single();

  return (mergedData as { id: string } | null)?.id || null;
}

async function getSponsorIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("sponsors")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  return (data as { id: string } | null)?.id || null;
}
