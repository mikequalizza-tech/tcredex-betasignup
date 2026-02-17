import { getSupabase } from "../supabase";
import { logger } from "@/lib/utils/logger";

// =============================================================================
// INVESTOR QUERIES
// =============================================================================

export interface InvestorData {
  id: string;
  name: string;
  slug: string;
  description: string;
  investorType: string;
  totalCapital: number;
  availableCapital: number;
  targetDeployment: number;
  programs: string[];
  minInvestment: number;
  maxInvestment: number;
  targetReturn: string;
  geographicFocus: string[];
  focusType: string;
  projectPreferences: string[];
  requiresCDE: boolean;
  directInvestment: boolean;
  dealsCompleted: number;
  totalInvested: number;
  avgDealSize: number;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  activelyInvesting: boolean;
  responseTime: string;
}

/**
 * Fetch all investors from Supabase
 */
export async function fetchInvestors(): Promise<InvestorData[]> {
  const supabase = getSupabase();

  // No organizations table — read directly from investors table
  const { data, error } = await supabase.from("investors").select("*");

  if (error) {
    const isBuild =
      process.env.NODE_ENV === "production" && typeof window === "undefined";
    const isRecursion = error.message?.toLowerCase().includes("recursion");

    if (!isBuild || !isRecursion) {
      logger.error("Error fetching investors", error);
    }
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase `select('*')` returns untyped rows; mapping to InvestorData
  return (data || []).map((inv: any) => ({
    id: inv.id,
    name: inv.organization_name || "Unknown Investor",
    slug: inv.organization_id || inv.id,
    description: inv.description || "",
    investorType: inv.investor_type || "fund",
    totalCapital: Number(inv.total_capital) || 0,
    availableCapital: Number(inv.available_capital) || 0,
    targetDeployment: Number(inv.target_deployment) || 0,
    programs: inv.target_credit_types || [],
    minInvestment: Number(inv.min_investment) || 0,
    maxInvestment: Number(inv.max_investment) || 0,
    targetReturn: inv.target_return || "",
    geographicFocus: inv.target_states || [],
    focusType: inv.focus_type || "national",
    projectPreferences: inv.target_sectors || [],
    requiresCDE: inv.requires_cde || false,
    directInvestment: inv.direct_investment ?? true,
    dealsCompleted: inv.total_investments || 0,
    totalInvested: Number(inv.total_invested) || 0,
    avgDealSize:
      inv.total_investments > 0
        ? Number(inv.total_invested) / inv.total_investments
        : 0,
    primaryContact: inv.primary_contact_name || "",
    contactEmail: inv.primary_contact_email || "",
    contactPhone: inv.primary_contact_phone || "",
    website: "",
    activelyInvesting: inv.actively_investing ?? true,
    responseTime: inv.response_time || "standard",
  }));
}

/**
 * Fetch investors by program type
 */
export async function fetchInvestorsByProgram(
  program: string,
): Promise<InvestorData[]> {
  const investors = await fetchInvestors();
  return investors.filter((inv) => inv.programs.includes(program));
}

/**
 * Fetch investors by state
 */
export async function fetchInvestorsByState(
  state: string,
): Promise<InvestorData[]> {
  const investors = await fetchInvestors();
  return investors.filter(
    (inv) =>
      inv.geographicFocus.includes("ALL") ||
      inv.geographicFocus.includes(state),
  );
}

/**
 * Fetch actively investing investors
 */
export async function fetchActiveInvestors(): Promise<InvestorData[]> {
  const investors = await fetchInvestors();
  return investors.filter((inv) => inv.activelyInvesting);
}

/**
 * Get investor statistics
 */
export async function getInvestorStats() {
  const investors = await fetchInvestors();
  const active = investors.filter((i) => i.activelyInvesting).length;
  const totalAvailable = investors.reduce(
    (sum, i) => sum + i.availableCapital,
    0,
  );

  return {
    total: investors.length,
    active,
    totalAvailable,
    byProgram: {
      NMTC: investors.filter((i) => i.programs.includes("NMTC")).length,
      HTC: investors.filter((i) => i.programs.includes("HTC")).length,
      LIHTC: investors.filter((i) => i.programs.includes("LIHTC")).length,
      OZ: investors.filter((i) => i.programs.includes("OZ")).length,
      Brownfield: investors.filter((i) => i.programs.includes("Brownfield"))
        .length,
    },
  };
}
