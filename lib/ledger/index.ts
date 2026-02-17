/**
 * tCredex Ledger Module
 * Tamper-evident audit logging for institutional-grade compliance
 * 
 * Usage:
 * 
 * import { logLedgerEvent, getLedgerService } from '@/lib/ledger';
 * 
 * // Log an event
 * await logLedgerEvent({
 *   actor_type: 'human',
 *   actor_id: userId,
 *   entity_type: 'application',
 *   entity_id: applicationId,
 *   action: 'application_submitted',
 *   payload_json: { ... }
 * });
 * 
 * // Verify chain integrity
 * const service = getLedgerService();
 * const result = await service.verifyChain({ requestedBy: 'admin@example.com' });
 */

// Types
export type {
  LedgerActorType,
  LedgerAction,
  LedgerEntityType,
  LedgerEvent,
  LedgerEventInput,
  LedgerAnchor,
  LedgerVerification,
  ChainIssue,
  VerificationResult,
  LedgerExtract
} from './types';

// Service
export { 
  LedgerService, 
  getLedgerService, 
  logLedgerEvent 
} from './service';

// Hash chain utilities
export {
  buildCanonicalString,
  computeHash,
  computeEventHash,
  verifyHashChain,
  getChainSummary,
  computeFileHash,
  generateVerificationReport
} from './hash-chain';

// External anchoring
export {
  anchorToGitHubGist,
  anchorToEscrowEmail,
  anchorToBlockchain,
  runScheduledAnchoring
} from './anchoring';

// Event helpers for common operations
export {
  // Application events
  logApplicationCreated,
  logApplicationUpdated,
  logApplicationSubmitted,
  // AI Scoring events
  logDistressScoreCalculated,
  logImpactScoreCalculated,
  logEligibilityDetermined,
  // CDE Matching events
  logCDEMatchSuggested,
  logCDEMatchAccepted,
  logCDEMatchOverride,
  // Document events
  logDocumentUploaded,
  logDocumentHashed,
  logDocumentSigned,
  logDocumentExecuted,
  // Closing events
  logClosingInitiated,
  logClosingMilestoneReached,
  logFundingApproved,
  logFundingDisbursed,
  logClosingCompleted,
  // Post-closing compliance
  logComplianceCheckPerformed,
  logAnnualReportSubmitted
} from './event-helpers';
