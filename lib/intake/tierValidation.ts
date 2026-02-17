/**
 * tCredex Intake Tier Validation Engine
 *
 * Validates intake data against tier requirements
 * Determines if deal can advance to next tier
 */

import {
  IntakeTier,
  FieldDefinition,
  getRequiredFieldsForTier,
  TIER_NAMES,
} from "@/types/intakeTiers";

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

export interface FieldValidationError {
  field: string;
  label: string;
  error: string;
  tier: IntakeTier;
}

export interface TierValidationResult {
  valid: boolean;
  current_tier: IntakeTier;
  target_tier: IntakeTier;
  errors: FieldValidationError[];
  warnings: FieldValidationError[];
  completion_pct: number;
  missing_required: string[];
  ready_to_advance: boolean;
}

export interface DealTierStatus {
  current_tier: IntakeTier;
  max_achievable_tier: IntakeTier;
  tier_completion: Record<IntakeTier, number>;
  next_tier_blockers: string[];
}

// =============================================================================
// FIELD VALUE VALIDATORS
// =============================================================================

function isValuePresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function validateFieldValue(
  field: FieldDefinition,
  value: unknown,
): string | null {
  // Check required
  if (!isValuePresent(value)) {
    return `${field.label} is required`;
  }

  // Type-specific validation
  switch (field.type) {
    case "number":
    case "currency":
    case "percent":
      if (typeof value !== "number" || isNaN(value)) {
        return `${field.label} must be a valid number`;
      }
      if (field.validation?.min !== undefined && value < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && value > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
      break;

    case "text":
    case "textarea":
      if (typeof value !== "string") {
        return `${field.label} must be text`;
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return `${field.label} format is invalid`;
        }
      }
      break;

    case "date":
      if (typeof value === "string" && isNaN(Date.parse(value))) {
        return `${field.label} must be a valid date`;
      }
      break;

    case "select":
      if (field.options && field.options.length > 0) {
        const validValues = field.options.map((o) => o.value);
        if (!validValues.includes(value as string)) {
          return `${field.label} has invalid selection`;
        }
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        return `${field.label} must be yes or no`;
      }
      break;
  }

  return null;
}

function checkDependency(
  field: FieldDefinition,
  data: Record<string, unknown>,
): boolean {
  if (!field.depends_on) return true;

  const { field: depField, value: depValue } = field.depends_on;
  const actualValue = data[depField];

  // Handle comparison operators in value
  if (typeof depValue === "object" && depValue !== null) {
    const comp = depValue as {
      gt?: number;
      lt?: number;
      gte?: number;
      lte?: number;
    };
    if (typeof actualValue === "number") {
      if (comp.gt !== undefined && actualValue <= comp.gt) return false;
      if (comp.lt !== undefined && actualValue >= comp.lt) return false;
      if (comp.gte !== undefined && actualValue < comp.gte) return false;
      if (comp.lte !== undefined && actualValue > comp.lte) return false;
      return true;
    }
    return false;
  }

  return actualValue === depValue;
}

// =============================================================================
// TIER VALIDATION
// =============================================================================

export function validateTier(
  data: Record<string, unknown>,
  targetTier: IntakeTier,
): TierValidationResult {
  const requiredFields = getRequiredFieldsForTier(targetTier);
  const errors: FieldValidationError[] = [];
  const warnings: FieldValidationError[] = [];
  const missingRequired: string[] = [];

  let completedCount = 0;

  for (const field of requiredFields) {
    const value = data[field.key];

    // Check dependency first
    if (!checkDependency(field, data)) {
      // Field not applicable, count as complete
      completedCount++;
      continue;
    }

    // Check if required field is present
    if (field.required_at_tier <= targetTier) {
      if (!isValuePresent(value)) {
        errors.push({
          field: field.key,
          label: field.label,
          error: `Required for ${TIER_NAMES[field.required_at_tier]}`,
          tier: field.required_at_tier,
        });
        missingRequired.push(field.key);
        continue;
      }

      // Validate value
      const validationError = validateFieldValue(field, value);
      if (validationError) {
        errors.push({
          field: field.key,
          label: field.label,
          error: validationError,
          tier: field.required_at_tier,
        });
        continue;
      }
    }

    completedCount++;
  }

  const completionPct =
    requiredFields.length > 0
      ? Math.round((completedCount / requiredFields.length) * 100)
      : 100;

  return {
    valid: errors.length === 0,
    current_tier: determineTier(data),
    target_tier: targetTier,
    errors,
    warnings,
    completion_pct: completionPct,
    missing_required: missingRequired,
    ready_to_advance: errors.length === 0 && completionPct >= 100,
  };
}

// =============================================================================
// TIER DETERMINATION
// =============================================================================

export function determineTier(data: Record<string, unknown>): IntakeTier {
  // Check each tier from highest to lowest
  for (let tier = 4 as IntakeTier; tier >= 1; tier--) {
    const result = validateTier(data, tier);
    if (result.valid) {
      return tier;
    }
  }
  return 1;
}

export function getDealTierStatus(
  data: Record<string, unknown>,
): DealTierStatus {
  const tierCompletion: Record<IntakeTier, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  // Calculate completion for each tier
  for (let tier = 1 as IntakeTier; tier <= 4; tier++) {
    const result = validateTier(data, tier);
    tierCompletion[tier] = result.completion_pct;
  }

  const currentTier = determineTier(data);
  const nextTier = Math.min(currentTier + 1, 4) as IntakeTier;

  // Get blockers for next tier
  const nextTierResult = validateTier(data, nextTier);
  const blockers = nextTierResult.errors.map((e) => e.label);

  // Determine max achievable tier
  let maxAchievable = currentTier;
  for (let tier = (currentTier + 1) as IntakeTier; tier <= 4; tier++) {
    const result = validateTier(data, tier);
    if (result.completion_pct >= 80) {
      maxAchievable = tier;
    } else {
      break;
    }
  }

  return {
    current_tier: currentTier,
    max_achievable_tier: maxAchievable as IntakeTier,
    tier_completion: tierCompletion,
    next_tier_blockers: blockers,
  };
}

// =============================================================================
// TIER ADVANCEMENT CHECK
// =============================================================================

export interface TierAdvanceResult {
  can_advance: boolean;
  from_tier: IntakeTier;
  to_tier: IntakeTier;
  blockers: FieldValidationError[];
  trigger_met: boolean;
  trigger_description: string;
}

export function canAdvanceToTier(
  data: Record<string, unknown>,
  targetTier: IntakeTier,
  transactionState: {
    has_active_loi?: boolean;
    has_accepted_loi?: boolean;
    has_active_commitment?: boolean;
    has_accepted_commitment?: boolean;
    closing_room_open?: boolean;
  },
): TierAdvanceResult {
  const currentTier = determineTier(data);

  // Check transaction triggers
  let triggerMet = false;
  let triggerDescription = "";

  switch (targetTier) {
    case 2:
      triggerMet = !!transactionState.has_active_loi;
      triggerDescription = "LOI issued by CDE";
      break;
    case 3:
      triggerMet =
        !!transactionState.has_accepted_loi &&
        !!transactionState.has_active_commitment;
      triggerDescription = "Commitment issued by investor";
      break;
    case 4:
      triggerMet = !!transactionState.closing_room_open;
      triggerDescription = "Closing room opened";
      break;
    default:
      triggerMet = true;
      triggerDescription = "Initial submission";
  }

  // Validate data completeness
  const validation = validateTier(data, targetTier);

  return {
    can_advance: validation.valid && triggerMet,
    from_tier: currentTier,
    to_tier: targetTier,
    blockers: validation.errors,
    trigger_met: triggerMet,
    trigger_description: triggerDescription,
  };
}

// =============================================================================
// BATCH VALIDATION
// =============================================================================

export function validateMultipleDeals(
  deals: { id: string; data: Record<string, unknown> }[],
): { id: string; status: DealTierStatus }[] {
  return deals.map((deal) => ({
    id: deal.id,
    status: getDealTierStatus(deal.data),
  }));
}
