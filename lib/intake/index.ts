/**
 * tCredex Intake Tier System - Public API
 */

// Validation
export * from './tierValidation';

// Service
export { IntakeTierService, getIntakeTierService } from './tierService';

// Readiness Score
export {
  calculateReadiness,
  getTierDisplay,
  getQuickReadinessScore,
  getReadinessTier,
} from './readinessScore';

export type {
  ReadinessResult,
  ReadinessBreakdownItem,
  TierDisplay,
} from './readinessScore';

// Re-export types
export type {
  IntakeTier,
  FieldDefinition,
  FieldCategory,
} from '@/types/intakeTiers';

export {
  TIER_NAMES,
  TIER_DESCRIPTIONS,
  TIER_TRIGGERS,
  CATEGORY_LABELS,
  ALL_INTAKE_FIELDS,
  TIER_1_FIELDS,
  TIER_2_FIELDS,
  TIER_3_FIELDS,
  TIER_4_FIELDS,
  getFieldsForTier,
  getRequiredFieldsForTier,
  getNewFieldsAtTier,
  getFieldsByCategory,
  getFieldByKey,
} from '@/types/intakeTiers';
