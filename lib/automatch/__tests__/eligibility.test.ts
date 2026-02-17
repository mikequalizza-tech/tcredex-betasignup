import { describe, it, expect } from "vitest";
import {
  isQALICBEligible,
  getDetailedEligibility,
  PROHIBITED_BUSINESSES,
  QALICBInput,
} from "../eligibility";

// =============================================================================
// HELPERS
// =============================================================================

function allPassing(): QALICBInput {
  return {
    gross_income_test: true,
    tangible_property_test: true,
    services_test: true,
    collectibles_test: true,
    financial_property_test: true,
    prohibited_business: false,
    active_business: true,
  };
}

// =============================================================================
// isQALICBEligible
// =============================================================================

describe("isQALICBEligible", () => {
  it("returns true when all tests pass", () => {
    expect(isQALICBEligible(allPassing())).toBe(true);
  });

  it("returns false when gross_income_test fails", () => {
    expect(
      isQALICBEligible({ ...allPassing(), gross_income_test: false }),
    ).toBe(false);
  });

  it("returns false when tangible_property_test fails", () => {
    expect(
      isQALICBEligible({ ...allPassing(), tangible_property_test: false }),
    ).toBe(false);
  });

  it("returns false when services_test fails", () => {
    expect(isQALICBEligible({ ...allPassing(), services_test: false })).toBe(
      false,
    );
  });

  it("returns false when collectibles_test fails", () => {
    expect(
      isQALICBEligible({ ...allPassing(), collectibles_test: false }),
    ).toBe(false);
  });

  it("returns false when financial_property_test fails", () => {
    expect(
      isQALICBEligible({ ...allPassing(), financial_property_test: false }),
    ).toBe(false);
  });

  it("returns false when business is prohibited", () => {
    expect(
      isQALICBEligible({ ...allPassing(), prohibited_business: true }),
    ).toBe(false);
  });

  it("returns false when not an active business", () => {
    expect(isQALICBEligible({ ...allPassing(), active_business: false })).toBe(
      false,
    );
  });

  it("returns false when multiple tests fail", () => {
    expect(
      isQALICBEligible({
        ...allPassing(),
        gross_income_test: false,
        services_test: false,
      }),
    ).toBe(false);
  });

  it("returns false when all tests fail", () => {
    expect(
      isQALICBEligible({
        gross_income_test: false,
        tangible_property_test: false,
        services_test: false,
        collectibles_test: false,
        financial_property_test: false,
        prohibited_business: true,
        active_business: false,
      }),
    ).toBe(false);
  });
});

// =============================================================================
// getDetailedEligibility
// =============================================================================

describe("getDetailedEligibility", () => {
  it("returns eligible=true when all pass", () => {
    const result = getDetailedEligibility(allPassing());
    expect(result.eligible).toBe(true);
    expect(result.failed_tests).toHaveLength(0);
    expect(result.recommendations).toHaveLength(0);
  });

  it("returns 7 passed tests when all pass", () => {
    const result = getDetailedEligibility(allPassing());
    expect(result.passed_tests).toHaveLength(7);
  });

  it("identifies failed gross income test", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      gross_income_test: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.failed_tests).toContain("Gross Income Test (50%)");
    expect(result.passed_tests).not.toContain("Gross Income Test (50%)");
  });

  it("identifies failed tangible property test", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      tangible_property_test: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.failed_tests).toContain("Tangible Property Test (40%)");
  });

  it("identifies failed services test", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      services_test: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.failed_tests).toContain("Services Test (40%)");
  });

  it("identifies prohibited business", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      prohibited_business: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.failed_tests).toContain("Not Prohibited Business");
  });

  it("provides recommendation for gross income failure", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      gross_income_test: false,
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toContain("50% gross income");
  });

  it("provides recommendation for tangible property failure", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      tangible_property_test: false,
    });
    expect(
      result.recommendations.some((r) => r.includes("40% threshold")),
    ).toBe(true);
  });

  it("provides recommendation for services failure", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      services_test: false,
    });
    expect(result.recommendations.some((r) => r.includes("LIC"))).toBe(true);
  });

  it("provides recommendation for prohibited business", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      prohibited_business: true,
    });
    expect(result.recommendations.some((r) => r.includes("prohibited"))).toBe(
      true,
    );
  });

  it("no recommendation for collectibles or financial property failures", () => {
    const result1 = getDetailedEligibility({
      ...allPassing(),
      collectibles_test: false,
    });
    // collectibles failure has no specific recommendation
    expect(result1.recommendations).toHaveLength(0);

    const result2 = getDetailedEligibility({
      ...allPassing(),
      financial_property_test: false,
    });
    expect(result2.recommendations).toHaveLength(0);
  });

  it("returns multiple recommendations for multiple failures", () => {
    const result = getDetailedEligibility({
      ...allPassing(),
      gross_income_test: false,
      services_test: false,
      prohibited_business: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.recommendations.length).toBe(3);
    expect(result.failed_tests.length).toBe(3);
    expect(result.passed_tests.length).toBe(4);
  });
});

// =============================================================================
// PROHIBITED_BUSINESSES
// =============================================================================

describe("PROHIBITED_BUSINESSES", () => {
  it("contains expected prohibited types", () => {
    expect(PROHIBITED_BUSINESSES).toContain("Golf course");
    expect(PROHIBITED_BUSINESSES).toContain("Country club");
    expect(PROHIBITED_BUSINESSES).toContain("Liquor store");
    expect(PROHIBITED_BUSINESSES).toContain("Massage parlor");
  });

  it("has 9 entries", () => {
    expect(PROHIBITED_BUSINESSES).toHaveLength(9);
  });

  it("includes residential rental property", () => {
    expect(PROHIBITED_BUSINESSES).toContain("Residential rental property");
  });
});
