/**
 * Public Marketplace Deals API
 * Returns visible deals for the homepage with tract data enrichment
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { lookupTract } from "@/lib/tracts/tractData";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching marketplace deals:", error);
      return NextResponse.json({ deals: [] }, { status: 200 });
    }

    const dealsRaw = (data || []) as Array<Record<string, unknown>>;
    const sponsorById = new Map<string, Record<string, unknown>>();
    const sponsorByOrgId = new Map<string, Record<string, unknown>>();
    const sponsorIds = Array.from(
      new Set(
        dealsRaw
          .map((deal) => deal.sponsor_id)
          .filter((value): value is string => typeof value === "string"),
      ),
    );
    if (sponsorIds.length > 0) {
      const { data: sponsorsById } = await supabase
        .from("sponsors")
        .select("id, organization_id, organization_name")
        .in("id", sponsorIds);
      for (const sponsor of (sponsorsById || []) as Array<
        Record<string, unknown>
      >) {
        if (typeof sponsor.id === "string")
          sponsorById.set(sponsor.id, sponsor);
        if (typeof sponsor.organization_id === "string")
          sponsorByOrgId.set(sponsor.organization_id, sponsor);
      }
    }
    const sponsorOrgIds = Array.from(
      new Set(
        dealsRaw
          .map((deal) => deal.sponsor_organization_id)
          .filter(
            (value): value is string =>
              typeof value === "string" && !sponsorByOrgId.has(value),
          ),
      ),
    );
    if (sponsorOrgIds.length > 0) {
      const { data: sponsorsByOrg } = await supabase
        .from("sponsors")
        .select("id, organization_id, organization_name")
        .in("organization_id", sponsorOrgIds);
      for (const sponsor of (sponsorsByOrg || []) as Array<
        Record<string, unknown>
      >) {
        if (typeof sponsor.id === "string")
          sponsorById.set(sponsor.id, sponsor);
        if (typeof sponsor.organization_id === "string")
          sponsorByOrgId.set(sponsor.organization_id, sponsor);
      }
    }

    // Map deals and enrich with tract data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deals from select('*') with extensive untyped property access
    const deals = await Promise.all(
      dealsRaw.map(async (deal: Record<string, any>) => {
        const intake = deal.intake_data || {};
        const censusTract = deal.census_tract || intake.censusTract || "";
        const sponsor =
          (typeof deal.sponsor_id === "string"
            ? sponsorById.get(deal.sponsor_id)
            : undefined) ||
          (typeof deal.sponsor_organization_id === "string"
            ? sponsorByOrgId.get(deal.sponsor_organization_id)
            : undefined);
        const sponsorName =
          sponsor?.organization_name ||
          deal.sponsor_organization_name ||
          deal.sponsor_name ||
          intake.sponsorName ||
          "Unknown";

        // Look up tract demographics if we have a tract number
        let tractData: {
          poverty: number;
          income: number;
          unemployment: number;
        } | null = null;
        if (censusTract) {
          try {
            const tract = await lookupTract(censusTract);
            if (tract) {
              tractData = {
                poverty: tract.poverty,
                income: tract.income,
                unemployment: tract.unemployment,
              };
            }
          } catch (_e) {
            // Tract lookup failed, continue without it
          }
        }

        return {
          id: deal.id,
          projectName: deal.project_name || intake.projectName || "Untitled",
          sponsorName,
          programType:
            (deal.programs && deal.programs[0]) ||
            intake.programs?.[0] ||
            "NMTC",
          programLevel: deal.program_level || intake.programLevel || "federal",
          allocation:
            Number(deal.nmtc_financing_requested) ||
            Number(intake.nmtcFinancingRequested) ||
            Number(deal.total_project_cost) ||
            0,
          creditPrice: 0.76,
          state: deal.state || intake.state || "",
          city: deal.city || intake.city || "",
          address: deal.address || intake.address || "",
          censusTract,
          // Required Deal fields
          tractType: deal.tract_types || intake.tractTypes || [],
          status: deal.status || "available",
          submittedDate: deal.created_at || new Date().toISOString(),
          // Tract demographics from lookup
          povertyRate:
            tractData?.poverty ??
            deal.tract_poverty_rate ??
            intake.povertyRate ??
            undefined,
          medianIncome:
            tractData?.income ??
            deal.tract_median_income ??
            intake.medianIncome ??
            undefined,
          unemployment:
            tractData?.unemployment ??
            deal.tract_unemployment ??
            intake.unemployment ??
            undefined,
          // Financials
          projectCost:
            Number(deal.total_project_cost) ||
            Number(intake.totalProjectCost) ||
            0,
          financingGap:
            Number(deal.financing_gap) || Number(intake.financingGap) || 0,
          stateNMTCAllocation:
            Number(deal.state_nmtc_allocation) ||
            Number(intake.stateNMTCAllocation) ||
            0,
          htcAmount:
            Number(deal.htc_amount) ||
            Number(intake.htcAmount) ||
            Number(deal.project_gross_htc) ||
            0,
          // Status
          shovelReady: deal.shovel_ready ?? intake.shovelReady ?? false,
          constructionStartDate:
            deal.construction_start_date ||
            intake.constructionStartDate ||
            intake.startDate ||
            "",
          // LIHTC specific
          lihtcData: deal.lihtc_data ||
            intake.lihtcData || {
              lihtcType: intake.lihtcType || intake.fedLihtcBasis,
            },
          // Project classification
          projectType: deal.project_type || intake.projectType || "",
          organizationType: deal.entity_type || intake.organizationType || "",
          // Sources and Uses
          sources:
            deal.sources || intake.sources || intake.financingSources || [],
          uses: deal.uses || intake.uses || intake.projectUses || [],
          totalSources:
            Number(deal.total_sources) || Number(intake.totalSources) || 0,
          totalUses: Number(deal.total_uses) || Number(intake.totalUses) || 0,
          // Other
          description:
            deal.project_description || intake.projectDescription || "",
          visible: true,
          zipCode: deal.zip_code || intake.zipCode || "",
        };
      }),
    );

    console.log("Marketplace deals sample:", JSON.stringify(deals[0], null, 2));
    return NextResponse.json({ deals }, { status: 200 });
  } catch (error) {
    console.error("Marketplace deals error:", error);
    return NextResponse.json({ deals: [] }, { status: 200 });
  }
}
