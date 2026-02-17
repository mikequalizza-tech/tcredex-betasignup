/**
 * tCredex LOI State Machine
 *
 * Manages LOI lifecycle transitions with validation
 */

import {
  LOIStatus,
  LOI_TRANSITIONS,
  CommitmentStatus,
  COMMITMENT_TRANSITIONS,
} from "@/types/loi";

// =============================================================================
// LOI STATE MACHINE
// =============================================================================

export function canTransitionLOI(from: LOIStatus, to: LOIStatus): boolean {
  const allowed = LOI_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getNextLOIStates(current: LOIStatus): LOIStatus[] {
  return LOI_TRANSITIONS[current] || [];
}

export function isLOITerminal(status: LOIStatus): boolean {
  return LOI_TRANSITIONS[status]?.length === 0;
}

export function isLOIActive(status: LOIStatus): boolean {
  return ["draft", "issued", "pending_sponsor", "sponsor_countered"].includes(
    status,
  );
}

export function isLOIAccepted(status: LOIStatus): boolean {
  return status === "sponsor_accepted";
}

export function requiresLOISponsorAction(status: LOIStatus): boolean {
  return status === "pending_sponsor";
}

export function requiresLOICDEAction(status: LOIStatus): boolean {
  return ["draft", "sponsor_countered"].includes(status);
}

// =============================================================================
// COMMITMENT STATE MACHINE
// =============================================================================

export function canTransitionCommitment(
  from: CommitmentStatus,
  to: CommitmentStatus,
): boolean {
  const allowed = COMMITMENT_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getNextCommitmentStates(
  current: CommitmentStatus,
): CommitmentStatus[] {
  return COMMITMENT_TRANSITIONS[current] || [];
}

export function isCommitmentTerminal(status: CommitmentStatus): boolean {
  return COMMITMENT_TRANSITIONS[status]?.length === 0;
}

export function isCommitmentActive(status: CommitmentStatus): boolean {
  return [
    "draft",
    "issued",
    "pending_sponsor",
    "pending_cde",
    "sponsor_accepted",
    "cde_accepted",
  ].includes(status);
}

export function isCommitmentFullyAccepted(status: CommitmentStatus): boolean {
  return status === "all_accepted";
}

export function requiresCommitmentSponsorAction(
  status: CommitmentStatus,
): boolean {
  return status === "pending_sponsor";
}

export function requiresCommitmentCDEAction(status: CommitmentStatus): boolean {
  return status === "pending_cde";
}

export function requiresCommitmentInvestorAction(
  status: CommitmentStatus,
): boolean {
  return status === "draft";
}

// =============================================================================
// STATE RESOLUTION
// =============================================================================

export interface CommitmentAcceptanceState {
  sponsor_accepted: boolean;
  cde_accepted: boolean;
  requires_cde: boolean;
}

export function resolveCommitmentStatus(
  state: CommitmentAcceptanceState,
): CommitmentStatus {
  const { sponsor_accepted, cde_accepted, requires_cde } = state;

  if (sponsor_accepted && (cde_accepted || !requires_cde)) {
    return "all_accepted";
  }

  if (sponsor_accepted && requires_cde && !cde_accepted) {
    return "pending_cde";
  }

  if (cde_accepted && requires_cde && !sponsor_accepted) {
    return "pending_sponsor";
  }

  if (sponsor_accepted) return "sponsor_accepted";
  if (cde_accepted) return "cde_accepted";

  return "issued";
}

// =============================================================================
// DEAL STATUS MAPPING
// =============================================================================

export type DealTransactionStatus =
  | "seeking_allocation"
  | "loi_pending"
  | "seeking_capital"
  | "commitment_pending"
  | "committed"
  | "closing";

export function getDealStatusFromLOI(
  loiStatus: LOIStatus,
): DealTransactionStatus {
  switch (loiStatus) {
    case "issued":
    case "pending_sponsor":
    case "sponsor_countered":
      return "loi_pending";
    case "sponsor_accepted":
      return "seeking_capital";
    default:
      return "seeking_allocation";
  }
}

export function getDealStatusFromCommitment(
  commitmentStatus: CommitmentStatus,
): DealTransactionStatus {
  switch (commitmentStatus) {
    case "issued":
    case "pending_sponsor":
    case "pending_cde":
    case "sponsor_accepted":
    case "cde_accepted":
      return "commitment_pending";
    case "all_accepted":
      return "committed";
    default:
      return "seeking_capital";
  }
}

// =============================================================================
// EXPIRATION LOGIC
// =============================================================================

export function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function daysUntilExpiry(
  expiresAt: string | null | undefined,
): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isExpiringWithin(
  expiresAt: string | null | undefined,
  days: number,
): boolean {
  const remaining = daysUntilExpiry(expiresAt);
  if (remaining === null) return false;
  return remaining > 0 && remaining <= days;
}
