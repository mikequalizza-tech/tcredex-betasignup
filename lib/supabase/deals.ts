/**
 * Deal-specific Supabase Query Functions
 * Extracted from the main queries.ts file for better organization
 */

import {
  Deal,
  ProgramType,
  ProgramLevel,
  DealStatus,
  TractType,
} from "@/lib/data/deals";
import { logger } from "@/lib/utils/logger";
import { normalizeProjectImages } from "@/lib/utils/project-images";
import { fetchApi } from "../api/fetch-utils";
import { calculateReadiness } from "@/lib/intake/readinessScore";

/** A raw deal row from the database or API response */
type DealRow = Record<string, unknown>;

/** A financing source entry from intake data */
interface FinancingSourceEntry {
  source?: string;
  type?: string;
  amount: number;
}

/**
 * Helper function to map allocation based on program type
 */
function mapAllocationByProgram(
  deal: DealRow,
  programType: ProgramType,
): number {
  switch (programType) {
    case "LIHTC":
      return (
        Number(deal.project_gross_htc) ||
        Number(deal.htc_amount) ||
        Number(deal.lihtc_basis) ||
        Number(deal.total_project_cost) ||
        0
      );
    case "HTC":
      return Number(deal.project_gross_htc) || Number(deal.htc_amount) || 0;
    case "NMTC":
      return (
        Number(deal.nmtc_financing_requested) ||
        Number(deal.fed_nmtc_allocation_request) ||
        0
      );
    case "OZ":
      return Number(deal.oz_investment) || Number(deal.total_project_cost) || 0;
    default:
      return Number(deal.nmtc_financing_requested) || 0;
  }
}

/**
 * Fetch all deals - uses backend API for reliability
 */
export async function fetchDeals(
  onlyVisible: boolean = false,
): Promise<Deal[]> {
  // Use backend API instead of direct Supabase call
  try {
    const params = onlyVisible ? "?visible=true" : "";
    const url = `/api/deals${params}`;
    const result = await fetchApi<{
      deals?: Deal[];
      data?: { deals?: Deal[] };
    }>(url);

    if (!result.success || !result.data) {
      return [];
    }

    const data =
      result.data.data?.deals ||
      result.data.deals ||
      (Array.isArray(result.data) ? result.data : []);

    return (data as unknown as DealRow[]).map((deal: DealRow) => {
      const programs = deal.programs as string[] | undefined;
      const sponsors = deal.sponsors as Record<string, unknown> | undefined;
      const programType = ((programs && programs[0]) as ProgramType) || "NMTC";
      return {
        id: deal.id as string,
        projectName: deal.project_name as string,
        sponsorName: (deal.sponsor_organization_name ||
          sponsors?.organization_name ||
          deal.sponsor_name ||
          "Unknown Sponsor") as string,
        sponsorDescription: "",
        website: deal.website as string | undefined,
        programType,
        projectType: (deal.project_type || "Commercial Real Estate") as string, // For sector matching
        programLevel: (deal.program_level as ProgramLevel) || "federal",
        stateProgram: deal.state_program,
        allocation: mapAllocationByProgram(deal, programType),
        creditPrice: 0.76,
        state: deal.state || "",
        city: deal.city || "",
        tractType: (deal.tract_types || []) as TractType[],
        status: (deal.status || "draft") as DealStatus,
        description: deal.project_description,
        communityImpact: deal.community_benefit,
        projectHighlights: [],
        useOfFunds: deal.total_project_cost
          ? [
              {
                category: "Construction",
                amount: Number(deal.construction_cost) || 0,
              },
              {
                category: "Acquisition",
                amount: Number(deal.acquisition_cost) || 0,
              },
              { category: "Soft Costs", amount: Number(deal.soft_costs) || 0 },
            ].filter((item) => item.amount > 0)
          : [],
        timeline: [
          {
            milestone: "Construction Start",
            date: deal.construction_start_date || "TBD",
            completed: !!deal.construction_start_date,
          },
          {
            milestone: "Projected Completion",
            date: deal.projected_completion_date || "TBD",
            completed: false,
          },
        ].filter((item) => item.date !== "TBD"),
        foundedYear: 2020,
        submittedDate: deal.created_at,
        povertyRate: Number(deal.tract_poverty_rate) || 0,
        medianIncome: Number(deal.tract_median_income) || 0,
        jobsCreated: deal.jobs_created || 0,
        visible: deal.visible ?? true,
        coordinates:
          deal.latitude && deal.longitude
            ? [deal.longitude, deal.latitude]
            : undefined,
        projectCost: Number(deal.total_project_cost) || 0,
        financingGap: Number(deal.financing_gap) || 0,
        censusTract: deal.census_tract,
        unemployment: Number(deal.tract_unemployment) || 0,
        tractSeverelyDistressed: deal.tract_severely_distressed || false, // For distress matching
        tractEligible: deal.tract_eligible || false, // QCT status
        affordableHousingUnits: deal.affordable_housing_units || 0, // For housing impact
      };
    }) as unknown as Deal[];
  } catch (error) {
    logger.error("Error fetching deals", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : error,
    });
    return [];
  }
}

/**
 * Fetch a single deal by ID - returns full detail including intake data
 */
export async function fetchDealById(id: string): Promise<Deal | null> {
  try {
    const result = await fetchApi<{ deal?: Record<string, unknown> }>(
      `/api/deals?id=${encodeURIComponent(id)}`,
    );

    if (!result.success || !result.data) {
      return null;
    }

    const data = result.data.deal as Record<string, unknown> | undefined;
    if (!data) return null;

    // Get sponsor organization info via join if available
    const sponsors = data.sponsors as Record<string, unknown> | undefined;
    const sponsorOrgId =
      sponsors?.organization_id || data.sponsor_organization_id || null;
    // Use sponsor organization name (from sponsors table), not the person's name
    const sponsorOrgName =
      data.sponsor_organization_name ||
      sponsors?.organization_name ||
      sponsors?.name ||
      data.sponsor_name ||
      "Unknown Sponsor";

    // Extract intake_data for additional fields - try multiple sources
    // intake_data is the canonical source, but also check draft_data as fallback
    let intakeData: Record<string, unknown> | null | undefined =
      data.intake_data as Record<string, unknown> | null | undefined;
    if (!intakeData || Object.keys(intakeData).length === 0) {
      intakeData = data.draft_data as
        | Record<string, unknown>
        | null
        | undefined;
    }

    // Merge in qalicb_data if present (separate column for QALICB tests)
    const qalicbData: Record<string, unknown> | null | undefined =
      data.qalicb_data as Record<string, unknown> | null | undefined;
    if (qalicbData && Object.keys(qalicbData).length > 0) {
      intakeData = { ...intakeData, ...qalicbData };
    }

    const projectDescriptionCandidate =
      intakeData?.projectDescription || data.project_description || "";
    // Canonical source: sponsors.description (managed in /dashboard/teams).
    const rawSponsorDescription = sponsors?.description || "";
    const normalizedSponsorDescription =
      typeof rawSponsorDescription === "string"
        ? rawSponsorDescription.trim()
        : "";
    const normalizedProjectDescription =
      typeof projectDescriptionCandidate === "string"
        ? projectDescriptionCandidate.trim()
        : "";
    const sponsorDescription =
      normalizedSponsorDescription &&
      normalizedSponsorDescription.toLowerCase() !==
        normalizedProjectDescription.toLowerCase()
        ? normalizedSponsorDescription
        : "";

    // Build use of funds from intake_data or direct columns
    // PRIORITY: intake_data > draft_data > direct database columns
    const useOfFunds: { category: string; amount: number }[] = [];
    const landCost = intakeData?.landCost || data.land_cost;
    const acquisitionCost =
      intakeData?.acquisitionCost || data.acquisition_cost;
    const constructionCost =
      intakeData?.constructionCost || data.construction_cost;
    const softCosts = intakeData?.softCosts || data.soft_costs;
    const contingency = intakeData?.contingency || data.contingency;
    const developerFee = intakeData?.developerFee || data.developer_fee;
    const financingCosts = intakeData?.financingCosts || data.financing_costs;
    const reserves = intakeData?.reserves || data.reserves;

    if (landCost)
      useOfFunds.push({
        category: "Land / Acquisition",
        amount: Number(landCost),
      });
    if (acquisitionCost && !landCost)
      useOfFunds.push({
        category: "Acquisition",
        amount: Number(acquisitionCost),
      });
    if (constructionCost)
      useOfFunds.push({
        category: "Construction",
        amount: Number(constructionCost),
      });
    if (softCosts)
      useOfFunds.push({ category: "Soft Costs", amount: Number(softCosts) });
    if (contingency)
      useOfFunds.push({ category: "Contingency", amount: Number(contingency) });
    if (developerFee)
      useOfFunds.push({
        category: "Developer Fee",
        amount: Number(developerFee),
      });
    if (financingCosts)
      useOfFunds.push({
        category: "Financing Costs",
        amount: Number(financingCosts),
      });
    if (reserves)
      useOfFunds.push({ category: "Reserves", amount: Number(reserves) });

    // Build sources from intake_data (Capital Stack)
    const sources: { name: string; amount: number }[] = [];
    const equityAmount = intakeData?.equityAmount || data.equity_amount;
    const debtAmount = intakeData?.debtAmount || data.debt_amount;
    const grantAmount = intakeData?.grantAmount || data.grant_amount;
    const otherAmount = intakeData?.otherAmount || data.other_amount;

    if (equityAmount)
      sources.push({ name: "Equity", amount: Number(equityAmount) });
    if (debtAmount)
      sources.push({ name: "Senior Debt", amount: Number(debtAmount) });
    if (grantAmount)
      sources.push({ name: "Grants / Subsidies", amount: Number(grantAmount) });
    if (otherAmount)
      sources.push({ name: "Other Sources", amount: Number(otherAmount) });

    // Also include financing sources array if present
    if (
      intakeData?.financingSources &&
      Array.isArray(intakeData.financingSources)
    ) {
      (intakeData.financingSources as FinancingSourceEntry[]).forEach((src) => {
        if (src.amount > 0)
          sources.push({
            name: src.source || src.type || "",
            amount: Number(src.amount),
          });
      });
    }

    // Build timeline from intake_data
    const timeline: { milestone: string; date: string; completed: boolean }[] =
      [];
    const constructionStartDate = (intakeData?.constructionStartDate ||
      data.construction_start_date) as string | undefined;
    const projectedClosingDate = (intakeData?.projectedClosingDate ||
      data.projected_closing_date) as string | undefined;
    const projectedCompletionDate = (intakeData?.projectedCompletionDate ||
      data.projected_completion_date) as string | undefined;

    if (constructionStartDate) {
      timeline.push({
        milestone: "Construction Start",
        date: constructionStartDate,
        completed: false,
      });
    }
    if (projectedClosingDate) {
      timeline.push({
        milestone: "Target Closing",
        date: projectedClosingDate,
        completed: false,
      });
    }
    if (projectedCompletionDate) {
      timeline.push({
        milestone: "Project Completion",
        date: projectedCompletionDate,
        completed: false,
      });
    }

    const normalizedProjectImages = normalizeProjectImages(
      intakeData?.projectImages,
    );
    const normalizedFeaturedImageId =
      (typeof intakeData?.featuredImageId === "string"
        ? intakeData.featuredImageId
        : undefined) ||
      (typeof data.featured_image_id === "string"
        ? data.featured_image_id
        : undefined) ||
      normalizedProjectImages[0]?.id;
    const featuredImage = normalizedProjectImages.find(
      (img) => img.id === normalizedFeaturedImageId,
    );

    const programs = data.programs as string[] | undefined;

    return {
      id: data.id,
      projectName: data.project_name,
      sponsorName: sponsorOrgName, // Organization name, not person's name
      sponsorOrganizationId: sponsorOrgId,
      sponsorDescription,
      website: intakeData?.website || data.website,
      programType: (programs?.[0] as ProgramType) || "NMTC",
      programLevel: (data.program_level as ProgramLevel) || "federal",
      stateProgram: data.state_program,
      allocation: mapAllocationByProgram(
        data,
        (programs?.[0] as ProgramType) || "NMTC",
      ),
      creditPrice: 0.76,
      state: data.state || "",
      city: data.city || "",
      address: intakeData?.address || data.address,
      zipCode: intakeData?.zipCode || data.zip_code,
      county: intakeData?.county || data.county,
      tractType: (data.tract_types ||
        intakeData?.tractType ||
        []) as TractType[],
      status: (data.status || "draft") as DealStatus,
      description: intakeData?.projectDescription || data.project_description,
      communityImpact:
        intakeData?.communityImpact ||
        intakeData?.communityBenefit ||
        data.community_benefit,
      projectHighlights: intakeData?.projectHighlights || [],
      useOfFunds: useOfFunds.filter((item) => item.amount > 0),
      timeline: timeline.filter((item) => item.date && item.date !== "TBD"),
      foundedYear: 2020,
      submittedDate: data.created_at,
      povertyRate:
        Number(intakeData?.tractPovertyRate || data.tract_poverty_rate) || 0,
      medianIncome:
        Number(intakeData?.tractMedianIncome || data.tract_median_income) || 0,
      jobsCreated:
        intakeData?.jobsCreated ||
        intakeData?.permanentJobsFTE ||
        data.jobs_created ||
        0,
      visible: data.visible ?? true,
      coordinates:
        data.latitude && data.longitude
          ? [data.longitude, data.latitude]
          : undefined,
      projectCost:
        Number(intakeData?.totalProjectCost || data.total_project_cost) || 0,
      financingGap:
        Number(intakeData?.financingGap || data.financing_gap) ||
        // Calculate gap if not explicitly set: totalCost - (equity + debt + grants + other)
        Math.max(
          0,
          Number(intakeData?.totalProjectCost || data.total_project_cost || 0) -
            (Number(equityAmount || 0) +
              Number(debtAmount || 0) +
              Number(grantAmount || 0) +
              Number(otherAmount || 0)),
        ),
      censusTract: intakeData?.censusTract || data.census_tract,
      unemployment:
        Number(intakeData?.tractUnemployment || data.tract_unemployment) || 0,
      shovelReady:
        data.site_control === "Owned" ||
        data.site_control === "Under Contract" ||
        intakeData?.siteControl === "Owned",
      completionDate:
        intakeData?.projectedCompletionDate || data.projected_completion_date,
      // Contact info
      contactName: intakeData?.contactName || intakeData?.personCompletingForm,
      contactEmail: intakeData?.contactEmail || intakeData?.sponsorEmail,
      contactPhone: intakeData?.contactPhone || intakeData?.sponsorPhone,
      // Project images from intake data
      projectImages: normalizedProjectImages,
      featuredImageId: normalizedFeaturedImageId,
      heroImageUrl:
        intakeData?.heroImageUrl ||
        data.hero_image_url ||
        featuredImage?.url ||
        normalizedProjectImages[0]?.url,
      // Financing
      sources: sources.filter((s) => s.amount > 0),
      uses: useOfFunds
        .filter((u) => u.amount > 0)
        .map((u) => ({ name: u.category, amount: u.amount })),
      // Store full intake data for the detail page (C-Score calculation uses this)
      // Priority: intake_data > draft_data > reconstructed from flat columns
      draftData: intakeData || {
        // Reconstruct minimal draftData from flat columns if JSONB is empty
        projectName: data.project_name,
        sponsorName: sponsorOrgName,
        address: data.address,
        city: data.city,
        state: data.state,
        censusTract: data.census_tract,
        programs: data.programs,
        totalProjectCost: data.total_project_cost,
        financingGap: data.financing_gap,
        projectDescription: data.project_description,
        communityImpact: data.community_benefit,
        permanentJobsFTE: data.jobs_created,
        siteControl: data.site_control,
        constructionStartDate: data.construction_start_date,
        phaseIEnvironmental: data.phase_i_environmental,
        zoningApproval: data.zoning_approval,
        // Capital stack
        equityAmount: equityAmount,
        debtAmount: debtAmount,
        grantAmount: grantAmount,
        otherAmount: otherAmount,
        // Costs
        landCost: landCost,
        constructionCost: constructionCost,
        softCosts: softCosts,
      },
    } as unknown as Deal;
  } catch (error) {
    logger.error("Error in fetchDealById", error);
    return null;
  }
}

/**
 * Fetch deals for the marketplace view (public, uses API route)
 */
export async function fetchMarketplaceDeals(): Promise<Deal[]> {
  try {
    const result = await fetchApi<{ deals?: Deal[] }>("/api/deals/marketplace");

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.deals || [];
  } catch (error) {
    logger.error("Error fetching marketplace deals", error);
    return [];
  }
}

/**
 * Fetch deals for a specific organization or user
 * Uses API route to avoid RLS issues on client side
 */
export async function fetchDealsByOrganization(
  orgId: string,
  userEmail?: string,
  orgType?: string,
): Promise<Deal[]> {
  // If orgId is empty/undefined, return empty array (user has no deals yet)
  if (!orgId || orgId === "undefined" || orgId === "null") {
    logger.info("fetchDealsByOrganization: No valid orgId, returning empty");
    return [];
  }

  try {
    // Use API route which runs on server with admin privileges
    let url = `/api/deals/by-organization?orgId=${encodeURIComponent(orgId)}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ""}`;
    if (orgType) url += `&orgType=${encodeURIComponent(orgType)}`;
    const result = await fetchApi<{ deals?: Deal[] }>(url);

    if (!result.success || !result.data) {
      return [];
    }

    const data = result.data.deals || [];

    logger.info(`Found ${data.length} deals for organization ${orgId}`);
    return (data as unknown as DealRow[]).map((deal) => {
      // Extract intake_data for fallback values
      const intakeData = deal.intake_data as
        | Record<string, unknown>
        | undefined;
      const sponsors = deal.sponsors as Record<string, unknown> | undefined;

      // Determine completion date
      const completionDate =
        deal.projected_completion_date ||
        deal.estimated_completion ||
        deal.completion_date ||
        intakeData?.projectedCompletionDate;

      // Determine shovel ready status
      const shovelReady =
        deal.shovel_ready !== undefined
          ? Boolean(deal.shovel_ready)
          : deal.site_control === "owned" ||
            deal.site_control === "under_contract" ||
            intakeData?.siteControl === "Owned" ||
            intakeData?.siteControl === "Under Contract";

      // Determine program type
      const dealPrograms = deal.programs as string[] | undefined;
      const programType =
        ((dealPrograms && dealPrograms[0]) as ProgramType) || "NMTC";

      // Calculate allocation based on program type with intake_data fallback
      const allocation =
        mapAllocationByProgram(deal, programType) ||
        Number(intakeData?.nmtcFinancingRequested) ||
        Number(intakeData?.totalProjectCost) ||
        0;

      return {
        id: deal.id as string,
        projectName: deal.project_name as string,
        sponsorName: (deal.sponsor_organization_name ||
          sponsors?.organization_name ||
          deal.sponsor_name ||
          "Unknown Sponsor") as string,
        sponsorDescription: "",
        website: deal.website as string | undefined,
        programType,
        projectType: (deal.project_type ||
          intakeData?.projectType ||
          "Commercial Real Estate") as string, // For sector matching
        programLevel: (deal.program_level as ProgramLevel) || "federal",
        stateProgram: deal.state_program as string | undefined,
        allocation,
        creditPrice: 0.76,
        state: (deal.state || "") as string,
        city: (deal.city || "") as string,
        address: deal.address as string | undefined,
        tractType: (deal.tract_types || deal.tract_type || []) as TractType[],
        status: (deal.status || "draft") as DealStatus,
        description: deal.project_description,
        communityImpact: deal.community_benefit || intakeData?.communityImpact,
        projectHighlights: [],
        useOfFunds: deal.total_project_cost
          ? [
              {
                category: "Construction",
                amount: Number(deal.construction_cost) || 0,
              },
              {
                category: "Acquisition",
                amount: Number(deal.acquisition_cost) || 0,
              },
              { category: "Soft Costs", amount: Number(deal.soft_costs) || 0 },
            ].filter((item) => item.amount > 0)
          : [],
        timeline: [
          {
            milestone: "Construction Start",
            date: deal.construction_start_date || "TBD",
            completed: !!deal.construction_start_date,
          },
          {
            milestone: "Projected Completion",
            date: completionDate || "TBD",
            completed: false,
          },
        ].filter((item) => item.date !== "TBD"),
        foundedYear: 2020,
        submittedDate: deal.created_at,
        // Fall back to intake_data for tract data
        povertyRate:
          Number(
            deal.tract_poverty_rate ||
              deal.poverty_rate ||
              intakeData?.tractPovertyRate,
          ) || 0,
        medianIncome:
          Number(
            deal.tract_median_income ||
              deal.median_income ||
              intakeData?.tractMedianIncome,
          ) || 0,
        jobsCreated:
          deal.jobs_created ||
          intakeData?.jobsCreated ||
          intakeData?.permanentJobsFTE ||
          0,
        permanentJobsFTE:
          intakeData?.permanentJobsFTE || deal.jobs_created || 0,
        visible: deal.visible ?? true,
        coordinates:
          deal.latitude && deal.longitude
            ? [deal.longitude, deal.latitude]
            : undefined,
        projectCost:
          Number(
            deal.total_project_cost ||
              deal.project_cost ||
              intakeData?.totalProjectCost,
          ) || 0,
        financingGap:
          Number(deal.financing_gap || intakeData?.financingGap) || 0,
        censusTract: deal.census_tract || intakeData?.censusTract,
        unemployment:
          Number(
            deal.tract_unemployment ||
              deal.unemployment ||
              intakeData?.tractUnemployment,
          ) || 0,
        shovelReady: shovelReady,
        completionDate: completionDate,
        // Tract eligibility for matching
        tractSeverelyDistressed:
          deal.tract_severely_distressed ||
          intakeData?.tractSeverelyDistressed ||
          false,
        tractEligible:
          deal.tract_eligible || intakeData?.tractEligible || false,
        affordableHousingUnits:
          deal.affordable_housing_units ||
          intakeData?.affordableHousingUnits ||
          0,
        // Additional financial fields
        stateNMTCAllocation:
          Number(
            deal.state_nmtc_allocation_request || deal.state_nmtc_allocation,
          ) || 0,
        htcAmount:
          programType === "HTC"
            ? Number(
                deal.project_gross_htc || deal.htc_amount || deal.allocation,
              ) || 0
            : Number(deal.project_gross_htc || deal.htc_amount) || 0,
        // C-Score / Readiness Score — recalculate from merged deal columns + intake_data
        // The stored readiness_score may be stale (scored only against intake_data JSON,
        // missing deal-level columns like address, programs, total_project_cost, etc.)
        readinessScore: (() => {
          const merged: Record<string, unknown> = {
            ...(intakeData || {}),
            projectName: intakeData?.projectName || deal.project_name,
            sponsorName:
              intakeData?.sponsorName ||
              deal.sponsor_organization_name ||
              sponsors?.organization_name ||
              deal.sponsor_name,
            projectType: intakeData?.projectType || deal.project_type,
            address:
              intakeData?.address ||
              deal.address ||
              (deal.city ? `${deal.city}, ${deal.state}` : undefined),
            programs: intakeData?.programs || deal.programs,
            totalProjectCost:
              intakeData?.totalProjectCost || deal.total_project_cost,
            communityImpact:
              intakeData?.communityImpact ||
              intakeData?.communitySupport ||
              deal.community_benefit,
            communitySupport:
              intakeData?.communitySupport ||
              intakeData?.communityImpact ||
              deal.community_benefit,
            permanentJobsFTE:
              intakeData?.permanentJobsFTE ??
              deal.permanent_jobs_fte ??
              deal.jobs_created,
            constructionJobsFTE:
              intakeData?.constructionJobsFTE ?? deal.construction_jobs_fte,
            siteControl: intakeData?.siteControl || deal.site_control,
            constructionStartDate:
              intakeData?.constructionStartDate || deal.construction_start_date,
            targetClosingDate:
              intakeData?.targetClosingDate || deal.projected_closing_date,
            phaseIEnvironmental:
              intakeData?.phaseIEnvironmental || deal.phase_i_environmental,
            zoningApproval: intakeData?.zoningApproval || deal.zoning_approval,
          };
          try {
            return calculateReadiness(merged).totalScore;
          } catch {
            return deal.readiness_score || 0;
          }
        })(),
      };
    }) as unknown as Deal[];
  } catch (error) {
    logger.error("Error in fetchDealsByOrganization", error);
    return [];
  }
}
