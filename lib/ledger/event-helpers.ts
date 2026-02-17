/**
 * tCredex Ledger Event Helpers
 * Convenience functions for logging common platform events
 */

import { logLedgerEvent } from "./service";
import { computeFileHash } from "./hash-chain";
import type { LedgerActorType } from "./types";

// ============================================================================
// Application Events
// ============================================================================

export async function logApplicationCreated(
  actorType: LedgerActorType,
  actorId: string,
  applicationId: string,
  applicationData: Record<string, unknown>,
) {
  return logLedgerEvent({
    actor_type: actorType,
    actor_id: actorId,
    entity_type: "application",
    entity_id: applicationId,
    action: "application_created",
    payload_json: {
      ...applicationData,
      created_at: new Date().toISOString(),
    },
  });
}

export async function logApplicationUpdated(
  actorType: LedgerActorType,
  actorId: string,
  applicationId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
) {
  return logLedgerEvent({
    actor_type: actorType,
    actor_id: actorId,
    entity_type: "application",
    entity_id: applicationId,
    action: "application_updated",
    payload_json: {
      changes,
      updated_at: new Date().toISOString(),
    },
  });
}

export async function logApplicationSubmitted(
  actorType: LedgerActorType,
  actorId: string,
  applicationId: string,
  submissionData: Record<string, unknown>,
) {
  return logLedgerEvent({
    actor_type: actorType,
    actor_id: actorId,
    entity_type: "application",
    entity_id: applicationId,
    action: "application_submitted",
    payload_json: {
      ...submissionData,
      submitted_at: new Date().toISOString(),
    },
  });
}

// ============================================================================
// AI Scoring Events
// ============================================================================

export async function logDistressScoreCalculated(
  applicationId: string,
  tractId: string,
  score: number,
  modelVersion: string,
  inputs: Record<string, unknown>,
  reasonCodes: Record<string, unknown>,
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "distress-scoring-engine",
    entity_type: "tract",
    entity_id: tractId,
    action: "distress_score_calculated",
    payload_json: {
      application_id: applicationId,
      score,
      inputs,
      calculated_at: new Date().toISOString(),
    },
    model_version: modelVersion,
    reason_codes: reasonCodes,
  });
}

export async function logImpactScoreCalculated(
  applicationId: string,
  score: number,
  modelVersion: string,
  inputs: Record<string, unknown>,
  reasonCodes: Record<string, unknown>,
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "impact-scoring-engine",
    entity_type: "application",
    entity_id: applicationId,
    action: "impact_score_calculated",
    payload_json: {
      score,
      inputs,
      calculated_at: new Date().toISOString(),
    },
    model_version: modelVersion,
    reason_codes: reasonCodes,
  });
}

export async function logEligibilityDetermined(
  applicationId: string,
  tractId: string,
  eligibility: {
    nmtc_eligible: boolean;
    htc_eligible: boolean;
    lihtc_eligible: boolean;
    oz_eligible: boolean;
    state_credits: string[];
    severely_distressed: boolean;
    is_ppc: boolean;
    is_rural: boolean;
    is_non_metro: boolean;
  },
  modelVersion: string,
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "eligibility-engine",
    entity_type: "application",
    entity_id: applicationId,
    action: "eligibility_determined",
    payload_json: {
      tract_id: tractId,
      ...eligibility,
      determined_at: new Date().toISOString(),
    },
    model_version: modelVersion,
    reason_codes: {
      nmtc_reason: eligibility.nmtc_eligible
        ? "meets_lic_criteria"
        : "does_not_meet_lic_criteria",
      severely_distressed_reason: eligibility.severely_distressed
        ? "meets_sd_threshold"
        : null,
    },
  });
}

// ============================================================================
// CDE Matching Events
// ============================================================================

export async function logCDEMatchSuggested(
  applicationId: string,
  cdeId: string,
  matchScore: number,
  modelVersion: string,
  matchFactors: Record<string, unknown>,
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "automatch-ai",
    entity_type: "application",
    entity_id: applicationId,
    action: "cde_match_suggested",
    payload_json: {
      cde_id: cdeId,
      match_score: matchScore,
      match_factors: matchFactors,
      suggested_at: new Date().toISOString(),
    },
    model_version: modelVersion,
  });
}

export async function logCDEMatchAccepted(
  actorId: string,
  applicationId: string,
  cdeId: string,
) {
  return logLedgerEvent({
    actor_type: "human",
    actor_id: actorId,
    entity_type: "application",
    entity_id: applicationId,
    action: "cde_match_accepted",
    payload_json: {
      cde_id: cdeId,
      accepted_at: new Date().toISOString(),
    },
  });
}

export async function logCDEMatchOverride(
  actorId: string,
  applicationId: string,
  originalCdeId: string,
  newCdeId: string,
  rationale: string,
) {
  return logLedgerEvent({
    actor_type: "human",
    actor_id: actorId,
    entity_type: "application",
    entity_id: applicationId,
    action: "cde_match_override",
    payload_json: {
      original_cde_id: originalCdeId,
      new_cde_id: newCdeId,
      rationale,
      overridden_at: new Date().toISOString(),
    },
  });
}

// ============================================================================
// Document Events
// ============================================================================

export async function logDocumentUploaded(
  actorType: LedgerActorType,
  actorId: string,
  documentId: string,
  documentMetadata: {
    filename: string;
    content_type: string;
    size_bytes: number;
    application_id?: string;
    closing_id?: string;
    document_type: string;
  },
) {
  return logLedgerEvent({
    actor_type: actorType,
    actor_id: actorId,
    entity_type: "document",
    entity_id: documentId,
    action: "document_uploaded",
    payload_json: {
      ...documentMetadata,
      uploaded_at: new Date().toISOString(),
    },
  });
}

export async function logDocumentHashed(
  documentId: string,
  fileContent: Buffer,
  filename: string,
) {
  const contentHash = computeFileHash(fileContent);

  return logLedgerEvent({
    actor_type: "system",
    actor_id: "document-processor",
    entity_type: "document",
    entity_id: documentId,
    action: "document_hashed",
    payload_json: {
      filename,
      content_hash: contentHash,
      hash_algorithm: "sha256",
      hashed_at: new Date().toISOString(),
    },
  });
}

export async function logDocumentSigned(
  actorId: string,
  documentId: string,
  signatureData: {
    signature_provider: string; // e.g., 'docusign', 'dropbox_sign'
    envelope_id: string;
    signer_email: string;
    signed_at: string;
  },
) {
  return logLedgerEvent({
    actor_type: "human",
    actor_id: actorId,
    entity_type: "document",
    entity_id: documentId,
    action: "document_signed",
    payload_json: {
      ...signatureData,
      recorded_at: new Date().toISOString(),
    },
  });
}

export async function logDocumentExecuted(
  documentId: string,
  executionData: {
    final_document_hash: string;
    all_signatures_complete: boolean;
    execution_timestamp: string;
    envelope_id?: string;
  },
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "document-processor",
    entity_type: "document",
    entity_id: documentId,
    action: "document_executed",
    payload_json: {
      ...executionData,
      recorded_at: new Date().toISOString(),
    },
  });
}

// ============================================================================
// Closing Events
// ============================================================================

export async function logClosingInitiated(
  actorId: string,
  closingId: string,
  closingData: {
    application_id: string;
    cde_id: string;
    qalicb_id: string;
    expected_closing_date: string;
    qlici_amount: number;
  },
) {
  return logLedgerEvent({
    actor_type: "human",
    actor_id: actorId,
    entity_type: "closing",
    entity_id: closingId,
    action: "closing_initiated",
    payload_json: {
      ...closingData,
      initiated_at: new Date().toISOString(),
    },
  });
}

export async function logClosingMilestoneReached(
  closingId: string,
  milestone: string,
  milestoneData: Record<string, unknown>,
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "closing-tracker",
    entity_type: "closing",
    entity_id: closingId,
    action: "closing_milestone_reached",
    payload_json: {
      milestone,
      ...milestoneData,
      reached_at: new Date().toISOString(),
    },
  });
}

export async function logFundingApproved(
  actorId: string,
  closingId: string,
  approvalData: {
    approved_amount: number;
    approval_conditions?: string[];
    approver_role: string;
  },
) {
  return logLedgerEvent({
    actor_type: "human",
    actor_id: actorId,
    entity_type: "closing",
    entity_id: closingId,
    action: "funding_approved",
    payload_json: {
      ...approvalData,
      approved_at: new Date().toISOString(),
    },
  });
}

export async function logFundingDisbursed(
  closingId: string,
  disbursementData: {
    amount_disbursed: number;
    disbursement_date: string;
    wire_reference?: string;
    qlici_id: string;
  },
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "funding-processor",
    entity_type: "closing",
    entity_id: closingId,
    action: "funding_disbursed",
    payload_json: {
      ...disbursementData,
      recorded_at: new Date().toISOString(),
    },
  });
}

export async function logClosingCompleted(
  closingId: string,
  completionData: {
    final_qlici_amount: number;
    closing_date: string;
    all_documents_executed: boolean;
    compliance_period_start: string;
    compliance_period_end: string;
  },
) {
  return logLedgerEvent({
    actor_type: "system",
    actor_id: "closing-tracker",
    entity_type: "closing",
    entity_id: closingId,
    action: "closing_completed",
    payload_json: {
      ...completionData,
      recorded_at: new Date().toISOString(),
    },
  });
}

// ============================================================================
// Post-Closing Compliance Events
// ============================================================================

export async function logComplianceCheckPerformed(
  actorType: LedgerActorType,
  actorId: string,
  entityType: "qalicb" | "qlici" | "closing",
  entityId: string,
  checkResults: {
    check_type: string;
    passed: boolean;
    findings?: string[];
    compliance_period_year: number;
  },
) {
  return logLedgerEvent({
    actor_type: actorType,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action: "compliance_check_performed",
    payload_json: {
      ...checkResults,
      performed_at: new Date().toISOString(),
    },
  });
}

export async function logAnnualReportSubmitted(
  actorId: string,
  entityId: string,
  reportData: {
    report_year: number;
    report_type: string;
    document_id?: string;
  },
) {
  return logLedgerEvent({
    actor_type: "human",
    actor_id: actorId,
    entity_type: "qalicb",
    entity_id: entityId,
    action: "annual_report_submitted",
    payload_json: {
      ...reportData,
      submitted_at: new Date().toISOString(),
    },
  });
}
