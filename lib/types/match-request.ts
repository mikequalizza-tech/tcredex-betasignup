/**
 * Match Request Types
 *
 * Implements the 3-Request Limit system:
 * - Sponsors can have max 3 active CDE requests
 * - Sponsors can have max 3 active Investor requests
 * - Declined requests enter 7-day cooldown before slot reopens
 * - Withdrawn requests free up slot immediately
 */

export type MatchTargetType = 'cde' | 'investor';

export type MatchRequestStatus =
  | 'pending'    // Awaiting response from target
  | 'accepted'   // Target accepted the request
  | 'declined'   // Target declined (triggers cooldown)
  | 'withdrawn'  // Sponsor withdrew (frees slot immediately)
  | 'expired';   // Request expired without response

export interface MatchRequest {
  id: string;
  sponsorId: string;
  dealId: string;
  dealName?: string;
  targetType: MatchTargetType;
  targetId: string;
  targetOrgId: string;
  targetName?: string;
  status: MatchRequestStatus;
  message?: string;
  responseMessage?: string;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  cooldownEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchRequestSlots {
  cde: {
    used: number;
    max: number;
    available: number;
    requests: MatchRequest[];
  };
  investor: {
    used: number;
    max: number;
    available: number;
    requests: MatchRequest[];
  };
}

export interface CreateMatchRequestInput {
  dealId: string;
  targetType: MatchTargetType;
  targetId: string;
  message?: string;
}

export interface MatchRequestResponse {
  requestId: string;
  accept: boolean;
  message?: string;
}

// Constants for the 3-request limit system
export const MATCH_REQUEST_LIMITS = {
  maxCDERequests: 3,
  maxInvestorRequests: 3,
  cooldownDays: 7,
  expirationDays: 30, // Requests expire after 30 days without response
} as const;

/**
 * Check if a slot is available for a new request
 */
export function canCreateRequest(
  slots: MatchRequestSlots,
  targetType: MatchTargetType
): boolean {
  return slots[targetType].available > 0;
}

/**
 * Get remaining slots for a target type
 */
export function getRemainingSlots(
  slots: MatchRequestSlots,
  targetType: MatchTargetType
): number {
  return slots[targetType].available;
}

/**
 * Check if a request is in cooldown period
 */
export function isInCooldown(request: MatchRequest): boolean {
  if (!request.cooldownEndsAt) return false;
  return new Date(request.cooldownEndsAt) > new Date();
}

/**
 * Calculate when cooldown ends for a declined request
 */
export function calculateCooldownEnd(): Date {
  const now = new Date();
  now.setDate(now.getDate() + MATCH_REQUEST_LIMITS.cooldownDays);
  return now;
}

/**
 * Calculate when a request expires
 */
export function calculateExpirationDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + MATCH_REQUEST_LIMITS.expirationDays);
  return now;
}
