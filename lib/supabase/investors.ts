/**
 * Investor-specific Supabase Query Functions
 * Extracted from the main queries.ts file for better organization
 */

import { getSupabaseAdmin } from "../supabase";

/**
 * Investor detail interface for profile pages
 */
export interface InvestorDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  investorType: string;
  programs: string[];
  projectPreferences: string[];
  geographicFocus: string[];
  focusType: string;
  availableCapital: number;
  totalCapital: number;
  minInvestment: number;
  maxInvestment: number;
  dealsCompleted: number;
  totalInvested: number;
  avgDealSize: number;
  targetReturn: string;
  responseTime: string;
  activelyInvesting: boolean;
  requiresCDE: boolean;
  directInvestment: boolean;
  website: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
}

/**
 * Fetch a single investor by slug - uses investors table
 */
export async function fetchInvestorBySlug(
  slug: string,
): Promise<InvestorDetail | null> {
  const supabase = getSupabaseAdmin();

  // Try to find by slug first
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    // Try by investor id as fallback
    const { data: byId, error: byIdError } = await supabase
      .from("investors")
      .select("*")
      .eq("id", slug)
      .single();

    if (byIdError || !byId) {
      return null;
    }

    return mapInvestorToDetail(byId);
  }

  return mapInvestorToDetail(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase `select('*')` returns untyped rows; mapping to InvestorDetail
function mapInvestorToDetail(investor: any): InvestorDetail {
  return {
    id: investor.id,
    name: investor.organization_name || investor.name || "Unknown Investor",
    slug: investor.slug || investor.id,
    description: investor.investment_thesis || investor.description || "",
    investorType: investor.investor_type || "institutional",
    programs: investor.target_credit_types || investor.programs || ["NMTC"],
    projectPreferences:
      investor.target_sectors || investor.project_preferences || [],
    geographicFocus:
      investor.target_states ||
      investor.preferred_states ||
      investor.geographic_focus ||
      [],
    focusType:
      investor.focus_type ||
      (investor.target_states?.length ? "Regional" : "National"),
    availableCapital:
      Number(investor.available_capital) ||
      Number(investor.max_investment) ||
      0,
    totalCapital:
      Number(investor.total_capital) || Number(investor.max_investment) || 0,
    minInvestment: Number(investor.min_investment) || 0,
    maxInvestment: Number(investor.max_investment) || 0,
    dealsCompleted: Number(investor.deals_completed) || 0,
    totalInvested: Number(investor.total_invested) || 0,
    avgDealSize: Number(investor.avg_deal_size) || 0,
    targetReturn: investor.target_return || "Market Rate",
    responseTime: investor.response_time || "1-2 weeks",
    activelyInvesting:
      investor.status === "active" || investor.is_active !== false,
    requiresCDE: investor.requires_cde ?? true,
    directInvestment: investor.direct_investment ?? false,
    website: investor.website || "",
    primaryContact: investor.primary_contact_name || "",
    contactEmail: investor.primary_contact_email || "",
    contactPhone: investor.primary_contact_phone || "",
  };
}
