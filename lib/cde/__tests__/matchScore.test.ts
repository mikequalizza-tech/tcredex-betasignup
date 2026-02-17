import { describe, it, expect } from "vitest";
import {
  calculateCDEMatchScore,
  getMatchTier,
  calculateDealScore,
  DealCriteria,
  MatchResult,
} from "../matchScore";
import { CDEDealCard } from "@/lib/types/cde";
import { TOTAL_CRITERIA, MATCH_THRESHOLDS } from "@/lib/automatch/constants";

// =============================================================================
// HELPERS
// =============================================================================

function baseDeal(overrides?: Partial<DealCriteria>): DealCriteria {
  return {
    state: "CA",
    projectType: "Healthcare",
    allocationRequest: 5_000_000,
    isOwnerOccupied: true,
    isRealEstate: true,
    isRural: false,
    isNonProfit: true,
    isMinorityOwned: false,
    severelyDistressed: false,
    distressScore: 50,
    isUts: false,
    isTribal: false,
    allocationType: "federal",
    ...overrides,
  };
}

function baseCDE(overrides?: Partial<CDEDealCard>): CDEDealCard {
  return {
    id: "cde-1",
    organizationName: "Test CDE",
    primaryStates: [],
    serviceAreaType: "national",
    predominantFinancing: "Real Estate",
    predominantMarket: "",
    dealSizeRange: { min: 1_000_000, max: 20_000_000 },
    smallDealFund: true,
    ruralFocus: false,
    urbanFocus: false,
    targetSectors: [],
    requireSeverelyDistressed: false,
    remainingAllocation: 10_000_000,
    status: "active",
    allocationYears: [2024],
    // No special requirements
    minorityFocus: false,
    utsFocus: false,
    forprofitAccepted: true,
    nonprofitPreferred: false,
    ownerOccupiedPreferred: false,
    nativeAmericanFocus: false,
    minDistressPercentile: 0,
    allocationType: "federal",
    ...overrides,
  } as CDEDealCard;
}

// =============================================================================
// ELIMINATOR 1: GEOGRAPHIC GATE
// =============================================================================

describe("Geographic Eliminator", () => {
  it("passes when CDE is national", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "national" }),
      baseDeal({ state: "NY" }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("passes when CDE primaryStates includes deal state abbreviation", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "regional", primaryStates: ["CA", "NY"] }),
      baseDeal({ state: "CA" }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("passes when CDE primaryStates includes full state name", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "regional", primaryStates: ["california"] }),
      baseDeal({ state: "CA" }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("passes when CDE predominantMarket includes deal state abbreviation", () => {
    const result = calculateCDEMatchScore(
      baseCDE({
        serviceAreaType: "regional",
        primaryStates: [],
        predominantMarket: "CA, NY, TX",
      }),
      baseDeal({ state: "CA" }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("eliminates when CDE does not serve deal state", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "regional", primaryStates: ["NY", "NJ"] }),
      baseDeal({ state: "CA" }),
    );
    expect(result.score).toBe(0);
    expect(result.matchStrength).toBe("weak");
    expect(result.reasons).toContainEqual(
      expect.stringContaining("Does not serve"),
    );
  });

  it("passes when deal has no state (benefit of doubt)", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "regional", primaryStates: ["NY"] }),
      baseDeal({ state: "" }),
    );
    expect(result.score).toBeGreaterThan(0);
  });
});

// =============================================================================
// ELIMINATOR 2: FINANCING GATE
// =============================================================================

describe("Financing Eliminator", () => {
  it("passes when deal is owner-occupied (matches everything)", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ predominantFinancing: "Business Financing" }),
      baseDeal({ isOwnerOccupied: true, isRealEstate: true }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("passes when CDE financing matches deal type (real estate)", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ predominantFinancing: "Real Estate" }),
      baseDeal({ isOwnerOccupied: false, isRealEstate: true }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("passes when CDE financing matches deal type (business)", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ predominantFinancing: "Business Financing" }),
      baseDeal({ isOwnerOccupied: false, isRealEstate: false }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("eliminates when financing type mismatches", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ predominantFinancing: "Real Estate" }),
      baseDeal({ isOwnerOccupied: false, isRealEstate: false }),
    );
    expect(result.score).toBe(0);
    expect(result.reasons).toContain("Financing type mismatch");
  });

  it("passes when CDE has no financing preference", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ predominantFinancing: "" }),
      baseDeal({ isOwnerOccupied: false, isRealEstate: true }),
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it("defaults to owner-occupied when not specified", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ predominantFinancing: "Business Financing" }),
      baseDeal({ isOwnerOccupied: undefined }),
    );
    // isOwnerOccupied defaults to true in passesFinancing
    expect(result.score).toBeGreaterThan(0);
  });
});

// =============================================================================
// 15 BINARY CRITERIA
// =============================================================================

describe("Binary Criteria", () => {
  // 3. Urban/Rural
  describe("Urban/Rural criterion", () => {
    it("gives point when rural deal matches rural CDE", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ ruralFocus: true }),
        baseDeal({ isRural: true }),
      );
      expect(result.breakdown.urbanRural).toBe(1);
    });

    it("gives point when urban deal matches urban CDE", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ urbanFocus: true }),
        baseDeal({ isRural: false }),
      );
      expect(result.breakdown.urbanRural).toBe(1);
    });

    it("gives point when CDE has no rural/urban focus", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ ruralFocus: false, urbanFocus: false }),
        baseDeal({ isRural: true }),
      );
      expect(result.breakdown.urbanRural).toBe(1);
    });

    it("gives 0 when rural deal vs urban-only CDE", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ urbanFocus: true, ruralFocus: false }),
        baseDeal({ isRural: true }),
      );
      expect(result.breakdown.urbanRural).toBe(0);
    });

    it("gives 0 when urban deal vs rural-only CDE", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ ruralFocus: true, urbanFocus: false }),
        baseDeal({ isRural: false }),
      );
      expect(result.breakdown.urbanRural).toBe(0);
    });
  });

  // 4. Sector
  describe("Sector criterion", () => {
    it("gives point when CDE has no sector preference", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ targetSectors: [] }),
        baseDeal({ projectType: "Healthcare" }),
      );
      expect(result.breakdown.sector).toBe(1);
    });

    it("gives point when deal type matches CDE sector", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ targetSectors: ["Healthcare"] }),
        baseDeal({ projectType: "Healthcare" }),
      );
      expect(result.breakdown.sector).toBe(1);
    });

    it("gives 0 when sector does not match", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ targetSectors: ["Manufacturing"] }),
        baseDeal({ projectType: "Healthcare" }),
      );
      expect(result.breakdown.sector).toBe(0);
    });

    it("matches with normalized text (underscores/hyphens)", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ targetSectors: ["health_care"] }),
        baseDeal({ projectType: "health-care" }),
      );
      expect(result.breakdown.sector).toBe(1);
    });
  });

  // 5. Deal Size
  describe("Deal Size criterion", () => {
    it("gives point when amount is within range", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ dealSizeRange: { min: 1_000_000, max: 10_000_000 } }),
        baseDeal({ allocationRequest: 5_000_000 }),
      );
      expect(result.breakdown.dealSize).toBe(1);
    });

    it("gives point at min boundary", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ dealSizeRange: { min: 5_000_000, max: 10_000_000 } }),
        baseDeal({ allocationRequest: 5_000_000 }),
      );
      expect(result.breakdown.dealSize).toBe(1);
    });

    it("gives 0 when below min", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ dealSizeRange: { min: 5_000_000, max: 10_000_000 } }),
        baseDeal({ allocationRequest: 1_000_000 }),
      );
      expect(result.breakdown.dealSize).toBe(0);
    });

    it("gives 0 when above max", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ dealSizeRange: { min: 1_000_000, max: 5_000_000 } }),
        baseDeal({ allocationRequest: 10_000_000 }),
      );
      expect(result.breakdown.dealSize).toBe(0);
    });
  });

  // 6. Small Deal Fund
  describe("Small Deal Fund criterion", () => {
    it("gives point when deal is not small", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ smallDealFund: false }),
        baseDeal({ allocationRequest: 10_000_000 }),
      );
      expect(result.breakdown.smallDealFund).toBe(1);
    });

    it("gives point when small deal and CDE has small deal fund", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ smallDealFund: true }),
        baseDeal({ allocationRequest: 3_000_000 }),
      );
      expect(result.breakdown.smallDealFund).toBe(1);
    });

    it("gives 0 when small deal and CDE has no small deal fund", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ smallDealFund: false }),
        baseDeal({ allocationRequest: 3_000_000 }),
      );
      expect(result.breakdown.smallDealFund).toBe(0);
    });

    it("threshold is $5M (≤$5M is small)", () => {
      // $5M exactly is small
      const resultSmall = calculateCDEMatchScore(
        baseCDE({ smallDealFund: false }),
        baseDeal({ allocationRequest: 5_000_000 }),
      );
      expect(resultSmall.breakdown.smallDealFund).toBe(0);

      // $5,000,001 is not small
      const resultNotSmall = calculateCDEMatchScore(
        baseCDE({ smallDealFund: false }),
        baseDeal({ allocationRequest: 5_000_001 }),
      );
      expect(resultNotSmall.breakdown.smallDealFund).toBe(1);
    });
  });

  // 7. Severely Distressed
  describe("Severely Distressed criterion", () => {
    it("gives point when CDE does not require it", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ requireSeverelyDistressed: false }),
        baseDeal({ severelyDistressed: false }),
      );
      expect(result.breakdown.severelyDistressed).toBe(1);
    });

    it("gives point when CDE requires it and deal has it", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ requireSeverelyDistressed: true }),
        baseDeal({ severelyDistressed: true }),
      );
      expect(result.breakdown.severelyDistressed).toBe(1);
    });

    it("gives 0 when CDE requires it but deal does not have it", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ requireSeverelyDistressed: true }),
        baseDeal({ severelyDistressed: false }),
      );
      expect(result.breakdown.severelyDistressed).toBe(0);
    });
  });

  // 8. Distress Percentile
  describe("Distress Percentile criterion", () => {
    it("gives point when minDistress is 0 (no requirement)", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ minDistressPercentile: 0 }),
        baseDeal({ distressScore: 0 }),
      );
      expect(result.breakdown.distressPercentile).toBe(1);
    });

    it("gives point when deal meets minimum", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ minDistressPercentile: 50 }),
        baseDeal({ distressScore: 75 }),
      );
      expect(result.breakdown.distressPercentile).toBe(1);
    });

    it("gives 0 when deal below minimum", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ minDistressPercentile: 75 }),
        baseDeal({ distressScore: 50 }),
      );
      expect(result.breakdown.distressPercentile).toBe(0);
    });
  });

  // 9. Minority Focus
  describe("Minority Focus criterion", () => {
    it("gives point when CDE has no minority focus", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ minorityFocus: false }),
        baseDeal({ isMinorityOwned: false }),
      );
      expect(result.breakdown.minorityFocus).toBe(1);
    });

    it("gives point when CDE has minority focus and deal is minority-owned", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ minorityFocus: true }),
        baseDeal({ isMinorityOwned: true }),
      );
      expect(result.breakdown.minorityFocus).toBe(1);
    });

    it("gives 0 when CDE has minority focus but deal is not minority-owned", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ minorityFocus: true }),
        baseDeal({ isMinorityOwned: false }),
      );
      expect(result.breakdown.minorityFocus).toBe(0);
    });
  });

  // 10. UTS Focus
  describe("UTS Focus criterion", () => {
    it("gives point when CDE has no UTS focus", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ utsFocus: false }),
        baseDeal({ isUts: false, state: "OH" }),
      );
      expect(result.breakdown.utsFocus).toBe(1);
    });

    it("gives point when deal.isUts is true and CDE has UTS focus", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ utsFocus: true }),
        baseDeal({ isUts: true }),
      );
      expect(result.breakdown.utsFocus).toBe(1);
    });

    it("gives point when deal state is underserved for CDE allocation year", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ utsFocus: true, allocationYears: [2024] }),
        baseDeal({ isUts: false, state: "CA" }), // CA is underserved in 2024
      );
      expect(result.breakdown.utsFocus).toBe(1);
    });

    it("gives 0 when CDE has UTS focus but deal is not in underserved state", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ utsFocus: true, allocationYears: [2024] }),
        baseDeal({ isUts: false, state: "OH" }), // OH is not underserved
      );
      expect(result.breakdown.utsFocus).toBe(0);
    });
  });

  // 11. Entity Type
  describe("Entity Type criterion", () => {
    it("gives point when CDE accepts for-profit and deal is for-profit", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ forprofitAccepted: true }),
        baseDeal({ isNonProfit: false }),
      );
      expect(result.breakdown.entityType).toBe(1);
    });

    it("gives 0 when CDE does not accept for-profit and deal is for-profit", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ forprofitAccepted: false }),
        baseDeal({ isNonProfit: false }),
      );
      expect(result.breakdown.entityType).toBe(0);
    });

    it("gives point for nonprofits regardless", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ forprofitAccepted: false }),
        baseDeal({ isNonProfit: true }),
      );
      expect(result.breakdown.entityType).toBe(1);
    });
  });

  // 12. Owner Occupied
  describe("Owner Occupied criterion", () => {
    it("gives point when CDE does not prefer owner-occupied", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ ownerOccupiedPreferred: false }),
        baseDeal({ isOwnerOccupied: false }),
      );
      expect(result.breakdown.ownerOccupied).toBe(1);
    });

    it("gives point when CDE prefers owner-occupied and deal is", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ ownerOccupiedPreferred: true }),
        baseDeal({ isOwnerOccupied: true }),
      );
      expect(result.breakdown.ownerOccupied).toBe(1);
    });

    it("gives 0 when CDE prefers owner-occupied but deal is not", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ ownerOccupiedPreferred: true }),
        baseDeal({ isOwnerOccupied: false }),
      );
      expect(result.breakdown.ownerOccupied).toBe(0);
    });
  });

  // 13. Tribal
  describe("Tribal criterion", () => {
    it("gives point when CDE has no native american focus", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ nativeAmericanFocus: false }),
        baseDeal({ isTribal: false }),
      );
      expect(result.breakdown.tribal).toBe(1);
    });

    it("gives point when CDE has focus and deal is tribal", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ nativeAmericanFocus: true }),
        baseDeal({ isTribal: true }),
      );
      expect(result.breakdown.tribal).toBe(1);
    });

    it("gives 0 when CDE has focus but deal is not tribal", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ nativeAmericanFocus: true }),
        baseDeal({ isTribal: false }),
      );
      expect(result.breakdown.tribal).toBe(0);
    });
  });

  // 14. Allocation Type
  describe("Allocation Type criterion", () => {
    it("gives point when both are federal", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ allocationType: "federal" }),
        baseDeal({ allocationType: "federal" }),
      );
      expect(result.breakdown.allocationType).toBe(1);
    });

    it("gives point when allocation types match", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ allocationType: "state" }),
        baseDeal({ allocationType: "state" }),
      );
      expect(result.breakdown.allocationType).toBe(1);
    });

    it("gives 0 when allocation types differ", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ allocationType: "federal" }),
        baseDeal({ allocationType: "state" }),
      );
      expect(result.breakdown.allocationType).toBe(0);
    });
  });

  // 15. Has Allocation
  describe("Has Allocation criterion", () => {
    it("gives point when CDE has remaining allocation", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ remainingAllocation: 10_000_000 }),
        baseDeal(),
      );
      expect(result.breakdown.hasAllocation).toBe(1);
    });

    it("gives 0 when CDE has zero allocation", () => {
      const result = calculateCDEMatchScore(
        baseCDE({ remainingAllocation: 0 }),
        baseDeal(),
      );
      expect(result.breakdown.hasAllocation).toBe(0);
    });
  });
});

// =============================================================================
// SCORE CALCULATION
// =============================================================================

describe("Score Calculation", () => {
  it("calculates score as points/15 * 100", () => {
    // With a perfectly matching CDE and deal, all 15 criteria should give 1
    const result = calculateCDEMatchScore(baseCDE(), baseDeal());
    const totalPoints = Object.values(result.breakdown).reduce(
      (s, v) => s + v,
      0,
    );
    expect(result.score).toBe(Math.round((totalPoints / TOTAL_CRITERIA) * 100));
  });

  it("score is 0 when eliminated", () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "regional", primaryStates: ["NY"] }),
      baseDeal({ state: "CA" }),
    );
    expect(result.score).toBe(0);
  });

  it("score never exceeds 100", () => {
    const result = calculateCDEMatchScore(baseCDE(), baseDeal());
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("score is always a whole number (rounded)", () => {
    const result = calculateCDEMatchScore(baseCDE(), baseDeal());
    expect(result.score).toBe(Math.round(result.score));
  });

  it("breakdown has exactly 15 keys when not eliminated", () => {
    const result = calculateCDEMatchScore(baseCDE(), baseDeal());
    expect(Object.keys(result.breakdown).length).toBe(TOTAL_CRITERIA);
  });
});

// =============================================================================
// MATCH STRENGTH
// =============================================================================

describe("Match Strength", () => {
  it('returns "excellent" for score >= 80', () => {
    const result = calculateCDEMatchScore(baseCDE(), baseDeal());
    // Perfect match should be >= 80
    if (result.score >= 80) {
      expect(result.matchStrength).toBe("excellent");
    }
  });

  it('eliminated matches are "weak"', () => {
    const result = calculateCDEMatchScore(
      baseCDE({ serviceAreaType: "regional", primaryStates: ["NY"] }),
      baseDeal({ state: "CA" }),
    );
    expect(result.matchStrength).toBe("weak");
  });
});

// =============================================================================
// getMatchTier
// =============================================================================

describe("getMatchTier", () => {
  it("returns Excellent for >= 80", () => {
    expect(getMatchTier(80)).toBe("Excellent");
    expect(getMatchTier(100)).toBe("Excellent");
    expect(getMatchTier(95)).toBe("Excellent");
  });

  it("returns Good for >= 65 and < 80", () => {
    expect(getMatchTier(65)).toBe("Good");
    expect(getMatchTier(79)).toBe("Good");
  });

  it("returns Fair for >= 50 and < 65", () => {
    expect(getMatchTier(50)).toBe("Fair");
    expect(getMatchTier(64)).toBe("Fair");
  });

  it("returns Poor for < 50", () => {
    expect(getMatchTier(0)).toBe("Poor");
    expect(getMatchTier(49)).toBe("Poor");
  });

  it("boundaries match MATCH_THRESHOLDS", () => {
    expect(getMatchTier(MATCH_THRESHOLDS.excellent)).toBe("Excellent");
    expect(getMatchTier(MATCH_THRESHOLDS.excellent - 1)).toBe("Good");
    expect(getMatchTier(MATCH_THRESHOLDS.good)).toBe("Good");
    expect(getMatchTier(MATCH_THRESHOLDS.good - 1)).toBe("Fair");
    expect(getMatchTier(MATCH_THRESHOLDS.fair)).toBe("Fair");
    expect(getMatchTier(MATCH_THRESHOLDS.fair - 1)).toBe("Poor");
  });
});

// =============================================================================
// calculateDealScore
// =============================================================================

describe("calculateDealScore", () => {
  it("starts at base score of 50", () => {
    const score = calculateDealScore(
      baseDeal({
        severelyDistressed: false,
        isQct: false,
        isNonProfit: false,
        allocationRequest: 1_000_000,
      }),
    );
    expect(score).toBe(50);
  });

  it("adds 20 for severely distressed", () => {
    const score = calculateDealScore(
      baseDeal({
        severelyDistressed: true,
        isQct: false,
        isNonProfit: false,
        allocationRequest: 1_000_000,
      }),
    );
    expect(score).toBe(70);
  });

  it("adds 10 for QCT", () => {
    const score = calculateDealScore(
      baseDeal({
        isQct: true,
        severelyDistressed: false,
        isNonProfit: false,
        allocationRequest: 1_000_000,
      }),
    );
    expect(score).toBe(60);
  });

  it("adds 10 for nonprofit", () => {
    const score = calculateDealScore(
      baseDeal({
        isNonProfit: true,
        severelyDistressed: false,
        isQct: false,
        allocationRequest: 1_000_000,
      }),
    );
    expect(score).toBe(60);
  });

  it("adds 10 for large allocation (>= $5M)", () => {
    const score = calculateDealScore(
      baseDeal({
        allocationRequest: 5_000_000,
        severelyDistressed: false,
        isQct: false,
        isNonProfit: false,
      }),
    );
    expect(score).toBe(60);
  });

  it("caps at 100", () => {
    const score = calculateDealScore(
      baseDeal({
        severelyDistressed: true,
        isQct: true,
        isNonProfit: true,
        allocationRequest: 10_000_000,
      }),
    );
    expect(score).toBe(100);
  });

  it("all bonuses stack correctly", () => {
    // 50 + 20 + 10 + 10 + 10 = 100 (capped)
    const score = calculateDealScore(
      baseDeal({
        severelyDistressed: true, // +20
        isQct: true, // +10
        isNonProfit: true, // +10
        allocationRequest: 5_000_000, // +10
      }),
    );
    expect(score).toBe(100);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Edge Cases", () => {
  it("handles null/undefined CDE fields gracefully", () => {
    const result = calculateCDEMatchScore(
      baseCDE({
        predominantFinancing: undefined,
        predominantMarket: undefined,
        targetSectors: [],
        minorityFocus: undefined,
        utsFocus: undefined,
      }),
      baseDeal(),
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles empty deal criteria", () => {
    const result = calculateCDEMatchScore(
      baseCDE(),
      baseDeal({
        state: "",
        projectType: "",
        allocationRequest: 0,
      }),
    );
    // Should not throw, score >= 0
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("returns reasons array with at least one reason when not eliminated", () => {
    const result = calculateCDEMatchScore(baseCDE(), baseDeal());
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});
