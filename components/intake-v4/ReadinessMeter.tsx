"use client";

import { IntakeData, ProgramType } from "@/types/intake";
import { useEffect, useMemo } from "react";
import { calculateUnifiedReadiness } from "@/lib/intake/readinessScore";

interface ReadinessMeterProps {
  data: IntakeData;
  programs: ProgramType[];
  onScoreChange?: (score: number, tier: number) => void;
}

export function ReadinessMeter({
  data,
  programs,
  onScoreChange,
}: ReadinessMeterProps) {
  // Use the shared unified readiness calculation
  const result = useMemo(() => {
    return calculateUnifiedReadiness(data as Record<string, unknown>, programs);
  }, [data, programs]);

  const {
    percentage: readinessScore,
    currentTier,
    tier1Pct,
    tier2Pct,
    tier3Pct,
  } = result;

  // Report score and tier changes
  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(readinessScore, currentTier);
    }
  }, [readinessScore, currentTier, onScoreChange]);

  // Eligibility indicators
  const hasEligibleTract = data.tractEligible === true;
  const isSeverelyDistressed = data.tractSeverelyDistressed === true;
  const passesQALICB = programs.includes("NMTC")
    ? (data.qalicbGrossIncome ?? 0) >= 50 &&
      (data.qalicbTangibleProperty ?? 0) >= 40 &&
      (data.qalicbEmployeeServices ?? 0) >= 40 &&
      data.isProhibitedBusiness === false
    : true;

  // Calculate financing metrics
  const financingGapPct =
    data.totalProjectCost && data.financingGap
      ? Math.round((data.financingGap / data.totalProjectCost) * 100)
      : 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sticky top-24 h-fit space-y-6">
      {/* Main Readiness Score */}
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          {/* Circular progress */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-800"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - readinessScore / 100)}`}
              className={`transition-all duration-700 ${
                currentTier >= 3
                  ? "text-amber-500"
                  : currentTier >= 2
                    ? "text-emerald-500"
                    : currentTier >= 1
                      ? "text-indigo-500"
                      : "text-gray-600"
              }`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-3xl font-bold ${
                currentTier >= 3
                  ? "text-amber-400"
                  : currentTier >= 2
                    ? "text-emerald-400"
                    : currentTier >= 1
                      ? "text-indigo-400"
                      : "text-gray-400"
              }`}
            >
              {readinessScore}%
            </span>
            <span className="text-xs text-gray-500">Ready</span>
          </div>
        </div>
      </div>

      {/* Current Tier Badge */}
      <div
        className={`p-3 rounded-lg text-center border ${
          currentTier >= 3
            ? "bg-amber-900/20 border-amber-500/30"
            : currentTier >= 2
              ? "bg-emerald-900/20 border-emerald-500/30"
              : currentTier >= 1
                ? "bg-indigo-900/20 border-indigo-500/30"
                : "bg-gray-800/50 border-gray-700"
        }`}
      >
        <div className="text-2xl mb-1">
          {currentTier >= 3
            ? "✅"
            : currentTier >= 2
              ? "📊"
              : currentTier >= 1
                ? "📋"
                : "🔒"}
        </div>
        <div
          className={`text-sm font-semibold ${
            currentTier >= 3
              ? "text-amber-300"
              : currentTier >= 2
                ? "text-emerald-300"
                : currentTier >= 1
                  ? "text-indigo-300"
                  : "text-gray-400"
          }`}
        >
          {currentTier >= 3
            ? "Due Diligence Ready"
            : currentTier >= 2
              ? "Project Profile Ready"
              : currentTier >= 1
                ? "DealCard Ready"
                : "In Progress"}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentTier >= 3
            ? "Ready for closing room"
            : currentTier >= 2
              ? "Ready for CDE matching"
              : currentTier >= 1
                ? "Ready to submit"
                : "Complete Tier 1 fields"}
        </div>
      </div>

      {/* Tier Progress Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tier Progress
        </h4>

        {/* Tier 1 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-400 font-medium">
              Tier 1: DealCard
            </span>
            <span
              className={tier1Pct >= 100 ? "text-green-400" : "text-gray-500"}
            >
              {tier1Pct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${tier1Pct}%` }}
            />
          </div>
        </div>

        {/* Tier 2 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium">
              Tier 2: Profile
            </span>
            <span
              className={tier2Pct >= 70 ? "text-green-400" : "text-gray-500"}
            >
              {tier2Pct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${tier2Pct}%` }}
            />
          </div>
        </div>

        {/* Tier 3 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-400 font-medium">
              Tier 3: Due Diligence
            </span>
            <span
              className={tier3Pct >= 85 ? "text-green-400" : "text-gray-500"}
            >
              {tier3Pct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${tier3Pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Eligibility Indicators */}
      <div className="space-y-2 pt-4 border-t border-gray-800">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Eligibility
        </h4>

        {/* Tract Eligibility */}
        <div className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-800/50">
          <span className="text-xs text-gray-400">Census Tract</span>
          {data.censusTract ? (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                hasEligibleTract
                  ? isSeverelyDistressed
                    ? "bg-purple-900/50 text-purple-300"
                    : "bg-green-900/50 text-green-300"
                  : "bg-red-900/50 text-red-300"
              }`}
            >
              {hasEligibleTract
                ? isSeverelyDistressed
                  ? "Severely Distressed"
                  : "Eligible"
                : "Not Eligible"}
            </span>
          ) : (
            <span className="text-xs text-gray-500">—</span>
          )}
        </div>

        {/* QALICB Status (NMTC only) */}
        {programs.includes("NMTC") && (
          <div className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-800/50">
            <span className="text-xs text-gray-400">QALICB Tests</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                passesQALICB
                  ? "bg-green-900/50 text-green-300"
                  : "bg-yellow-900/50 text-yellow-300"
              }`}
            >
              {passesQALICB ? "Pass" : "Incomplete"}
            </span>
          </div>
        )}

        {/* Programs */}
        <div className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-800/50">
          <span className="text-xs text-gray-400">Programs</span>
          <div className="flex gap-1">
            {programs.length > 0 ? (
              programs.map((p) => (
                <span
                  key={p}
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    p === "NMTC"
                      ? "bg-emerald-900/50 text-emerald-300"
                      : p === "HTC"
                        ? "bg-blue-900/50 text-blue-300"
                        : p === "LIHTC"
                          ? "bg-purple-900/50 text-purple-300"
                          : p === "OZ"
                            ? "bg-amber-900/50 text-amber-300"
                            : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {p}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">None selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      {data.totalProjectCost && (
        <div className="space-y-2 pt-4 border-t border-gray-800">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Financials
          </h4>

          <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total Project Cost</span>
              <span className="text-sm font-semibold text-gray-200">
                ${(data.totalProjectCost || 0).toLocaleString()}
              </span>
            </div>

            {data.financingGap !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Financing Gap</span>
                <span className="text-sm font-semibold text-indigo-400">
                  ${(data.financingGap || 0).toLocaleString()}
                  <span className="text-xs text-gray-500 ml-1">
                    ({financingGapPct}%)
                  </span>
                </span>
              </div>
            )}

            {data.requestedAllocation && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {(() => {
                    const programNames: Record<ProgramType, string> = {
                      NMTC: "Requested NMTC",
                      HTC: "Requested HTC",
                      LIHTC: "Requested LIHTC",
                      OZ: "OZ Investment",
                      Brownfield: "Brownfield Credit",
                    };
                    if (programs.length === 1) {
                      return (
                        programNames[programs[0]] || "Requested Allocation"
                      );
                    }
                    return "Requested Allocation";
                  })()}
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  ${(data.requestedAllocation || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs Summary */}
      {(data.permanentJobsFTE || data.constructionJobsFTE) && (
        <div className="space-y-2 pt-4 border-t border-gray-800">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Community Impact
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {data.permanentJobsFTE !== undefined && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-400">
                  {data.permanentJobsFTE}
                </div>
                <div className="text-xs text-gray-500">Permanent Jobs</div>
              </div>
            )}
            {data.constructionJobsFTE !== undefined && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-orange-400">
                  {data.constructionJobsFTE}
                </div>
                <div className="text-xs text-gray-500">Construction Jobs</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Step Prompt */}
      {currentTier < 3 && (
        <div className="pt-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-xs font-medium text-gray-300">
                  {currentTier === 0
                    ? "Complete basics to create DealCard"
                    : currentTier === 1
                      ? "Add impact data for Project Profile"
                      : "Upload documents for closing readiness"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentTier === 0
                    ? "Need: Name, location, costs, programs"
                    : currentTier === 1
                      ? "Need: Jobs, timeline, QALICB tests"
                      : "Need: Phase I, permits, legal docs"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadinessMeter;
