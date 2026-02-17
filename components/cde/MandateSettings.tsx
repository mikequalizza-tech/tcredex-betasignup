"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  MapPin,
  Building2,
  Target,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";
import { fetchApi } from "@/lib/api/fetch-utils";

/**
 * CDE Mandate Settings Component
 *
 * Allows CDEs to configure their investment preferences:
 * - Geographic focus (states, regions, rural/urban)
 * - Sector preferences
 * - Deal size range
 * - UTS (Underserved Targeted States) targets
 * - Program focus (NMTC, HTC, LIHTC)
 */

interface CDEMandate {
  id: string;
  // Geographic
  serviceAreaType: "national" | "regional" | "state";
  primaryStates: string[];
  targetRegions: string[];
  excludedStates: string[];
  ruralFocus: boolean;
  urbanFocus: boolean;
  nativeAmericanFocus: boolean;
  underservedStatesFocus: boolean;
  // Sector
  targetSectors: string[];
  preferredProjectTypes: string[];
  specialFocus: string[];
  // Deal Size
  minDealSize: number;
  maxDealSize: number;
  smallDealFund: boolean;
  // Requirements
  requireSeverelyDistressed: boolean;
  requireQCT: boolean;
  minDistressScore: number;
  requireCommunityBenefits: boolean;
  requireShovelReady: boolean;
  maxTimeToClose: number; // months
  // Program Focus
  nmtcExperience: boolean;
  htcExperience: boolean;
  lihtcExperience: boolean;
  stackedDealsPreferred: boolean;
  // Mission
  missionStatement: string;
  impactPriorities: string[];
}

interface MandateSettingsProps {
  cdeId: string;
  onSave?: (mandate: CDEMandate) => void;
  className?: string;
}

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
  "VI",
  "GU",
];

const SECTORS = [
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Mixed-Use",
  "Community Facility",
  "Office",
  "Industrial",
  "Childcare",
  "Food Access",
  "Arts & Culture",
  "Workforce Development",
];

const PROJECT_TYPES = [
  "New Construction",
  "Rehabilitation",
  "Acquisition",
  "Equipment",
  "Working Capital",
  "Mixed (New + Rehab)",
];

const IMPACT_PRIORITIES = [
  "Job Creation",
  "Affordable Housing",
  "Healthcare Access",
  "Education Access",
  "Food Security",
  "Environmental Justice",
  "Minority Business",
  "Women-Owned Business",
  "Veteran-Owned Business",
  "Rural Development",
];

export default function MandateSettings({
  cdeId,
  onSave,
  className = "",
}: MandateSettingsProps) {
  const [mandate, setMandate] = useState<CDEMandate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "geography" | "sectors" | "requirements" | "mission"
  >("geography");

  useEffect(() => {
    loadMandate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMandate only depends on cdeId which is already in deps
  }, [cdeId]);

  async function loadMandate() {
    if (!cdeId) return;

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await fetchApi<{ data: any }>(`/api/cdes/${cdeId}`);
      if (result.success && result.data?.data) {
        const cde = result.data.data;
        setMandate({
          id: cde.id,
          serviceAreaType: cde.service_area_type || "national",
          primaryStates: cde.primary_states || [],
          targetRegions: cde.target_regions || [],
          excludedStates: cde.excluded_states || [],
          ruralFocus: cde.rural_focus || false,
          urbanFocus: cde.urban_focus !== false,
          nativeAmericanFocus: cde.native_american_focus || false,
          underservedStatesFocus:
            cde.uts_focus || cde.underserved_states_focus || false,
          targetSectors: cde.target_sectors || [],
          preferredProjectTypes: cde.preferred_project_types || [],
          specialFocus: cde.special_focus || [],
          minDealSize: cde.min_deal_size || 1000000,
          maxDealSize: cde.max_deal_size || 15000000,
          smallDealFund: cde.small_deal_fund || false,
          requireSeverelyDistressed: cde.require_severely_distressed || false,
          requireQCT: cde.require_qct || false,
          minDistressScore:
            cde.min_distress_percentile ?? cde.min_distress_score ?? 0,
          requireCommunityBenefits: cde.require_community_benefits !== false,
          requireShovelReady: cde.require_shovel_ready || false,
          maxTimeToClose: cde.max_time_to_close || 12,
          nmtcExperience: cde.nmtc_experience !== false,
          htcExperience: cde.htc_experience || false,
          lihtcExperience: cde.lihtc_experience || false,
          stackedDealsPreferred: cde.stacked_deals_preferred || false,
          missionStatement: cde.mission_statement || "",
          impactPriorities: cde.impact_priorities || [],
        });
      }
    } catch (err) {
      setError("Failed to load mandate settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!mandate) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await fetchApi(`/api/cdes/${cdeId}`, {
        method: "PATCH",
        body: JSON.stringify({
          service_area_type: mandate.serviceAreaType,
          primary_states: mandate.primaryStates,
          target_regions: mandate.targetRegions,
          excluded_states: mandate.excludedStates,
          rural_focus: mandate.ruralFocus,
          urban_focus: mandate.urbanFocus,
          native_american_focus: mandate.nativeAmericanFocus,
          uts_focus: mandate.underservedStatesFocus,
          target_sectors: mandate.targetSectors,
          preferred_project_types: mandate.preferredProjectTypes,
          special_focus: mandate.specialFocus,
          min_deal_size: mandate.minDealSize,
          max_deal_size: mandate.maxDealSize,
          small_deal_fund: mandate.smallDealFund,
          require_severely_distressed: mandate.requireSeverelyDistressed,
          require_qct: mandate.requireQCT,
          min_distress_percentile: mandate.minDistressScore,
          require_community_benefits: mandate.requireCommunityBenefits,
          require_shovel_ready: mandate.requireShovelReady,
          max_time_to_close: mandate.maxTimeToClose,
          nmtc_experience: mandate.nmtcExperience,
          htc_experience: mandate.htcExperience,
          lihtc_experience: mandate.lihtcExperience,
          stacked_deals_preferred: mandate.stackedDealsPreferred,
          mission_statement: mandate.missionStatement,
          impact_priorities: mandate.impactPriorities,
        }),
      });

      if (result.success) {
        setSuccess(true);
        onSave?.(mandate);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save mandate settings",
      );
    } finally {
      setSaving(false);
    }
  }

  const updateMandate = (updates: Partial<CDEMandate>) => {
    if (mandate) {
      setMandate({ ...mandate, ...updates });
    }
  };

  const toggleArrayItem = <K extends keyof CDEMandate>(
    field: K,
    item: string,
  ) => {
    if (!mandate) return;
    const current = mandate[field] as string[];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateMandate({ [field]: updated } as Partial<CDEMandate>);
  };

  if (loading) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-32 bg-gray-800 rounded" />
          <div className="h-32 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-6 ${className}`}
      >
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <p className="text-gray-400">Unable to load mandate settings</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "geography", label: "Geography", icon: MapPin },
    { id: "sectors", label: "Sectors", icon: Building2 },
    { id: "requirements", label: "Requirements", icon: Target },
    { id: "mission", label: "Mission", icon: Settings },
  ] as const;

  return (
    <div
      className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Investment Mandate
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
                    : "bg-purple-600 hover:bg-purple-500 text-white"
              }
            `}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rose-400 bg-rose-900/20 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? "text-purple-400 border-b-2 border-purple-400 bg-purple-900/10"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "geography" && (
          <GeographyTab
            mandate={mandate}
            updateMandate={updateMandate}
            toggleArrayItem={toggleArrayItem}
          />
        )}
        {activeTab === "sectors" && (
          <SectorsTab mandate={mandate} toggleArrayItem={toggleArrayItem} />
        )}
        {activeTab === "requirements" && (
          <RequirementsTab mandate={mandate} updateMandate={updateMandate} />
        )}
        {activeTab === "mission" && (
          <MissionTab
            mandate={mandate}
            updateMandate={updateMandate}
            toggleArrayItem={toggleArrayItem}
          />
        )}
      </div>
    </div>
  );
}

// Tab Components
interface TabProps {
  mandate: CDEMandate;
  updateMandate: (updates: Partial<CDEMandate>) => void;
  toggleArrayItem: <K extends keyof CDEMandate>(field: K, item: string) => void;
}

function GeographyTab({ mandate, updateMandate, toggleArrayItem }: TabProps) {
  return (
    <div className="space-y-6">
      {/* Service Area Type */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Service Area Type
        </label>
        <div className="flex gap-2">
          {(["national", "regional", "state"] as const).map((type) => (
            <button
              key={type}
              onClick={() => updateMandate({ serviceAreaType: type })}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                ${
                  mandate.serviceAreaType === type
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

      {/* Primary States */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Primary States ({mandate.primaryStates.length} selected)
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
          {US_STATES.map((state) => (
            <button
              key={state}
              onClick={() => toggleArrayItem("primaryStates", state)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${
                  mandate.primaryStates.includes(state)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }
              `}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Focus Areas */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Geographic Focus
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ToggleOption
            label="Rural Areas"
            checked={mandate.ruralFocus}
            onChange={(v) => updateMandate({ ruralFocus: v })}
          />
          <ToggleOption
            label="Urban Areas"
            checked={mandate.urbanFocus}
            onChange={(v) => updateMandate({ urbanFocus: v })}
          />
          <ToggleOption
            label="Native American Communities"
            checked={mandate.nativeAmericanFocus}
            onChange={(v) => updateMandate({ nativeAmericanFocus: v })}
          />
          <ToggleOption
            label="Underserved Targeted States"
            checked={mandate.underservedStatesFocus}
            onChange={(v) => updateMandate({ underservedStatesFocus: v })}
          />
        </div>
      </div>
    </div>
  );
}

function SectorsTab({
  mandate,
  toggleArrayItem,
}: Omit<TabProps, "updateMandate">) {
  return (
    <div className="space-y-6">
      {/* Target Sectors */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Target Sectors ({mandate.targetSectors.length} selected)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => toggleArrayItem("targetSectors", sector)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                ${
                  mandate.targetSectors.includes(sector)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }
              `}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Project Types */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Preferred Project Types
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleArrayItem("preferredProjectTypes", type)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                ${
                  mandate.preferredProjectTypes.includes(type)
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
    </div>
  );
}

function RequirementsTab({
  mandate,
  updateMandate,
}: Omit<TabProps, "toggleArrayItem">) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  return (
    <div className="space-y-6">
      {/* Deal Size Range */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Deal Size Range
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Minimum</label>
            <input
              type="number"
              value={mandate.minDealSize}
              onChange={(e) =>
                updateMandate({ minDealSize: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(mandate.minDealSize)}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Maximum</label>
            <input
              type="number"
              value={mandate.maxDealSize}
              onChange={(e) =>
                updateMandate({ maxDealSize: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(mandate.maxDealSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Program Experience */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Program Experience
        </label>
        <div className="grid grid-cols-3 gap-2">
          <ToggleOption
            label="NMTC"
            checked={mandate.nmtcExperience}
            onChange={(v) => updateMandate({ nmtcExperience: v })}
          />
          <ToggleOption
            label="HTC"
            checked={mandate.htcExperience}
            onChange={(v) => updateMandate({ htcExperience: v })}
          />
          <ToggleOption
            label="LIHTC"
            checked={mandate.lihtcExperience}
            onChange={(v) => updateMandate({ lihtcExperience: v })}
          />
        </div>
      </div>

      {/* Requirements */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Project Requirements
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ToggleOption
            label="Require Severely Distressed"
            checked={mandate.requireSeverelyDistressed}
            onChange={(v) => updateMandate({ requireSeverelyDistressed: v })}
          />
          <ToggleOption
            label="Require QCT"
            checked={mandate.requireQCT}
            onChange={(v) => updateMandate({ requireQCT: v })}
          />
          <ToggleOption
            label="Require Community Benefits"
            checked={mandate.requireCommunityBenefits}
            onChange={(v) => updateMandate({ requireCommunityBenefits: v })}
          />
          <ToggleOption
            label="Require Shovel Ready"
            checked={mandate.requireShovelReady}
            onChange={(v) => updateMandate({ requireShovelReady: v })}
          />
          <ToggleOption
            label="Small Deal Fund"
            checked={mandate.smallDealFund}
            onChange={(v) => updateMandate({ smallDealFund: v })}
          />
          <ToggleOption
            label="Prefer Stacked Deals"
            checked={mandate.stackedDealsPreferred}
            onChange={(v) => updateMandate({ stackedDealsPreferred: v })}
          />
        </div>
      </div>

      {/* Max Time to Close */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Max Time to Close: {mandate.maxTimeToClose} months
        </label>
        <input
          type="range"
          min="3"
          max="24"
          value={mandate.maxTimeToClose}
          onChange={(e) =>
            updateMandate({ maxTimeToClose: parseInt(e.target.value) })
          }
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>3 months</span>
          <span>24 months</span>
        </div>
      </div>
    </div>
  );
}

function MissionTab({ mandate, updateMandate, toggleArrayItem }: TabProps) {
  return (
    <div className="space-y-6">
      {/* Mission Statement */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Mission Statement
        </label>
        <textarea
          value={mandate.missionStatement}
          onChange={(e) => updateMandate({ missionStatement: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          placeholder="Describe your CDE's mission and investment philosophy..."
        />
      </div>

      {/* Impact Priorities */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Impact Priorities ({mandate.impactPriorities.length} selected)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {IMPACT_PRIORITIES.map((priority) => (
            <button
              key={priority}
              onClick={() => toggleArrayItem("impactPriorities", priority)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                ${
                  mandate.impactPriorities.includes(priority)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }
              `}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Component
function ToggleOption({
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
            ? "bg-purple-900/50 text-purple-300 border border-purple-500/30"
            : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
        }
      `}
    >
      <div
        className={`
          w-4 h-4 rounded flex items-center justify-center
          ${checked ? "bg-purple-500" : "bg-gray-600"}
        `}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      {label}
    </button>
  );
}
