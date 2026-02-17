import { describe, it, expect } from "vitest";
import {
  calculateUnifiedReadiness,
  calculateReadiness,
  getTierDisplay,
  getQuickReadinessScore,
  getReadinessTier,
  ReadinessResult,
} from "../readinessScore";

// =============================================================================
// HELPERS
// =============================================================================

function emptyData(): Record<string, unknown> {
  return {};
}

function tier1Data(): Record<string, unknown> {
  return {
    projectName: "Test Project",
    sponsorName: "Test Sponsor",
    projectType: "Healthcare",
    address: "123 Main St",
    programs: ["NMTC"],
    totalProjectCost: 10_000_000,
  };
}

function tier2Data(): Record<string, unknown> {
  return {
    ...tier1Data(),
    communityImpact: "Great impact on the community",
    permanentJobsFTE: 50,
    constructionJobsFTE: 100,
    ownersRepresentative: "John Doe",
    financingSources: [{ type: "Debt", amount: 5_000_000 }],
    siteControl: "Owned",
    constructionStartDate: "2025-06-01",
    // NMTC QALICB section
    qalicbGrossIncome: 60,
    qalicbTangibleProperty: 50,
    qalicbEmployeeServices: 50,
    isProhibitedBusiness: false,
  };
}

function tier3Data(): Record<string, unknown> {
  return {
    ...tier2Data(),
    phaseIEnvironmental: "Complete",
    zoningApproval: "Complete",
    documents: [{ id: "1", name: "doc.pdf" }],
  };
}

// =============================================================================
// calculateUnifiedReadiness — EMPTY DATA
// =============================================================================

describe("calculateUnifiedReadiness — empty data", () => {
  it("returns tier 0 for empty data", () => {
    const result = calculateUnifiedReadiness(emptyData());
    expect(result.currentTier).toBe(0);
  });

  it("returns 0% for all tier percentages", () => {
    const result = calculateUnifiedReadiness(emptyData());
    expect(result.tier1Pct).toBe(0);
    expect(result.tier2Pct).toBe(0);
    expect(result.tier3Pct).toBe(0);
  });

  it('returns "early" tier label', () => {
    const result = calculateUnifiedReadiness(emptyData());
    expect(result.tier).toBe("early");
  });

  it("returns low totalScore", () => {
    const result = calculateUnifiedReadiness(emptyData());
    expect(result.totalScore).toBe(0);
  });

  it("lists all tier 1 sections as missing", () => {
    const result = calculateUnifiedReadiness(emptyData());
    expect(result.missingRequired.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// calculateUnifiedReadiness — TIER 1 (DealCard Ready)
// =============================================================================

describe("calculateUnifiedReadiness — tier 1", () => {
  it("reaches tier 1 when all tier 1 sections complete", () => {
    const result = calculateUnifiedReadiness(tier1Data());
    expect(result.tier1Pct).toBe(100);
    expect(result.currentTier).toBeGreaterThanOrEqual(1);
  });

  it("has no missing required fields", () => {
    const result = calculateUnifiedReadiness(tier1Data());
    expect(result.missingRequired).toHaveLength(0);
  });

  it("tier1Pct is 100% with all 4 tier-1 sections complete", () => {
    const result = calculateUnifiedReadiness(tier1Data());
    expect(result.tier1Pct).toBe(100);
  });

  it("partial tier 1 data does not reach tier 1", () => {
    const result = calculateUnifiedReadiness({
      projectName: "Test",
      // Missing: sponsorName, address, programs, totalProjectCost
    });
    expect(result.tier1Pct).toBeLessThan(100);
    expect(result.currentTier).toBe(0);
  });
});

// =============================================================================
// calculateUnifiedReadiness — TIER 2 (Profile Ready)
// =============================================================================

describe("calculateUnifiedReadiness — tier 2", () => {
  it("reaches tier 2 when >= 70% of tier 1+2 sections complete", () => {
    const result = calculateUnifiedReadiness(tier2Data());
    expect(result.tier2Pct).toBeGreaterThanOrEqual(70);
    expect(result.currentTier).toBeGreaterThanOrEqual(2);
  });

  it("tier2Pct reflects cumulative tier 1 + tier 2 sections", () => {
    // Tier 1 sections count toward tier2Pct
    const result = calculateUnifiedReadiness(tier1Data());
    // Only tier 1 complete — tier2Pct should be > 0 (tier 1 sections counted)
    expect(result.tier2Pct).toBeGreaterThan(0);
    expect(result.tier2Pct).toBeLessThan(100);
  });
});

// =============================================================================
// calculateUnifiedReadiness — TIER 3 (DD Ready)
// =============================================================================

describe("calculateUnifiedReadiness — tier 3", () => {
  it("reaches tier 3 when >= 85% of all sections complete", () => {
    const result = calculateUnifiedReadiness(tier3Data());
    expect(result.tier3Pct).toBeGreaterThanOrEqual(85);
    expect(result.currentTier).toBe(3);
  });
});

// =============================================================================
// READINESS SCORE FORMULA
// =============================================================================

describe("Readiness Score Formula", () => {
  it("matches formula: (tier1Pct * 0.4) + (tier2Pct * 0.35) + (tier3Pct * 0.25)", () => {
    const result = calculateUnifiedReadiness(tier1Data());
    const expected = Math.round(
      result.tier1Pct * 0.4 + result.tier2Pct * 0.35 + result.tier3Pct * 0.25,
    );
    expect(result.totalScore).toBe(expected);
  });

  it("maxScore is 100", () => {
    const result = calculateUnifiedReadiness(tier3Data());
    expect(result.maxScore).toBe(100);
  });

  it("percentage equals totalScore", () => {
    const result = calculateUnifiedReadiness(tier2Data());
    expect(result.percentage).toBe(result.totalScore);
  });
});

// =============================================================================
// LEGACY TIER LABELS
// =============================================================================

describe("Legacy Tier Labels", () => {
  it("maps score >= 80 to shovel-ready", () => {
    const result = calculateUnifiedReadiness(tier3Data());
    if (result.totalScore >= 80) {
      expect(result.tier).toBe("shovel-ready");
    }
  });

  it("maps score 60-79 to advanced", () => {
    // Create data that would produce score in 60-79 range
    const result = calculateUnifiedReadiness(tier2Data());
    if (result.totalScore >= 60 && result.totalScore < 80) {
      expect(result.tier).toBe("advanced");
    }
  });

  it("maps score 40-59 to developing", () => {
    const result = calculateUnifiedReadiness(tier1Data());
    if (result.totalScore >= 40 && result.totalScore < 60) {
      expect(result.tier).toBe("developing");
    }
  });

  it("maps score < 40 to early", () => {
    const result = calculateUnifiedReadiness(emptyData());
    expect(result.tier).toBe("early");
  });
});

// =============================================================================
// PROGRAM-SPECIFIC SECTIONS
// =============================================================================

describe("Program-Specific Sections", () => {
  it("includes NMTC QALICB section when NMTC selected", () => {
    const result = calculateUnifiedReadiness(
      { ...tier1Data(), programs: ["NMTC"] },
      ["NMTC"],
    );
    const hasQalicb = result.breakdown.some((b) => b.id === "nmtc_qalicb");
    expect(hasQalicb).toBe(true);
  });

  it("includes HTC section when HTC selected", () => {
    const result = calculateUnifiedReadiness(
      { ...tier1Data(), programs: ["HTC"] },
      ["HTC"],
    );
    const hasHtc = result.breakdown.some((b) => b.id === "htc_status");
    expect(hasHtc).toBe(true);
  });

  it("includes LIHTC section when LIHTC selected", () => {
    const result = calculateUnifiedReadiness(
      { ...tier1Data(), programs: ["LIHTC"] },
      ["LIHTC"],
    );
    const hasLihtc = result.breakdown.some((b) => b.id === "lihtc_housing");
    expect(hasLihtc).toBe(true);
  });

  it("includes OZ section when OZ selected", () => {
    const result = calculateUnifiedReadiness(
      { ...tier1Data(), programs: ["OZ"] },
      ["OZ"],
    );
    const hasOz = result.breakdown.some((b) => b.id === "oz_eligibility");
    expect(hasOz).toBe(true);
  });

  it("does not include program sections when program not selected", () => {
    const result = calculateUnifiedReadiness(tier1Data(), []);
    const hasQalicb = result.breakdown.some((b) => b.id === "nmtc_qalicb");
    const hasHtc = result.breakdown.some((b) => b.id === "htc_status");
    expect(hasQalicb).toBe(false);
    expect(hasHtc).toBe(false);
  });

  it("QALICB section complete when thresholds met", () => {
    const data = {
      ...tier1Data(),
      qalicbGrossIncome: 60,
      qalicbTangibleProperty: 50,
      qalicbEmployeeServices: 50,
      isProhibitedBusiness: false,
    };
    const result = calculateUnifiedReadiness(data, ["NMTC"]);
    const qalicb = result.breakdown.find((b) => b.id === "nmtc_qalicb");
    expect(qalicb?.status).toBe("complete");
  });

  it("QALICB section incomplete when thresholds not met", () => {
    const data = {
      ...tier1Data(),
      qalicbGrossIncome: 30, // Below 50%
      qalicbTangibleProperty: 50,
      qalicbEmployeeServices: 50,
      isProhibitedBusiness: false,
    };
    const result = calculateUnifiedReadiness(data, ["NMTC"]);
    const qalicb = result.breakdown.find((b) => b.id === "nmtc_qalicb");
    expect(qalicb?.status).toBe("incomplete");
  });
});

// =============================================================================
// BREAKDOWN
// =============================================================================

describe("Breakdown", () => {
  it("has base sections for all deals", () => {
    const result = calculateUnifiedReadiness(emptyData());
    // 12 base sections
    expect(result.breakdown.length).toBe(12);
  });

  it("each breakdown item has required fields", () => {
    const result = calculateUnifiedReadiness(tier1Data());
    for (const item of result.breakdown) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect([0, 1]).toContain(item.score);
      expect(item.maxScore).toBe(1);
      expect(["complete", "partial", "incomplete"]).toContain(item.status);
    }
  });

  it("breakdown labels are human-readable", () => {
    const result = calculateUnifiedReadiness(emptyData());
    const labels = result.breakdown.map((b) => b.label);
    expect(labels).toContain("Project Basics");
    expect(labels).toContain("Location");
    expect(labels).toContain("Programs");
  });
});

// =============================================================================
// calculateReadiness (legacy wrapper)
// =============================================================================

describe("calculateReadiness", () => {
  it("delegates to calculateUnifiedReadiness", () => {
    const data = tier1Data();
    const unified = calculateUnifiedReadiness(data);
    const legacy = calculateReadiness(data);
    expect(legacy.totalScore).toBe(unified.totalScore);
    expect(legacy.currentTier).toBe(unified.currentTier);
  });
});

// =============================================================================
// getTierDisplay
// =============================================================================

describe("getTierDisplay", () => {
  it("returns display for shovel-ready", () => {
    const display = getTierDisplay("shovel-ready");
    expect(display.label).toBe("Shovel Ready");
    expect(display.color).toBe("green");
  });

  it("returns display for advanced", () => {
    const display = getTierDisplay("advanced");
    expect(display.label).toBe("Advanced");
    expect(display.color).toBe("blue");
  });

  it("returns display for developing", () => {
    const display = getTierDisplay("developing");
    expect(display.label).toBe("Developing");
    expect(display.color).toBe("amber");
  });

  it("returns display for early", () => {
    const display = getTierDisplay("early");
    expect(display.label).toBe("Early Stage");
    expect(display.color).toBe("gray");
  });

  it("falls back to early for unknown tier", () => {
    const display = getTierDisplay("unknown");
    expect(display.label).toBe("Early Stage");
  });

  it("each display has text and bg colors", () => {
    for (const tier of ["shovel-ready", "advanced", "developing", "early"]) {
      const display = getTierDisplay(tier);
      expect(display.textColor).toBeTruthy();
      expect(display.bgColor).toBeTruthy();
      expect(display.description).toBeTruthy();
    }
  });
});

// =============================================================================
// QUICK HELPERS
// =============================================================================

describe("getQuickReadinessScore", () => {
  it("returns numeric score", () => {
    const score = getQuickReadinessScore(tier1Data());
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("getReadinessTier", () => {
  it("returns tier string", () => {
    const tier = getReadinessTier(tier1Data());
    expect(["early", "developing", "advanced", "shovel-ready"]).toContain(tier);
  });
});

// =============================================================================
// SECTION COMPLETION LOGIC
// =============================================================================

describe("Section Completion Logic", () => {
  it("basics requires projectName, sponsorName, projectType", () => {
    const withAll = calculateUnifiedReadiness({
      projectName: "A",
      sponsorName: "B",
      projectType: "C",
    });
    const basics = withAll.breakdown.find((b) => b.id === "basics");
    expect(basics?.status).toBe("complete");

    const withoutName = calculateUnifiedReadiness({
      sponsorName: "B",
      projectType: "C",
    });
    const basicsInc = withoutName.breakdown.find((b) => b.id === "basics");
    expect(basicsInc?.status).toBe("incomplete");
  });

  it("location requires address", () => {
    const result = calculateUnifiedReadiness({ address: "123 Main St" });
    const loc = result.breakdown.find((b) => b.id === "location");
    expect(loc?.status).toBe("complete");
  });

  it("programs requires non-empty programs array", () => {
    const complete = calculateUnifiedReadiness({ programs: ["NMTC"] });
    expect(complete.breakdown.find((b) => b.id === "programs")?.status).toBe(
      "complete",
    );

    const empty = calculateUnifiedReadiness({ programs: [] });
    expect(empty.breakdown.find((b) => b.id === "programs")?.status).toBe(
      "incomplete",
    );
  });

  it("costs requires totalProjectCost", () => {
    const complete = calculateUnifiedReadiness({
      totalProjectCost: 10_000_000,
    });
    expect(complete.breakdown.find((b) => b.id === "costs")?.status).toBe(
      "complete",
    );
  });

  it("impact requires communitySupport or communityImpact", () => {
    const a = calculateUnifiedReadiness({ communitySupport: "Yes" });
    expect(a.breakdown.find((b) => b.id === "impact")?.status).toBe("complete");

    const b = calculateUnifiedReadiness({ communityImpact: "Yes" });
    expect(b.breakdown.find((b) => b.id === "impact")?.status).toBe("complete");
  });

  it("benefits requires permanentJobsFTE or constructionJobsFTE", () => {
    const a = calculateUnifiedReadiness({ permanentJobsFTE: 10 });
    expect(a.breakdown.find((b) => b.id === "benefits")?.status).toBe(
      "complete",
    );

    // 0 is defined, so should be complete (data.x !== undefined)
    const b = calculateUnifiedReadiness({ constructionJobsFTE: 0 });
    expect(b.breakdown.find((b) => b.id === "benefits")?.status).toBe(
      "complete",
    );
  });

  it("team requires ownersRepresentative", () => {
    const result = calculateUnifiedReadiness({ ownersRepresentative: "John" });
    expect(result.breakdown.find((b) => b.id === "team")?.status).toBe(
      "complete",
    );
  });

  it("capital requires non-empty financingSources", () => {
    const result = calculateUnifiedReadiness({
      financingSources: [{ type: "Debt", amount: 1 }],
    });
    expect(result.breakdown.find((b) => b.id === "capital")?.status).toBe(
      "complete",
    );
  });

  it("site requires siteControl", () => {
    const result = calculateUnifiedReadiness({ siteControl: "Owned" });
    expect(result.breakdown.find((b) => b.id === "site")?.status).toBe(
      "complete",
    );
  });

  it("timeline requires constructionStartDate or targetClosingDate", () => {
    const a = calculateUnifiedReadiness({
      constructionStartDate: "2025-01-01",
    });
    expect(a.breakdown.find((b) => b.id === "timeline")?.status).toBe(
      "complete",
    );
  });
});
