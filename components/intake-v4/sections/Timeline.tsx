"use client";

import { IntakeData } from "../IntakeShell";

interface TimelineProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

export function Timeline({ data, onChange }: TimelineProps) {
  // Calculate months to construction
  const calculateMonthsToConstruction = (dateStr: string): number => {
    if (!dateStr) return 999;
    const startDate = new Date(dateStr);
    const now = new Date();
    const months =
      (startDate.getFullYear() - now.getFullYear()) * 12 +
      (startDate.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  const handleConstructionDateChange = (dateStr: string) => {
    const months = calculateMonthsToConstruction(dateStr);
    onChange({
      constructionStartDate: dateStr,
      constructionStartMonths: months,
    });
  };

  const months =
    data.constructionStartMonths ??
    calculateMonthsToConstruction(data.constructionStartDate || "");
  const timelineScore =
    months <= 6 ? 10 : months <= 12 ? 5 : months <= 18 ? 2 : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Projects with near-term construction starts score higher. This helps
        CDEs and investors assess deployment timing.
      </p>

      {/* Key Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Construction Start Date <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={data.constructionStartDate || ""}
            onChange={(e) => handleConstructionDateChange(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Anticipated construction commencement
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Projected Completion
          </label>
          <input
            type="date"
            value={data.projectedCompletionDate || ""}
            onChange={(e) =>
              onChange({ projectedCompletionDate: e.target.value })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Expected project completion
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Target Closing Date
          </label>
          <input
            type="date"
            value={data.projectedClosingDate || ""}
            onChange={(e) => onChange({ projectedClosingDate: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            When you need to close the tax credit transaction
          </p>
        </div>
      </div>

      {/* Timeline Visualization */}
      {data.constructionStartDate && (
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Timeline Score
          </h3>

          <div className="space-y-4">
            {/* Months indicator */}
            <div
              className={`p-4 rounded-lg ${
                months <= 6
                  ? "bg-green-900/30 border border-green-700"
                  : months <= 12
                    ? "bg-amber-900/30 border border-amber-700"
                    : "bg-gray-800 border border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className={`text-sm font-medium ${
                      months <= 6
                        ? "text-green-400"
                        : months <= 12
                          ? "text-amber-400"
                          : "text-gray-400"
                    }`}
                  >
                    {months <= 6
                      ? "Near-term Start"
                      : months <= 12
                        ? "Mid-term Start"
                        : months <= 18
                          ? "Long-term Start"
                          : "Extended Timeline"}
                  </span>
                  <p
                    className={`text-xs ${
                      months <= 6
                        ? "text-green-500"
                        : months <= 12
                          ? "text-amber-500"
                          : "text-gray-500"
                    }`}
                  >
                    {months} months to construction
                  </p>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    months <= 6
                      ? "text-green-400"
                      : months <= 12
                        ? "text-amber-400"
                        : "text-gray-500"
                  }`}
                >
                  {timelineScore}/10
                </span>
              </div>
            </div>

            {/* Timeline bar */}
            <div className="relative">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    months <= 6
                      ? "bg-green-500"
                      : months <= 12
                        ? "bg-amber-500"
                        : "bg-gray-500"
                  }`}
                  style={{
                    width: `${Math.max(100 - (months / 24) * 100, 10)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Now</span>
                <span>6mo</span>
                <span>12mo</span>
                <span>18mo</span>
                <span>24mo+</span>
              </div>
            </div>

            {/* Scoring hints */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div
                className={`p-2 rounded text-center ${months <= 6 ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}
              >
                ≤6 months = 10 pts
              </div>
              <div
                className={`p-2 rounded text-center ${months > 6 && months <= 12 ? "bg-amber-900/50 text-amber-400" : "bg-gray-800 text-gray-500"}`}
              >
                ≤12 months = 5 pts
              </div>
              <div
                className={`p-2 rounded text-center ${months > 12 && months <= 18 ? "bg-gray-700 text-gray-400" : "bg-gray-800 text-gray-500"}`}
              >
                ≤18 months = 2 pts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Info */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Project Phase
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            "Pre-Development",
            "Design",
            "Permitting",
            "Construction Ready",
          ].map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => onChange({ projectPhase: phase })}
              className={`p-3 rounded-lg border-2 text-sm transition-all ${
                data.projectPhase === phase
                  ? "border-green-500 bg-green-900/20 text-green-400"
                  : "border-gray-700 text-gray-400 hover:border-gray-600 bg-gray-800"
              }`}
            >
              {phase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
