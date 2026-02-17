"use client";

import { useState, useCallback } from "react";
import { IntakeData, ProgramType } from "@/types/intake";
import AddressAutocomplete, {
  AddressData,
} from "@/components/ui/AddressAutocomplete";
import { useStateCredits, StateCreditMatch } from "@/lib/credits";

interface LocationTractProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

// Map state names to abbreviations for API
const STATE_ABBREV: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

interface EligibilityResult {
  eligible: boolean;
  tract: string;
  programs: string[];
  federal: {
    nmtc_eligible: boolean;
    poverty_rate: number;
    poverty_qualifies: boolean;
    median_income_pct: number;
    income_qualifies: boolean;
    unemployment_rate: number;
    unemployment_qualifies: boolean;
    severely_distressed: boolean;
    metro_status: string;
  };
  state: {
    state_name: string;
    nmtc: { available: boolean; transferable?: boolean; refundable?: boolean };
    htc: { available: boolean; transferable?: boolean; refundable?: boolean };
    brownfield: { available: boolean };
    stacking_notes?: string;
  } | null;
  location: {
    state: string;
    county: string | number;
  };
  reason: string;
  note?: string;
}

export function LocationTract({ data, onChange }: LocationTractProps) {
  const [lookupStage, setLookupStage] = useState<
    "idle" | "geocoding" | "tract" | "eligibility" | "done" | "error"
  >("idle");
  const [eligibilityResult, setEligibilityResult] =
    useState<EligibilityResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Get state abbreviation for credit lookup
  const stateAbbrev = data.state
    ? STATE_ABBREV[data.state] || data.state
    : undefined;

  // Map IntakeData programs to CreditProgram type
  const creditPrograms = (data.programs || []).filter(
    (p): p is "NMTC" | "HTC" | "LIHTC" | "OZ" | "Brownfield" =>
      ["NMTC", "HTC", "LIHTC", "OZ", "Brownfield"].includes(p),
  );

  // Fetch state credits when state or programs change
  const { credits: stateCredits, isLoading: creditsLoading } = useStateCredits({
    state: stateAbbrev,
    programs: creditPrograms.length > 0 ? creditPrograms : undefined,
    enabled: !!stateAbbrev,
  });

  // Full auto-lookup pipeline: coordinates → tract → eligibility → auto-populate
  const runAutoLookup = useCallback(
    async (lat: number, lng: number, currentCounty?: string) => {
      setLookupError(null);
      setEligibilityResult(null);

      try {
        // Stage 1: Get census tract from coordinates
        setLookupStage("tract");

        const tractResponse = await fetch(
          `/api/geo/tract-lookup?lat=${lat}&lng=${lng}`,
        );
        const tractData = await tractResponse.json();

        if (!tractData.geoid) {
          throw new Error(
            tractData.error ||
              "Could not determine census tract for this location",
          );
        }

        const fullTract = tractData.geoid;

        // Stage 2: Get eligibility data
        setLookupStage("eligibility");

        const eligibilityResponse = await fetch(
          `/api/eligibility?tract=${fullTract}`,
        );
        const eligibility: EligibilityResult = await eligibilityResponse.json();

        setEligibilityResult(eligibility);

        // Stage 3: Auto-populate ALL fields
        const tractTypes: ("QCT" | "SD" | "LIC" | "DDA")[] = [];

        if (eligibility.eligible) {
          tractTypes.push("LIC");
          if (eligibility.federal?.severely_distressed) {
            tractTypes.push("SD");
          }
          if (eligibility.federal?.poverty_rate >= 20) {
            tractTypes.push("QCT");
          }
        }

        // Determine rural/urban from metro status
        const metroStatus =
          eligibility.federal?.metro_status?.toLowerCase() || "";
        const isRural =
          metroStatus.includes("non-metro") ||
          metroStatus.includes("rural") ||
          metroStatus.includes("nonmetro");

        onChange({
          censusTract: fullTract,
          tractType: tractTypes,
          tractPovertyRate: eligibility.federal?.poverty_rate ?? undefined,
          tractMedianIncome:
            eligibility.federal?.median_income_pct ?? undefined,
          tractUnemployment:
            eligibility.federal?.unemployment_rate ?? undefined,
          tractEligible: eligibility.eligible,
          tractSeverelyDistressed:
            eligibility.federal?.severely_distressed || false,
          tractClassification: eligibility.federal?.metro_status,
          tractCounty:
            typeof eligibility.location?.county === "string"
              ? eligibility.location.county
              : undefined,
          tractState: eligibility.location?.state,
          county:
            typeof eligibility.location?.county === "string"
              ? eligibility.location.county
              : currentCounty,
          // AutoMatch data - auto-populated from tract
          isRural: isRural,
          // UTS and Tribal would come from extended tract data if available
          // For now, these will be populated when the API returns this data
          isUts:
            ((eligibility as EligibilityResult & Record<string, unknown>)
              .uts_eligible as boolean | undefined) ?? undefined,
          isTribal:
            ((eligibility as EligibilityResult & Record<string, unknown>)
              .tribal_area as boolean | undefined) ?? undefined,
          isAian:
            ((eligibility as EligibilityResult & Record<string, unknown>)
              .aian_area as boolean | undefined) ?? undefined,
        });

        setLookupStage("done");
        setTimeout(() => setLookupStage("idle"), 2000);
      } catch (error) {
        console.error("Auto-lookup error:", error);
        setLookupError(
          error instanceof Error ? error.message : "Lookup failed",
        );
        setLookupStage("error");
      }
    },
    [onChange],
  );

  // Handle address selection - triggers full auto-lookup
  const handleAddressSelect = useCallback(
    async (addressData: AddressData) => {
      setLookupStage("geocoding");

      onChange({
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        county: addressData.county,
        latitude: addressData.lat,
        longitude: addressData.lng,
      });

      if (addressData.lat && addressData.lng) {
        await runAutoLookup(
          addressData.lat,
          addressData.lng,
          addressData.county,
        );
      } else {
        setLookupStage("idle");
      }
    },
    [onChange, runAutoLookup],
  );

  // Status indicator component
  const StatusIndicator = () => {
    if (lookupStage === "idle") return null;
    if (lookupStage === "error" && (eligibilityResult || data.censusTract))
      return null;

    // Determine program-specific eligibility text
    const getEligibilityText = () => {
      if (!data.programs || data.programs.length === 0) {
        return "Checking eligibility...";
      }
      const programNames: Record<ProgramType, string> = {
        NMTC: "NMTC",
        HTC: "HTC",
        LIHTC: "LIHTC",
        OZ: "Opportunity Zone",
        Brownfield: "Brownfield",
      };
      const selectedPrograms = data.programs
        .map((p) => programNames[p] || p)
        .join("/");
      return `Checking ${selectedPrograms} eligibility...`;
    };

    const stages = {
      geocoding: { text: "Getting coordinates...", icon: "📍" },
      tract: { text: "Finding census tract...", icon: "🗺️" },
      eligibility: { text: getEligibilityText(), icon: "🔍" },
      done: { text: "Complete!", icon: "✅" },
      error: { text: lookupError || "Error", icon: "❌" },
    };

    const stage = stages[lookupStage];

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          lookupStage === "done"
            ? "bg-green-900/30 text-green-300"
            : lookupStage === "error"
              ? "bg-red-900/30 text-red-300"
              : "bg-indigo-900/30 text-indigo-300"
        }`}
      >
        {lookupStage !== "done" && lookupStage !== "error" && (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        <span>{stage.icon}</span>
        <span>{stage.text}</span>
      </div>
    );
  };

  // State Credit Card component
  const StateCreditCard = ({ credit }: { credit: StateCreditMatch }) => (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-gray-200">
            {credit.program}
          </span>
          {credit.rate && (
            <span className="ml-2 text-xs font-mono text-indigo-400">
              {credit.rate}%
            </span>
          )}
        </div>
        {credit.maxCredit && (
          <span className="text-xs text-gray-400">
            Est. ${credit.maxCredit.toLocaleString()}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {credit.transferable && (
          <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs">
            Transferable
          </span>
        )}
        {credit.refundable && (
          <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">
            Refundable
          </span>
        )}
        {credit.stackableWithNMTC && (
          <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded text-xs">
            +NMTC
          </span>
        )}
        {credit.stackableWithFederalHTC && (
          <span className="px-2 py-0.5 bg-amber-900/50 text-amber-300 rounded text-xs">
            +Fed HTC
          </span>
        )}
      </div>

      {credit.notes && (
        <p className="text-xs text-gray-500 line-clamp-2">{credit.notes}</p>
      )}

      {credit.url && (
        <a
          href={credit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
        >
          Learn more →
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Address Input - Primary action */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Address <span className="text-red-400">*</span>
        </label>
        <AddressAutocomplete
          value={data.address}
          onChange={handleAddressSelect}
          placeholder="Start typing address... (auto-fills everything)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Type and select address → City, State, ZIP, Census Tract, and
          eligibility auto-populate
        </p>

        <div className="mt-2">
          <StatusIndicator />
        </div>
      </div>

      {/* Auto-filled Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            City
          </label>
          <input
            type="text"
            value={data.city || ""}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Auto-filled"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            State
          </label>
          <select
            value={data.state || ""}
            onChange={(e) => onChange({ state: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100"
          >
            <option value="">Auto-filled</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            ZIP
          </label>
          <input
            type="text"
            value={data.zipCode || ""}
            onChange={(e) => onChange({ zipCode: e.target.value })}
            placeholder="Auto-filled"
            maxLength={10}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            County
          </label>
          <input
            type="text"
            value={data.county || data.tractCounty || ""}
            onChange={(e) => onChange({ county: e.target.value })}
            placeholder="Auto-filled"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Census Tract & Eligibility */}
      {(data.censusTract || eligibilityResult) && (
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <div className="text-sm text-gray-400">Census Tract</div>
                <div className="text-xl font-mono text-gray-100">
                  {data.censusTract || "—"}
                </div>
              </div>
            </div>
            {eligibilityResult && (
              <div
                className={`px-4 py-2 rounded-lg font-medium ${
                  eligibilityResult.eligible
                    ? "bg-green-600 text-white"
                    : "bg-yellow-600 text-white"
                }`}
              >
                {eligibilityResult.eligible
                  ? (() => {
                      const programNames: Record<ProgramType, string> = {
                        NMTC: "NMTC",
                        HTC: "HTC",
                        LIHTC: "LIHTC",
                        OZ: "Opportunity Zone",
                        Brownfield: "Brownfield",
                      };
                      const selectedPrograms =
                        (data.programs || []).length > 0
                          ? data
                              .programs!.map((p) => programNames[p] || p)
                              .join("/")
                          : "Tax Credit";
                      return `✓ ${selectedPrograms} Eligible`;
                    })()
                  : "⚠ Not Eligible"}
              </div>
            )}
          </div>

          {eligibilityResult && (
            <div className="p-4 bg-gray-900/50">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
                {eligibilityResult.eligible && (
                  <span className="text-green-400 font-semibold">
                    ✓ Eligible for Tax Credits!
                  </span>
                )}
                {eligibilityResult.federal?.severely_distressed && (
                  <span className="text-orange-400 font-medium">
                    • Severely Distressed
                  </span>
                )}
              </div>

              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Census Tract:</span>
                  <span className="text-white font-semibold">
                    {eligibilityResult.tract}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Poverty Rate:</span>
                  <span className="text-white">
                    {eligibilityResult.federal?.poverty_rate}%
                    {eligibilityResult.federal?.poverty_qualifies && (
                      <span className="text-orange-400 ml-2">Distressed</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Median Family Income:</span>
                  <span className="text-white">
                    {eligibilityResult.federal?.median_income_pct}%
                    {eligibilityResult.federal?.income_qualifies && (
                      <span className="text-orange-400 ml-2">Distressed</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Unemployment Rate:</span>
                  <span className="text-white">
                    {eligibilityResult.federal?.unemployment_rate}%
                    {eligibilityResult.federal?.unemployment_qualifies && (
                      <span className="text-orange-400 ml-2">Distressed</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">Area:</span>
                  <span className="text-white">
                    {eligibilityResult.federal?.metro_status || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-400">State:</span>
                  <span className="text-white">
                    {eligibilityResult.location?.state || "—"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
                {eligibilityResult.programs?.map((program) => (
                  <span
                    key={program}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      program === "Federal NMTC"
                        ? "bg-green-900/50 text-green-300 border-green-500/30"
                        : program === "Severely Distressed"
                          ? "bg-orange-900/50 text-orange-300 border-orange-500/30"
                          : program === "State NMTC"
                            ? "bg-blue-900/50 text-blue-300 border-blue-500/30"
                            : program === "State HTC"
                              ? "bg-amber-900/50 text-amber-300 border-amber-500/30"
                              : "bg-gray-800 text-gray-300 border-gray-600"
                    }`}
                  >
                    {program}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-400 mt-4">
                {eligibilityResult.reason}
              </p>

              {/* AutoMatch Classification Indicators */}
              {(data.isRural || data.isUts || data.isTribal || data.isAian) && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400 mb-2 font-medium">
                    AutoMatch Classifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.isRural && (
                      <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-medium flex items-center gap-1">
                        🌾 Rural Area
                      </span>
                    )}
                    {data.isRural === false && (
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-medium flex items-center gap-1">
                        🏙️ Urban/Metro Area
                      </span>
                    )}
                    {data.isUts && (
                      <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs font-medium flex items-center gap-1">
                        📍 Underserved Targeted State
                      </span>
                    )}
                    {data.isTribal && (
                      <span className="px-2 py-1 bg-amber-900/50 text-amber-300 rounded text-xs font-medium flex items-center gap-1">
                        🪶 Tribal Area
                      </span>
                    )}
                    {data.isAian && (
                      <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs font-medium flex items-center gap-1">
                        🏔️ AIAN Area
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These classifications are used to match with CDEs that have
                    specific geographic focus areas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* State Credits from Matcher - Enhanced Display */}
      {stateAbbrev && (stateCredits.length > 0 || creditsLoading) && (
        <div className="border border-indigo-500/30 rounded-xl overflow-hidden bg-indigo-900/10">
          <div className="bg-indigo-900/30 px-4 py-3 flex items-center justify-between border-b border-indigo-500/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <div className="text-sm text-indigo-300 font-medium">
                  State Tax Credits — {data.state || stateAbbrev}
                </div>
                <div className="text-xs text-gray-400">
                  {stateCredits.length} program
                  {stateCredits.length !== 1 ? "s" : ""} available
                  {creditPrograms.length > 0 &&
                    ` for ${creditPrograms.join(", ")}`}
                </div>
              </div>
            </div>
            {creditsLoading && (
              <svg
                className="w-5 h-5 animate-spin text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
          </div>

          <div className="p-4">
            {stateCredits.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stateCredits.map((credit, idx) => (
                  <StateCreditCard
                    key={`${credit.program}-${idx}`}
                    credit={credit}
                  />
                ))}
              </div>
            ) : creditsLoading ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                Loading state credit programs...
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No state credits found for selected programs
              </div>
            )}

            {stateCredits.some(
              (c) => c.stackableWithNMTC || c.stackableWithFederalHTC,
            ) && (
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex items-start gap-2 text-xs text-emerald-400">
                  <span>💡</span>
                  <span>
                    Some state credits can be stacked with federal programs for
                    combined benefit.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state with retry */}
      {lookupStage === "error" && !eligibilityResult && !data.censusTract && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">Lookup Error</p>
              <p className="text-sm text-red-400 mt-1">{lookupError}</p>
              <p className="text-xs text-gray-500 mt-2">
                You can manually enter the census tract below, or try a
                different address.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Manual Census Tract Entry
            </label>
            <input
              type="text"
              value={data.censusTract || ""}
              onChange={(e) => onChange({ censusTract: e.target.value })}
              placeholder="11-digit FIPS code (e.g., 17031839100)"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* Help text */}
      {!data.address && !data.censusTract && lookupStage === "idle" && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-gray-300 font-medium">
            Enter Project Address Above
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Select from dropdown to auto-populate all location data, eligibility
            metrics, and available state credits
          </p>
        </div>
      )}
    </div>
  );
}

export default LocationTract;
