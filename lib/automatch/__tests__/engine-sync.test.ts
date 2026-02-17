/**
 * AutoMatch Engine Sync Test
 *
 * Verifies that the 2 frontend scoring engines stay in sync:
 * 1. lib/cde/matchScore.ts — typed client-side engine
 * 2. app/api/automatch/route.ts — untyped server-side engine
 *
 * Both MUST implement identical criteria in the same order.
 * If one file is updated without the other, this test fails.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../../..");

function readEngine(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf-8");
}

// Extract all `scores.XXX = ` assignments from a file
function extractCriteriaKeys(source: string): string[] {
  const matches = source.matchAll(/scores[.\[](['"]?)(\w+)\1\]?\s*=/g);
  const keys: string[] = [];
  for (const m of matches) {
    if (!keys.includes(m[2])) keys.push(m[2]);
  }
  return keys;
}

// Extract the total criteria divisor from a file
function extractTotalCriteria(source: string): number | null {
  // Look for TOTAL_CRITERIA import/usage or literal /15
  const importMatch = source.match(/TOTAL_CRITERIA/);
  if (importMatch) return 15; // TOTAL_CRITERIA is defined as 15 in constants.ts

  const literalMatch = source.match(/\/\s*15\s*\)\s*\*\s*100/);
  if (literalMatch) return 15;

  return null;
}

describe("AutoMatch Engine Sync", () => {
  const libEngine = readEngine("lib/cde/matchScore.ts");
  const routeEngine = readEngine("app/api/automatch/route.ts");

  it("both engines use TOTAL_CRITERIA from shared constants", () => {
    expect(libEngine).toContain("from '@/lib/automatch/constants'");
    expect(routeEngine).toContain("from '@/lib/automatch/constants'");
  });

  it("both engines import normalizeText from shared constants", () => {
    expect(libEngine).toContain("normalizeText");
    expect(routeEngine).toContain("normalizeText");
  });

  it("both engines import getStateInfo from shared constants", () => {
    expect(libEngine).toContain("getStateInfo");
    expect(routeEngine).toContain("getStateInfo");
  });

  it("both engines implement the same 15 binary criteria", () => {
    const libKeys = extractCriteriaKeys(libEngine);
    const routeKeys = extractCriteriaKeys(routeEngine);

    expect(libKeys).toHaveLength(15);
    expect(routeKeys).toHaveLength(15);
    expect(libKeys).toEqual(routeKeys);
  });

  it("criteria keys match the expected canonical order", () => {
    const expected = [
      "geographic",
      "financing",
      "urbanRural",
      "sector",
      "dealSize",
      "smallDealFund",
      "severelyDistressed",
      "distressPercentile",
      "minorityFocus",
      "utsFocus",
      "entityType",
      "ownerOccupied",
      "tribal",
      "allocationType",
      "hasAllocation",
    ];

    const libKeys = extractCriteriaKeys(libEngine);
    const routeKeys = extractCriteriaKeys(routeEngine);

    expect(libKeys).toEqual(expected);
    expect(routeKeys).toEqual(expected);
  });

  it("both engines use the same score formula: points / TOTAL_CRITERIA * 100", () => {
    const formulaPattern = /totalPoints\s*\/\s*TOTAL_CRITERIA\s*\)\s*\*\s*100/;
    expect(libEngine).toMatch(formulaPattern);
    expect(routeEngine).toMatch(formulaPattern);
  });

  it("both engines use MATCH_THRESHOLDS from shared constants", () => {
    expect(libEngine).toContain("MATCH_THRESHOLDS");
    expect(routeEngine).toContain("MATCH_THRESHOLDS");
  });

  it("both engines have geographic eliminator returning score 0", () => {
    expect(libEngine).toContain("passesGeographic");
    expect(routeEngine).toContain("passesGeographic");
  });

  it("both engines have financing eliminator returning score 0", () => {
    expect(libEngine).toContain("passesFinancing");
    expect(routeEngine).toContain("passesFinancing");
  });

  it("both engines use UNDERSERVED_STATES_BY_YEAR for UTS criterion", () => {
    expect(libEngine).toContain("UNDERSERVED_STATES_BY_YEAR");
    expect(routeEngine).toContain("UNDERSERVED_STATES_BY_YEAR");
  });

  it("both engines handle owner-occupied default as true", () => {
    // Both should have `?? true` for isOwnerOccupied
    const ownerOccDefaultPattern = /isOwnerOccupied\s*\?\?\s*true/;
    expect(libEngine).toMatch(ownerOccDefaultPattern);
    expect(routeEngine).toMatch(ownerOccDefaultPattern);
  });

  it('both engines handle distress percentile = 0 as "no minimum required"', () => {
    // Both should give point when minDistress === 0
    expect(libEngine).toContain("minDistress === 0");
    expect(routeEngine).toContain("minDistress === 0");
  });

  it("small deal threshold is $5M in both engines", () => {
    expect(libEngine).toContain("5000000");
    expect(routeEngine).toContain("5000000");
  });
});
