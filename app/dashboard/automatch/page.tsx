"use client";

import { useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/lib/auth";

interface MatchResult {
  id: string;
  projectName: string;
  sponsorName: string;
  city: string;
  state: string;
  allocationRequest: number;
  matchScore: number;
  tractType: string[];
  programType: "NMTC" | "HTC" | "LIHTC";
  scoreBreakdown: Record<string, number>; // 15 binary criteria (0 or 1 each)
  matchReasons: string[];
  submittedDate: string;
}

// Human-readable labels for the 15 binary AutoMatch criteria
const CRITERIA_LABELS: Record<string, string> = {
  geographic: "Geographic",
  financing: "Financing Type",
  urbanRural: "Urban/Rural",
  sector: "Sector Match",
  dealSize: "Deal Size",
  smallDealFund: "Small Deal Fund",
  severelyDistressed: "Severely Distressed",
  distressPercentile: "Distress Percentile",
  minorityFocus: "Minority Focus",
  utsFocus: "Underserved States",
  entityType: "Entity Type",
  ownerOccupied: "Owner Occupied",
  tribal: "Tribal/AIAN",
  allocationType: "Allocation Type",
  hasAllocation: "Has Allocation",
};

// No demo data — all matches come from real AutoMatch scan API

export default function AutoMatchPage() {
  return (
    <ProtectedRoute>
      <AutoMatchContent />
    </ProtectedRoute>
  );
}

function AutoMatchContent() {
  const { orgName, organizationId } = useCurrentUser();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [_lastRun, setLastRun] = useState<string | null>(null);
  const [_error, setError] = useState<string | null>(null);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const filteredMatches = matches.filter((m) => m.matchScore >= minScore);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 65) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-900/30 border-green-700/50";
    if (score >= 65) return "bg-yellow-900/30 border-yellow-700/50";
    if (score >= 50) return "bg-orange-900/30 border-orange-700/50";
    return "bg-red-900/30 border-red-700/50";
  };

  // Scan marketplace for matching deals (CDE perspective)
  const runAutoMatch = async () => {
    setIsRunning(true);
    setError(null);

    try {
      // Call scan endpoint — always fetch ALL matches (minScore=0), filter on frontend
      const response = await fetch(
        `/api/automatch?scan=true&cdeId=${organizationId}&minScore=0`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.matches && Array.isArray(data.matches)) {
          setMatches(data.matches);
          setLastRun(new Date().toISOString());
        } else {
          setMatches([]);
          setLastRun(new Date().toISOString());
          setError(
            "No matching projects found. Try adjusting your investment criteria.",
          );
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || "AutoMatch scan failed. Please try again.");
        setLastRun(new Date().toISOString());
      }
    } catch (err) {
      console.error("AutoMatch scan error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </span>
            AutoMatch AI
          </h1>
          <p className="text-gray-400 mt-1">
            AI-powered project matching for {orgName || "your CDE"}
          </p>
        </div>
        <button
          onClick={runAutoMatch}
          disabled={isRunning}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Run AutoMatch
            </>
          )}
        </button>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          How AutoMatch Works
        </h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">1</span>
            </div>
            <p className="text-sm text-gray-300">
              Analyzes your investment criteria
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">2</span>
            </div>
            <p className="text-sm text-gray-300">Scans marketplace projects</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">3</span>
            </div>
            <p className="text-sm text-gray-300">Scores 15 binary criteria</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-purple-400">4</span>
            </div>
            <p className="text-sm text-gray-300">Ranks & explains matches</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">Minimum Score:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setMinScore(0)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                minScore === 0
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              All
            </button>
            {[50, 65, 80].map((score) => (
              <button
                key={score}
                onClick={() => setMinScore(score)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  minScore === score
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {score}+
              </button>
            ))}
          </div>
        </div>
        <p className="text-gray-400">
          <span className="text-white font-semibold">
            {filteredMatches.length}
          </span>
          {minScore > 0 ? ` of ${matches.length}` : ""} matches found
        </p>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 && !isRunning && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {matches.length === 0
                ? "No matches yet"
                : "No matches above minimum score"}
            </h3>
            <p className="text-gray-500 mb-4">
              {matches.length === 0
                ? 'Click "Run AutoMatch" to scan the marketplace for projects matching your investment criteria.'
                : "Try lowering the minimum score threshold to see more results."}
            </p>
            {_error && <p className="text-amber-400 text-sm mt-2">{_error}</p>}
          </div>
        )}
        {filteredMatches.map((match, index) => (
          <div
            key={match.id}
            onClick={() => setSelectedMatch(match)}
            className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-6">
              {/* Rank */}
              <div className="flex-shrink-0 text-center">
                <div className="text-2xl font-bold text-gray-500">
                  #{index + 1}
                </div>
              </div>

              {/* Score */}
              <div
                className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center ${getScoreBg(match.matchScore)}`}
              >
                <div
                  className={`text-3xl font-bold ${getScoreColor(match.matchScore)}`}
                >
                  {match.matchScore}
                </div>
                <div className="text-xs text-gray-500">Match</div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      {match.projectName}
                    </h3>
                    <p className="text-gray-400">
                      {match.sponsorName} • {match.city}, {match.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-indigo-400">
                      {formatCurrency(match.allocationRequest)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Allocation Request
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Mini — shows pass/fail for key criteria */}
                <div className="flex gap-3 mb-3 flex-wrap">
                  {Object.entries(match.scoreBreakdown)
                    .slice(0, 6)
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${val ? "bg-green-400" : "bg-red-400"}`}
                        />
                        <span className="text-xs text-gray-400">
                          {CRITERIA_LABELS[key] || key}
                        </span>
                      </div>
                    ))}
                  {Object.keys(match.scoreBreakdown).length > 6 && (
                    <span className="text-xs text-gray-500">
                      +{Object.keys(match.scoreBreakdown).length - 6} more
                    </span>
                  )}
                </div>

                {/* Match Reasons Preview */}
                <div className="flex flex-wrap gap-2">
                  {match.matchReasons.slice(0, 2).map((reason, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                    >
                      {reason}
                    </span>
                  ))}
                  {match.matchReasons.length > 2 && (
                    <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                      +{match.matchReasons.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Tract Types & Action */}
              <div className="flex-shrink-0 text-right">
                <div className="flex gap-1 mb-3 justify-end">
                  {match.tractType.map((tract) => (
                    <span
                      key={tract}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tract === "SD"
                          ? "bg-red-900/50 text-red-400"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {tract}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/deals/${match.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  View Project →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedMatch(null)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedMatch.projectName}
                </h3>
                <p className="text-gray-400">
                  {selectedMatch.sponsorName} • {selectedMatch.city},{" "}
                  {selectedMatch.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
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

            {/* Score Display */}
            <div className="flex items-center gap-6 mb-6">
              <div
                className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center ${getScoreBg(selectedMatch.matchScore)}`}
              >
                <div
                  className={`text-4xl font-bold ${getScoreColor(selectedMatch.matchScore)}`}
                >
                  {selectedMatch.matchScore}
                </div>
                <div className="text-xs text-gray-500">Match Score</div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-indigo-400 mb-1">
                  {formatCurrency(selectedMatch.allocationRequest)}
                </div>
                <p className="text-gray-400">Allocation Request</p>
              </div>
            </div>

            {/* Score Breakdown — 15 binary criteria (pass/fail) */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Criteria Breakdown (
                {
                  Object.values(selectedMatch.scoreBreakdown).filter(
                    (v) => v === 1,
                  ).length
                }
                /15 passed)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(selectedMatch.scoreBreakdown).map(
                  ([key, val]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${val ? "bg-green-900/20" : "bg-red-900/20"}`}
                    >
                      {val ? (
                        <svg
                          className="w-4 h-4 text-green-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-red-400 flex-shrink-0"
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
                      )}
                      <span
                        className={`text-xs ${val ? "text-green-300" : "text-red-300"}`}
                      >
                        {CRITERIA_LABELS[key] || key}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Match Reasons */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Why This Match
              </h4>
              <ul className="space-y-2">
                {selectedMatch.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href={`/deals/${selectedMatch.id}`}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-center"
              >
                View Full Project
              </Link>
              <Link
                href={`/deals/${selectedMatch.id}`}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 font-medium text-center"
              >
                Add to Pipeline
              </Link>
              <button className="px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">
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
          </div>
        </div>
      )}
    </div>
  );
}
