/**
 * CDE Match Score Calculator
 *
 * SYNCED WITH BACKEND: packages/nest-automatch/src/automatch.engine.ts
 *
 * SIMPLE BINARY SCORING:
 * - 2 eliminators (geographic + financing) - fail = OUT (score 0)
 * - 15 binary criteria total (0 or 1 each, including the 2 eliminators)
 * - Score = points / 15 × 100%
 * - No weighting - all criteria equal
 */

import { CDEDealCard } from "@/lib/types/cde";
import {
  TOTAL_CRITERIA,
  MATCH_THRESHOLDS,
  UNDERSERVED_STATES_BY_YEAR,
  normalizeText,
  getStateInfo,
} from "@/lib/automatch/constants";

// Check if a deal's state is underserved for any of the CDE's allocation years
function isDealInUnderservedState(
  dealState: string,
  allocationYears?: number[],
): boolean {
  const stateUpper = (dealState || "").toUpperCase().trim();
  if (!stateUpper) return false;
  for (const year of allocationYears || []) {
    const underserved = UNDERSERVED_STATES_BY_YEAR[year] || [];
    if (underserved.includes(stateUpper)) return true;
  }
  return false;
}

export interface DealCriteria {
  state: string;
  projectType: string;
  projectName?: string;
  allocationRequest: number;
  severelyDistressed?: boolean;
  isQct?: boolean;
  distressScore?: number;
  isRural?: boolean;
  isNonProfit?: boolean;
  isMinorityOwned?: boolean;
  isOwnerOccupied?: boolean;
  isRealEstate?: boolean;
  isUts?: boolean;
  isTribal?: boolean;
  allocationType?: string;
}

export interface MatchResult {
  score: number;
  reasons: string[];
  breakdown: Record<string, number>; // 15 criteria, each 0 or 1
  matchStrength: "excellent" | "good" | "fair" | "weak";
}

// =============================================================================
// ELIMINATOR 1: GEOGRAPHIC GATE
// CDE must be "national" OR serve the deal's state (via primaryStates or predominantMarket)
// =============================================================================

function passesGeographic(deal: DealCriteria, cde: CDEDealCard): boolean {
  // Check if CDE is national (via serviceAreaType)
  const serviceType = normalizeText(cde.serviceAreaType);
  if (serviceType === "national") return true;

  // CDE is not national — check if they serve the deal's state
  const stateInfo = getStateInfo(deal.state || "");
  if (!stateInfo) return true; // No deal state = don't eliminate

  // Check primaryStates array (already enriched from predominant_market by API)
  for (const s of cde.primaryStates) {
    const cleaned = s.trim();
    if (cleaned.toUpperCase() === stateInfo.abbrev) return true;
    if (cleaned.toLowerCase() === stateInfo.name) return true;
  }

  // Also parse predominantMarket for comma-separated state abbreviations (fallback)
  const rawMarket = cde.predominantMarket || "";
  if (rawMarket) {
    const marketStates = rawMarket
      .split(/[,;]+/)
      .map((s: string) => s.trim().toUpperCase())
      .filter((s: string) => /^[A-Z]{2}$/.test(s));
    if (marketStates.includes(stateInfo.abbrev)) return true;

    // Check for full state names in case market has prose text
    const marketLower = rawMarket.toLowerCase();
    const stateNameRegex = new RegExp(`\\b${stateInfo.name}\\b`);
    if (stateNameRegex.test(marketLower)) return true;
  }

  return false;
}

// =============================================================================
// ELIMINATOR 2: FINANCING GATE
// CDE predominant_financing must match deal type ("real estate" or "business financing")
// Owner-occupied deals pass either type (financing both real estate and business)
// =============================================================================

function passesFinancing(deal: DealCriteria, cde: CDEDealCard): boolean {
  // Owner-occupied matches both RE and Business — default true when not specified
  const isOwnerOccupied = deal.isOwnerOccupied ?? true;
  if (isOwnerOccupied) return true;

  const financing = normalizeText(cde.predominantFinancing);
  if (!financing) return true; // No CDE financing preference = matches anything

  const isRealEstateCde = financing.includes("real estate");
  const isBusinessCde =
    financing.includes("business") || financing.includes("operating");
  if (!isRealEstateCde && !isBusinessCde) return true; // Unknown CDE financing type = matches

  // If we don't know the deal's project type, give benefit of doubt
  if (deal.isRealEstate === undefined || deal.isRealEstate === null)
    return true;

  if (deal.isRealEstate && isRealEstateCde) return true;
  if (!deal.isRealEstate && isBusinessCde) return true;

  return false;
}

// =============================================================================
// MAIN MATCHING FUNCTION - BINARY SCORING
// =============================================================================

export function calculateCDEMatchScore(
  cde: CDEDealCard,
  deal: DealCriteria,
): MatchResult {
  const reasons: string[] = [];

  // ELIMINATOR 1: Geographic — CDE must serve the deal's state
  if (!passesGeographic(deal, cde)) {
    return {
      score: 0,
      reasons: [`Does not serve ${deal.state}`],
      breakdown: { geographic: 0 },
      matchStrength: "weak",
    };
  }

  // ELIMINATOR 2: Financing — CDE financing type must match deal type
  if (!passesFinancing(deal, cde)) {
    return {
      score: 0,
      reasons: ["Financing type mismatch"],
      breakdown: { geographic: 1, financing: 0 },
      matchStrength: "weak",
    };
  }

  const serviceType = normalizeText(cde.serviceAreaType);
  const market = normalizeText(cde.predominantMarket);
  const isNational =
    serviceType === "national" ||
    (market ? /\bnational\b/.test(market) : false);
  reasons.push(isNational ? "National coverage" : `Serves ${deal.state}`);

  // 15 BINARY CRITERIA
  const scores: Record<string, number> = {};

  // 1. Geographic (passed the gate)
  scores.geographic = 1;

  // 2. Financing (passed the gate)
  scores.financing = 1;
  if (cde.predominantFinancing) {
    reasons.push(
      `Financing: ${cde.predominantFinancing.includes("Real Estate") ? "Real Estate" : "Business"}`,
    );
  }

  // 3. Urban/Rural (matches NestJS reference engine)
  if (deal.isRural && cde.ruralFocus) scores.urbanRural = 1;
  else if (!deal.isRural && cde.urbanFocus) scores.urbanRural = 1;
  else if (!cde.ruralFocus && !cde.urbanFocus) scores.urbanRural = 1;
  else scores.urbanRural = 0;

  // 4. Sector
  const dealType = normalizeText(deal.projectType);
  const sectors = cde.targetSectors.map(normalizeText);
  let sectorMatch = sectors.length === 0;
  if (!sectorMatch) {
    for (const sector of sectors) {
      if (sector && (dealType.includes(sector) || sector.includes(dealType))) {
        sectorMatch = true;
        break;
      }
    }
  }
  scores.sector = sectorMatch ? 1 : 0;
  if (sectorMatch) reasons.push("Sector match");

  // 5. Deal Size
  const amount = deal.allocationRequest || 0;
  const min = cde.dealSizeRange?.min || 0;
  const max = cde.dealSizeRange?.max || Number.MAX_SAFE_INTEGER;
  scores.dealSize = amount >= min && amount <= max ? 1 : 0;
  if (scores.dealSize) reasons.push("Deal size fits");

  // 6. Small Deal Fund
  const isSmallDeal = amount > 0 && amount <= 5000000;
  scores.smallDealFund = !isSmallDeal || cde.smallDealFund ? 1 : 0;

  // 7. Severely Distressed
  scores.severelyDistressed =
    !cde.requireSeverelyDistressed || deal.severelyDistressed ? 1 : 0;
  if (deal.severelyDistressed) reasons.push("Distressed tract");

  // 8. Distress Percentile (matches NestJS reference engine)
  const minDistress = cde.minDistressPercentile || 0;
  if (minDistress === 0) {
    scores.distressPercentile = 1; // CDE doesn't require a minimum
  } else {
    const dealDistress = deal.distressScore || 0;
    scores.distressPercentile = dealDistress >= minDistress ? 1 : 0;
  }

  // 9. Minority Focus
  scores.minorityFocus = !cde.minorityFocus || deal.isMinorityOwned ? 1 : 0;

  // 10. UTS Focus (Underserved Target States)
  // Check if deal's state is in CDFI Fund's underserved states for the CDE's allocation years
  const isUts =
    deal.isUts || isDealInUnderservedState(deal.state, cde.allocationYears);
  scores.utsFocus = !cde.utsFocus || isUts ? 1 : 0;
  if (isUts && cde.utsFocus) reasons.push("Underserved target state");

  // 11. Entity Type
  if (!cde.forprofitAccepted && !deal.isNonProfit) scores.entityType = 0;
  else scores.entityType = 1;
  if (cde.nonprofitPreferred && deal.isNonProfit)
    reasons.push("Nonprofit preferred match");

  // 12. Owner Occupied
  const dealOwnerOccupied = deal.isOwnerOccupied ?? true; // default true when not specified
  scores.ownerOccupied =
    !cde.ownerOccupiedPreferred || dealOwnerOccupied ? 1 : 0;
  if (deal.isOwnerOccupied) reasons.push("Owner-occupied");

  // 13. Tribal
  scores.tribal = !cde.nativeAmericanFocus || deal.isTribal ? 1 : 0;

  // 14. Allocation Type
  const dealAllocType = normalizeText(deal.allocationType || "federal");
  const cdeAllocType = normalizeText(cde.allocationType || "federal");
  scores.allocationType =
    !dealAllocType || !cdeAllocType || dealAllocType === cdeAllocType ? 1 : 0;

  // 15. Has Allocation
  scores.hasAllocation = (cde.remainingAllocation || 0) > 0 ? 1 : 0;

  // Calculate total: points / 15 × 100
  const totalPoints = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const totalScore = Math.round((totalPoints / TOTAL_CRITERIA) * 100);

  // Match strength
  let matchStrength: MatchResult["matchStrength"] = "weak";
  if (totalScore >= MATCH_THRESHOLDS.excellent) matchStrength = "excellent";
  else if (totalScore >= MATCH_THRESHOLDS.good) matchStrength = "good";
  else if (totalScore >= MATCH_THRESHOLDS.fair) matchStrength = "fair";

  // Raw binary breakdown — each criterion is 0 or 1
  return {
    score: totalScore,
    reasons,
    breakdown: scores,
    matchStrength,
  };
}

// =============================================================================
// MATCH TIER HELPERS (UI display)
// =============================================================================

export type MatchTier = "Excellent" | "Good" | "Fair" | "Poor";

/**
 * Get tier label from match score
 */
export function getMatchTier(score: number): MatchTier {
  if (score >= MATCH_THRESHOLDS.excellent) return "Excellent";
  if (score >= MATCH_THRESHOLDS.good) return "Good";
  if (score >= MATCH_THRESHOLDS.fair) return "Fair";
  return "Poor";
}

// Re-export from shared constants for consumers that import from this file
export { UNDERSERVED_STATES_BY_YEAR };

/**
 * Calculate deal score for ranking in marketplace
 */
export function calculateDealScore(deal: DealCriteria): number {
  let score = 50;
  if (deal.severelyDistressed) score += 20;
  if (deal.isQct) score += 10;
  if (deal.isNonProfit) score += 10;
  if (deal.allocationRequest >= 5000000) score += 10;
  return Math.min(score, 100);
}
