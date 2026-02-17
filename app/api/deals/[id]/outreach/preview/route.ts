/**
 * Email Preview API
 * POST /api/deals/[id]/outreach/preview
 *
 * Generates the allocation/investment request email HTML without sending it.
 * Returns { subject, html, recipientName, contactEmail } so the sponsor can
 * review the email before committing to send.
 *
 * Accepts optional `recipientType` ('cde' | 'investor') in body.
 * Defaults to 'cde' for backward compatibility.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import {
  allocationRequestTemplate,
  investmentRequestTemplate,
} from "@/lib/email/templates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Loosely-typed deal row returned from Supabase (JSONB columns are unknown). */
interface DealRow {
  [key: string]: unknown;
  intake_data?: Record<string, unknown>;
  sponsor_id?: string;
  sponsor_organization_name?: string;
  sponsor_name?: string;
  project_name?: string;
  city?: string;
  state?: string;
  address?: string;
  census_tract?: string;
  program_type?: string;
  programs?: string[];
  nmtc_financing_requested?: number;
  total_project_cost?: number;
  financing_gap?: number;
  poverty_rate?: number;
  median_income_percent?: number;
  unemployment_rate?: number;
  shovel_ready?: boolean;
  projected_completion_date?: string;
  community_impact?: string;
  description?: string;
}

/** Intake JSONB data — common fields used in outreach preview. */
interface IntakeData {
  [key: string]: unknown;
  organizationName?: string;
  sponsorName?: string;
  city?: string;
  state?: string;
  address?: string;
  censusTract?: string;
  nmtcFinancingRequested?: number;
  totalProjectCost?: number;
  financingGap?: number;
  tractPovertyRate?: number;
  tractMedianIncome?: number;
  tractUnemployment?: number;
  isShovelReady?: string | boolean;
  projectedCompletionDate?: string;
  communityImpact?: string;
  financingSources?: Array<{ source?: string; amount?: number }>;
  equityAmount?: number;
  debtAmount?: number;
  grantAmount?: number;
  landCost?: number;
  acquisitionCost?: number;
  constructionCost?: number;
  softCosts?: number;
  developerFee?: number;
  contingency?: number;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    const user = await requireAuth(request);
    if (user.organizationType !== "sponsor") {
      return NextResponse.json(
        { error: "Only sponsors can preview outreach emails" },
        { status: 403 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");
    const body = await request.json();

    const {
      recipientOrgId, // CDE or Investor organization_id
      senderName, // Sponsor contact name
      senderOrg, // Sponsor org name
      recipientType = "cde", // 'cde' | 'investor'
    } = body;

    if (!recipientOrgId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Fetch full deal
    const { data: dealData, error: dealError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    const deal = dealData as unknown as DealRow | null;
    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const intake = (deal.intake_data || {}) as IntakeData;
    const sponsorIdFromDeal =
      typeof deal.sponsor_id === "string" ? deal.sponsor_id : null;
    const { data: sponsorProfileData } = sponsorIdFromDeal
      ? await supabase
          .from("sponsors")
          .select("organization_name")
          .eq("id", sponsorIdFromDeal)
          .maybeSingle()
      : { data: null };
    const sponsorProfile = sponsorProfileData as {
      organization_name?: string;
    } | null;

    // Sponsor info — prefer live org name over stale deal/intake copies
    const sponsorOrgName =
      senderOrg ||
      sponsorProfile?.organization_name ||
      intake.organizationName ||
      intake.sponsorName ||
      deal.sponsor_organization_name ||
      deal.sponsor_name ||
      "Sponsor";
    let sponsorContactName = senderName || "";
    if (!sponsorContactName) {
      const { data: senderUser } = await supabase
        .from("users")
        .select("name")
        .eq("organization_id", user.organizationId)
        .limit(1)
        .single();
      sponsorContactName =
        (senderUser as { name?: string } | null)?.name || sponsorOrgName;
    }

    // Build rich deal summary (shared between CDE and Investor)
    const sources: Array<{ name: string; amount: number }> = [];
    if (intake.financingSources) {
      (
        intake.financingSources as Array<{ source?: string; amount?: number }>
      ).forEach((s) => {
        if (s.source && s.amount)
          sources.push({ name: s.source, amount: s.amount });
      });
    } else {
      if (intake.equityAmount)
        sources.push({ name: "Equity", amount: Number(intake.equityAmount) });
      if (intake.debtAmount)
        sources.push({ name: "Debt", amount: Number(intake.debtAmount) });
      if (intake.grantAmount)
        sources.push({ name: "Grants", amount: Number(intake.grantAmount) });
      if (intake.nmtcFinancingRequested)
        sources.push({
          name: "NMTC Equity",
          amount: Number(intake.nmtcFinancingRequested),
        });
    }

    const uses: Array<{ name: string; amount: number }> = [];
    if (intake.landCost) uses.push({ name: "Land", amount: intake.landCost });
    if (intake.acquisitionCost)
      uses.push({ name: "Acquisition", amount: intake.acquisitionCost });
    if (intake.constructionCost)
      uses.push({ name: "Construction", amount: intake.constructionCost });
    if (intake.softCosts)
      uses.push({ name: "Soft Costs", amount: intake.softCosts });
    if (intake.developerFee)
      uses.push({ name: "Developer Fee", amount: intake.developerFee });
    if (intake.contingency)
      uses.push({ name: "Contingency", amount: intake.contingency });

    const richDealSummary = {
      city: intake.city || deal.city || "",
      state: intake.state || deal.state || "",
      address: intake.address || deal.address || "",
      censusTract: intake.censusTract || deal.census_tract || "",
      programType:
        deal.program_type ||
        (deal.programs as string[] | undefined)?.[0] ||
        "NMTC",
      allocation:
        intake.nmtcFinancingRequested ||
        deal.nmtc_financing_requested ||
        deal.total_project_cost ||
        0,
      projectCost: intake.totalProjectCost || deal.total_project_cost || 0,
      financingGap: intake.financingGap || deal.financing_gap,
      povertyRate: intake.tractPovertyRate || deal.poverty_rate,
      medianIncome: intake.tractMedianIncome || deal.median_income_percent,
      unemployment: intake.tractUnemployment || deal.unemployment_rate,
      shovelReady:
        intake.isShovelReady === "Yes" ||
        intake.isShovelReady === true ||
        deal.shovel_ready === true,
      completionDate:
        intake.projectedCompletionDate || deal.projected_completion_date,
      communityImpact:
        intake.communityImpact || deal.community_impact || deal.description,
      sources: sources.length > 0 ? sources : undefined,
      uses: uses.length > 0 ? uses : undefined,
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tcredex.com";

    const fmtAllocation = (amt: number) => {
      if (!amt) return "$0";
      if (amt >= 1000000) return `$${(amt / 1000000).toFixed(1)}M`;
      if (amt >= 1000) return `$${(amt / 1000).toFixed(0)}K`;
      return `$${amt}`;
    };

    // ----------------------------------------------------------------
    // Investor preview
    // ----------------------------------------------------------------
    if (recipientType === "investor") {
      const investorCols =
        "id, organization_id, organization_name, primary_contact_email, primary_contact_name";
      let { data: investorData } = await supabase
        .from("investors")
        .select(investorCols)
        .eq("organization_id", recipientOrgId)
        .limit(1)
        .single();

      if (!investorData) {
        const { data: byId } = await supabase
          .from("investors")
          .select(investorCols)
          .eq("id", recipientOrgId)
          .limit(1)
          .single();
        investorData = byId;
      }

      const investor = investorData as {
        primary_contact_name?: string;
        organization_name?: string;
        primary_contact_email?: string;
      } | null;
      if (!investor) {
        return NextResponse.json(
          { error: "Investor not found" },
          { status: 404 },
        );
      }

      const contactName =
        investor.primary_contact_name || investor.organization_name || "Team";
      const investorName = investor.organization_name || "Unknown Investor";
      const claimUrl = `${baseUrl}/signup?ref=investor&org=${recipientOrgId}&deal=${dealId}`;

      const { subject, html } = investmentRequestTemplate({
        contactName,
        investorName,
        sponsorName: sponsorOrgName,
        sponsorContactName,
        projectName: (deal.project_name as string) || "Untitled Project",
        dealSummary: richDealSummary,
        claimUrl,
        dealId,
      });

      return NextResponse.json({
        subject,
        html,
        recipientName: investorName,
        cdeName: investorName, // backward compat
        contactEmail: investor.primary_contact_email || "No email on file",
      });
    }

    // ----------------------------------------------------------------
    // CDE preview (default)
    // ----------------------------------------------------------------
    const selectFields =
      "id, organization_id, name, contact_email, contact_name, total_allocation, amount_remaining, year";
    let { data: recipientData } = await supabase
      .from("cdes_merged")
      .select(selectFields)
      .eq("organization_id", recipientOrgId)
      .order("year", { ascending: false })
      .limit(1)
      .single();

    if (!recipientData) {
      const { data: byId } = await supabase
        .from("cdes_merged")
        .select(selectFields)
        .eq("id", recipientOrgId)
        .limit(1)
        .single();
      recipientData = byId;
    }

    const recipient = recipientData as {
      contact_name?: string;
      name?: string;
      contact_email?: string;
      amount_remaining?: number;
      total_allocation?: number;
      year?: number;
    } | null;
    if (!recipient) {
      return NextResponse.json({ error: "CDE not found" }, { status: 404 });
    }

    const contactName = recipient.contact_name || recipient.name || "Team";
    const cdeName = recipient.name || "Unknown CDE";
    const cdeAllocationAmount = fmtAllocation(
      recipient.amount_remaining || recipient.total_allocation || 0,
    );
    const cdeAllocationYear = recipient.year || new Date().getFullYear();
    const claimUrl = `${baseUrl}/signup?ref=cde&org=${recipientOrgId}&deal=${dealId}`;

    const { subject, html } = allocationRequestTemplate({
      contactName,
      cdeName,
      cdeAllocationAmount,
      cdeAllocationYear,
      sponsorName: sponsorOrgName,
      sponsorContactName,
      projectName: (deal.project_name as string) || "Untitled Project",
      dealSummary: richDealSummary,
      claimUrl,
      dealId,
    });

    return NextResponse.json({
      subject,
      html,
      recipientName: cdeName,
      cdeName,
      contactEmail: recipient.contact_email || "No email on file",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
