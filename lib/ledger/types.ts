/**
 * tCredex Ledger Types
 * Tamper-evident audit logging for institutional-grade compliance
 */

export type LedgerActorType = 'system' | 'human' | 'api_key';

export type LedgerAction =
  // Application lifecycle
  | 'application_created'
  | 'application_updated'
  | 'application_submitted'
  | 'application_status_changed'
  // AI Scoring
  | 'distress_score_calculated'
  | 'impact_score_calculated'
  | 'eligibility_determined'
  // Matching
  | 'cde_match_suggested'
  | 'cde_match_accepted'
  | 'cde_match_rejected'
  | 'cde_match_override'
  // Documents
  | 'document_uploaded'
  | 'document_hashed'
  | 'document_signed'
  | 'document_executed'
  // Closing
  | 'closing_initiated'
  | 'closing_milestone_reached'
  | 'funding_approved'
  | 'funding_disbursed'
  | 'closing_completed'
  // Post-closing
  | 'compliance_check_performed'
  | 'annual_report_submitted'
  | 'amendment_recorded';

export type LedgerEntityType =
  | 'application'
  | 'project'
  | 'tract'
  | 'cde'
  | 'investor'
  | 'sponsor'
  | 'document'
  | 'closing'
  | 'qalicb'
  | 'qlici';

export interface LedgerEvent {
  id: number;
  event_timestamp: string;
  actor_type: LedgerActorType;
  actor_id: string;
  entity_type: LedgerEntityType;
  entity_id: string;
  action: LedgerAction;
  payload_json: Record<string, unknown>;
  model_version?: string;
  reason_codes?: Record<string, unknown>;
  prev_hash?: string;
  hash: string;
  sig?: string;
  created_at: string;
}

export interface LedgerEventInput {
  actor_type: LedgerActorType;
  actor_id: string;
  entity_type: LedgerEntityType;
  entity_id: string;
  action: LedgerAction;
  payload_json: Record<string, unknown>;
  model_version?: string;
  reason_codes?: Record<string, unknown>;
}

export interface LedgerAnchor {
  id: number;
  ledger_event_id: number;
  anchored_hash: string;
  anchor_type: 'github_gist' | 'blockchain' | 'escrow_email';
  external_reference?: string;
  anchored_at: string;
  verified: boolean;
  verified_at?: string;
  metadata?: Record<string, unknown>;
}

export interface LedgerVerification {
  id: number;
  start_event_id?: number;
  end_event_id?: number;
  events_checked: number;
  chain_valid: boolean;
  signatures_valid?: boolean;
  anchor_matched?: boolean;
  issues?: ChainIssue[];
  requested_by?: string;
  started_at: string;
  completed_at?: string;
}

export interface ChainIssue {
  event_id: number;
  issue_type: 'hash_mismatch' | 'prev_hash_mismatch' | 'signature_invalid' | 'missing_hash';
  expected?: string;
  actual?: string;
  message: string;
}

export interface VerificationResult {
  valid: boolean;
  events_checked: number;
  chain_valid: boolean;
  signatures_valid?: boolean;
  anchor_matched?: boolean;
  issues: ChainIssue[];
  start_event_id: number;
  end_event_id: number;
  final_hash: string;
  verification_timestamp: string;
}

export interface LedgerExtract {
  events: LedgerEvent[];
  start_timestamp: string;
  end_timestamp: string;
  event_count: number;
  first_hash: string;
  final_hash: string;
  extracted_at: string;
  extracted_by: string;
}
