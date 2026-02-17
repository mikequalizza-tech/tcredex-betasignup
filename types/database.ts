/**
 * tCredex Database Types v1.7
 * Auto-generated from Supabase schema
 *
 * These types mirror the database schema exactly
 */

// =============================================================================
// ENUMS
// =============================================================================

export type OrgType = "cde" | "sponsor" | "investor" | "admin";
export type UserRole = "ORG_ADMIN" | "PROJECT_ADMIN" | "MEMBER" | "VIEWER";
export type DealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "available"
  | "seeking_capital"
  | "matched"
  | "closing"
  | "closed"
  | "withdrawn";
export type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ" | "Brownfield";
export type LOIStatus =
  | "draft"
  | "issued"
  | "pending_sponsor"
  | "sponsor_accepted"
  | "sponsor_rejected"
  | "sponsor_countered"
  | "withdrawn"
  | "expired"
  | "superseded";
export type CommitmentStatus =
  | "draft"
  | "issued"
  | "pending_sponsor"
  | "pending_cde"
  | "all_accepted"
  | "rejected"
  | "withdrawn"
  | "expired"
  | "closing"
  | "closed";
export type DocumentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_review";
export type LedgerActorType = "system" | "human" | "api_key";

// =============================================================================
// CORE TABLES
// =============================================================================

export interface DbOrganization {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  logo_url?: string;
  website?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  verified: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  organization_id?: string;
  phone?: string;
  title?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  organization?: DbOrganization;
}

export interface DbCDE {
  id: string;
  organization_id: string;
  certification_number?: string;
  parent_organization?: string;
  year_established?: number;

  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;

  total_allocation: number;
  remaining_allocation: number;
  deployment_deadline?: string;

  min_deal_size: number;
  max_deal_size: number;
  small_deal_fund: boolean;

  service_area_type: string;
  primary_states: string[];
  target_regions?: string[];
  excluded_states?: string[];
  rural_focus: boolean;
  urban_focus: boolean;
  native_american_focus: boolean;
  underserved_states_focus: boolean;

  mission_statement?: string;
  impact_priorities: string[];
  target_sectors: string[];
  special_focus?: string[];

  preferred_project_types: string[];
  require_severely_distressed: boolean;
  require_qct: boolean;
  min_distress_score?: number;
  min_project_cost?: number;
  max_project_cost?: number;
  min_jobs_created?: number;
  require_community_benefits: boolean;
  require_shovel_ready: boolean;
  max_time_to_close?: number;
  related_party_policy: string;

  nmtc_experience: boolean;
  htc_experience: boolean;
  lihtc_experience: boolean;
  oz_experience: boolean;
  stacked_deals_preferred: boolean;

  total_deals_completed: number;
  total_qlici_deployed: number;
  average_close_time?: number;

  status: string;
  created_at: string;
  updated_at: string;

  // Joined
  organization?: DbOrganization;
  allocations?: DbCDEAllocation[];
}

export interface DbCDEAllocation {
  id: string;
  cde_id: string;
  type: "federal" | "state";
  year: string;
  state_code?: string;
  awarded_amount: number;
  available_on_platform: number;
  deployed_amount: number;
  percentage_won?: number;
  deployment_deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DbSponsor {
  id: string;
  organization_id: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  organization_type?: string;
  low_income_owned?: boolean;
  woman_owned: boolean;
  minority_owned: boolean;
  veteran_owned: boolean;
  total_projects_completed: number;
  total_project_value: number;
  exclusivity_agreed: boolean;
  exclusivity_agreed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  organization?: DbOrganization;
}

export interface DbInvestor {
  id: string;
  organization_id: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  investor_type?: string;
  cra_motivated: boolean;
  min_investment?: number;
  max_investment?: number;
  target_credit_types: ProgramType[];
  target_states?: string[];
  target_sectors?: string[];
  total_investments: number;
  total_invested: number;
  accredited: boolean;
  verified_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  organization?: DbOrganization;
}

// =============================================================================
// DEALS
// =============================================================================

export interface DbDeal {
  id: string;
  project_name: string;
  sponsor_id?: string;
  sponsor_name?: string;
  sponsor_organization_id?: string;

  programs: ProgramType[];
  program_level: string;
  state_program?: string;

  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  county?: string;
  census_tract?: string;
  latitude?: number;
  longitude?: number;

  tract_types?: string[];
  tract_poverty_rate?: number;
  tract_median_income?: number;
  tract_unemployment?: number;
  tract_eligible?: boolean;
  tract_severely_distressed?: boolean;
  tract_classification?: string;

  project_type?: string;
  venture_type?: string;
  project_description?: string;
  tenant_mix?: string;

  total_project_cost?: number;
  nmtc_financing_requested?: number;
  financing_gap?: number;

  land_cost?: number;
  acquisition_cost?: number;
  construction_cost?: number;
  soft_costs?: number;
  contingency?: number;
  developer_fee?: number;
  financing_costs?: number;
  reserves?: number;

  equity_amount?: number;
  debt_amount?: number;
  grant_amount?: number;
  other_amount?: number;
  committed_capital_pct?: number;

  jobs_created?: number;
  jobs_retained?: number;
  permanent_jobs_fte?: number;
  construction_jobs_fte?: number;
  commercial_sqft?: number;
  housing_units?: number;
  affordable_housing_units?: number;
  community_benefit?: string;

  site_control?: string;
  site_control_date?: string;
  phase_i_environmental?: string;
  zoning_approval?: string;
  building_permits?: string;
  construction_drawings?: string;
  construction_start_date?: string;
  projected_completion_date?: string;
  projected_closing_date?: string;

  status: DealStatus;
  visible: boolean;
  readiness_score: number;
  tier: number;

  assigned_cde_id?: string;
  assigned_cde_name?: string;
  investor_id?: string;
  investor_name?: string;

  exclusivity_agreed: boolean;
  exclusivity_agreed_at?: string;

  qalicb_data: Record<string, unknown>;
  htc_data: Record<string, unknown>;
  intake_data: Record<string, unknown>;
  checklist: Record<string, unknown>;

  ai_flags?: string[];
  scoring_breakdown?: Record<string, unknown>;

  submitted_at?: string;
  matched_at?: string;
  closing_started_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  sponsor?: DbSponsor;
  assigned_cde?: DbCDE;
  investor?: DbInvestor;
}

// =============================================================================
// TRANSACTIONS (LOI, COMMITMENT, CLOSING)
// =============================================================================

export interface DbLOICondition {
  id: string;
  description: string;
  status: "pending" | "satisfied" | "waived";
  due_date?: string;
  satisfied_at?: string;
  notes?: string;
}

export interface DbLOI {
  id: string;
  loi_number?: string;
  deal_id: string;
  cde_id: string;
  sponsor_id: string;
  status: LOIStatus;

  allocation_amount: number;
  qlici_rate?: number;
  leverage_structure: string;
  term_years: number;

  expires_at?: string;
  expected_closing_date?: string;
  sponsor_response_deadline?: string;

  conditions: DbLOICondition[];
  special_terms?: string;
  cde_requirements: Record<string, unknown>;

  sponsor_response_at?: string;
  sponsor_response_notes?: string;
  counter_terms?: Record<string, unknown>;

  issued_at?: string;
  issued_by?: string;

  withdrawn_at?: string;
  withdrawn_by?: string;
  withdrawn_reason?: string;

  superseded_by?: string;

  created_at: string;
  updated_at: string;

  // Joined
  deal?: DbDeal;
  cde?: DbCDE;
  sponsor?: DbSponsor;
}

export interface DbCommitmentCondition {
  id: string;
  description: string;
  status: "pending" | "satisfied" | "waived";
  responsible_party?: string;
  due_date?: string;
  satisfied_at?: string;
  notes?: string;
}

export interface DbCommitment {
  id: string;
  commitment_number?: string;
  deal_id: string;
  loi_id?: string;
  investor_id: string;
  cde_id?: string;
  sponsor_id: string;
  status: CommitmentStatus;

  investment_amount: number;
  credit_type: ProgramType;
  credit_rate?: number;
  expected_credits?: number;
  pricing_cents_per_credit?: number;
  net_benefit_to_project?: number;

  cra_eligible: boolean;

  expires_at?: string;
  target_closing_date?: string;
  response_deadline?: string;

  conditions: DbCommitmentCondition[];
  special_terms?: string;
  investor_requirements: Record<string, unknown>;

  sponsor_accepted_at?: string;
  sponsor_accepted_by?: string;
  cde_accepted_at?: string;
  cde_accepted_by?: string;
  all_accepted_at?: string;

  issued_at?: string;
  issued_by?: string;

  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: string;

  withdrawn_at?: string;
  withdrawn_by?: string;
  withdrawn_reason?: string;

  created_at: string;
  updated_at: string;

  // Joined
  deal?: DbDeal;
  investor?: DbInvestor;
  cde?: DbCDE;
  sponsor?: DbSponsor;
  loi?: DbLOI;
}

export interface DbClosingRoom {
  id: string;
  deal_id: string;
  commitment_id?: string;
  loi_id?: string;
  status: string;
  target_close_date?: string;
  actual_close_date?: string;
  participants: Record<string, unknown>[];
  checklist_progress: Record<string, unknown>;
  notes?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined
  deal?: DbDeal;
  commitment?: DbCommitment;
  loi?: DbLOI;
}

// =============================================================================
// DOCUMENTS
// =============================================================================

export interface DbDocument {
  id: string;
  organization_id?: string;
  deal_id?: string;
  closing_room_id?: string;
  uploaded_by?: string;

  name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;

  category?: string;
  tags: string[];

  status: DocumentStatus;

  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;

  version: number;
  parent_document_id?: string;

  ai_summary?: string;
  ai_flags?: string[];

  content_hash?: string;

  created_at: string;
  updated_at: string;
}

// =============================================================================
// LEDGER
// =============================================================================

export interface DbLedgerEvent {
  id: number;
  event_timestamp: string;
  actor_type: LedgerActorType;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload_json: Record<string, unknown>;
  model_version?: string;
  reason_codes?: Record<string, unknown>;
  prev_hash?: string;
  hash: string;
  sig?: string;
  created_at: string;
}

// =============================================================================
// TEAM & ACCESS
// =============================================================================

export interface DbTeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  title?: string;
  invited_by?: string;
  invited_at?: string;
  accepted_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Joined
  user?: DbUser;
}

export interface DbProjectAssignment {
  id: string;
  user_id: string;
  deal_id: string;
  role: "admin" | "member" | "viewer";
  assigned_by?: string;
  assigned_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

// =============================================================================
// DATABASE HELPER TYPE (Supabase tables)
// =============================================================================

// Generic table type for tables not explicitly defined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericTable = { Row: any; Insert: any; Update: any; Relationships: [] };

// Use a fully permissive Database type to avoid strict type checking on tables
// that may not be fully synchronized with the actual database schema
export interface Database {
  public: {
    Tables: {
      [key: string]: GenericTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
