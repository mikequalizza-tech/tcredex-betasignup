// tCredex v1.6 - Core Deal Types

export interface Deal {
  id: string;
  project_name: string;
  project_description?: string;
  project_type: string;
  sponsor_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  census_tract: string;
  poverty_rate: number;
  median_income: number;
  unemployment_rate: number;
  total_project_cost: number;
  fed_nmtc_allocation_request: number;
  state_nmtc_allocation_request?: number;
  project_gross_htc?: number;
  shovel_ready: boolean;
  financing_gap: number;
  projected_completion_date: string;
  tract_flags: TractFlags;
  jobs_created?: number;
  affordable_units?: number;
  affordability_levels?: string;
  cra_requirement?: boolean;
  pricing_tiers?: PricingTiers;
  match_score?: number;
  deal_status: DealStatus;
  programs: CreditProgram[];
  created_at: string;
  updated_at: string;
}

export interface TractFlags {
  severely_distressed: boolean;
  opp_zone_eligible: boolean;
  nonmetro: boolean;
  underserved_state?: boolean;
}

export interface PricingTiers {
  good: number;
  better: number;
  best: number;
}

export type DealStatus =
  | "intake"
  | "matched"
  | "term_sheet"
  | "commitment"
  | "closing_room"
  | "closed"
  | "compliance";

export type CreditProgram =
  | "NMTC"
  | "LIHTC"
  | "HTC"
  | "OZ"
  | "STATE_NMTC"
  | "STATE_HTC";

export const DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  intake: ["matched"],
  matched: ["term_sheet", "intake"],
  term_sheet: ["commitment", "matched"],
  commitment: ["closing_room"],
  closing_room: ["closed"],
  closed: ["compliance"],
  compliance: [],
};

export function canTransition(from: DealStatus, to: DealStatus): boolean {
  return DEAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextSteps(status: DealStatus): DealStatus[] {
  return DEAL_TRANSITIONS[status] || [];
}
