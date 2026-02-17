"use client";

import { ProgramType, IntakeData } from "./IntakeShell";

interface Section {
  id: string;
  label: string;
  required: boolean;
  tier: 1 | 2 | 3;
  program?: ProgramType;
  isComplete: (data: IntakeData) => boolean;
}

// =============================================================================
// SECTION DEFINITIONS WITH TIERS - Now consistent with ReadinessMeter
// =============================================================================

// =============================================================================
// TIER CONFIGURATION
// =============================================================================

const TIERS = [
  {
    tier: 1,
    name: "DealCard Ready",
    minScore: 25,
    color: "indigo",
    icon: "📋",
  },
  {
    tier: 2,
    name: "Project Profile",
    minScore: 55,
    color: "emerald",
    icon: "📊",
  },
  {
    tier: 3,
    name: "Due Diligence Ready",
    minScore: 80,
    color: "amber",
    icon: "✅",
  },
];

interface ProgressRailProps {
  data: IntakeData;
  programs: ProgramType[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export function ProgressRail({
  data,
  programs,
  activeSection,
  onSectionClick,
}: ProgressRailProps) {
  // Use the same section definitions as ReadinessMeter for consistency
  const BASE_SECTIONS: Section[] = [
    // TIER 1 - DealCard Ready
    {
      id: "basics",
      label: "Project Basics",
      required: true,
      tier: 1,
      isComplete: (data) =>
        !!(data.projectName && data.sponsorName && data.projectType),
    },
    {
      id: "location",
      label: "Location & Census Tract",
      required: true,
      tier: 1,
      isComplete: (data) => !!data.address,
    },
    {
      id: "programs",
      label: "Programs Selected",
      required: true,
      tier: 1,
      isComplete: (data) => !!(data.programs && data.programs.length > 0),
    },
    {
      id: "costs",
      label: "Project Costs & Gap",
      required: true,
      tier: 1,
      isComplete: (data) => !!data.totalProjectCost,
    },

    // TIER 2 - Project Profile Ready
    {
      id: "sponsor",
      label: "Sponsor Details",
      required: false,
      tier: 2,
      isComplete: (data) => !!data.organizationType,
    },
    {
      id: "impact",
      label: "Social Investment Criteria",
      required: false,
      tier: 2,
      isComplete: (data) => !!(data.communitySupport || data.communityImpact),
    },
    {
      id: "benefits",
      label: "Economic & Social Benefits",
      required: false,
      tier: 2,
      isComplete: (data) =>
        data.permanentJobsFTE !== undefined ||
        data.constructionJobsFTE !== undefined,
    },
    {
      id: "team",
      label: "Project Team",
      required: false,
      tier: 2,
      isComplete: (data) => !!data.ownersRepresentative,
    },
    {
      id: "capital",
      label: "Capital Stack",
      required: false,
      tier: 2,
      isComplete: (data) => (data.financingSources?.length || 0) > 0,
    },
    {
      id: "site",
      label: "Site Control",
      required: false,
      tier: 2,
      isComplete: (data) => !!data.siteControl,
    },
    {
      id: "timeline",
      label: "Timeline",
      required: false,
      tier: 2,
      isComplete: (data) =>
        !!data.constructionStartDate || !!data.targetClosingDate,
    },

    // TIER 3 - Due Diligence Ready
    {
      id: "readiness",
      label: "Due Diligence Status",
      required: false,
      tier: 3,
      isComplete: (data) =>
        data.phaseIEnvironmental === "Complete" ||
        data.zoningApproval === "Complete",
    },
    {
      id: "documents",
      label: "Due Diligence Documents",
      required: false,
      tier: 3,
      isComplete: (data) => (data.documents?.length || 0) >= 1,
    },
  ];

  const PROGRAM_SECTIONS: Section[] = [
    // NMTC
    {
      id: "nmtc_qalicb",
      label: "QALICB Tests",
      required: true,
      tier: 2,
      program: "NMTC",
      isComplete: (data) =>
        (data.qalicbGrossIncome ?? 0) >= 50 &&
        (data.qalicbTangibleProperty ?? 0) >= 40 &&
        (data.qalicbEmployeeServices ?? 0) >= 40 &&
        data.isProhibitedBusiness === false,
    },

    // HTC
    {
      id: "htc_status",
      label: "Historic Status",
      required: true,
      tier: 2,
      program: "HTC",
      isComplete: (data) =>
        !!data.historicStatus && data.historicStatus !== "none",
    },

    // LIHTC
    {
      id: "lihtc_housing",
      label: "Housing Metrics",
      required: true,
      tier: 2,
      program: "LIHTC",
      isComplete: (data) =>
        data.totalUnits !== undefined && data.affordableUnits !== undefined,
    },

    // OZ
    {
      id: "oz_eligibility",
      label: "OZ Eligibility",
      required: true,
      tier: 2,
      program: "OZ",
      isComplete: (data) => !!data.ozInvestmentDate,
    },
  ];

  // Get applicable sections based on selected programs (same as ReadinessMeter)
  const applicableSections = [
    ...BASE_SECTIONS,
    ...PROGRAM_SECTIONS.filter(
      (s) => s.program && programs.includes(s.program),
    ),
  ];

  // Calculate completion by tier (same logic as ReadinessMeter)
  const tier1Sections = applicableSections.filter((s) => s.tier === 1);
  const tier2Sections = applicableSections.filter((s) => s.tier <= 2);
  const tier3Sections = applicableSections;

  const tier1Complete = tier1Sections.filter((s) => s.isComplete(data)).length;
  const tier2Complete = tier2Sections.filter((s) => s.isComplete(data)).length;
  const tier3Complete = tier3Sections.filter((s) => s.isComplete(data)).length;

  const tier1Pct =
    tier1Sections.length > 0
      ? Math.round((tier1Complete / tier1Sections.length) * 100)
      : 0;
  const tier2Pct =
    tier2Sections.length > 0
      ? Math.round((tier2Complete / tier2Sections.length) * 100)
      : 0;
  const tier3Pct =
    tier3Sections.length > 0
      ? Math.round((tier3Complete / tier3Sections.length) * 100)
      : 0;

  // Determine current tier based on correct thresholds
  // Tier 1 (DealCard Ready): 100% of Tier 1 fields complete
  // Tier 2 (Project Profile Ready): 70% of Tier 2 fields complete
  // Tier 3 (Due Diligence Ready): 85% of Tier 3 fields complete
  const currentTier =
    tier3Pct >= 85 ? 3 : tier2Pct >= 70 ? 2 : tier1Pct >= 100 ? 1 : 0;

  // Overall progress (weighted)
  const progressPct = Math.min(
    100,
    Math.round(tier1Pct * 0.4 + tier2Pct * 0.3 + tier3Pct * 0.3),
  );

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sticky top-24 h-fit">
      {/* Tier Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">
            Form Progress
          </span>
          <span className="text-sm font-bold text-indigo-400">
            {progressPct}%
          </span>
        </div>

        {/* Main Progress Bar */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${
              currentTier >= 3
                ? "bg-amber-500"
                : currentTier >= 2
                  ? "bg-emerald-500"
                  : currentTier >= 1
                    ? "bg-indigo-500"
                    : "bg-gray-600"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Tier Badges */}
        <div className="flex gap-2">
          {TIERS.map((t) => {
            const isUnlocked = currentTier >= t.tier;
            const tierPct =
              t.tier === 1 ? tier1Pct : t.tier === 2 ? tier2Pct : tier3Pct;

            return (
              <div
                key={t.tier}
                className={`flex-1 p-2 rounded-lg text-center border transition-all ${
                  isUnlocked
                    ? `bg-${t.color}-900/30 border-${t.color}-500/50`
                    : "bg-gray-800/50 border-gray-700"
                }`}
              >
                <div className="text-lg mb-1">{isUnlocked ? t.icon : "🔒"}</div>
                <div
                  className={`text-xs font-medium ${isUnlocked ? `text-${t.color}-300` : "text-gray-500"}`}
                >
                  Tier {t.tier}
                </div>
                <div
                  className={`text-[10px] ${isUnlocked ? "text-gray-400" : "text-gray-600"}`}
                >
                  {tierPct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Tier Label */}
        {currentTier > 0 && (
          <div
            className={`mt-3 px-3 py-2 rounded-lg text-center ${
              currentTier >= 3
                ? "bg-amber-900/30 border border-amber-500/30"
                : currentTier >= 2
                  ? "bg-emerald-900/30 border border-emerald-500/30"
                  : "bg-indigo-900/30 border border-indigo-500/30"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                currentTier >= 3
                  ? "text-amber-300"
                  : currentTier >= 2
                    ? "text-emerald-300"
                    : "text-indigo-300"
              }`}
            >
              {currentTier >= 3
                ? "✅ Due Diligence Ready"
                : currentTier >= 2
                  ? "📊 Project Profile Ready"
                  : "📋 DealCard Ready"}
            </span>
          </div>
        )}
      </div>

      {/* Section Navigation */}
      <div className="space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        {/* Tier 1 Sections */}
        <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>📋</span> Tier 1 • DealCard
        </div>
        {BASE_SECTIONS.filter((s) => s.tier === 1).map((section) => (
          <SectionButton
            key={section.id}
            section={section}
            data={data}
            activeSection={activeSection}
            onSectionClick={onSectionClick}
          />
        ))}

        {/* Tier 2 Sections */}
        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-4 mb-2 flex items-center gap-2">
          <span>📊</span> Tier 2 • Profile
        </div>
        {BASE_SECTIONS.filter((s) => s.tier === 2).map((section) => (
          <SectionButton
            key={section.id}
            section={section}
            data={data}
            activeSection={activeSection}
            onSectionClick={onSectionClick}
          />
        ))}

        {/* Program-Specific Sections */}
        {programs.length > 0 && (
          <>
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mt-4 mb-2 flex items-center gap-2">
              <span>🎯</span> Program Requirements
            </div>
            {PROGRAM_SECTIONS.filter(
              (s) => s.program && programs.includes(s.program),
            ).map((section) => (
              <SectionButton
                key={section.id}
                section={section}
                data={data}
                activeSection={activeSection}
                onSectionClick={onSectionClick}
                showProgram
              />
            ))}
          </>
        )}

        {/* Tier 3 Sections */}
        <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mt-4 mb-2 flex items-center gap-2">
          <span>✅</span> Tier 3 • Due Diligence
        </div>
        {BASE_SECTIONS.filter((s) => s.tier === 3).map((section) => (
          <SectionButton
            key={section.id}
            section={section}
            data={data}
            activeSection={activeSection}
            onSectionClick={onSectionClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]">
              *
            </span>
            <span>Required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]">
              ○
            </span>
            <span>Optional</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section button component
function SectionButton({
  section,
  data,
  activeSection,
  onSectionClick,
  showProgram = false,
}: {
  section: Section;
  data: IntakeData;
  activeSection: string;
  onSectionClick: (id: string) => void;
  showProgram?: boolean;
}) {
  const isComplete = section.isComplete(data);
  const isActive = activeSection === section.id;

  return (
    <button
      onClick={() => onSectionClick(section.id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-indigo-900/50 text-indigo-300 font-medium"
          : "text-gray-400 hover:bg-gray-800"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
          isComplete ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"
        }`}
      >
        {isComplete ? "✓" : section.required ? "*" : "○"}
      </span>
      <span className="flex-1 text-left truncate">{section.label}</span>
      {showProgram && section.program && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            section.program === "NMTC"
              ? "bg-emerald-900/50 text-emerald-400"
              : section.program === "HTC"
                ? "bg-blue-900/50 text-blue-400"
                : section.program === "LIHTC"
                  ? "bg-purple-900/50 text-purple-400"
                  : "bg-amber-900/50 text-amber-400"
          }`}
        >
          {section.program}
        </span>
      )}
    </button>
  );
}

export default ProgressRail;
