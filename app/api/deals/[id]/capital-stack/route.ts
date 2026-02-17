/**
 * Capital Stack API
 *
 * GET /api/deals/[id]/capital-stack - Get all funding sources for a deal
 * Returns LOIs, commitments, and calculates funding gap
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

interface CapitalSource {
  id: string;
  type: "loi" | "commitment" | "other";
  sourceType: "cde" | "investor" | "equity" | "debt" | "grant";
  sourceName: string;
  sourceId: string;
  amount: number;
  status: string;
  statusLabel: string;
  creditType?: string;
  issuedAt?: string;
  expiresAt?: string;
  acceptedAt?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

interface CapitalStackResponse {
  success: boolean;
  dealId: string;
  projectName: string;
  allocationNeeded: number;
  sources: CapitalSource[];
  summary: {
    totalCommitted: number;
    totalPending: number;
    totalExpired: number;
    fundingGap: number;
    readyForClosing: boolean;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<
  NextResponse<CapitalStackResponse | { success: false; error: string }>
> {
  try {
    const user = await requireAuth(request);
    const { id: dealId } = await params;
    await verifyDealAccess(request, user, dealId, "view");
    const supabase = getSupabaseAdmin();

    // Get deal info
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select(
        "id, project_name, nmtc_financing_requested, total_project_cost, programs",
      )
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 },
      );
    }

    // Get LOIs for this deal
    const { data: lois, error: loiError } = await supabase
      .from("letters_of_intent")
      .select(
        `
        id,
        cde_id,
        allocation_amount,
        status,
        issued_at,
        expires_at,
        sponsor_response_at,
        cdes:cde_id (
          id,
          parent_organization,
          primary_contact_name,
          primary_contact_email
        )
      `,
      )
      .eq("deal_id", dealId);

    if (loiError) {
      console.error("LOI fetch error:", loiError);
    }

    // Get commitments for this deal
    const { data: commitments, error: commitmentError } = await supabase
      .from("commitments")
      .select(
        `
        id,
        investor_id,
        cde_id,
        investment_amount,
        credit_type,
        status,
        created_at,
        expires_at,
        sponsor_accepted_at,
        cde_accepted_at,
        all_accepted_at,
        investors:investor_id (
          id,
          primary_contact_name,
          primary_contact_email
        ),
        cdes:cde_id (
          id,
          parent_organization,
          primary_contact_name,
          primary_contact_email
        )
      `,
      )
      .eq("deal_id", dealId);

    if (commitmentError) {
      console.error("Commitment fetch error:", commitmentError);
    }

    // Map LOIs to capital sources
    interface LOIRow {
      id: string;
      cde_id: string;
      allocation_amount: number | null;
      status: string;
      issued_at: string | null;
      expires_at: string | null;
      sponsor_response_at: string | null;
      cdes?: {
        id: string;
        parent_organization?: string;
        primary_contact_name?: string;
        primary_contact_email?: string;
      } | null;
    }
    const loiSources: CapitalSource[] = ((lois || []) as LOIRow[]).map(
      (loi) => {
        const cdeName =
          loi.cdes?.parent_organization ||
          loi.cdes?.primary_contact_name ||
          "Unknown CDE";

        let statusLabel = "Unknown";
        switch (loi.status) {
          case "issued":
          case "pending_sponsor":
            statusLabel = "Awaiting Your Response";
            break;
          case "sponsor_accepted":
            statusLabel = "You Accepted - Awaiting CDE";
            break;
          case "sponsor_countered":
            statusLabel = "Counter Sent";
            break;
          case "sponsor_rejected":
            statusLabel = "Declined";
            break;
          case "expired":
            statusLabel = "Expired";
            break;
          default:
            statusLabel = loi.status;
        }

        return {
          id: loi.id,
          type: "loi" as const,
          sourceType: "cde" as const,
          sourceName: cdeName,
          sourceId: loi.cde_id,
          amount: loi.allocation_amount || 0,
          status: loi.status,
          statusLabel,
          issuedAt: loi.issued_at ?? undefined,
          expiresAt: loi.expires_at ?? undefined,
          acceptedAt: loi.sponsor_response_at ?? undefined,
          contactName: loi.cdes?.primary_contact_name,
          contactEmail: loi.cdes?.primary_contact_email,
        };
      },
    );

    // Map commitments to capital sources
    interface CommitmentRow {
      id: string;
      investor_id: string | null;
      cde_id: string | null;
      investment_amount: number | null;
      credit_type: string | null;
      status: string;
      created_at: string;
      expires_at: string | null;
      sponsor_accepted_at: string | null;
      cde_accepted_at: string | null;
      all_accepted_at: string | null;
      investors?: {
        id: string;
        primary_contact_name?: string;
        primary_contact_email?: string;
      } | null;
      cdes?: {
        id: string;
        parent_organization?: string;
        primary_contact_name?: string;
        primary_contact_email?: string;
      } | null;
    }
    const commitmentSources: CapitalSource[] = (
      (commitments || []) as CommitmentRow[]
    ).map((c) => {
      const isInvestor = !!c.investor_id;
      const sourceName = isInvestor
        ? c.investors?.primary_contact_name || "Unknown Investor"
        : c.cdes?.parent_organization ||
          c.cdes?.primary_contact_name ||
          "Unknown CDE";

      let statusLabel = "Unknown";
      switch (c.status) {
        case "draft":
          statusLabel = "Draft";
          break;
        case "issued":
        case "pending_sponsor":
          statusLabel = "Awaiting Your Response";
          break;
        case "pending_cde":
          statusLabel = "Awaiting CDE Approval";
          break;
        case "all_accepted":
          statusLabel = "Fully Committed";
          break;
        case "expired":
          statusLabel = "Expired";
          break;
        case "rejected":
          statusLabel = "Rejected";
          break;
        case "withdrawn":
          statusLabel = "Withdrawn";
          break;
        default:
          statusLabel = c.status;
      }

      return {
        id: c.id,
        type: "commitment" as const,
        sourceType: isInvestor ? ("investor" as const) : ("cde" as const),
        sourceName,
        sourceId: c.investor_id || c.cde_id || "",
        amount: c.investment_amount || 0,
        status: c.status,
        statusLabel,
        creditType: c.credit_type ?? undefined,
        issuedAt: c.created_at,
        expiresAt: c.expires_at ?? undefined,
        acceptedAt: c.all_accepted_at ?? undefined,
        contactName: isInvestor
          ? c.investors?.primary_contact_name
          : c.cdes?.primary_contact_name,
        contactEmail: isInvestor
          ? c.investors?.primary_contact_email
          : c.cdes?.primary_contact_email,
      };
    });

    // Combine all sources
    const allSources = [...loiSources, ...commitmentSources];

    // Calculate totals
    const committedStatuses = ["all_accepted", "sponsor_accepted"];
    const pendingStatuses = [
      "issued",
      "pending_sponsor",
      "pending_cde",
      "sponsor_countered",
    ];
    const expiredStatuses = [
      "expired",
      "rejected",
      "withdrawn",
      "sponsor_rejected",
    ];

    const totalCommitted = allSources
      .filter((s) => committedStatuses.includes(s.status))
      .reduce((sum, s) => sum + s.amount, 0);

    const totalPending = allSources
      .filter((s) => pendingStatuses.includes(s.status))
      .reduce((sum, s) => sum + s.amount, 0);

    const totalExpired = allSources
      .filter((s) => expiredStatuses.includes(s.status))
      .reduce((sum, s) => sum + s.amount, 0);

    // Allocation needed is NMTC financing requested or a portion of total project cost
    const allocationNeeded =
      Number(deal.nmtc_financing_requested) ||
      (deal.total_project_cost ? Number(deal.total_project_cost) * 0.25 : 0);

    const fundingGap = Math.max(0, allocationNeeded - totalCommitted);
    const readyForClosing = fundingGap === 0 && totalCommitted > 0;

    return NextResponse.json({
      success: true,
      dealId: deal.id,
      projectName: deal.project_name,
      allocationNeeded,
      sources: allSources,
      summary: {
        totalCommitted,
        totalPending,
        totalExpired,
        fundingGap,
        readyForClosing,
      },
    });
  } catch (error) {
    return handleAuthError(error) as NextResponse<{
      success: false;
      error: string;
    }>;
  }
}
