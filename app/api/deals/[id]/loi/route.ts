import { NextRequest, NextResponse } from "next/server";
import { getLOIService } from "@/lib/loi/loiService";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notify } from "@/lib/notifications/emit";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user.organizationType !== "cde" && user.organizationType !== "admin") {
      return NextResponse.json(
        { error: "Only CDE users can create LOIs" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    await verifyDealAccess(request, user, id, "view");

    const supabase = getSupabaseAdmin();
    const cdeId =
      user.organizationType === "cde"
        ? await getCdeIdForOrganization(supabase, user.organizationId)
        : body.cde_id || body.senderOrgId;

    if (!cdeId) {
      return NextResponse.json(
        { error: "Unable to resolve CDE profile for this user" },
        { status: 400 },
      );
    }

    const loiService = getLOIService();

    // Create LOI using existing service
    const loi = await loiService.create(
      {
        deal_id: id,
        cde_id: cdeId,
        allocation_amount: body.allocation_amount || 0,
        qlici_rate: body.qlici_rate || 0.5,
        leverage_structure: body.leverage_structure || "standard",
        term_years: body.term_years || 7,
        special_terms: body.message || undefined,
      },
      user.id,
    );

    // Send notification to sponsor about new LOI
    try {
      // Get deal and CDE info for notification
      const [{ data: deal }, { data: cde }] = await Promise.all([
        supabase.from("deals").select("project_name").eq("id", id).single(),
        supabase
          .from("cdes")
          .select(
            "organization_name, parent_organization, primary_contact_name",
          )
          .eq("id", cdeId)
          .single(),
      ]);

      if (deal) {
        const projectName = deal.project_name || "Your Project";
        const cdeName =
          (
            cde as {
              organization_name?: string | null;
              parent_organization?: string | null;
              primary_contact_name?: string | null;
            } | null
          )?.organization_name ||
          (
            cde as {
              organization_name?: string | null;
              parent_organization?: string | null;
              primary_contact_name?: string | null;
            } | null
          )?.parent_organization ||
          (
            cde as {
              organization_name?: string | null;
              parent_organization?: string | null;
              primary_contact_name?: string | null;
            } | null
          )?.primary_contact_name ||
          "A CDE";
        const allocationFormatted = body.allocation_amount
          ? `$${(body.allocation_amount / 1000000).toFixed(1)}M`
          : undefined;

        await notify.loiReceived(id, projectName, cdeName, allocationFormatted);
      }
    } catch (notifyError) {
      console.error("Failed to send LOI received notification:", notifyError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: loi }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getCdeIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data: cdeData } = await supabase
    .from("cdes")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  if (cdeData) {
    return (cdeData as { id: string }).id;
  }

  const { data: mergedData } = await supabase
    .from("cdes_merged")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1)
    .single();

  return (mergedData as { id: string } | null)?.id || null;
}
