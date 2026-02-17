/**
 * tCredex Commitment API
 *
 * GET /api/commitments - List commitments (filtered by query params)
 * POST /api/commitments - Create new commitment
 */

import { NextRequest, NextResponse } from "next/server";
import { getCommitmentService } from "@/lib/loi";
import { CreateCommitmentInput, CommitmentStatus } from "@/types/loi";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { commitmentInputSchema } from "@/lib/api/schemas";

// =============================================================================
// GET /api/commitments
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("deal_id");
    let investorId = searchParams.get("investor_id");
    let cdeId = searchParams.get("cde_id");
    let sponsorId = searchParams.get("sponsor_id");
    const statusParam = searchParams.get("status");

    const service = getCommitmentService();
    const status = statusParam?.split(",") as CommitmentStatus[] | undefined;
    const supabase = getSupabaseAdmin();

    if (dealId) {
      await verifyDealAccess(request, user, dealId, "view");
    }

    if (user.organizationType === "sponsor") {
      const mySponsorId = await getSponsorIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (!mySponsorId) {
        return NextResponse.json(
          { success: false, error: "Sponsor profile not found" },
          { status: 403 },
        );
      }
      if (sponsorId && sponsorId !== mySponsorId) {
        return NextResponse.json(
          { success: false, error: "You can only view your own commitments" },
          { status: 403 },
        );
      }
      if (!dealId && !sponsorId && !investorId && !cdeId) {
        sponsorId = mySponsorId;
      }
    }

    if (user.organizationType === "investor") {
      const myInvestorId = await getInvestorIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (!myInvestorId) {
        return NextResponse.json(
          { success: false, error: "Investor profile not found" },
          { status: 403 },
        );
      }
      if (investorId && investorId !== myInvestorId) {
        return NextResponse.json(
          { success: false, error: "You can only view your own commitments" },
          { status: 403 },
        );
      }
      if (!dealId && !sponsorId && !investorId && !cdeId) {
        investorId = myInvestorId;
      }
    }

    if (user.organizationType === "cde") {
      const myCdeId = await getCdeIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (!myCdeId) {
        return NextResponse.json(
          { success: false, error: "CDE profile not found" },
          { status: 403 },
        );
      }
      if (cdeId && cdeId !== myCdeId) {
        return NextResponse.json(
          { success: false, error: "You can only view your own commitments" },
          { status: 403 },
        );
      }
      if (!dealId && !sponsorId && !investorId && !cdeId) {
        cdeId = myCdeId;
      }
    }

    let commitments;

    if (dealId) {
      commitments = await service.getByDeal(dealId);
    } else if (investorId) {
      commitments = await service.getByInvestor(investorId, status);
    } else if (cdeId) {
      commitments = await service.getByCDE(cdeId, status);
    } else if (sponsorId) {
      commitments = await service.getBySponsor(sponsorId, status);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Must provide deal_id, investor_id, cde_id, or sponsor_id",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      commitments,
      total: commitments.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/commitments
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (
      user.organizationType !== "investor" &&
      user.organizationType !== "admin"
    ) {
      return NextResponse.json(
        { success: false, error: "Only investors can create commitments" },
        { status: 403 },
      );
    }

    const body = await parseBody(request, commitmentInputSchema);
    if (isValidationError(body)) return body;
    const { input } = body as { input: CreateCommitmentInput };
    await verifyDealAccess(request, user, input.deal_id, "edit");

    if (user.organizationType === "investor") {
      const supabase = getSupabaseAdmin();
      const myInvestorId = await getInvestorIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (!myInvestorId || myInvestorId !== input.investor_id) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only create commitments for your investor profile",
          },
          { status: 403 },
        );
      }
    }

    const service = getCommitmentService();
    const commitment = await service.create(input, user.id);

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error) {
    return handleAuthError(error);
  }
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

async function getInvestorIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("investors")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  return (data as { id: string } | null)?.id || null;
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
