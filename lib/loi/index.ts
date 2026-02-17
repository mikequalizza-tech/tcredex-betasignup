/**
 * tCredex LOI & Commitment System - Public API
 */

// State Machine
export * from './stateMachine';

// Services
export { LOIService, getLOIService } from './loiService';
export { CommitmentService, getCommitmentService } from './commitmentService';

// Types
export type {
  LOI,
  LOIStatus,
  LOICondition,
  LOIHistoryEntry,
  CreateLOIInput,
  UpdateLOIInput,
  LOISponsorResponse,
  Commitment,
  CommitmentStatus,
  CommitmentCondition,
  CommitmentHistoryEntry,
  CreateCommitmentInput,
  UpdateCommitmentInput,
  CommitmentResponse,
} from '@/types/loi';

export {
  LOI_TRANSITIONS,
  LOI_STATUS_LABELS,
  LOI_STATUS_COLORS,
  COMMITMENT_TRANSITIONS,
  COMMITMENT_STATUS_LABELS,
  COMMITMENT_STATUS_COLORS,
} from '@/types/loi';
