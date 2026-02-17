/**
 * tCredex Readiness Score Calculator
 *
 * Calculates deal readiness based on completed intake fields.
 *
 * IMPORTANT: This file uses the UNIFIED scoring algorithm that matches
 * the ReadinessMeter component in the intake form. This ensures
 * consistent C-Scores across Deal Page, Intake Form, and everywhere else.
 */

import { ProgramType } from "@/types/intake";

// =============================================================================
// TYPES
// =============================================================================

export interface ReadinessBreakdownItem {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  status: "complete" | "partial" | "incomplete";
}

export interface ReadinessResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  tier: "early" | "developing" | "advanced" | "shovel-ready";
  breakdown: ReadinessBreakdownItem[];
  missingRequired: string[];
  completedFields: number;
  totalFields: number;
  // New unified tier fields
  currentTier: number; // 0, 1, 2, or 3
  tier1Pct: number;
  tier2Pct: number;
  tier3Pct: number;
}

export interface TierDisplay {
  label: string;
  color: "green" | "blue" | "amber" | "gray";
  textColor: string;
  bgColor: string;
  description: string;
}

// =============================================================================
// UNIFIED SECTION-BASED SCORING (matches ReadinessMeter component)
// =============================================================================

interface SectionDef {
  id: string;
  tier: number;
  program?: string;
  isComplete: (data: Record<string, unknown>) => boolean;
}

const BASE_SECTIONS: SectionDef[] = [
  // TIER 1 - DealCard Ready
  {
    id: "basics",
    tier: 1,
    isComplete: (data) =>
      !!(data.projectName && data.sponsorName && data.projectType),
  },
  { id: "location", tier: 1, isComplete: (data) => !!data.address },
  {
    id: "programs",
    tier: 1,
    isComplete: (data) =>
      !!(
        data.programs &&
        Array.isArray(data.programs) &&
        (data.programs as unknown[]).length > 0
      ),
  },
  { id: "costs", tier: 1, isComplete: (data) => !!data.totalProjectCost },

  // TIER 2 - Project Profile Ready
  {
    id: "impact",
    tier: 2,
    isComplete: (data) => !!(data.communitySupport || data.communityImpact),
  },
  {
    id: "benefits",
    tier: 2,
    isComplete: (data) =>
      data.permanentJobsFTE !== undefined ||
      data.constructionJobsFTE !== undefined,
  },
  { id: "team", tier: 2, isComplete: (data) => !!data.ownersRepresentative },
  {
    id: "capital",
    tier: 2,
    isComplete: (data) => {
      const sources = data.financingSources;
      return Array.isArray(sources) && sources.length > 0;
    },
  },
  { id: "site", tier: 2, isComplete: (data) => !!data.siteControl },
  {
    id: "timeline",
    tier: 2,
    isComplete: (data) =>
      !!data.constructionStartDate || !!data.targetClosingDate,
  },

  // TIER 3 - Due Diligence Ready
  {
    id: "readiness",
    tier: 3,
    isComplete: (data) =>
      data.phaseIEnvironmental === "Complete" ||
      data.zoningApproval === "Complete",
  },
  {
    id: "documents",
    tier: 3,
    isComplete: (data) => {
      const docs = data.documents;
      return Array.isArray(docs) && docs.length >= 1;
    },
  },
];

const PROGRAM_SECTIONS: SectionDef[] = [
  // NMTC
  {
    id: "nmtc_qalicb",
    tier: 2,
    program: "NMTC",
    isComplete: (data) => {
      const grossIncome = (data.qalicbGrossIncome as number) ?? 0;
      const tangibleProperty = (data.qalicbTangibleProperty as number) ?? 0;
      const employeeServices = (data.qalicbEmployeeServices as number) ?? 0;
      return (
        grossIncome >= 50 &&
        tangibleProperty >= 40 &&
        employeeServices >= 40 &&
        data.isProhibitedBusiness === false
      );
    },
  },
  // HTC
  {
    id: "htc_status",
    tier: 2,
    program: "HTC",
    isComplete: (data) =>
      !!data.historicStatus && data.historicStatus !== "none",
  },
  // LIHTC
  {
    id: "lihtc_housing",
    tier: 2,
    program: "LIHTC",
    isComplete: (data) =>
      data.totalUnits !== undefined && data.affordableUnits !== undefined,
  },
  // OZ
  {
    id: "oz_eligibility",
    tier: 2,
    program: "OZ",
    isComplete: (data) => !!data.ozInvestmentDate,
  },
];

/**
 * Calculate readiness using unified section-based scoring.
 * This matches the ReadinessMeter component exactly.
 */
export function calculateUnifiedReadiness(
  data: Record<string, unknown>,
  programs?: ProgramType[],
): ReadinessResult {
  // Get programs from data if not provided
  const selectedPrograms: ProgramType[] =
    programs ||
    (Array.isArray(data.programs) ? (data.programs as ProgramType[]) : []);

  // Get applicable sections based on selected programs
  const applicableSections = [
    ...BASE_SECTIONS,
    ...PROGRAM_SECTIONS.filter(
      (s) => s.program && selectedPrograms.includes(s.program as ProgramType),
    ),
  ];

  // Calculate completion by tier
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

  // Determine current tier based on completion thresholds
  // Tier 1 (DealCard Ready): 100% of Tier 1 fields complete
  // Tier 2 (Project Profile Ready): 70% of cumulative Tier 1+2 fields complete
  // Tier 3 (Due Diligence Ready): 85% of all fields complete
  const currentTier =
    tier3Pct >= 85 ? 3 : tier2Pct >= 70 ? 2 : tier1Pct >= 100 ? 1 : 0;

  // Calculate overall readiness score (matches ReadinessMeter formula)
  const readinessScore = Math.round(
    tier1Pct * 0.4 + tier2Pct * 0.35 + tier3Pct * 0.25,
  );

  // Map to legacy tier names for compatibility
  const tier: ReadinessResult["tier"] =
    readinessScore >= 80
      ? "shovel-ready"
      : readinessScore >= 60
        ? "advanced"
        : readinessScore >= 40
          ? "developing"
          : "early";

  // Build breakdown from sections for detailed display
  const breakdown: ReadinessBreakdownItem[] = [];
  const sectionLabels: Record<string, string> = {
    basics: "Project Basics",
    location: "Location",
    programs: "Programs",
    costs: "Costs",
    impact: "Social Impact",
    benefits: "Economic Benefits",
    team: "Project Team",
    capital: "Capital Stack",
    site: "Site Control",
    timeline: "Timeline",
    readiness: "Due Diligence",
    documents: "Documents",
    nmtc_qalicb: "QALICB Tests",
    htc_status: "HTC Details",
    lihtc_housing: "LIHTC Housing",
    oz_eligibility: "OZ Details",
  };

  for (const section of applicableSections) {
    const isComplete = section.isComplete(data);
    breakdown.push({
      id: section.id,
      label: sectionLabels[section.id] || section.id,
      score: isComplete ? 1 : 0,
      maxScore: 1,
      status: isComplete ? "complete" : "incomplete",
    });
  }

  // Calculate missing required fields
  const missingRequired: string[] = [];
  for (const section of tier1Sections) {
    if (!section.isComplete(data)) {
      missingRequired.push(sectionLabels[section.id] || section.id);
    }
  }

  return {
    totalScore: readinessScore,
    maxScore: 100,
    percentage: readinessScore,
    tier,
    breakdown,
    missingRequired,
    completedFields: tier3Complete,
    totalFields: tier3Sections.length,
    currentTier,
    tier1Pct,
    tier2Pct,
    tier3Pct,
  };
}

// =============================================================================
// CALCULATE READINESS (Legacy - now uses unified algorithm)
// =============================================================================

export function calculateReadiness(
  data: Record<string, unknown>,
): ReadinessResult {
  // Use the unified algorithm that matches ReadinessMeter
  return calculateUnifiedReadiness(data);
}

// =============================================================================
// TIER DISPLAY
// =============================================================================

const TIER_DISPLAYS: Record<string, TierDisplay> = {
  "shovel-ready": {
    label: "Shovel Ready",
    color: "green",
    textColor: "text-green-400",
    bgColor: "bg-green-500/20",
    description: "Ready for closing",
  },
  advanced: {
    label: "Advanced",
    color: "blue",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/20",
    description: "Due diligence stage",
  },
  developing: {
    label: "Developing",
    color: "amber",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/20",
    description: "Building momentum",
  },
  early: {
    label: "Early Stage",
    color: "gray",
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/20",
    description: "Initial submission",
  },
};

export function getTierDisplay(tier: string): TierDisplay {
  return TIER_DISPLAYS[tier] || TIER_DISPLAYS["early"];
}

// =============================================================================
// QUICK SCORE (for lists/tables)
// =============================================================================

export function getQuickReadinessScore(data: Record<string, unknown>): number {
  const result = calculateReadiness(data);
  return result.totalScore;
}

export function getReadinessTier(data: Record<string, unknown>): string {
  const result = calculateReadiness(data);
  return result.tier;
}
