/**
 * tCredex Intake v1.1 — Readiness Score Calculator
 *
 * Call this after intake save.
 * Store readinessScore with the deal.
 *
 * ⚠️ Logic lives HERE, not in UI components
 */

import {
  READINESS_RULES,
  ReadinessResult,
  getReadinessTier,
} from "./readinessRules";

/**
 * Calculate readiness score from intake data
 *
 * @param data - Intake form data or deal record
 * @returns ReadinessResult with score, breakdown, and tier
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intake data is a JSONB bag with heterogeneous value types
export function calculateReadiness(data: Record<string, any>): ReadinessResult {
  const breakdown = READINESS_RULES.map((rule) => {
    const score = rule.evaluate(data);
    const maxScore = rule.weight;

    let status: "complete" | "partial" | "missing";
    if (score >= maxScore) {
      status = "complete";
    } else if (score > 0) {
      status = "partial";
    } else {
      status = "missing";
    }

    return {
      id: rule.id,
      label: rule.label,
      score,
      maxScore,
      status,
    };
  });

  const totalScore = breakdown.reduce((sum, item) => sum + item.score, 0);
  const maxScore = breakdown.reduce((sum, item) => sum + item.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);
  const tier = getReadinessTier(totalScore);

  return {
    totalScore,
    maxScore,
    percentage,
    breakdown,
    tier,
  };
}

/**
 * Quick score calculation (returns just the number)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intake data is a JSONB bag with heterogeneous value types
export function getReadinessScore(data: Record<string, any>): number {
  return READINESS_RULES.reduce((score, rule) => {
    return score + rule.evaluate(data);
  }, 0);
}

/**
 * Check if deal meets minimum readiness threshold
 */
export function meetsReadinessThreshold(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- intake data is a JSONB bag with heterogeneous value types
  data: Record<string, any>,
  threshold: number = 40,
): boolean {
  return getReadinessScore(data) >= threshold;
}

/**
 * Get readiness gaps (what's missing or incomplete)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intake data is a JSONB bag with heterogeneous value types
export function getReadinessGaps(data: Record<string, any>): string[] {
  const result = calculateReadiness(data);
  return result.breakdown
    .filter((item) => item.status !== "complete")
    .map((item) => {
      if (item.status === "missing") {
        return `${item.label}: Not started`;
      }
      return `${item.label}: Incomplete (${item.score}/${item.maxScore})`;
    });
}

/**
 * Format readiness for display
 */
export function formatReadinessDisplay(score: number): {
  score: number;
  tier: string;
  color: string;
  description: string;
} {
  const tier = getReadinessTier(score);

  const tierMap = {
    "shovel-ready": {
      tier: "Shovel Ready",
      color: "green",
      description: "Ready for closing",
    },
    advanced: {
      tier: "Advanced",
      color: "blue",
      description: "Most requirements met",
    },
    developing: {
      tier: "Developing",
      color: "amber",
      description: "In progress",
    },
    early: {
      tier: "Early Stage",
      color: "gray",
      description: "Just getting started",
    },
  };

  return {
    score,
    ...tierMap[tier],
  };
}
