"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AddressAutocomplete from "@/components/forms/AddressAutocomplete";

// Preload vector tiles for initial view (centered on US)
// This runs immediately on module load to start fetching tiles before map renders
if (typeof window !== "undefined") {
  // Prefetch center tiles at zoom 4 (full US view)
  const tilesToPrefetch = [
    "/api/tiles/4/3/5",
    "/api/tiles/4/4/5",
    "/api/tiles/4/5/5",
    "/api/tiles/4/3/6",
    "/api/tiles/4/4/6",
    "/api/tiles/4/5/6",
  ];
  tilesToPrefetch.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "fetch";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  });
}

// Dynamic import to avoid SSR issues - with priority loading
const HomeMapWithTracts = dynamic(
  () => import("@/components/maps/HomeMapWithTracts"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    ),
  },
);

interface MapSectionProps {
  title?: string;
  description?: string;
  showLegend?: boolean;
  showSearch?: boolean;
}

export default function MapSection(props: MapSectionProps) {
  // No hydration guard needed - dynamic import handles SSR
  return <MapSectionContent {...props} />;
}

// Actual content - only rendered after client-side mount
function MapSectionContent({
  title = "Free Census Tract Check",
  description = "Search any U.S. address to determine NMTC, LIHTC, DDA, and Opportunity Zone eligibility instantly. No login required.",
  showSearch = true,
}: MapSectionProps) {
  const [searchAddress, setSearchAddress] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lng: number;
    tract?: string;
  } | null>(null);

  const [eligibilityResult, setEligibilityResult] = useState<{
    eligible: boolean;
    tract: string;
    programs: string[];
    povertyRate?: number | null;
    medianIncomePct?: number | null;
    reason?: string;
    note?: string;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddressSelect = useCallback(async (suggestion: any) => {
    if (suggestion?.center) {
      const [lng, lat] = suggestion.center;
      // Will be updated with tract once census lookup completes
      setSearchedLocation({ lat, lng });
    }
  }, []);

  const handleCensusTractFound = async (tract: string | null) => {
    if (!tract) {
      setEligibilityResult(null);
      return;
    }

    setIsLookingUp(true);

    try {
      // Call real eligibility API
      const response = await fetch(`/api/eligibility?tract=${tract}`);
      const data = await response.json();

      setEligibilityResult({
        eligible: data.eligible,
        tract: data.tract,
        programs: data.programs || [],
        povertyRate: data.federal?.poverty_rate ?? null,
        medianIncomePct: data.federal?.median_income_pct ?? null,
        reason: data.reason,
        note: data.note,
      });

      // Update searched location with tract info
      setSearchedLocation((prev) => (prev ? { ...prev, tract } : null));
    } catch (error) {
      console.error("Eligibility check error:", error);
      setEligibilityResult({
        eligible: false,
        tract,
        programs: [],
        reason: "Error checking eligibility",
        note: "Please try again or verify at cdfifund.gov",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <section className="relative" id="address-lookup">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-gradient-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-gradient-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Map Intelligence
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              {title}
            </h2>
            <p className="text-lg text-indigo-200/65">{description}</p>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="max-w-2xl mx-auto mb-8">
              <AddressAutocomplete
                value={searchAddress}
                onChange={setSearchAddress}
                onSelect={handleAddressSelect}
                onCensusTractFound={handleCensusTractFound}
                placeholder="Start typing an address (e.g., 123 Main St, St. Louis, MO)"
                label="Check Address Eligibility"
              />

              {/* Loading state */}
              {isLookingUp && (
                <div className="mt-4 p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">
                      Checking NMTC eligibility...
                    </span>
                  </div>
                </div>
              )}

              {/* Eligibility result */}
              {eligibilityResult && !isLookingUp && (
                <div
                  className={`mt-4 p-4 rounded-lg border ${
                    eligibilityResult.eligible
                      ? "bg-green-900/30 border-green-500"
                      : "bg-red-900/30 border-red-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-3xl ${eligibilityResult.eligible ? "text-green-400" : "text-red-400"}`}
                    >
                      {eligibilityResult.eligible ? "✓" : "✗"}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`font-semibold text-lg ${eligibilityResult.eligible ? "text-green-300" : "text-red-300"}`}
                      >
                        {eligibilityResult.eligible
                          ? "Eligible for Tax Credits!"
                          : "Not in Qualified Tract"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Census Tract:{" "}
                        <span className="font-mono text-gray-300">
                          {eligibilityResult.tract}
                        </span>
                      </p>

                      {eligibilityResult.reason && (
                        <p className="text-sm text-gray-400 mt-1">
                          {eligibilityResult.reason}
                        </p>
                      )}

                      {eligibilityResult.eligible &&
                        eligibilityResult.programs.length > 0 && (
                          <div className="flex gap-2 mt-3 flex-wrap">
                            {eligibilityResult.programs.map((program) => (
                              <span
                                key={program}
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  program === "NMTC"
                                    ? "bg-green-900/50 text-green-300 border border-green-500/30"
                                    : program === "Opportunity Zone"
                                      ? "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                                      : program === "Severely Distressed"
                                        ? "bg-orange-900/50 text-orange-300 border border-orange-500/30"
                                        : "bg-blue-900/50 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {program}
                              </span>
                            ))}
                          </div>
                        )}

                      {eligibilityResult.povertyRate !== null &&
                        eligibilityResult.povertyRate !== undefined && (
                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500">
                                Poverty Rate
                              </p>
                              <p className="text-lg font-semibold text-gray-200">
                                {eligibilityResult.povertyRate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Median Income
                              </p>
                              <p className="text-lg font-semibold text-gray-200">
                                {eligibilityResult.medianIncomePct != null
                                  ? `${Math.round(eligibilityResult.medianIncomePct)}% AMI`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        )}

                      {eligibilityResult.note && (
                        <p className="text-xs text-gray-500 mt-3 italic">
                          {eligibilityResult.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map with tracts - no AOS to ensure immediate loading */}
          <div>
            <HomeMapWithTracts
              height="500px"
              searchedLocation={searchedLocation}
              className="border border-gray-700/50"
            />
          </div>

          {/* CTA below map */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Hover over the map to see tract eligibility • Click a deal pin for
              details
            </p>
            <a
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
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
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Explore Full Map Platform
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
