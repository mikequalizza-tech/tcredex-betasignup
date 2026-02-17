"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  DollarSign,
  Clock,
  FileText,
  MapPin,
  TrendingUp,
  Save,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchApi } from "@/lib/api/fetch-utils";

/**
 * Investor Risk Filters Component
 *
 * Allows investors to configure risk preferences for deal filtering:
 * - Financial Risk (leverage, credit pricing, sources committed)
 * - Program Risk (credit type preferences, stacking)
 * - Due Diligence Risk (DD completion thresholds)
 * - Timeline Risk (construction timing, closing deadlines)
 * - Geographic Risk (state preferences, CRA eligibility)
 */

interface InvestorRiskPreferences {
  id: string;
  // Financial Risk
  minSourcesCommitted: number; // % of capital stack committed
  maxLeverageRatio: number;
  minCreditPrice: number;
  maxCreditPrice: number;
  minInvestmentAmount: number;
  maxInvestmentAmount: number;
  // Program Risk
  acceptedCreditTypes: string[];
  allowStackedDeals: boolean;
  requireFederalCredits: boolean;
  // DD Risk
  minDDCompletion: number; // % of DD documents complete
  requirePhase1Complete: boolean;
  requireAppraisalCurrent: boolean;
  requireTitleCurrent: boolean;
  // Timeline Risk
  maxMonthsToClose: number;
  requireConstructionStart: boolean;
  maxMonthsToConstruction: number;
  // Geographic Risk
  targetStates: string[];
  excludedStates: string[];
  requireCRAEligible: boolean;
  lmiThreshold: number; // % LMI for CRA
}

interface RiskFiltersProps {
  investorId: string;
  onSave?: (preferences: InvestorRiskPreferences) => void;
  onFilterChange?: (filters: Partial<InvestorRiskPreferences>) => void;
  compact?: boolean;
  className?: string;
}

const CREDIT_TYPES = ["NMTC", "HTC", "LIHTC", "OZ", "Brownfield"] as const;

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "PR",
];

const DEFAULT_PREFERENCES: InvestorRiskPreferences = {
  id: "",
  minSourcesCommitted: 50,
  maxLeverageRatio: 4,
  minCreditPrice: 0.7,
  maxCreditPrice: 0.95,
  minInvestmentAmount: 1000000,
  maxInvestmentAmount: 50000000,
  acceptedCreditTypes: ["NMTC", "HTC", "LIHTC"],
  allowStackedDeals: true,
  requireFederalCredits: true,
  minDDCompletion: 60,
  requirePhase1Complete: true,
  requireAppraisalCurrent: true,
  requireTitleCurrent: true,
  maxMonthsToClose: 12,
  requireConstructionStart: false,
  maxMonthsToConstruction: 6,
  targetStates: [],
  excludedStates: [],
  requireCRAEligible: false,
  lmiThreshold: 50,
};

export default function RiskFilters({
  investorId,
  onSave,
  onFilterChange,
  compact = false,
  className = "",
}: RiskFiltersProps) {
  const [preferences, setPreferences] =
    useState<InvestorRiskPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    financial: true,
    program: true,
    dd: true,
    timeline: true,
    geographic: false,
  });

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPreferences only depends on investorId which is already in deps
  }, [investorId]);

  async function loadPreferences() {
    if (!investorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await fetchApi<{ data: any }>(
        `/api/investors/${investorId}/criteria`,
      );
      if (result.success && result.data?.data) {
        const data = result.data.data;
        setPreferences({
          ...DEFAULT_PREFERENCES,
          id: data.id,
          minSourcesCommitted:
            data.min_sources_committed ??
            DEFAULT_PREFERENCES.minSourcesCommitted,
          maxLeverageRatio:
            data.max_leverage_ratio ?? DEFAULT_PREFERENCES.maxLeverageRatio,
          minCreditPrice:
            data.min_credit_price ?? DEFAULT_PREFERENCES.minCreditPrice,
          maxCreditPrice:
            data.max_credit_price ?? DEFAULT_PREFERENCES.maxCreditPrice,
          minInvestmentAmount:
            data.min_investment ?? DEFAULT_PREFERENCES.minInvestmentAmount,
          maxInvestmentAmount:
            data.max_investment ?? DEFAULT_PREFERENCES.maxInvestmentAmount,
          acceptedCreditTypes:
            data.target_credit_types ?? DEFAULT_PREFERENCES.acceptedCreditTypes,
          allowStackedDeals:
            data.allow_stacked ?? DEFAULT_PREFERENCES.allowStackedDeals,
          requireFederalCredits:
            data.require_federal ?? DEFAULT_PREFERENCES.requireFederalCredits,
          minDDCompletion:
            data.min_dd_completion ?? DEFAULT_PREFERENCES.minDDCompletion,
          requirePhase1Complete:
            data.require_phase1 ?? DEFAULT_PREFERENCES.requirePhase1Complete,
          requireAppraisalCurrent:
            data.require_appraisal ??
            DEFAULT_PREFERENCES.requireAppraisalCurrent,
          requireTitleCurrent:
            data.require_title ?? DEFAULT_PREFERENCES.requireTitleCurrent,
          maxMonthsToClose:
            data.max_close_months ?? DEFAULT_PREFERENCES.maxMonthsToClose,
          requireConstructionStart:
            data.require_construction ??
            DEFAULT_PREFERENCES.requireConstructionStart,
          maxMonthsToConstruction:
            data.max_construction_months ??
            DEFAULT_PREFERENCES.maxMonthsToConstruction,
          targetStates: data.target_states ?? DEFAULT_PREFERENCES.targetStates,
          excludedStates:
            data.excluded_states ?? DEFAULT_PREFERENCES.excludedStates,
          requireCRAEligible:
            data.cra_motivated ?? DEFAULT_PREFERENCES.requireCRAEligible,
          lmiThreshold: data.lmi_threshold ?? DEFAULT_PREFERENCES.lmiThreshold,
        });
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  }

  const updatePreferences = (updates: Partial<InvestorRiskPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    onFilterChange?.(updates);
  };

  const toggleCreditType = (type: string) => {
    const current = preferences.acceptedCreditTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updatePreferences({ acceptedCreditTypes: updated });
  };

  const toggleState = (
    state: string,
    field: "targetStates" | "excludedStates",
  ) => {
    const current = preferences[field];
    const updated = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    updatePreferences({ [field]: updated });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await fetchApi(`/api/investors/${investorId}/criteria`, {
        method: "PATCH",
        body: JSON.stringify({
          min_sources_committed: preferences.minSourcesCommitted,
          max_leverage_ratio: preferences.maxLeverageRatio,
          min_credit_price: preferences.minCreditPrice,
          max_credit_price: preferences.maxCreditPrice,
          min_investment: preferences.minInvestmentAmount,
          max_investment: preferences.maxInvestmentAmount,
          target_credit_types: preferences.acceptedCreditTypes,
          allow_stacked: preferences.allowStackedDeals,
          require_federal: preferences.requireFederalCredits,
          min_dd_completion: preferences.minDDCompletion,
          require_phase1: preferences.requirePhase1Complete,
          require_appraisal: preferences.requireAppraisalCurrent,
          require_title: preferences.requireTitleCurrent,
          max_close_months: preferences.maxMonthsToClose,
          require_construction: preferences.requireConstructionStart,
          max_construction_months: preferences.maxMonthsToConstruction,
          target_states: preferences.targetStates,
          excluded_states: preferences.excludedStates,
          cra_motivated: preferences.requireCRAEligible,
          lmi_threshold: preferences.lmiThreshold,
        }),
      });

      if (result.success) {
        setSuccess(true);
        onSave?.(preferences);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save preferences",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-32 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(0)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  return (
    <div
      className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Risk Filters
          </h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                saving
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : success
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }
            `}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : success ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : success ? "Saved" : "Save"}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rose-400 bg-rose-900/20 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-800">
        {/* Financial Risk */}
        <CollapsibleSection
          title="Financial Risk"
          icon={DollarSign}
          color="emerald"
          expanded={expandedSections.financial}
          onToggle={() => toggleSection("financial")}
          compact={compact}
        >
          <div className="space-y-4 p-4">
            <RangeInput
              label="Investment Amount"
              minValue={preferences.minInvestmentAmount}
              maxValue={preferences.maxInvestmentAmount}
              onMinChange={(v) => updatePreferences({ minInvestmentAmount: v })}
              onMaxChange={(v) => updatePreferences({ maxInvestmentAmount: v })}
              format={formatCurrency}
              step={500000}
            />

            <SliderInput
              label="Min Sources Committed"
              value={preferences.minSourcesCommitted}
              onChange={(v) => updatePreferences({ minSourcesCommitted: v })}
              min={0}
              max={100}
              suffix="%"
            />

            <SliderInput
              label="Credit Price Range"
              value={preferences.minCreditPrice}
              onChange={(v) => updatePreferences({ minCreditPrice: v })}
              min={0.5}
              max={1.0}
              step={0.01}
              format={(v) => `$${v.toFixed(2)}`}
            />
          </div>
        </CollapsibleSection>

        {/* Program Risk */}
        <CollapsibleSection
          title="Program Risk"
          icon={TrendingUp}
          color="purple"
          expanded={expandedSections.program}
          onToggle={() => toggleSection("program")}
          compact={compact}
        >
          <div className="space-y-4 p-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Accepted Credit Types
              </label>
              <div className="flex gap-2">
                {CREDIT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleCreditType(type)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        preferences.acceptedCreditTypes.includes(type)
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <ToggleSwitch
                label="Allow Stacked Deals"
                checked={preferences.allowStackedDeals}
                onChange={(v) => updatePreferences({ allowStackedDeals: v })}
              />
              <ToggleSwitch
                label="Federal Credits Only"
                checked={preferences.requireFederalCredits}
                onChange={(v) =>
                  updatePreferences({ requireFederalCredits: v })
                }
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* DD Risk */}
        <CollapsibleSection
          title="Due Diligence Risk"
          icon={FileText}
          color="blue"
          expanded={expandedSections.dd}
          onToggle={() => toggleSection("dd")}
          compact={compact}
        >
          <div className="space-y-4 p-4">
            <SliderInput
              label="Min DD Completion"
              value={preferences.minDDCompletion}
              onChange={(v) => updatePreferences({ minDDCompletion: v })}
              min={0}
              max={100}
              suffix="%"
            />

            <div className="grid grid-cols-3 gap-2">
              <ToggleSwitch
                label="Phase I ESA"
                checked={preferences.requirePhase1Complete}
                onChange={(v) =>
                  updatePreferences({ requirePhase1Complete: v })
                }
              />
              <ToggleSwitch
                label="Current Appraisal"
                checked={preferences.requireAppraisalCurrent}
                onChange={(v) =>
                  updatePreferences({ requireAppraisalCurrent: v })
                }
              />
              <ToggleSwitch
                label="Current Title"
                checked={preferences.requireTitleCurrent}
                onChange={(v) => updatePreferences({ requireTitleCurrent: v })}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Timeline Risk */}
        <CollapsibleSection
          title="Timeline Risk"
          icon={Clock}
          color="amber"
          expanded={expandedSections.timeline}
          onToggle={() => toggleSection("timeline")}
          compact={compact}
        >
          <div className="space-y-4 p-4">
            <SliderInput
              label="Max Months to Close"
              value={preferences.maxMonthsToClose}
              onChange={(v) => updatePreferences({ maxMonthsToClose: v })}
              min={3}
              max={24}
              suffix=" months"
            />

            <div className="flex gap-4">
              <ToggleSwitch
                label="Require Construction Started"
                checked={preferences.requireConstructionStart}
                onChange={(v) =>
                  updatePreferences({ requireConstructionStart: v })
                }
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Geographic Risk */}
        <CollapsibleSection
          title="Geographic / CRA"
          icon={MapPin}
          color="rose"
          expanded={expandedSections.geographic}
          onToggle={() => toggleSection("geographic")}
          compact={compact}
        >
          <div className="space-y-4 p-4">
            <div className="flex gap-4">
              <ToggleSwitch
                label="CRA Eligible Only"
                checked={preferences.requireCRAEligible}
                onChange={(v) => updatePreferences({ requireCRAEligible: v })}
              />
            </div>

            {preferences.requireCRAEligible && (
              <SliderInput
                label="Min LMI Percentage"
                value={preferences.lmiThreshold}
                onChange={(v) => updatePreferences({ lmiThreshold: v })}
                min={0}
                max={100}
                suffix="%"
              />
            )}

            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Target States ({preferences.targetStates.length} selected)
              </label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
                {US_STATES.map((state) => (
                  <button
                    key={state}
                    onClick={() => toggleState(state, "targetStates")}
                    className={`
                      px-2 py-0.5 rounded text-xs font-medium transition-colors
                      ${
                        preferences.targetStates.includes(state)
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }
                    `}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// Helper Components

interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  color: "emerald" | "purple" | "blue" | "amber" | "rose";
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon: Icon,
  color,
  expanded,
  onToggle,
  compact: _compact,
  children,
}: CollapsibleSectionProps) {
  const colorClasses = {
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
          <span className="text-sm font-medium text-gray-300">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {expanded && children}
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
  format,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  format?: (v: number) => string;
}) {
  const displayValue = format ? format(value) : `${value}${suffix}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-400">{label}</label>
        <span className="text-sm font-medium text-white">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </div>
  );
}

function RangeInput({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  format,
  step = 1,
}: {
  label: string;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  format: (v: number) => string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Min</label>
          <input
            type="number"
            value={minValue}
            onChange={(e) => onMinChange(parseInt(e.target.value) || 0)}
            step={step}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">{format(minValue)}</p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Max</label>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => onMaxChange(parseInt(e.target.value) || 0)}
            step={step}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">{format(maxValue)}</p>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
        ${
          checked
            ? "bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"
            : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
        }
      `}
    >
      <div
        className={`
          w-4 h-4 rounded flex items-center justify-center
          ${checked ? "bg-emerald-500" : "bg-gray-600"}
        `}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      {label}
    </button>
  );
}
