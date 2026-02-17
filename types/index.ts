// tCredex v1.6 - Type Exports
// Note: Using explicit exports to avoid naming conflicts

export * from './deal';
export * from './cde';

// Investor - explicit exports (CommitmentStatus conflicts with loi)
export type {
  Investor,
  InvestorType,
  InvestorPersona,
  InvestorCommitment,
} from './investor';
// Alias the investor CommitmentStatus
export type { CommitmentStatus as InvestorCommitmentStatus } from './investor';

export * from './pricing';
export * from './intake';

// Intake Tiers - explicit exports (avoid conflicts with scoring TIER_*)
export type {
  IntakeTier,
  FieldDefinition,
  FieldCategory,
} from './intakeTiers';

export {
  TIER_NAMES as INTAKE_TIER_NAMES,
  TIER_DESCRIPTIONS as INTAKE_TIER_DESCRIPTIONS,
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
} from './intakeTiers';

// LOI - full export (canonical CommitmentStatus lives here)
export * from './loi';
