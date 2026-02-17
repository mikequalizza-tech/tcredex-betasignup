/**
 * tCredex LOI & Commitment Types
 * 
 * Transaction Flow:
 * 1. CDE issues LOI → Sponsor accepts → Deal: "Seeking Capital"
 * 2. Investor issues Commitment → All accept → Closing Room opens
 */

// =============================================================================
// LOI STATUS & TRANSITIONS
// =============================================================================

export type LOIStatus =
  | 'draft'
  | 'issued'
  | 'pending_sponsor'
  | 'sponsor_accepted'
  | 'sponsor_rejected'
  | 'sponsor_countered'
  | 'expired'
  | 'withdrawn'
  | 'superseded';

export const LOI_TRANSITIONS: Record<LOIStatus, LOIStatus[]> = {
  draft: ['issued', 'withdrawn'],
  issued: ['pending_sponsor', 'withdrawn', 'expired'],
  pending_sponsor: ['sponsor_accepted', 'sponsor_rejected', 'sponsor_countered', 'expired', 'withdrawn'],
  sponsor_accepted: ['superseded', 'withdrawn'],
  sponsor_rejected: [],
  sponsor_countered: ['issued', 'withdrawn'], // CDE can revise and re-issue
  expired: [],
  withdrawn: [],
  superseded: [],
};

export const LOI_STATUS_LABELS: Record<LOIStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  pending_sponsor: 'Pending Sponsor Response',
  sponsor_accepted: 'Accepted',
  sponsor_rejected: 'Rejected',
  sponsor_countered: 'Countered',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  superseded: 'Superseded',
};

export const LOI_STATUS_COLORS: Record<LOIStatus, string> = {
  draft: 'gray',
  issued: 'blue',
  pending_sponsor: 'yellow',
  sponsor_accepted: 'green',
  sponsor_rejected: 'red',
  sponsor_countered: 'orange',
  expired: 'gray',
  withdrawn: 'gray',
  superseded: 'gray',
};

// =============================================================================
// COMMITMENT STATUS & TRANSITIONS
// =============================================================================

export type CommitmentStatus =
  | 'draft'
  | 'issued'
  | 'pending_sponsor'
  | 'pending_cde'
  | 'sponsor_accepted'
  | 'cde_accepted'
  | 'all_accepted'
  | 'rejected'
  | 'expired'
  | 'withdrawn'
  | 'superseded';

export const COMMITMENT_TRANSITIONS: Record<CommitmentStatus, CommitmentStatus[]> = {
  draft: ['issued', 'withdrawn'],
  issued: ['pending_sponsor', 'pending_cde', 'withdrawn', 'expired'],
  pending_sponsor: ['sponsor_accepted', 'rejected', 'expired', 'withdrawn'],
  pending_cde: ['cde_accepted', 'rejected', 'expired', 'withdrawn'],
  sponsor_accepted: ['pending_cde', 'all_accepted', 'withdrawn'], // If CDE already accepted
  cde_accepted: ['pending_sponsor', 'all_accepted', 'withdrawn'], // If sponsor already accepted
  all_accepted: ['superseded', 'withdrawn'],
  rejected: [],
  expired: [],
  withdrawn: [],
  superseded: [],
};

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  pending_sponsor: 'Pending Sponsor',
  pending_cde: 'Pending CDE',
  sponsor_accepted: 'Sponsor Accepted',
  cde_accepted: 'CDE Accepted',
  all_accepted: 'Fully Committed',
  rejected: 'Rejected',
  expired: 'Expired',
  withdrawn: 'Withdrawn',
  superseded: 'Superseded',
};

export const COMMITMENT_STATUS_COLORS: Record<CommitmentStatus, string> = {
  draft: 'gray',
  issued: 'blue',
  pending_sponsor: 'yellow',
  pending_cde: 'yellow',
  sponsor_accepted: 'cyan',
  cde_accepted: 'cyan',
  all_accepted: 'green',
  rejected: 'red',
  expired: 'gray',
  withdrawn: 'gray',
  superseded: 'gray',
};

// =============================================================================
// LOI INTERFACE
// =============================================================================

export interface LOICondition {
  id: string;
  description: string;
  status: 'pending' | 'satisfied' | 'waived';
  due_date?: string;
  satisfied_at?: string;
  notes?: string;
}

export interface LOI {
  id: string;
  deal_id: string;
  cde_id: string;
  sponsor_id: string;
  
  loi_number: string;
  status: LOIStatus;
  
  // Financial Terms
  allocation_amount: number;
  qlici_rate?: number;
  leverage_structure?: 'standard' | 'self-leverage' | 'hybrid';
  term_years: number;
  
  // Dates
  issued_at?: string;
  expires_at?: string;
  sponsor_response_deadline?: string;
  expected_closing_date?: string;
  
  // Conditions
  conditions: LOICondition[];
  special_terms?: string;
  cde_requirements?: Record<string, unknown>;
  
  // Document
  document_id?: string;
  document_url?: string;
  
  // Response
  sponsor_response_at?: string;
  sponsor_response_notes?: string;
  counter_terms?: Record<string, unknown>;
  
  // Workflow
  issued_by?: string;
  withdrawn_by?: string;
  withdrawn_at?: string;
  withdrawn_reason?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  deal?: {
    project_name: string;
    sponsor_name: string;
  };
  cde?: {
    name: string;
  };
}

// =============================================================================
// COMMITMENT INTERFACE
// =============================================================================

export interface CommitmentCondition {
  id: string;
  description: string;
  status: 'pending' | 'satisfied' | 'waived';
  responsible_party: 'sponsor' | 'cde' | 'investor';
  due_date?: string;
  satisfied_at?: string;
  notes?: string;
}

export interface Commitment {
  id: string;
  deal_id: string;
  loi_id?: string;
  investor_id: string;
  cde_id?: string;
  sponsor_id: string;
  
  commitment_number: string;
  status: CommitmentStatus;
  
  // Financial Terms
  investment_amount: number;
  credit_type: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
  credit_rate?: number;
  expected_credits?: number;
  pricing_cents_per_credit?: number;
  net_benefit_to_project?: number;
  
  // Dates
  issued_at?: string;
  expires_at?: string;
  response_deadline?: string;
  target_closing_date?: string;
  
  // Acceptance Tracking
  sponsor_accepted_at?: string;
  sponsor_accepted_by?: string;
  cde_accepted_at?: string;
  cde_accepted_by?: string;
  all_accepted_at?: string;
  
  // Conditions
  conditions: CommitmentCondition[];
  investor_requirements?: Record<string, unknown>;
  special_terms?: string;
  cra_eligible: boolean;
  
  // Document
  document_id?: string;
  document_url?: string;
  
  // Workflow
  issued_by?: string;
  withdrawn_by?: string;
  withdrawn_at?: string;
  withdrawn_reason?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  deal?: {
    project_name: string;
  };
  investor?: {
    name: string;
  };
  cde?: {
    name: string;
  };
  loi?: {
    loi_number: string;
    allocation_amount: number;
  };
}

// =============================================================================
// CREATE/UPDATE INPUTS
// =============================================================================

export interface CreateLOIInput {
  deal_id: string;
  cde_id: string;
  allocation_amount: number;
  qlici_rate?: number;
  leverage_structure?: 'standard' | 'self-leverage' | 'hybrid';
  term_years?: number;
  expires_at?: string;
  expected_closing_date?: string;
  conditions?: Omit<LOICondition, 'id'>[];
  special_terms?: string;
  cde_requirements?: Record<string, unknown>;
}

export interface UpdateLOIInput {
  allocation_amount?: number;
  qlici_rate?: number;
  leverage_structure?: 'standard' | 'self-leverage' | 'hybrid';
  term_years?: number;
  expires_at?: string;
  expected_closing_date?: string;
  conditions?: LOICondition[];
  special_terms?: string;
  cde_requirements?: Record<string, unknown>;
}

export interface CreateCommitmentInput {
  deal_id: string;
  loi_id?: string;
  investor_id: string;
  cde_id?: string;
  investment_amount: number;
  credit_type: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';
  credit_rate?: number;
  pricing_cents_per_credit?: number;
  expires_at?: string;
  target_closing_date?: string;
  conditions?: Omit<CommitmentCondition, 'id'>[];
  special_terms?: string;
  investor_requirements?: Record<string, unknown>;
  cra_eligible?: boolean;
}

export interface UpdateCommitmentInput {
  investment_amount?: number;
  credit_rate?: number;
  pricing_cents_per_credit?: number;
  expires_at?: string;
  target_closing_date?: string;
  conditions?: CommitmentCondition[];
  special_terms?: string;
  investor_requirements?: Record<string, unknown>;
  cra_eligible?: boolean;
}

// =============================================================================
// RESPONSE INPUTS
// =============================================================================

export interface LOISponsorResponse {
  action: 'accept' | 'reject' | 'counter';
  notes?: string;
  counter_terms?: {
    allocation_amount?: number;
    qlici_rate?: number;
    term_years?: number;
    expected_closing_date?: string;
    additional_conditions?: string[];
  };
}

export interface CommitmentResponse {
  action: 'accept' | 'reject';
  notes?: string;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface LOIResponse {
  success: boolean;
  loi?: LOI;
  error?: string;
}

export interface CommitmentResponse {
  success: boolean;
  commitment?: Commitment;
  error?: string;
}

export interface LOIListResponse {
  success: boolean;
  lois: LOI[];
  total: number;
}

export interface CommitmentListResponse {
  success: boolean;
  commitments: Commitment[];
  total: number;
}

// =============================================================================
// HISTORY TYPES
// =============================================================================

export interface LOIHistoryEntry {
  id: string;
  loi_id: string;
  from_status?: LOIStatus;
  to_status: LOIStatus;
  changed_by?: string;
  change_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CommitmentHistoryEntry {
  id: string;
  commitment_id: string;
  from_status?: CommitmentStatus;
  to_status: CommitmentStatus;
  changed_by?: string;
  change_reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
