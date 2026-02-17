"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  CDEIntakeData,
  defaultCDEIntakeData,
  CDEImpactPriority,
  IMPACT_PRIORITY_LABELS,
} from "@/lib/types/cde";

// Allocation types
interface AllocationEntry {
  id: string;
  type: "federal" | "state";
  year: string;
  awardedAmount: number;
  availableOnPlatform: number;
  percentageWon?: number; // For federal allocations where they only won partial
  state?: string; // For state allocations
  deploymentDeadline?: string;
}

// US States for selection
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

// Project types (same as Intake form)
const PROJECT_TYPES = [
  "Real Estate - Commercial",
  "Real Estate - Industrial",
  "Real Estate - Retail",
  "Real Estate - Mixed Use",
  "Operating Business",
  "Manufacturing",
  "Healthcare / Medical",
  "Community Facility",
  "Educational",
  "Childcare / Early Learning",
  "Food Access / Grocery",
  "Energy / Clean Tech",
  "Technology / Data Center",
  "Agriculture / Farming",
  "Arts / Cultural",
  "Hospitality / Hotel",
  "Workforce Development",
  "Infrastructure",
];

const STEPS = [
  { id: 1, name: "Organization", icon: "🏢" },
  { id: 2, name: "Allocation", icon: "💰" },
  { id: 3, name: "Geography", icon: "🗺️" },
  { id: 4, name: "Mission", icon: "🎯" },
  { id: 5, name: "Preferences", icon: "⚙️" },
  { id: 6, name: "Review", icon: "✓" },
];

const ALLOCATION_YEARS = [
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
];

export default function CDEProfileEditPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CDEIntakeData>(defaultCDEIntakeData);
  const [isSaving, setIsSaving] = useState(false);

  // Allocation management
  const [allocations, setAllocations] = useState<AllocationEntry[]>([]);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [newAllocation, setNewAllocation] = useState<Partial<AllocationEntry>>({
    type: "federal",
  });

  const updateData = (updates: Partial<CDEIntakeData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  // Add allocation
  const handleAddAllocation = () => {
    if (!newAllocation.year || !newAllocation.awardedAmount) return;

    const entry: AllocationEntry = {
      id: `alloc-${Date.now()}`,
      type: newAllocation.type || "federal",
      year: newAllocation.year,
      awardedAmount: newAllocation.awardedAmount,
      availableOnPlatform:
        newAllocation.availableOnPlatform || newAllocation.awardedAmount,
      percentageWon: newAllocation.percentageWon,
      state: newAllocation.state,
      deploymentDeadline: newAllocation.deploymentDeadline,
    };

    setAllocations([...allocations, entry]);
    setNewAllocation({ type: "federal" });
    setShowAddAllocation(false);

    // Update totals in data
    const totalAwarded = [...allocations, entry].reduce(
      (sum, a) => sum + a.awardedAmount,
      0,
    );
    const totalAvailable = [...allocations, entry].reduce(
      (sum, a) => sum + a.availableOnPlatform,
      0,
    );
    updateData({
      totalAllocation: totalAwarded,
      remainingAllocation: totalAvailable,
    });
  };

  const removeAllocation = (id: string) => {
    const updated = allocations.filter((a) => a.id !== id);
    setAllocations(updated);
    updateData({
      totalAllocation: updated.reduce((sum, a) => sum + a.awardedAmount, 0),
      remainingAllocation: updated.reduce(
        (sum, a) => sum + a.availableOnPlatform,
        0,
      ),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save CDE profile via PATCH /api/cdes/[orgId]
      // First, resolve orgId from auth context (passed via cookie)
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const me = meRes.ok ? await meRes.json() : null;
      const orgId = me?.organizationId;

      if (!orgId) {
        console.error("No organization ID found");
        return;
      }

      const response = await fetch(`/api/cdes/${orgId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_name: data.organizationName,
          primary_contact_name: data.primaryContactName,
          primary_contact_email: data.primaryContactEmail,
          primary_contact_title: data.primaryContactTitle,
          primary_contact_phone: data.primaryContactPhone,
          website: data.website,
          cde_certification_number: data.cdeCertificationNumber,
          service_area_type: data.serviceAreaType,
          primary_states: data.primaryStates,
          urban_focus: data.urbanFocus,
          rural_focus: data.ruralFocus,
          native_american_focus: data.nativeAmericanFocus,
          target_sectors: data.targetSectors,
          mission_statement: data.missionStatement,
          impact_priorities: data.impactPriorities,
          min_deal_size: data.minDealSize,
          max_deal_size: data.maxDealSize,
          require_severely_distressed: data.requireSeverelyDistressed,
          require_qct: data.requireQCT,
          related_party_policy: data.relatedPartyPolicy,
          allocations: allocations.map((a) => ({
            type: a.type,
            year: a.year,
            awarded_amount: a.awardedAmount,
            available_on_platform: a.availableOnPlatform,
            percentage_won: a.percentageWon,
            state_code: a.state,
            deployment_deadline: a.deploymentDeadline,
          })),
        }),
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error saving CDE profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const totalAwarded = allocations.reduce((sum, a) => sum + a.awardedAmount, 0);
  const totalAvailable = allocations.reduce(
    (sum, a) => sum + a.availableOnPlatform,
    0,
  );
  const federalAllocations = allocations.filter((a) => a.type === "federal");
  const stateAllocations = allocations.filter((a) => a.type === "state");

  return (
    <ProtectedRoute allowedOrgTypes={["cde"]}>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">CDE Profile Setup</h1>
                <p className="text-xs text-gray-500">
                  Define your matching criteria for AutoMatch AI
                </p>
              </div>
            </div>
            <span className="px-2 py-1 text-xs bg-purple-900/50 text-purple-400 rounded">
              CDE Portal
            </span>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1 ${
                    step.id === currentStep
                      ? "text-purple-400"
                      : step.id < currentStep
                        ? "text-green-400"
                        : "text-gray-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                      step.id === currentStep
                        ? "bg-purple-600"
                        : step.id < currentStep
                          ? "bg-green-600"
                          : "bg-gray-800"
                    }`}
                  >
                    {step.id < currentStep ? "✓" : step.icon}
                  </div>
                  <span className="text-xs font-medium">{step.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          {/* Step 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Organization Information
                </h2>
                <p className="text-gray-400 text-sm">
                  Basic information about your CDE
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={data.organizationName}
                    onChange={(e) =>
                      updateData({ organizationName: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500"
                    placeholder="e.g., Midwest Community Capital"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      CDE Certification #
                    </label>
                    <input
                      type="text"
                      value={data.cdeCertificationNumber || ""}
                      onChange={(e) =>
                        updateData({ cdeCertificationNumber: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="CDFI certification"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Year Established
                    </label>
                    <input
                      type="number"
                      value={data.yearEstablished || ""}
                      onChange={(e) =>
                        updateData({
                          yearEstablished:
                            parseInt(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="e.g., 2010"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={data.website || ""}
                    onChange={(e) => updateData({ website: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    placeholder="https://www.example.com"
                  />
                </div>
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Primary Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={data.primaryContactName}
                        onChange={(e) =>
                          updateData({ primaryContactName: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={data.primaryContactTitle}
                        onChange={(e) =>
                          updateData({ primaryContactTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={data.primaryContactEmail}
                        onChange={(e) =>
                          updateData({ primaryContactEmail: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={data.primaryContactPhone || ""}
                        onChange={(e) =>
                          updateData({ primaryContactPhone: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Allocation - NEW MULTI-ALLOCATION SYSTEM */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Allocation Details
                </h2>
                <p className="text-gray-400 text-sm">
                  Add your NMTC allocations - both Federal and State awards
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-xs text-gray-500">Total Awarded</p>
                  <p className="text-xl font-bold text-gray-100">
                    {formatCurrency(totalAwarded)}
                  </p>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-700/50">
                  <p className="text-xs text-purple-400">
                    Available on Platform
                  </p>
                  <p className="text-xl font-bold text-purple-300">
                    {formatCurrency(totalAvailable)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <p className="text-xs text-gray-500">Allocations</p>
                  <p className="text-xl font-bold text-gray-100">
                    {allocations.length}
                  </p>
                </div>
              </div>

              {/* Existing Allocations */}
              {allocations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    Your Allocations
                  </h3>

                  {/* Federal Allocations */}
                  {federalAllocations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-indigo-400 font-medium uppercase">
                        Federal NMTC
                      </p>
                      {federalAllocations.map((alloc) => (
                        <div
                          key={alloc.id}
                          className="flex items-center justify-between p-3 bg-indigo-900/20 border border-indigo-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-indigo-400">
                                {alloc.year}
                              </p>
                              {alloc.percentageWon && (
                                <p className="text-xs text-gray-500">
                                  {alloc.percentageWon}% won
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">
                                Awarded: {formatCurrency(alloc.awardedAmount)}
                              </p>
                              <p className="text-xs text-purple-400">
                                On Platform:{" "}
                                {formatCurrency(alloc.availableOnPlatform)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAllocation(alloc.id)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* State Allocations */}
                  {stateAllocations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-sky-400 font-medium uppercase">
                        State NMTC
                      </p>
                      {stateAllocations.map((alloc) => (
                        <div
                          key={alloc.id}
                          className="flex items-center justify-between p-3 bg-sky-900/20 border border-sky-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-sky-400">
                                {alloc.state}
                              </p>
                              <p className="text-xs text-gray-500">
                                {alloc.year}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-300">
                                Awarded: {formatCurrency(alloc.awardedAmount)}
                              </p>
                              <p className="text-xs text-purple-400">
                                On Platform:{" "}
                                {formatCurrency(alloc.availableOnPlatform)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAllocation(alloc.id)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add Allocation Button */}
              {!showAddAllocation && (
                <button
                  onClick={() => setShowAddAllocation(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Allocation
                </button>
              )}

              {/* Add Allocation Form */}
              {showAddAllocation && (
                <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-200">
                      Add New Allocation
                    </h4>
                    <button
                      onClick={() => setShowAddAllocation(false)}
                      className="text-gray-500 hover:text-white"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Allocation Type */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setNewAllocation({
                            ...newAllocation,
                            type: "federal",
                            state: undefined,
                          })
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${newAllocation.type === "federal" ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}
                      >
                        Federal NMTC
                      </button>
                      <button
                        onClick={() =>
                          setNewAllocation({ ...newAllocation, type: "state" })
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${newAllocation.type === "state" ? "bg-sky-600 text-white" : "bg-gray-700 text-gray-400"}`}
                      >
                        State NMTC
                      </button>
                    </div>
                  </div>

                  {/* State Selection (for state allocations) */}
                  {newAllocation.type === "state" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        State *
                      </label>
                      <select
                        value={newAllocation.state || ""}
                        onChange={(e) =>
                          setNewAllocation({
                            ...newAllocation,
                            state: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Year */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Award Year *
                    </label>
                    <select
                      value={newAllocation.year || ""}
                      onChange={(e) =>
                        setNewAllocation({
                          ...newAllocation,
                          year: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    >
                      <option value="">Select Year</option>
                      {ALLOCATION_YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Awarded Amount *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={newAllocation.awardedAmount || ""}
                          onChange={(e) =>
                            setNewAllocation({
                              ...newAllocation,
                              awardedAmount: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                          placeholder="50,000,000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Available on Platform *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={newAllocation.availableOnPlatform || ""}
                          onChange={(e) =>
                            setNewAllocation({
                              ...newAllocation,
                              availableOnPlatform:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                          placeholder="35,000,000"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Portion you want to source deals for on tCredex
                      </p>
                    </div>
                  </div>

                  {/* Percentage Won (for federal) */}
                  {newAllocation.type === "federal" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Percentage Won (optional)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newAllocation.percentageWon || ""}
                          onChange={(e) =>
                            setNewAllocation({
                              ...newAllocation,
                              percentageWon:
                                parseInt(e.target.value) || undefined,
                            })
                          }
                          className="w-full pr-8 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                          placeholder="e.g., 50 if you won 50% of request"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Deployment Deadline */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Deployment Deadline
                    </label>
                    <input
                      type="date"
                      value={newAllocation.deploymentDeadline || ""}
                      onChange={(e) =>
                        setNewAllocation({
                          ...newAllocation,
                          deploymentDeadline: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddAllocation}
                    disabled={
                      !newAllocation.year ||
                      !newAllocation.awardedAmount ||
                      (newAllocation.type === "state" && !newAllocation.state)
                    }
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium"
                  >
                    Add Allocation
                  </button>
                </div>
              )}

              {/* Deal Size Range */}
              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Deal Size Range (QLICI)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Minimum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={data.minDealSize || ""}
                        onChange={(e) =>
                          updateData({
                            minDealSize: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        placeholder="1,000,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Maximum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={data.maxDealSize || ""}
                        onChange={(e) =>
                          updateData({
                            maxDealSize: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        placeholder="15,000,000"
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={data.isSmallDealFund}
                    onChange={(e) =>
                      updateData({ isSmallDealFund: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      Small Deal Fund
                    </p>
                    <p className="text-xs text-gray-500">
                      We accept deals under $5M
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Geography */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Geographic Focus</h2>
                <p className="text-gray-400 text-sm">
                  Define your service area
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service Area Type *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["national", "regional", "state", "local"] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => updateData({ serviceAreaType: type })}
                          className={`px-4 py-3 rounded-lg text-sm font-medium capitalize ${data.serviceAreaType === type ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                        >
                          {type}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {data.serviceAreaType !== "national" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary States
                    </label>
                    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-800 rounded-lg">
                      {US_STATES.map((state) => (
                        <button
                          key={state.code}
                          onClick={() =>
                            updateData({
                              primaryStates: toggleArrayItem(
                                data.primaryStates,
                                state.code,
                              ),
                            })
                          }
                          className={`px-2 py-1.5 rounded text-xs font-medium ${data.primaryStates.includes(state.code) ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}
                          title={state.name}
                        >
                          {state.code}
                        </button>
                      ))}
                    </div>
                    {data.primaryStates.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {data.primaryStates.join(", ")}
                      </p>
                    )}
                  </div>
                )}
                <div className="border-t border-gray-800 pt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Area Preferences
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.urbanFocus}
                        onChange={(e) =>
                          updateData({ urbanFocus: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                      />
                      <span className="text-sm text-gray-300">Urban Areas</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.ruralFocus}
                        onChange={(e) =>
                          updateData({ ruralFocus: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                      />
                      <span className="text-sm text-gray-300">Rural Areas</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.nativeAmericanFocus}
                        onChange={(e) =>
                          updateData({ nativeAmericanFocus: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                      />
                      <span className="text-sm text-gray-300">
                        Native American
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.underservedStatesFocus}
                        onChange={(e) =>
                          updateData({
                            underservedStatesFocus: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                      />
                      <span className="text-sm text-gray-300">
                        Underserved States
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Mission */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Mission & Impact</h2>
                <p className="text-gray-400 text-sm">
                  Define your impact priorities
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mission Statement *
                  </label>
                  <textarea
                    value={data.missionStatement}
                    onChange={(e) =>
                      updateData({ missionStatement: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                    placeholder="Describe your CDE's mission..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Impact Priorities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      Object.keys(IMPACT_PRIORITY_LABELS) as CDEImpactPriority[]
                    ).map((priority) => (
                      <button
                        key={priority}
                        onClick={() =>
                          updateData({
                            impactPriorities: toggleArrayItem(
                              data.impactPriorities,
                              priority,
                            ),
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-sm text-left ${data.impactPriorities.includes(priority) ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                      >
                        {IMPACT_PRIORITY_LABELS[priority]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Sectors
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-800/50 rounded-lg">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() =>
                          updateData({
                            targetSectors: toggleArrayItem(
                              data.targetSectors,
                              type,
                            ),
                          })
                        }
                        className={`px-3 py-2 rounded text-xs text-left ${data.targetSectors.includes(type) ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Preferences - ADDED NMTC */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Deal Preferences</h2>
                <p className="text-gray-400 text-sm">
                  Set matching requirements
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.requireSeverelyDistressed}
                      onChange={(e) =>
                        updateData({
                          requireSeverelyDistressed: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                    />
                    <div>
                      <p className="text-sm text-gray-300">
                        Require Severely Distressed
                      </p>
                      <p className="text-xs text-gray-500">
                        Only severely distressed tracts
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.requireQCT}
                      onChange={(e) =>
                        updateData({ requireQCT: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                    />
                    <div>
                      <p className="text-sm text-gray-300">Require QCT</p>
                      <p className="text-xs text-gray-500">
                        Qualified Census Tracts only
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.requireShovelReady}
                      onChange={(e) =>
                        updateData({ requireShovelReady: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                    />
                    <div>
                      <p className="text-sm text-gray-300">
                        Require Shovel Ready
                      </p>
                      <p className="text-xs text-gray-500">
                        Ready to begin construction
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.requireCommunityBenefits}
                      onChange={(e) =>
                        updateData({
                          requireCommunityBenefits: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                    />
                    <div>
                      <p className="text-sm text-gray-300">
                        Community Benefits Plan
                      </p>
                      <p className="text-xs text-gray-500">
                        Documented benefits agreement
                      </p>
                    </div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Related Party Policy *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "prohibited", label: "Prohibited" },
                      { value: "case-by-case", label: "Case-by-Case" },
                      { value: "allowed-with-disclosure", label: "Allowed" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateData({
                            relatedPartyPolicy:
                              opt.value as typeof data.relatedPartyPolicy,
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-sm ${data.relatedPartyPolicy === opt.value ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Credit Experience
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-purple-900/30 border border-purple-700/50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.nmtcExperience}
                        onChange={(e) =>
                          updateData({ nmtcExperience: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                      />
                      <span className="text-sm text-purple-300 font-medium">
                        NMTC
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.htcExperience}
                        onChange={(e) =>
                          updateData({ htcExperience: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-600"
                      />
                      <span className="text-sm text-gray-300">
                        Historic Tax Credits
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.lihtcExperience}
                        onChange={(e) =>
                          updateData({ lihtcExperience: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                      />
                      <span className="text-sm text-gray-300">LIHTC</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.ozExperience}
                        onChange={(e) =>
                          updateData({ ozExperience: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-green-600"
                      />
                      <span className="text-sm text-gray-300">
                        Opportunity Zones
                      </span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer col-span-2">
                      <input
                        type="checkbox"
                        checked={data.stackedDealsPreferred}
                        onChange={(e) =>
                          updateData({
                            stackedDealsPreferred: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600"
                      />
                      <span className="text-sm text-gray-300">
                        Prefer Stacked Deals (multiple credit types)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Review Profile</h2>
                <p className="text-gray-400 text-sm">
                  Verify before publishing
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">
                    Organization
                  </h3>
                  <p className="text-white font-medium">
                    {data.organizationName || "Not provided"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {data.primaryContactName} - {data.primaryContactEmail}
                  </p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">
                    Allocations
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Awarded</p>
                      <p className="text-lg font-bold text-gray-100">
                        {formatCurrency(totalAwarded)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        Available on Platform
                      </p>
                      <p className="text-lg font-bold text-purple-400">
                        {formatCurrency(totalAvailable)}
                      </p>
                    </div>
                  </div>
                  {allocations.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {federalAllocations.length > 0 && (
                        <span>
                          Federal:{" "}
                          {federalAllocations.map((a) => a.year).join(", ")}
                        </span>
                      )}
                      {stateAllocations.length > 0 && (
                        <span className="ml-3">
                          State:{" "}
                          {stateAllocations
                            .map((a) => `${a.state} (${a.year})`)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500">Deal Size Range</p>
                    <p className="text-sm text-gray-200">
                      {formatCurrency(data.minDealSize)} -{" "}
                      {formatCurrency(data.maxDealSize)}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">
                    Geography
                  </h3>
                  <p className="text-gray-200 capitalize">
                    {data.serviceAreaType}
                  </p>
                  {data.primaryStates.length > 0 && (
                    <p className="text-gray-400 text-sm mt-1">
                      {data.primaryStates.join(", ")}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">
                    Mission
                  </h3>
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {data.missionStatement || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-gray-800 mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50"
            >
              ← Previous
            </button>
            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 text-sm font-medium bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white rounded-lg flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Publish Profile ✓"
                )}
              </button>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
