/**
 * CDE-specific Supabase Query Functions
 * Extracted from the main queries.ts file for better organization
 */

import { getSupabaseAdmin } from "../supabase";
import { CDEDealCard } from "@/lib/types/cde";
import {
  Deal,
  ProgramType,
  ProgramLevel,
  DealStatus,
  TractType,
} from "@/lib/data/deals";
import { logger } from "@/lib/utils/logger";
import { fetchApi } from "../api/fetch-utils";

/** A raw CDE row from the database or API response */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CDERow = any;

/** A raw deal row from the database */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DealRow = any;

/** Year allocation entry from API */
interface YearAllocationRow {
  id?: string;
  year?: number;
  allocation_type?: string;
  total_allocation?: number;
  amount_finalized?: number;
  amount_remaining?: number;
  non_metro_commitment?: number;
  deployment_deadline?: string;
  underserved_states?: string[];
  service_area?: string;
  service_area_type?: string;
  predominant_financing?: string;
  predominant_market?: string;
  innovative_activities?: string;
}

/**
 * Fetch all CDEs - uses backend API for reliability
 * Returns CDE organizations from the cdes_merged table
 */
export async function fetchCDEs(): Promise<CDEDealCard[]> {
  // Use frontend API route which handles auth and calls backend if needed
  try {
    const result = await fetchApi<{
      cdes?: CDEDealCard[];
      data?: { cdes?: CDEDealCard[] };
    }>("/api/cdes");

    if (!result.success || !result.data) {
      return [];
    }

    const data =
      result.data.data?.cdes ||
      result.data.cdes ||
      (Array.isArray(result.data) ? result.data : []);

    // Map CDE data to CDEDealCard format
    // API returns normalized format from /api/cdes route with ALL fields
    return data.map((cde: CDERow) => {
      // Handle both API response format and direct database format
      const orgId = cde.organization_id || cde.organizationId;
      const name = cde.name || cde.organization_name || "Unknown CDE";
      const remainingAlloc =
        cde.remaining_allocation || cde.amount_remaining || 0;
      const serviceArea = cde.service_area || cde.serviceArea || "";
      const predominantMarket =
        cde.predominant_market || cde.predominantMarket || "";

      // API enrichment should already derive target_sectors from predominant_financing
      // This is a fallback that should rarely fire
      const targetSectors =
        Array.isArray(cde.target_sectors) && cde.target_sectors.length > 0
          ? cde.target_sectors
          : [];

      // Parse serviceAreaType from raw text if not explicitly set
      const rawServiceAreaType = cde.service_area_type || "";
      const inferredServiceAreaType =
        rawServiceAreaType ||
        (serviceArea.toLowerCase().includes("national")
          ? "national"
          : serviceArea.toLowerCase().includes("multi-state")
            ? "regional"
            : serviceArea.toLowerCase().includes("statewide") ||
                serviceArea.toLowerCase().includes("territory")
              ? "state"
              : serviceArea.toLowerCase().includes("local") ||
                  serviceArea.toLowerCase().includes("county")
                ? "local"
                : "");

      // Parse predominantFinancing from predominantMarket if not explicitly set
      const rawFinancing = cde.predominant_financing || "";
      const inferredFinancing =
        rawFinancing ||
        (predominantMarket.toLowerCase().includes("real estate")
          ? "Real Estate Financing"
          : predominantMarket.toLowerCase().includes("business") ||
              predominantMarket.toLowerCase().includes("operating")
            ? "Operating Business Financing"
            : "");

      // Build specialFocus from boolean flags if not provided as array
      const specialFocus: string[] =
        Array.isArray(cde.special_focus) && cde.special_focus.length > 0
          ? cde.special_focus
          : [
              ...(cde.minority_focus ? ["Minority-owned"] : []),
              ...(cde.native_american_focus ? ["Native American"] : []),
              ...(cde.uts_focus ? ["Underserved"] : []),
            ];

      return {
        id: cde.id,
        organizationId: orgId,
        organizationName: name,
        year: cde.year,
        missionSnippet: cde.mission_statement || cde.description || "",
        remainingAllocation: Number(remainingAlloc) || 0,
        amountFinalized: Number(cde.amount_finalized) || 0,
        allocationDeadline: cde.deployment_deadline || "",
        // Per-year allocation details with underserved states per round
        yearAllocations: Array.isArray(cde.year_allocations)
          ? (cde.year_allocations as YearAllocationRow[]).map((ya) => ({
              id: ya.id || "",
              year: Number(ya.year) || 0,
              allocationType: ya.allocation_type || "federal",
              totalAllocation: Number(ya.total_allocation) || 0,
              amountFinalized: Number(ya.amount_finalized) || 0,
              amountRemaining: Number(ya.amount_remaining) || 0,
              nonMetroCommitment: Number(ya.non_metro_commitment) || 0,
              deploymentDeadline: ya.deployment_deadline || "",
              underservedStates: Array.isArray(ya.underserved_states)
                ? ya.underserved_states
                : [],
              serviceArea: ya.service_area || "",
              serviceAreaType: ya.service_area_type || "",
              predominantFinancing: ya.predominant_financing || "",
              predominantMarket: ya.predominant_market || "",
              innovativeActivities: ya.innovative_activities || "",
            }))
          : undefined,
        allocationYears: Array.isArray(cde.allocation_years)
          ? cde.allocation_years
          : [],
        primaryStates: Array.isArray(cde.primary_states)
          ? cde.primary_states
          : cde.state
            ? [cde.state]
            : [],
        targetSectors: targetSectors,
        impactPriorities:
          Array.isArray(cde.impact_priorities) &&
          cde.impact_priorities.length > 0
            ? cde.impact_priorities
            : targetSectors,
        serviceArea: serviceArea,
        serviceAreaType: inferredServiceAreaType as
          | "national"
          | "regional"
          | "state"
          | "local"
          | undefined,
        predominantMarket: predominantMarket,
        dealSizeRange: {
          min: Number(cde.min_deal_size) || 0,
          max: Number(cde.max_deal_size) || 0,
        },
        ruralFocus: Boolean(cde.rural_focus),
        urbanFocus: Boolean(cde.urban_focus ?? true),
        requireSeverelyDistressed: Boolean(cde.require_severely_distressed),
        prefersSeverelyDistressed: Boolean(cde.prefers_severely_distressed),
        minDistressPercentile: Number(cde.min_distress_percentile) || 0,
        htcExperience: Boolean(cde.htc_experience),
        lihtcExperience: Boolean(cde.lihtc_experience),
        ozExperience: Boolean(cde.oz_experience),
        smallDealFund: Boolean(cde.small_deal_fund),
        minorityFocus: Boolean(cde.minority_focus),
        utsFocus: Boolean(cde.uts_focus),
        specialFocus: specialFocus.length > 0 ? specialFocus : undefined,
        // Critical AutoMatch fields
        forprofitAccepted: Boolean(cde.forprofit_accepted ?? true),
        ownerOccupiedPreferred: Boolean(cde.owner_occupied_preferred),
        nativeAmericanFocus: Boolean(cde.native_american_focus),
        requireQct: Boolean(cde.require_qct),
        prefersQct: Boolean(cde.prefers_qct),
        underservedStatesFocus: Boolean(
          cde.uts_focus || cde.underserved_states_focus,
        ),
        status: cde.status || "active",
        lastUpdated: cde.updated_at || cde.created_at || "",
        // Extra fields for complete display
        website: cde.website || "",
        city: cde.city || cde.headquarters_city || "",
        state: cde.state || cde.headquarters_state || "",
        headquartersCity: cde.headquarters_city || cde.city || "",
        headquartersState: cde.headquarters_state || cde.state || "",
        contactName: cde.primary_contact_name || cde.contact_name || "",
        contactEmail: cde.primary_contact_email || cde.contact_email || "",
        contactPhone: cde.primary_contact_phone || cde.contact_phone || "",
        controllingEntity: cde.controlling_entity || "",
        predominantFinancing: inferredFinancing,
        innovativeActivities: cde.innovative_activities || "",
        nonMetroCommitment: Number(cde.non_metro_commitment) || 0,
        totalAllocation: Number(cde.total_allocation) || 0,
        allocationYear: cde.allocation_year || cde.year?.toString() || "",
        allocationType: cde.allocation_type || "federal",
      };
    });
  } catch (error) {
    logger.error("Error fetching CDEs", {
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
 * CDE detail interface for profile pages
 * Expanded to include all available fields from cdes_merged table
 */
export interface CDEDetail {
  id: string;
  organizationId: string; // organization_id from cdes_merged (used for outreach API)
  name: string;
  slug: string;
  description: string;
  headquartersCity: string;
  headquartersState: string;
  missionFocus: string[];
  projectTypes: string[];
  serviceArea: string[];
  serviceAreaType: string;
  availableAllocation: number;
  totalAllocation: number;
  allocationYear: string;
  minDealSize: number;
  maxDealSize: number;
  projectsClosed: number;
  totalDeployed: number;
  avgDealSize: number;
  responseTime: string;
  acceptingApplications: boolean;
  website: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  // Additional fields from cdes_merged
  allocationType: string; // Federal vs State
  amountRemaining: number; // Available for deployment
  nonMetroCommitment: number; // Non-metro % commitment
  predominantFinancing: string; // Real Estate vs Operating Business
  predominantMarket: string; // Market focus description
  controllingEntity: string; // Parent/controlling org
  innovativeActivities: string; // Special programs
  ruralFocus: boolean;
  urbanFocus: boolean;
  minorityFocus: boolean;
  utsFocus: boolean; // Underserved target states
  nonprofitPreferred: boolean;
  forprofitAccepted: boolean;
  requireSeverelyDistressed: boolean;
  minDistressPercentile: number;
  smallDealFund: boolean;
  htcExperience: boolean;
  lihtcExperience: boolean;
  ozExperience: boolean;
  // Additional deal requirements
  targetRegions: string[];
  excludedStates: string[];
  minJobsCreated: number | null;
  maxTimeToClose: number | null;
  relatedPartyPolicy: string;
  qctRequired: boolean;
  stackedDealsPreferred: boolean;
  // Optional: per-year allocation rows when present
  allocations?: CDEAllocation[];
}

/**
 * Fetch a single CDE by slug - uses cdes_merged table
 * Fetches ALL year rows for the CDE and aggregates allocations
 */
export async function fetchCDEBySlug(slug: string): Promise<CDEDetail | null> {
  const supabase = getSupabaseAdmin();

  // Find the organization_id for this CDE (try slug, then id, then organization_id)
  let orgId: string | null = null;

  const { data: bySlug } = await supabase
    .from("cdes_merged")
    .select("organization_id")
    .eq("slug", slug)
    .limit(1)
    .single();

  if (bySlug) {
    orgId = (bySlug as Record<string, unknown>).organization_id as string;
  } else {
    const { data: byId } = await supabase
      .from("cdes_merged")
      .select("organization_id")
      .eq("id", slug)
      .limit(1)
      .single();

    if (byId) {
      orgId = (byId as Record<string, unknown>).organization_id as string;
    } else {
      const { data: byOrgId } = await supabase
        .from("cdes_merged")
        .select("organization_id")
        .eq("organization_id", slug)
        .limit(1)
        .single();

      if (byOrgId)
        orgId = (byOrgId as Record<string, unknown>).organization_id as string;
    }
  }

  if (!orgId) return null;

  // Fetch ALL rows for this CDE (all allocation years)
  const { data: allRows } = await supabase
    .from("cdes_merged")
    .select("*")
    .eq("organization_id", orgId)
    .order("year", { ascending: false });

  if (!allRows || allRows.length === 0) return null;

  // Latest year row has the best metadata
  const latest = allRows[0] as CDERow;

  // Build per-year allocations and sum totals
  let totalAlloc = 0;
  let totalRemaining = 0;
  const allocations: CDEAllocation[] = [];

  for (const row of allRows as CDERow[]) {
    const rowAlloc = Number(row.total_allocation) || 0;
    const rowRemaining = Number(row.amount_remaining) || 0;
    totalAlloc += rowAlloc;
    totalRemaining += rowRemaining;

    allocations.push({
      id: row.id as string,
      cdeId: orgId,
      year: String(row.year || ""),
      type: (row.allocation_type as "state" | "federal") || "federal",
      awardedAmount: rowAlloc,
      availableOnPlatform: rowRemaining,
      deployedAmount: Number(row.amount_finalized) || 0,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  }

  const detail = mapCDEToDetail(latest);
  detail.allocations = allocations;
  detail.totalAllocation = totalAlloc;
  detail.availableAllocation = totalRemaining;
  return detail;
}

function mapCDEToDetail(cde: CDERow): CDEDetail {
  // Parse sectors from predominant_market if target_sectors is empty
  // This ensures we show market focus even if target_sectors wasn't populated
  const parseSectorsFromMarket = (market: string): string[] => {
    if (!market) return [];
    const sectors: string[] = [];
    const m = market.toLowerCase();
    if (m.includes("community") || m.includes("civic"))
      sectors.push("community_facility");
    if (m.includes("health") || m.includes("medical") || m.includes("clinic"))
      sectors.push("healthcare");
    if (m.includes("education") || m.includes("school"))
      sectors.push("education");
    if (m.includes("housing") || m.includes("residential"))
      sectors.push("affordable_housing");
    if (m.includes("industrial") || m.includes("manufacturing"))
      sectors.push("manufacturing");
    if (m.includes("retail") || m.includes("commercial"))
      sectors.push("retail");
    if (m.includes("food") || m.includes("grocery"))
      sectors.push("food_access");
    if (m.includes("child") || m.includes("daycare")) sectors.push("childcare");
    if (m.includes("mixed")) sectors.push("mixed_use");
    return sectors;
  };

  // Get sectors - try target_sectors first, then parse from predominant_market
  const rawTargetSectors = cde.target_sectors as string[] | undefined;
  const rawImpactPriorities = cde.impact_priorities as string[] | undefined;
  const rawPrimaryStates = cde.primary_states as string[] | undefined;
  const targetSectors =
    rawTargetSectors && rawTargetSectors.length > 0
      ? rawTargetSectors
      : parseSectorsFromMarket((cde.predominant_market as string) || "");

  const year = cde.year as number | undefined;

  return {
    id: cde.id as string,
    organizationId: (cde.organization_id || cde.id) as string,
    name: (cde.name || "Unknown CDE") as string,
    slug: (cde.slug || cde.id) as string,
    description: (cde.mission_statement || cde.description || "") as string,
    headquartersCity: (cde.headquarters_city || cde.city || "") as string,
    headquartersState: (cde.headquarters_state || cde.state || "") as string,
    // Use impact_priorities if available, otherwise fall back to target_sectors
    missionFocus:
      rawImpactPriorities && rawImpactPriorities.length > 0
        ? rawImpactPriorities
        : targetSectors,
    projectTypes: targetSectors,
    serviceArea: rawPrimaryStates || [],
    serviceAreaType: (cde.service_area_type ||
      cde.service_area ||
      "Regional") as string,
    availableAllocation:
      Number(cde.remaining_allocation || cde.amount_remaining) || 0,
    totalAllocation: Number(cde.total_allocation) || 0,
    allocationYear:
      (cde.allocation_year as string) ||
      year?.toString() ||
      new Date().getFullYear().toString(),
    minDealSize: Number(cde.min_deal_size) || 0,
    maxDealSize: Number(cde.max_deal_size) || 0,
    projectsClosed: Number(cde.projects_closed) || 0,
    totalDeployed: Number(cde.total_deployed) || 0,
    avgDealSize: Number(cde.avg_deal_size) || 0,
    responseTime: (cde.response_time as string) || "2-3 weeks",
    acceptingApplications: cde.status === "active",
    website: (cde.website || "") as string,
    primaryContact: (cde.primary_contact_name ||
      cde.contact_name ||
      "") as string,
    contactEmail: (cde.primary_contact_email ||
      cde.contact_email ||
      "") as string,
    contactPhone: (cde.primary_contact_phone ||
      cde.contact_phone ||
      "") as string,
    // Additional fields from cdes_merged
    allocationType: (cde.allocation_type || "Federal") as string,
    amountRemaining:
      Number(cde.amount_remaining || cde.remaining_allocation) || 0,
    nonMetroCommitment: Number(cde.non_metro_commitment) || 0,
    predominantFinancing: (cde.predominant_financing || "") as string,
    predominantMarket: (cde.predominant_market || "") as string,
    controllingEntity: (cde.controlling_entity || "") as string,
    innovativeActivities: (cde.innovative_activities || "") as string,
    ruralFocus: Boolean(cde.rural_focus),
    urbanFocus: Boolean(cde.urban_focus ?? true),
    minorityFocus: Boolean(cde.minority_focus),
    utsFocus: Boolean(cde.uts_focus),
    nonprofitPreferred: Boolean(cde.nonprofit_preferred),
    forprofitAccepted: Boolean(cde.forprofit_accepted ?? true),
    requireSeverelyDistressed: Boolean(cde.require_severely_distressed),
    minDistressPercentile: Number(cde.min_distress_percentile) || 0,
    smallDealFund: Boolean(cde.small_deal_fund),
    htcExperience: Boolean(cde.htc_experience),
    lihtcExperience: Boolean(cde.lihtc_experience),
    ozExperience: Boolean(cde.oz_experience),
    // Additional deal requirements
    targetRegions: (cde.target_regions as string[]) || [],
    excludedStates: (cde.excluded_states as string[]) || [],
    minJobsCreated: (cde.min_jobs_created as number | null) ?? null,
    maxTimeToClose: (cde.max_time_to_close as number | null) ?? null,
    relatedPartyPolicy: (cde.related_party_policy || "case-by-case") as string,
    qctRequired: Boolean(cde.qct_required),
    stackedDealsPreferred: Boolean(cde.stacked_deals_preferred),
    allocations: (cde.allocations ||
      cde.cde_allocations ||
      []) as CDEAllocation[],
  };
}

/**
 * Fetch deals in CDE's pipeline (matched/interested deals)
 */
export async function fetchCDEPipelineDeals(cdeOrgId: string): Promise<Deal[]> {
  const supabase = getSupabaseAdmin();

  // Collect ALL possible IDs for this CDE from cdes_merged (SOT)
  // cdes_merged has multiple rows per CDE (one per allocation year), each with a different UUIDv5 id
  // outreach may store any of: cdes_merged.id (per-year), cdes_merged.organization_id
  const allCdeIds = new Set<string>([cdeOrgId]);

  const { data: mergedRows } = await supabase
    .from("cdes_merged")
    .select("id, organization_id")
    .eq("organization_id", cdeOrgId);

  for (const row of (mergedRows || []) as Array<{
    id: string;
    organization_id: string;
  }>) {
    if (row.id) allCdeIds.add(row.id);
    if (row.organization_id) allCdeIds.add(row.organization_id);
  }

  const cdeIdArray = [...allCdeIds];

  // Get deal IDs from match_requests checking ALL possible target IDs
  const { data: matchRequests } = await supabase
    .from("match_requests")
    .select("deal_id")
    .in("target_id", cdeIdArray)
    .eq("target_type", "cde")
    .in("status", ["pending", "accepted"]);

  const invitedDealIds = [
    ...new Set(
      ((matchRequests || []) as Array<{ deal_id: string }>).map(
        (r) => r.deal_id,
      ),
    ),
  ];

  // Build OR conditions: assigned deals (all CDE IDs) + outreach-invited deals
  const orClauses: string[] = [];
  for (const cid of cdeIdArray) {
    orClauses.push(`assigned_cde_id.eq.${cid}`);
  }
  if (invitedDealIds.length > 0) {
    orClauses.push(`id.in.(${invitedDealIds.join(",")})`);
  }

  // If no conditions at all, return empty
  if (orClauses.length === 0) return [];

  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .or(orClauses.join(","))
    .order("updated_at", { ascending: false });

  if (error) {
    logger.error("Error fetching CDE pipeline deals", error);
    return [];
  }

  return (data || []).map((deal: DealRow) => {
    const sponsors = deal.sponsors as Record<string, unknown> | undefined;
    const programs = deal.programs as string[] | undefined;
    return {
      id: deal.id as string,
      projectName: deal.project_name as string,
      sponsorName: (deal.sponsor_organization_name ||
        sponsors?.organization_name ||
        deal.sponsor_name ||
        "Unknown Sponsor") as string,
      sponsorDescription: "",
      website: deal.website as string | undefined,
      programType: ((programs && programs[0]) || "NMTC") as ProgramType,
      projectType: (deal.project_type || "Commercial Real Estate") as string,
      programLevel: (deal.program_level || "federal") as ProgramLevel,
      stateProgram: deal.state_program as string | undefined,
      allocation:
        Number(deal.nmtc_financing_requested) ||
        Number(deal.fed_nmtc_allocation_request) ||
        0,
      creditPrice: 0.76,
      state: (deal.state || "") as string,
      city: (deal.city || "") as string,
      tractType: (deal.tract_types || []) as TractType[],
      status: (deal.status || "draft") as DealStatus,
      description: deal.project_description as string | undefined,
      communityImpact: deal.community_benefit as string | undefined,
      projectHighlights: [],
      useOfFunds: [],
      timeline: [],
      foundedYear: 2020,
      submittedDate: deal.created_at as string,
      povertyRate: Number(deal.tract_poverty_rate) || 0,
      medianIncome: Number(deal.tract_median_income) || 0,
      jobsCreated: (deal.jobs_created || 0) as number,
      visible: (deal.visible as boolean) ?? true,
      coordinates:
        deal.latitude && deal.longitude
          ? [deal.longitude as number, deal.latitude as number]
          : undefined,
      projectCost: Number(deal.total_project_cost) || 0,
      financingGap: Number(deal.financing_gap) || 0,
      censusTract: deal.census_tract as string | undefined,
      unemployment: Number(deal.tract_unemployment) || 0,
    };
  });
}

/**
 * CDE Allocation interface
 */
export interface CDEAllocation {
  id: string;
  cdeId: string;
  type: "federal" | "state";
  year: string;
  stateCode?: string;
  awardedAmount: number;
  availableOnPlatform: number;
  deployedAmount: number;
  percentageWon?: number;
  deploymentDeadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all allocations for a specific CDE organization
 * Now uses cdes_merged which has allocation data embedded
 */
export async function fetchCDEAllocations(
  cdeOrgId: string,
): Promise<CDEAllocation[]> {
  const supabase = getSupabaseAdmin();

  try {
    // Get all CDE allocation rows from cdes_merged (one per year)
    const { data: cdeRows, error: cdeError } = await supabase
      .from("cdes_merged")
      .select("*")
      .eq("organization_id", cdeOrgId)
      .order("year", { ascending: false });

    if (cdeError || !cdeRows || cdeRows.length === 0) {
      logger.error("Error finding CDE for organization", cdeError);
      return [];
    }

    // Return allocations for each year
    return (cdeRows as Array<Record<string, unknown>>)
      .filter((cde) => cde.remaining_allocation || cde.total_allocation)
      .map((cde) => ({
        id: cde.id as string,
        cdeId: cde.id as string,
        type: "federal" as const,
        year: (
          (cde.allocation_year || cde.year || new Date().getFullYear()) as
            | string
            | number
        ).toString(),
        awardedAmount: Number(cde.total_allocation) || 0,
        availableOnPlatform: Number(cde.remaining_allocation) || 0,
        deployedAmount:
          (Number(cde.total_allocation) || 0) -
          (Number(cde.remaining_allocation) || 0),
        deploymentDeadline: cde.deployment_deadline as string | undefined,
        createdAt: cde.created_at as string,
        updatedAt: cde.updated_at as string,
      }));
  } catch (error) {
    logger.error("Error in fetchCDEAllocations", error);
    return [];
  }
}

/**
 * Fetch CDE investment criteria
 */
export interface CDEInvestmentCriteria {
  id: string;
  primaryStates: string[];
  minDealSize: number;
  maxDealSize: number;
  targetSectors: string[];
  impactPriorities: string[];
  ruralFocus: boolean;
  urbanFocus: boolean;
  requireSeverelyDistressed: boolean;
  minJobsPerMillion?: number;
}

export async function fetchCDECriteria(
  cdeOrgId: string,
): Promise<CDEInvestmentCriteria | null> {
  const supabase = getSupabaseAdmin();

  try {
    const { data: rawData, error } = await supabase
      .from("cdes_merged")
      .select("*")
      .eq("organization_id", cdeOrgId)
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle();

    const data = rawData as Record<string, unknown> | null;

    if (error || !data) {
      logger.error("Error fetching CDE criteria", error);
      return null;
    }

    return {
      id: data.id as string,
      primaryStates: (data.primary_states as string[]) || [],
      minDealSize: Number(data.min_deal_size) || 0,
      maxDealSize: Number(data.max_deal_size) || 0,
      targetSectors: (data.target_sectors as string[]) || [],
      impactPriorities: (data.impact_priorities as string[]) || [],
      ruralFocus: Boolean(data.rural_focus),
      urbanFocus: Boolean(data.urban_focus),
      requireSeverelyDistressed: Boolean(data.require_severely_distressed),
      minJobsPerMillion: data.min_jobs_per_million
        ? Number(data.min_jobs_per_million)
        : undefined,
    };
  } catch (error) {
    logger.error("Error in fetchCDECriteria", error);
    return null;
  }
}
