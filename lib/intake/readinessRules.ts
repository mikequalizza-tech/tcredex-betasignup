/**
 * tCredex Intake v1.1 — Readiness Scoring Rules
 *
 * Philosophy:
 * - Readiness is program-aware but normalized (0-100)
 * - NOT eligibility, NOT approval
 * - Used for: Marketplace sorting, CDE triage, Closing Room gating, "shovel-ready" signals
 *
 * ⚠️ LOCKED: Do NOT change scoring weights without explicit approval
 */

export interface ReadinessRule {
  id: string;
  label: string;
  weight: number;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intake data is a JSONB bag with heterogeneous value types
  evaluate: (data: Record<string, any>) => number;
}

export interface ReadinessResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    id: string;
    label: string;
    score: number;
    maxScore: number;
    status: "complete" | "partial" | "missing";
  }[];
  tier: "shovel-ready" | "advanced" | "developing" | "early";
}

/**
 * Readiness Dimensions (v2 – Updated for Intake v4 form alignment)
 *
 * | Dimension              | Max  |
 * |------------------------|------|
 * | Project Basics         | 20   |
 * | Location & Tract       | 20   |
 * | Site Control           | 20   |
 * | Capital Stack          | 20   |
 * | Timeline               | 10   |
 * | Approvals              | 10   |
 * | Total                  | 100  |
 *
 * NOTE: Aligned with actual form sections to prevent progress/readiness mismatch
 */
export const READINESS_RULES: ReadinessRule[] = [
  {
    id: "project_basics",
    label: "Project Basics",
    weight: 20,
    description: "Core project identity: name, type, sponsor",
    evaluate: (data) => {
      let score = 0;
      if (data.projectName) score += 8;
      if (data.projectType) score += 4;
      if (data.sponsorName) score += 8;
      return score;
    },
  },
  {
    id: "location_tract",
    label: "Location & Census Tract",
    weight: 20,
    description: "Project address and eligibility verification",
    evaluate: (data) => {
      let score = 0;
      if (data.address) score += 5;
      if (data.city && data.state && data.zipCode) score += 5;
      if (data.censusTract) score += 5;
      if (data.tractEligible) score += 5;
      return score;
    },
  },
  {
    id: "site_control",
    label: "Site Control",
    weight: 20,
    description: "Ownership or contractual control of the project site",
    evaluate: (data) => {
      if (data.siteControl === "Owned" || data.siteControl === "owned")
        return 20;
      if (
        data.siteControl === "Under Contract" ||
        data.siteControl === "under_contract"
      )
        return 10;
      if (data.siteControl === "LOI" || data.siteControl === "loi") return 5;
      return 0;
    },
  },
  {
    id: "capital_stack",
    label: "Capital Stack",
    weight: 20,
    description: "Capital sources identified and project financials",
    evaluate: (data) => {
      let score = 0;
      // Total project cost filled = 5 pts
      if (data.totalProjectCost && data.totalProjectCost > 0) score += 5;
      // Financing gap calculated = 5 pts
      if (data.financingGap !== undefined) score += 5;
      // Capital committed >= 60% = 10 pts
      const pct = data.committedCapitalPct ?? 0;
      if (pct >= 60) score += 10;
      else if (pct >= 40) score += 7;
      else if (pct >= 20) score += 4;
      else if (pct > 0) score += 2;
      return score;
    },
  },
  {
    id: "timeline",
    label: "Construction Timeline",
    weight: 10,
    description: "Months until construction start",
    evaluate: (data) => {
      // Has construction date = baseline
      if (!data.constructionStartDate) return 0;
      const months = data.constructionStartMonths ?? 999;
      if (months <= 6) return 10;
      if (months <= 12) return 7;
      if (months <= 18) return 4;
      return 2; // Date provided but >18 months out
    },
  },
  {
    id: "approvals",
    label: "Approvals / Entitlements",
    weight: 10,
    description: "Zoning, permits, and regulatory approvals status",
    evaluate: (data) => {
      if (data.entitlementsApproved || data.approvalsComplete) return 10;
      if (data.entitlementsSubmitted || data.approvalsSubmitted) return 6;
      if (
        data.entitlementsStarted ||
        data.approvalsStarted ||
        data.zoningApproved
      )
        return 3;
      return 0;
    },
  },
];

/**
 * Get readiness tier based on score
 */
export function getReadinessTier(score: number): ReadinessResult["tier"] {
  if (score >= 80) return "shovel-ready";
  if (score >= 60) return "advanced";
  if (score >= 40) return "developing";
  return "early";
}

/**
 * Get tier display properties
 */
export function getTierDisplay(tier: ReadinessResult["tier"]) {
  switch (tier) {
    case "shovel-ready":
      return {
        label: "Shovel Ready",
        color: "green",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
      };
    case "advanced":
      return {
        label: "Advanced",
        color: "blue",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      };
    case "developing":
      return {
        label: "Developing",
        color: "amber",
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
      };
    case "early":
      return {
        label: "Early Stage",
        color: "gray",
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
      };
  }
}
