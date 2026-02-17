import { describe, it, expect } from "vitest";
import {
  calculateClosingFee,
  formatFee,
  getEffectiveRate,
} from "../fee-engine";

// =============================================================================
// calculateClosingFee
// =============================================================================

describe("calculateClosingFee", () => {
  it("charges 1.8% on amounts under $10M", () => {
    expect(calculateClosingFee(1_000_000)).toBe(18_000);
    expect(calculateClosingFee(5_000_000)).toBe(90_000);
  });

  it("charges 1.8% on exactly $10M", () => {
    expect(calculateClosingFee(10_000_000)).toBe(180_000);
  });

  it("charges tiered rate above $10M", () => {
    // $10M × 1.8% + $5M × 1.5% = $180K + $75K = $255K
    expect(calculateClosingFee(15_000_000)).toBe(255_000);
  });

  it("handles $20M correctly", () => {
    // $10M × 1.8% + $10M × 1.5% = $180K + $150K = $330K
    expect(calculateClosingFee(20_000_000)).toBe(330_000);
  });

  it("handles $0", () => {
    expect(calculateClosingFee(0)).toBe(0);
  });

  it("handles very small amounts", () => {
    expect(calculateClosingFee(100)).toBeCloseTo(1.8);
  });

  it("handles very large amounts", () => {
    // $100M: $10M × 1.8% + $90M × 1.5% = $180K + $1.35M = $1.53M
    expect(calculateClosingFee(100_000_000)).toBe(1_530_000);
  });

  it("handles amounts just above $10M", () => {
    // $10,000,001: $10M × 1.8% + $1 × 1.5% = $180K + $0.015
    expect(calculateClosingFee(10_000_001)).toBeCloseTo(180_000.015);
  });
});

// =============================================================================
// formatFee
// =============================================================================

describe("formatFee", () => {
  it("formats as US currency with no decimals", () => {
    expect(formatFee(180_000)).toBe("$180,000");
  });

  it("formats zero", () => {
    expect(formatFee(0)).toBe("$0");
  });

  it("rounds to nearest dollar", () => {
    // formatFee uses maximumFractionDigits: 0
    expect(formatFee(180_000.015)).toBe("$180,000");
  });

  it("formats large amounts", () => {
    expect(formatFee(1_530_000)).toBe("$1,530,000");
  });
});

// =============================================================================
// getEffectiveRate
// =============================================================================

describe("getEffectiveRate", () => {
  it("returns 1.8% for amounts at or below $10M", () => {
    expect(getEffectiveRate(10_000_000)).toBeCloseTo(1.8);
    expect(getEffectiveRate(5_000_000)).toBeCloseTo(1.8);
  });

  it("returns rate between 1.5% and 1.8% for amounts above $10M", () => {
    const rate = getEffectiveRate(20_000_000);
    expect(rate).toBeGreaterThanOrEqual(1.5);
    expect(rate).toBeLessThanOrEqual(1.8);
  });

  it("effective rate for $20M is 1.65%", () => {
    // $330K / $20M × 100 = 1.65%
    expect(getEffectiveRate(20_000_000)).toBeCloseTo(1.65);
  });

  it("effective rate approaches 1.5% for very large amounts", () => {
    const rate = getEffectiveRate(1_000_000_000);
    expect(rate).toBeCloseTo(1.5, 1); // within 0.1%
  });
});
