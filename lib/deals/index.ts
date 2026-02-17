/**
 * tCredex Deal Management System
 *
 * Usage:
 *
 * // Status utilities
 * import { getStatusInfo, canTransition, getValidTransitions } from '@/lib/deals';
 *
 * // Lifecycle management
 * import { transitionDeal, getDealActivitySummary } from '@/lib/deals';
 *
 * // DealCard generation
 * import { generateDealFromIntake, validateForDealCard } from '@/lib/deals';
 */

export * from "./status";
export * from "./lifecycle";
export * from "./dealCardGenerator";
