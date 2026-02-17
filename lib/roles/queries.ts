/**
 * Role-Aware Query Functions
 * ==========================
 * These functions return different data based on the user's organization type.
 *
 * - Sponsors see: CDEs with allocation, Investors seeking opportunities
 * - CDEs see: Projects/Deals seeking allocation (filtered by match criteria)
 * - Investors see: Projects/Deals in later stages (filtered by preferences)
 */

import { OrgType } from "./config";
import {
  Deal,
  ProgramType,
  ProgramLevel,
  DealStatus,
  TractType,
} from "@/lib/data/deals";
import { CDEDealCard } from "@/lib/types/cde";
import { logger } from "@/lib/utils/logger";
import { fetchApi } from "../api/fetch-utils";
import { fetchCDEs } from "@/lib/supabase/queries";

/** A raw deal row from the database or API response */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DealRow = any;

/** A raw investor row from the API response */
interface InvestorRow {
  id: string;
  name?: string;
  investor_type?: string;
  target_credit_types?: string[];
  max_investment?: number;
  min_investment?: number;
  target_states?: string[];
}

/** CDE preferences for match scoring */
interface CDEPreferences {
  primary_states?: string[];
  min_deal_size?: number;
  max_deal_size?: number;
  require_severely_distressed?: boolean;
}

// Interface for investor cards (shown to sponsors)
export interface InvestorCard {
  id: string;
  organizationName: string;
  investorType: string;
  programs: string[];
  availableCapital: number;
  minInvestment: number;
  maxInvestment: number;
  geographicFocus: string[];
  projectPreferences: string[];
  activelyInvesting: boolean;
  matchScore?: number;
}

// Interface for marketplace results
export interface MarketplaceResult {
  deals: Deal[];
  cdes: CDEDealCard[];
  investors: InvestorCard[];
}

/**
 * Fetch marketplace data based on organization type
 * This is the main entry point for role-aware marketplace data
 * CRITICAL: Uses authenticated API routes, not direct Supabase queries
 */
export async function fetchMarketplaceForRole(
  orgType: OrgType | undefined,
  orgId?: string,
): Promise<MarketplaceResult> {
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (typeof window === "undefined" && process.env.VERCEL === "1");
  if (isBuildTime) {
    return { deals: [], cdes: [], investors: [] };
  }

  try {
    switch (orgType) {
      case "sponsor":
        return await fetchMarketplaceForSponsorViaAPI(orgId);
      case "cde":
        return await fetchMarketplaceForCDEViaAPI(orgId);
      case "investor":
        return await fetchMarketplaceForInvestorViaAPI(orgId);
      default:
        // Unauthenticated users see public deals
        return await fetchPublicMarketplaceViaAPI();
    }
  } catch (error) {
    logger.error("Error fetching marketplace data", error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For Sponsors: Fetch CDEs with allocation + Investors seeking opportunities
 * Uses authenticated API routes
 */
async function fetchMarketplaceForSponsorViaAPI(
  _sponsorOrgId?: string,
): Promise<MarketplaceResult> {
  try {
    // Use the SAME fetchCDEs() function that /map page uses
    // This ensures identical CDE data shape and AutoMatch scores on both pages
    const cdes = await fetchCDEs();

    // Fetch investors via API
    const invResult = await fetchApi<{ investors?: InvestorRow[] }>(
      "/api/investors",
    );
    const invJson =
      invResult.success && invResult.data ? invResult.data : { investors: [] };

    const investors: InvestorCard[] = (invJson.investors || []).map(
      (inv: InvestorRow) => ({
        id: inv.id,
        organizationName: inv.name || "Unknown Investor",
        investorType: inv.investor_type || "institutional",
        programs: inv.target_credit_types || ["NMTC"],
        availableCapital: Number(inv.max_investment) || 0,
        minInvestment: Number(inv.min_investment) || 0,
        maxInvestment: Number(inv.max_investment) || 0,
        geographicFocus: inv.target_states || [],
        projectPreferences: [],
        activelyInvesting: true, // Visible investors are active
      }),
    );

    return { deals: [], cdes, investors };
  } catch (error) {
    logger.error("Error fetching sponsor marketplace via API", error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For CDEs: Fetch deals/projects seeking allocation
 * Uses authenticated API routes
 */
async function fetchMarketplaceForCDEViaAPI(
  _cdeOrgId?: string,
): Promise<MarketplaceResult> {
  try {
    const result = await fetchApi<{ deals?: DealRow[] }>("/api/deals");
    const json = result.success && result.data ? result.data : { deals: [] };

    const deals: Deal[] = (json.deals || []).map((deal: DealRow) =>
      mapDealFromDB(deal),
    );

    // Calculate match scores based on CDE preferences
    // TODO: Fetch CDE preferences and calculate scores
    deals.sort((a, b) => {
      const aScore = a.matchScore || 50;
      const bScore = b.matchScore || 50;
      return bScore - aScore;
    });

    return { deals, cdes: [], investors: [] };
  } catch (error) {
    logger.error("Error fetching CDE marketplace via API", error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For Investors: Fetch deals in later stages (LOI, committed, closing)
 * Uses authenticated API routes
 */
async function fetchMarketplaceForInvestorViaAPI(
  _investorOrgId?: string,
): Promise<MarketplaceResult> {
  try {
    const result = await fetchApi<{ deals?: DealRow[] }>("/api/deals");
    const json = result.success && result.data ? result.data : { deals: [] };

    const deals: Deal[] = (json.deals || []).map((deal: DealRow) =>
      mapDealFromDB(deal),
    );

    return { deals, cdes: [], investors: [] };
  } catch (error) {
    logger.error("Error fetching investor marketplace via API", error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * For unauthenticated users: Show public marketplace view
 */
async function fetchPublicMarketplaceViaAPI(): Promise<MarketplaceResult> {
  try {
    // Public marketplace doesn't require auth, but still use fetchApi for consistency
    const result = await fetchApi<{ deals?: DealRow[] }>("/api/deals", {
      requireAuth: false,
    });
    const json = result.success && result.data ? result.data : { deals: [] };

    const deals: Deal[] = (json.deals || []).map((deal: DealRow) =>
      mapDealFromDB(deal),
    );

    return { deals, cdes: [], investors: [] };
  } catch (error) {
    logger.error("Error fetching public marketplace via API", error);
    return { deals: [], cdes: [], investors: [] };
  }
}

/**
 * Fetch pipeline data based on role
 * Uses authenticated API routes
 * - Sponsors: Their own deals in various stages
 * - CDEs: Deals they've engaged with (flagged, LOI, committed)
 * - Investors: Deals they've expressed interest in
 */
export async function fetchPipelineForRole(
  orgType: OrgType | undefined,
  orgId?: string,
): Promise<Deal[]> {
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (typeof window === "undefined" && process.env.VERCEL === "1");
  if (isBuildTime) {
    return [];
  }

  if (!orgId) {
    return [];
  }

  try {
    const result = await fetchApi<{ deals?: DealRow[] }>("/api/deals");
    const json = result.success && result.data ? result.data : { deals: [] };

    const deals: Deal[] = (json.deals || []).map((deal: DealRow) =>
      mapDealFromDB(deal),
    );

    return deals;
  } catch (error) {
    logger.error(`Error fetching pipeline for ${orgType}`, error);
    return [];
  }
}

// Helper: Map database record to Deal interface
function mapDealFromDB(deal: DealRow): Deal {
  const normalizeText = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";
  const projectDescription = normalizeText(deal.project_description);
  const sponsors = deal.sponsors as Record<string, unknown> | undefined;
  const sponsorDescriptionCandidates = [
    sponsors?.description,
    deal.sponsor_description,
    deal.sponsorDescription,
  ];
  const sponsorDescription =
    sponsorDescriptionCandidates
      .map(normalizeText)
      .find(
        (value) =>
          value && value.toLowerCase() !== projectDescription.toLowerCase(),
      ) || "";

  // Determine completion date from various possible fields
  const timeline = deal.timeline as
    | Array<{ milestone?: string; date?: string }>
    | undefined;
  const completionDate = (deal.projected_completion_date ||
    deal.estimated_completion ||
    deal.completion_date ||
    timeline?.find((t) => t.milestone?.includes("Completion"))?.date) as
    | string
    | undefined;

  // Determine shovel ready status
  const shovelReady =
    deal.shovel_ready !== undefined
      ? Boolean(deal.shovel_ready)
      : deal.site_control === "owned" || deal.site_control === "under_contract";

  const programs = deal.programs as string[] | undefined;

  return {
    id: deal.id as string,
    projectName: deal.project_name as string,
    sponsorName: (deal.sponsor_organization_name ||
      deal.sponsor_name ||
      sponsors?.organization_name ||
      "Unknown Sponsor") as string,
    sponsorDescription,
    website: deal.website as string | undefined,
    programType: ((programs && programs[0]) || "NMTC") as ProgramType,
    programLevel: (deal.program_level || "federal") as ProgramLevel,
    stateProgram: deal.state_program as string | undefined,
    allocation:
      Number(
        deal.nmtc_financing_requested || deal.nmtc_request || deal.allocation,
      ) || 0,
    creditPrice: 0.76,
    state: (deal.state || "") as string,
    city: (deal.city || "") as string,
    address: deal.address as string | undefined,
    tractType: (deal.tract_types || deal.tract_type || []) as TractType[],
    status: (deal.status || "draft") as DealStatus,
    description: deal.project_description as string | undefined,
    communityImpact: deal.community_benefit as string | undefined,
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
        date: (deal.construction_start_date || "TBD") as string,
        completed: !!deal.construction_start_date,
      },
      {
        milestone: "Projected Completion",
        date: (completionDate || "TBD") as string,
        completed: false,
      },
    ].filter((item) => item.date !== "TBD"),
    foundedYear: 2020,
    submittedDate: deal.created_at as string,
    povertyRate: Number(deal.tract_poverty_rate || deal.poverty_rate) || 0,
    medianIncome: Number(deal.tract_median_income || deal.median_income) || 0,
    jobsCreated: (deal.jobs_created || 0) as number,
    visible: (deal.visible as boolean) ?? true,
    coordinates:
      deal.latitude && deal.longitude
        ? [deal.longitude as number, deal.latitude as number]
        : undefined,
    projectCost: Number(deal.total_project_cost || deal.project_cost) || 0,
    financingGap: Number(deal.financing_gap) || 0,
    censusTract: deal.census_tract as string | undefined,
    unemployment: Number(deal.tract_unemployment || deal.unemployment) || 0,
    shovelReady: shovelReady,
    completionDate: completionDate,
    // Additional financial fields
    stateNMTCAllocation:
      Number(
        deal.state_nmtc_allocation_request || deal.state_nmtc_allocation,
      ) || 0,
    htcAmount:
      deal.programType === "HTC"
        ? Number(
            deal.project_gross_htc || deal.htc_amount || deal.allocation,
          ) || 0
        : Number(deal.project_gross_htc || deal.htc_amount) || 0,
  };
}

// Helper: Calculate match score between a deal and CDE preferences
function _calculateMatchScore(
  deal: Deal,
  cdePreferences: CDEPreferences,
): number {
  let score = 50; // Base score

  // State match: +20 points
  if (cdePreferences.primary_states?.includes(deal.state)) {
    score += 20;
  }

  // Sector match: +15 points (would need deal.sector field)
  // TODO: Add sector matching when sector field is available

  // Deal size in preferred range: +15 points
  const min = cdePreferences.min_deal_size || 0;
  const max = cdePreferences.max_deal_size || Infinity;
  if (deal.allocation >= min && deal.allocation <= max) {
    score += 15;
  }

  // Severely distressed tract: +10 points if CDE requires it
  if (
    cdePreferences.require_severely_distressed &&
    deal.tractType.includes("SD")
  ) {
    score += 10;
  }

  // QCT bonus: +5 points
  if (deal.tractType.includes("QCT")) {
    score += 5;
  }

  return Math.min(100, score);
}
