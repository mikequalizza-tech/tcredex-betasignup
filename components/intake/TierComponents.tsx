/**
 * tCredex Intake Tier Components
 *
 * React components for progressive disclosure intake forms
 */

"use client";

import React, { useMemo } from "react";
import {
  IntakeTier,
  TIER_NAMES,
  TIER_DESCRIPTIONS,
  TIER_TRIGGERS,
  FieldDefinition,
  FieldCategory,
  CATEGORY_LABELS,
} from "@/types/intakeTiers";
import {
  DealTierStatus,
  TierValidationResult,
  FieldValidationError,
} from "@/lib/intake";

// =============================================================================
// TIER PROGRESS INDICATOR
// =============================================================================

interface TierProgressProps {
  currentTier: IntakeTier;
  completion: Record<IntakeTier, number>;
  onTierClick?: (tier: IntakeTier) => void;
}

export function TierProgress({
  currentTier,
  completion,
  onTierClick,
}: TierProgressProps) {
  const tiers: IntakeTier[] = [1, 2, 3, 4];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        {tiers.map((tier, index) => (
          <React.Fragment key={tier}>
            {/* Tier Circle */}
            <button
              onClick={() => onTierClick?.(tier)}
              disabled={tier > currentTier + 1}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full
                font-semibold text-sm transition-all
                ${
                  tier < currentTier
                    ? "bg-green-500 text-white"
                    : tier === currentTier
                      ? "bg-blue-600 text-white ring-4 ring-blue-200"
                      : tier === currentTier + 1 && completion[tier] > 0
                        ? "bg-yellow-400 text-yellow-900"
                        : "bg-gray-200 text-gray-500"
                }
                ${tier <= currentTier + 1 ? "cursor-pointer hover:scale-110" : "cursor-not-allowed"}
              `}
            >
              {tier < currentTier ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                tier
              )}

              {/* Completion badge */}
              {tier >= currentTier &&
                completion[tier] > 0 &&
                completion[tier] < 100 && (
                  <span className="absolute -bottom-1 -right-1 bg-white text-xs font-medium px-1 rounded shadow">
                    {completion[tier]}%
                  </span>
                )}
            </button>

            {/* Connector Line */}
            {index < tiers.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={`h-1 rounded ${tier < currentTier ? "bg-green-500" : "bg-gray-200"}`}
                >
                  {tier === currentTier &&
                    completion[(tier + 1) as IntakeTier] > 0 && (
                      <div
                        className="h-full bg-yellow-400 rounded transition-all"
                        style={{
                          width: `${completion[(tier + 1) as IntakeTier]}%`,
                        }}
                      />
                    )}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Tier Labels */}
      <div className="flex justify-between text-xs">
        {tiers.map((tier) => (
          <div
            key={tier}
            className={`text-center w-20 ${tier === currentTier ? "text-blue-600 font-medium" : "text-gray-500"}`}
          >
            {TIER_NAMES[tier]}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TIER STATUS CARD
// =============================================================================

interface TierStatusCardProps {
  status: DealTierStatus;
  showBlockers?: boolean;
  onAdvance?: () => void;
}

export function TierStatusCard({
  status,
  showBlockers = true,
  onAdvance,
}: TierStatusCardProps) {
  const nextTier = Math.min(status.current_tier + 1, 4) as IntakeTier;
  const canAdvance =
    status.next_tier_blockers.length === 0 && status.current_tier < 4;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {TIER_NAMES[status.current_tier]}
          </h3>
          <p className="text-sm text-gray-500">
            {TIER_DESCRIPTIONS[status.current_tier]}
          </p>
        </div>
        <div
          className={`
          px-3 py-1 rounded-full text-sm font-medium
          ${status.current_tier === 4 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}
        `}
        >
          Tier {status.current_tier}
        </div>
      </div>

      {/* Progress */}
      <TierProgress
        currentTier={status.current_tier}
        completion={status.tier_completion}
      />

      {/* Next Tier Info */}
      {status.current_tier < 4 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Next: {TIER_NAMES[nextTier]}
            </span>
            <span className="text-sm text-gray-500">
              {status.tier_completion[nextTier]}% ready
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Trigger: {TIER_TRIGGERS[nextTier]}
          </p>

          {/* Blockers */}
          {showBlockers && status.next_tier_blockers.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-amber-600 mb-1">
                Missing required fields:
              </p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {status.next_tier_blockers.slice(0, 5).map((blocker, i) => (
                  <li key={i} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5" />
                    {blocker}
                  </li>
                ))}
                {status.next_tier_blockers.length > 5 && (
                  <li className="text-gray-400">
                    +{status.next_tier_blockers.length - 5} more...
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Advance Button */}
          {onAdvance && canAdvance && (
            <button
              onClick={onAdvance}
              className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Advance to {TIER_NAMES[nextTier]}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VALIDATION SUMMARY
// =============================================================================

interface ValidationSummaryProps {
  validation: TierValidationResult;
  showAll?: boolean;
}

export function ValidationSummary({
  validation,
  showAll = false,
}: ValidationSummaryProps) {
  const displayErrors = showAll
    ? validation.errors
    : validation.errors.slice(0, 5);

  if (validation.valid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center text-green-800">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">All required fields complete</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <div className="flex items-center text-amber-800 mb-2">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium">
          {validation.errors.length} field(s) need attention
        </span>
      </div>

      <ul className="space-y-1">
        {displayErrors.map((error, i) => (
          <li key={i} className="text-sm text-amber-700 flex items-start">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2 mt-1.5 flex-shrink-0" />
            <span>
              <strong>{error.label}:</strong> {error.error}
            </span>
          </li>
        ))}
      </ul>

      {!showAll && validation.errors.length > 5 && (
        <p className="text-xs text-amber-600 mt-2">
          +{validation.errors.length - 5} more issues
        </p>
      )}

      <div className="mt-2 pt-2 border-t border-amber-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-amber-700">Completion</span>
          <span className="font-medium text-amber-800">
            {validation.completion_pct}%
          </span>
        </div>
        <div className="mt-1 h-2 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${validation.completion_pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FIELD GROUP
// =============================================================================

interface FieldGroupProps {
  category: FieldCategory;
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  errors: FieldValidationError[];
  currentTier: IntakeTier;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

export function FieldGroup({
  category,
  fields,
  values,
  errors,
  currentTier,
  onChange,
  disabled = false,
}: FieldGroupProps) {
  const errorMap = useMemo(() => {
    const map: Record<string, string> = {};
    errors.forEach((e) => {
      map[e.field] = e.error;
    });
    return map;
  }, [errors]);

  if (fields.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">
        {CATEGORY_LABELS[category]}
      </h3>

      <div className="space-y-4">
        {fields.map((field) => {
          const error = errorMap[field.key];
          const isNew = field.visible_at_tier === currentTier;
          const isRequired = field.required_at_tier <= currentTier;

          return (
            <div key={field.key} className="relative">
              {/* New field badge */}
              {isNew && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  New
                </span>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>

              {/* Field input based on type */}
              <FieldInput
                field={field}
                value={values[field.key]}
                onChange={(v) => onChange(field.key, v)}
                error={error}
                disabled={disabled}
              />

              {/* Help text */}
              {field.help_text && !error && (
                <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
              )}

              {/* Error message */}
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// FIELD INPUT
// =============================================================================

interface FieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

function FieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldInputProps) {
  const baseClass = `
    w-full rounded-md border transition-colors
    ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"}
    ${disabled ? "bg-gray-50 text-gray-500" : "bg-white"}
  `;

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={3}
          className={`${baseClass} px-3 py-2`}
        />
      );

    case "select":
      return (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${baseClass} px-3 py-2`}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "boolean":
      return (
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={value === true}
              onChange={() => onChange(true)}
              disabled={disabled}
              className="mr-2"
            />
            Yes
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={value === false}
              onChange={() => onChange(false)}
              disabled={disabled}
              className="mr-2"
            />
            No
          </label>
        </div>
      );

    case "currency":
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            value={(value as number) || ""}
            onChange={(e) =>
              onChange(e.target.value ? parseFloat(e.target.value) : undefined)
            }
            placeholder={field.placeholder}
            disabled={disabled}
            className={`${baseClass} pl-7 pr-3 py-2`}
          />
        </div>
      );

    case "percent":
      return (
        <div className="relative">
          <input
            type="number"
            value={(value as number) || ""}
            onChange={(e) =>
              onChange(e.target.value ? parseFloat(e.target.value) : undefined)
            }
            placeholder={field.placeholder}
            disabled={disabled}
            min={0}
            max={100}
            className={`${baseClass} pr-8 pl-3 py-2`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            %
          </span>
        </div>
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${baseClass} px-3 py-2`}
        />
      );

    case "file":
      return (
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
          disabled={disabled}
          className={`${baseClass} px-3 py-2 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium`}
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={(value as number) || ""}
          onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : undefined)
          }
          placeholder={field.placeholder}
          disabled={disabled}
          min={field.validation?.min}
          max={field.validation?.max}
          className={`${baseClass} px-3 py-2`}
        />
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={`${baseClass} px-3 py-2`}
        />
      );
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  TierProgress,
  TierStatusCard,
  ValidationSummary,
  FieldGroup,
};
