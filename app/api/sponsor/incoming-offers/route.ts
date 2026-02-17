/**
 * Sponsor Incoming Offers API
 * GET: Fetch all incoming LOIs and Commitments for a sponsor's deals
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyOrgAccess,
} from "@/lib/api/auth-middleware";

// Types inferred from generated Supabase types — no local interfaces needed

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (
      user.organizationType !== "sponsor" &&
      user.organizationType !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only sponsors can view incoming offers" },
        { status: 403 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const requestedOrgId = searchParams.get("orgId");

    if (user.organizationType === "admin" && !requestedOrgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const orgId = requestedOrgId || user.organizationId;
    verifyOrgAccess(user, orgId);

    // First get sponsor_id from orgId, then get all deals for this sponsor
    const { data: sponsor } = await supabase
      .from("sponsors")
      .select("id")
      .eq("organization_id", orgId)
      .single();

    if (!sponsor) {
      return NextResponse.json({
        lois: [],
        commitments: [],
        totalPending: 0,
      });
    }

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select("id, project_name, status")
      .eq("sponsor_id", sponsor.id);

    if (dealsError) {
      throw dealsError;
    }

    if (!deals || deals.length === 0) {
      return NextResponse.json({
        lois: [],
        commitments: [],
        totalPending: 0,
      });
    }

    const dealIds = deals.map((d) => d.id);
    const dealMap = new Map(deals.map((d) => [d.id, d]));

    // Fetch LOIs for these deals from letters_of_intent table
    const { data: lois, error: loisError } = await supabase
      .from("letters_of_intent")
      .select(
        `
        id,
        deal_id,
        cde_id,
        allocation_amount,
        qlici_rate,
        leverage_structure,
        term_years,
        special_terms,
        status,
        created_at,
        expires_at
      `,
      )
      .in("deal_id", dealIds)
      .order("created_at", { ascending: false });

    if (loisError) {
      console.error("Error fetching LOIs:", loisError);
    }

    // Get CDE names for LOIs separately
    const cdeIds = [
      ...new Set((lois || []).map((l) => l.cde_id).filter(Boolean)),
    ] as string[];
    let cdeMap = new Map<string, string>();
    if (cdeIds.length > 0) {
      const { data: cdes } = await supabase
        .from("cdes_merged")
        .select("id, name")
        .in("id", cdeIds);
      if (cdes) {
        cdeMap = new Map(cdes.map((c) => [c.id, c.name || ""]));
      }
    }

    // Fetch Commitments for these deals
    const { data: commitments, error: commitmentsError } = await supabase
      .from("commitments")
      .select(
        `
        id,
        deal_id,
        investor_id,
        cde_id,
        investment_amount,
        credit_type,
        credit_rate,
        pricing_cents_per_credit,
        target_closing_date,
        special_terms,
        status,
        created_at,
        expires_at
      `,
      )
      .in("deal_id", dealIds)
      .order("created_at", { ascending: false });

    if (commitmentsError) {
      console.error("Error fetching commitments:", commitmentsError);
    }

    // Get investor names for commitments separately
    const investorIds = [
      ...new Set((commitments || []).map((c) => c.investor_id).filter(Boolean)),
    ];
    let investorMap = new Map<string, string>();
    if (investorIds.length > 0) {
      const { data: investors } = await supabase
        .from("investors")
        .select("id, primary_contact_name")
        .in("id", investorIds);
      if (investors) {
        investorMap = new Map(
          investors.map((i) => [i.id, i.primary_contact_name || ""]),
        );
      }
    }

    // Enrich with deal info
    const enrichedLois = (lois || []).map((loi) => ({
      ...loi,
      type: "loi" as const,
      dealName: dealMap.get(loi.deal_id)?.project_name || "Unknown Deal",
      dealStatus: dealMap.get(loi.deal_id)?.status,
      senderName: cdeMap.get(loi.cde_id) || "Unknown CDE",
    }));

    const enrichedCommitments = (commitments || []).map((commitment) => ({
      ...commitment,
      type: "commitment" as const,
      dealName: dealMap.get(commitment.deal_id)?.project_name || "Unknown Deal",
      dealStatus: dealMap.get(commitment.deal_id)?.status,
      senderName: investorMap.get(commitment.investor_id) || "Unknown Investor",
    }));

    // Count pending offers
    const pendingLois = enrichedLois.filter(
      (l) =>
        l.status === "pending_sponsor" ||
        l.status === "issued" ||
        l.status === "draft",
    ).length;
    const pendingCommitments = enrichedCommitments.filter(
      (c) =>
        c.status === "pending_sponsor" ||
        c.status === "pending_cde" ||
        c.status === "issued" ||
        c.status === "draft",
    ).length;

    return NextResponse.json({
      lois: enrichedLois,
      commitments: enrichedCommitments,
      totalPending: pendingLois + pendingCommitments,
      summary: {
        totalLois: enrichedLois.length,
        pendingLois,
        totalCommitments: enrichedCommitments.length,
        pendingCommitments,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
