"use client";

import {
  IntakeData,
  DueDiligenceStatus,
  DesignProgress,
  CostEstimateBasis,
  ShovelReadyStatus,
} from "@/types/intake";

interface ProjectReadinessProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const DD_STATUS_OPTIONS: DueDiligenceStatus[] = [
  "Complete",
  "In Progress",
  "Not Started",
  "Not Needed",
];
const DESIGN_PROGRESS_OPTIONS: DesignProgress[] = [
  "Complete",
  "Underway",
  "Not Started",
];
const COST_BASIS_OPTIONS: CostEstimateBasis[] = [
  "Developer",
  "Architect",
  "Contractor",
  "Third Party",
];
const SHOVEL_READY_OPTIONS: ShovelReadyStatus[] = [
  "Yes",
  "No",
  "Within 6 months",
];

interface DDItem {
  field: keyof IntakeData;
  dateField?: keyof IntakeData;
  label: string;
  description?: string;
  critical?: boolean;
}

const ENVIRONMENTAL_ITEMS: DDItem[] = [
  {
    field: "phaseIEnvironmental",
    dateField: "phaseIEnvironmentalDate",
    label: "Phase I Environmental",
    description: "Recommended for most tax credit projects",
  },
  {
    field: "phaseIIEnvironmental",
    dateField: "phaseIIEnvironmentalDate",
    label: "Phase II Environmental",
    description: "If recommended by Phase I",
  },
  {
    field: "noFurtherActionLetter",
    label: "No Further Action Letter",
    description: "If environmental remediation completed",
  },
  {
    field: "geotechSoilsStudy",
    label: "Geotechnical / Soils Study",
    description: "For new construction",
  },
];

const MARKET_APPRAISAL_ITEMS: DDItem[] = [
  {
    field: "marketStudy",
    label: "Market Study",
    description: "Demand analysis for project type",
  },
  {
    field: "acquisitionAppraisal",
    label: "Acquisition Appraisal",
    description: "Current fair market value",
  },
  {
    field: "asBuiltAppraisal",
    label: "As-Built Appraisal",
    description: "Projected stabilized value",
  },
];

export function ProjectReadiness({ data, onChange }: ProjectReadinessProps) {
  // Calculate readiness score
  const criticalComplete = [
    data.phaseIEnvironmental === "Complete",
    data.marketStudy === "Complete" || data.marketStudy === "Not Needed",
    data.zoningApproval === "Complete",
    data.constructionDrawings === "Complete" ||
      data.constructionDrawingsPercent! >= 90,
  ].filter(Boolean).length;

  const readinessScore = Math.round((criticalComplete / 4) * 100);

  const StatusSelector = ({
    field,
    dateField,
    label,
    description,
    critical,
  }: DDItem) => (
    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            {label}
            {critical && <span className="text-red-400 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {data[field] === "Complete" && (
          <span className="text-green-400 text-lg">✓</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {DD_STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange({ [field]: status })}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              data[field] === status
                ? status === "Complete"
                  ? "bg-green-600 text-white"
                  : status === "In Progress"
                    ? "bg-blue-600 text-white"
                    : status === "Not Needed"
                      ? "bg-gray-600 text-white"
                      : "bg-yellow-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {dateField && data[field] === "In Progress" && (
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">
            Target completion date
          </label>
          <input
            type="date"
            value={(data[dateField] as string) || ""}
            onChange={(e) => onChange({ [dateField]: e.target.value })}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Shovel-Ready Status - Key AutoMatch Factor */}
      <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🏗️</div>
          <div className="flex-1">
            <label className="block text-lg font-semibold text-amber-300 mb-2">
              Is this project shovel-ready?
              <span className="text-indigo-400 text-xs ml-2 font-normal">
                (Key CDE Filter)
              </span>
            </label>
            <p className="text-sm text-gray-400 mb-4">
              Shovel-ready = Site control secured + Permits in hand or imminent
              + Construction can start within 18 months
            </p>

            <div className="flex flex-wrap gap-3">
              {SHOVEL_READY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange({ isShovelReady: option })}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border-2 ${
                    data.isShovelReady === option
                      ? option === "Yes"
                        ? "border-green-500 bg-green-600 text-white"
                        : option === "Within 6 months"
                          ? "border-amber-500 bg-amber-600 text-white"
                          : "border-gray-500 bg-gray-600 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  {option === "Yes" && "✓ "}
                  {option === "Within 6 months" && "⏳ "}
                  {option}
                </button>
              ))}
            </div>

            {data.isShovelReady === "Yes" && (
              <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This will match with CDEs requiring shovel-ready projects
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Readiness Score Header */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-300">
              Due Diligence Readiness
            </h3>
            <p className="text-xs text-gray-500">
              Critical items for CDE/Investor review
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${
                readinessScore >= 75
                  ? "text-green-400"
                  : readinessScore >= 50
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {readinessScore}%
            </div>
            <div className="text-xs text-gray-500">Ready</div>
          </div>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              readinessScore >= 75
                ? "bg-green-500"
                : readinessScore >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
      </div>

      {/* Environmental Due Diligence */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">🌍</span>
          Environmental Due Diligence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENVIRONMENTAL_ITEMS.map((item) => (
            <StatusSelector key={item.field as string} {...item} />
          ))}
        </div>
      </div>

      {/* Market & Appraisal */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Market Study & Appraisals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKET_APPRAISAL_ITEMS.map((item) => (
            <StatusSelector key={item.field as string} {...item} />
          ))}
        </div>
      </div>

      {/* Design Progress */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">📐</span>
          Design Progress
        </h3>

        <div className="space-y-4">
          {/* Schematic Plans */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Schematic Plans
              </label>
              <div className="flex gap-2">
                {DESIGN_PROGRESS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onChange({ schematicPlans: status })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      data.schematicPlans === status
                        ? status === "Complete"
                          ? "bg-green-600 text-white"
                          : status === "Underway"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Architectural Drawings */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Architectural Drawings
              </label>
              <div className="flex gap-2">
                {DESIGN_PROGRESS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      onChange({ fullArchitecturalDrawings: status })
                    }
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      data.fullArchitecturalDrawings === status
                        ? status === "Complete"
                          ? "bg-green-600 text-white"
                          : status === "Underway"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Construction Drawings with Percentage */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Construction Drawings
                </label>
                <p className="text-xs text-gray-500">Required for closing</p>
              </div>
              <div className="flex gap-2">
                {DESIGN_PROGRESS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onChange({ constructionDrawings: status })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      data.constructionDrawings === status
                        ? status === "Complete"
                          ? "bg-green-600 text-white"
                          : status === "Underway"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {data.constructionDrawings === "Underway" && (
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-2">
                  Percent Complete: {data.constructionDrawingsPercent || 0}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={data.constructionDrawingsPercent || 0}
                  onChange={(e) =>
                    onChange({
                      constructionDrawingsPercent: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entitlements */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Entitlements & Permits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusSelector
            field="zoningApproval"
            label="Zoning Approval"
            description="Zoning conformance or variance"
          />
          <StatusSelector
            field="buildingPermits"
            label="Building Permits"
            description="Construction permits"
          />
        </div>
      </div>

      {/* Construction Contracting */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">🔨</span>
          Construction Contracting
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Construction Contract */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Construction Contract in Place?
            </label>
            <div className="flex gap-2">
              {["Yes", "No", "Don't Know"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onChange({
                      constructionContract:
                        option as IntakeData["constructionContract"],
                    })
                  }
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    data.constructionContract === option
                      ? option === "Yes"
                        ? "bg-green-600 text-white"
                        : "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* GMP Contract */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Guaranteed Maximum Price (GMP)?
            </label>
            <div className="flex gap-2">
              {["Yes", "No", "Don't Know"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    onChange({
                      gmpContract: option as IntakeData["gmpContract"],
                    })
                  }
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                    data.gmpContract === option
                      ? option === "Yes"
                        ? "bg-green-600 text-white"
                        : "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data.gmpContract === "No" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              If no GMP, explain cost certainty approach
            </label>
            <textarea
              value={data.nonGmpExplanation || ""}
              onChange={(e) => onChange({ nonGmpExplanation: e.target.value })}
              placeholder="Describe how construction costs will be controlled..."
              rows={2}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Cost Estimate Basis */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Hard Cost Estimate Basis
          </label>
          <div className="flex flex-wrap gap-2">
            {COST_BASIS_OPTIONS.map((basis) => (
              <button
                key={basis}
                type="button"
                onClick={() => onChange({ hardCostEstimateBasis: basis })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  data.hardCostEstimateBasis === basis
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                {basis}
              </button>
            ))}
          </div>
        </div>

        {/* Payment & Performance Bond */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Payment & Performance Bond Required?
          </label>
          <div className="flex gap-2 mb-3">
            {["Yes", "No", "Don't Know"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange({
                    paymentPerformanceBond:
                      option as IntakeData["paymentPerformanceBond"],
                  })
                }
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                  data.paymentPerformanceBond === option
                    ? option === "Yes"
                      ? "bg-green-600 text-white"
                      : "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {data.paymentPerformanceBond === "No" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Explain alternative risk mitigation
              </label>
              <input
                type="text"
                value={data.bondExplanation || ""}
                onChange={(e) => onChange({ bondExplanation: e.target.value })}
                placeholder="How will construction risk be mitigated?"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Not Needed Explanation */}
      {(data.phaseIEnvironmental === "Not Needed" ||
        data.phaseIIEnvironmental === "Not Needed" ||
        data.marketStudy === "Not Needed") && (
        <div className="border-t border-gray-800 pt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Explanation for "Not Needed" Items
          </label>
          <textarea
            value={data.dueDiligenceNotNeededExplanation || ""}
            onChange={(e) =>
              onChange({ dueDiligenceNotNeededExplanation: e.target.value })
            }
            placeholder="Explain why certain due diligence items are not needed for this project..."
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}

export default ProjectReadiness;
