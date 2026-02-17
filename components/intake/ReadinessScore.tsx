"use client";

import { calculateReadiness, getTierDisplay } from "@/lib/intake";
import type { ReadinessResult } from "@/lib/intake";

interface ReadinessScoreProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  showBreakdown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ReadinessScore({
  data,
  showBreakdown = false,
  size = "md",
  className = "",
}: ReadinessScoreProps) {
  const result: ReadinessResult = calculateReadiness(data);
  const tierDisplay = getTierDisplay(result.tier);

  const sizeClasses = {
    sm: { ring: "w-12 h-12", text: "text-sm", label: "text-xs" },
    md: { ring: "w-16 h-16", text: "text-lg", label: "text-sm" },
    lg: { ring: "w-24 h-24", text: "text-2xl", label: "text-base" },
  };

  const { ring, text, label } = sizeClasses[size];

  // Calculate stroke offset for circular progress
  const circumference = 2 * Math.PI * 45; // r=45 for a 100-width SVG
  const strokeOffset =
    circumference - (result.percentage / 100) * circumference;

  const colorMap = {
    green: { stroke: "stroke-green-500", bg: "text-green-500" },
    blue: { stroke: "stroke-blue-500", bg: "text-blue-500" },
    amber: { stroke: "stroke-amber-500", bg: "text-amber-500" },
    gray: { stroke: "stroke-gray-500", bg: "text-gray-500" },
  };

  const colors = colorMap[tierDisplay.color as keyof typeof colorMap];

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-4">
        {/* Circular Progress */}
        <div className={`relative ${ring}`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className={`${colors.stroke} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${text} ${colors.bg}`}>
              {result.totalScore}
            </span>
          </div>
        </div>

        {/* Label */}
        <div>
          <div className={`font-semibold ${label} ${tierDisplay.textColor}`}>
            {tierDisplay.label}
          </div>
          <div className="text-xs text-gray-500">Readiness Score</div>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="mt-4 space-y-2">
          {result.breakdown.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{item.label}</span>
                  <span
                    className={`font-medium ${
                      item.status === "complete"
                        ? "text-green-400"
                        : item.status === "partial"
                          ? "text-amber-400"
                          : "text-gray-500"
                    }`}
                  >
                    {item.score}/{item.maxScore}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === "complete"
                        ? "bg-green-500"
                        : item.status === "partial"
                          ? "bg-amber-500"
                          : "bg-gray-600"
                    }`}
                    style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm">
                {item.status === "complete"
                  ? "✓"
                  : item.status === "partial"
                    ? "◐"
                    : "○"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact badge version for tables/lists
 */
export function ReadinessBadge({
  score,
  className = "",
}: {
  score: number;
  className?: string;
}) {
  const tier =
    score >= 80
      ? "shovel-ready"
      : score >= 60
        ? "advanced"
        : score >= 40
          ? "developing"
          : "early";

  const tierDisplay = getTierDisplay(tier);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${tierDisplay.bgColor} ${tierDisplay.textColor} ${className}`}
    >
      <span className="font-bold">{score}</span>
      <span className="opacity-75">{tierDisplay.label}</span>
    </span>
  );
}
