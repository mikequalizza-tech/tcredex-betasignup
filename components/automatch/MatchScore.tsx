"use client";

import { getMatchTier } from "@/lib/cde/matchScore";

interface MatchScoreProps {
  score: number;
  showTier?: boolean;
}

export default function MatchScore({
  score,
  showTier = true,
}: MatchScoreProps) {
  const tier = getMatchTier(score);

  const tierColors = {
    Excellent: "text-green-400 border-green-500 bg-green-900/30",
    Good: "text-blue-400 border-blue-500 bg-blue-900/30",
    Fair: "text-yellow-400 border-yellow-500 bg-yellow-900/30",
    Poor: "text-red-400 border-red-500 bg-red-900/30",
  };

  const scoreColor =
    score >= 80
      ? "text-green-400"
      : score >= 60
        ? "text-blue-400"
        : score >= 40
          ? "text-yellow-400"
          : "text-red-400";

  return (
    <div
      className={`text-center p-6 border-2 rounded-xl shadow-lg ${tierColors[tier]}`}
    >
      <h2 className="text-lg font-semibold text-gray-300 mb-2">Match Score</h2>
      <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
      <p className="text-sm text-gray-500 mt-2">100 = perfect match</p>

      {showTier && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${tierColors[tier]}`}
          >
            {tier} Match
          </span>
        </div>
      )}
    </div>
  );
}
