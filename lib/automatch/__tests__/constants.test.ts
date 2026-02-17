import { describe, it, expect } from "vitest";
import {
  TOTAL_CRITERIA,
  MATCH_THRESHOLDS,
  UNDERSERVED_STATES_BY_YEAR,
  ABBREV_TO_NAME,
  NAME_TO_ABBREV,
  normalizeText,
  getStateInfo,
} from "../constants";

// =============================================================================
// TOTAL_CRITERIA
// =============================================================================

describe("TOTAL_CRITERIA", () => {
  it("equals 15", () => {
    expect(TOTAL_CRITERIA).toBe(15);
  });
});

// =============================================================================
// MATCH_THRESHOLDS
// =============================================================================

describe("MATCH_THRESHOLDS", () => {
  it("has correct threshold values", () => {
    expect(MATCH_THRESHOLDS.excellent).toBe(80);
    expect(MATCH_THRESHOLDS.good).toBe(65);
    expect(MATCH_THRESHOLDS.fair).toBe(50);
    expect(MATCH_THRESHOLDS.weak).toBe(0);
  });

  it("thresholds are in descending order", () => {
    expect(MATCH_THRESHOLDS.excellent).toBeGreaterThan(MATCH_THRESHOLDS.good);
    expect(MATCH_THRESHOLDS.good).toBeGreaterThan(MATCH_THRESHOLDS.fair);
    expect(MATCH_THRESHOLDS.fair).toBeGreaterThan(MATCH_THRESHOLDS.weak);
  });
});

// =============================================================================
// normalizeText
// =============================================================================

describe("normalizeText", () => {
  it("lowercases text", () => {
    expect(normalizeText("HELLO")).toBe("hello");
    expect(normalizeText("Mixed Case")).toBe("mixed case");
  });

  it("replaces underscores with spaces", () => {
    expect(normalizeText("real_estate")).toBe("real estate");
    expect(normalizeText("some_long_value")).toBe("some long value");
  });

  it("replaces hyphens with spaces", () => {
    expect(normalizeText("real-estate")).toBe("real estate");
    expect(normalizeText("owner-occupied")).toBe("owner occupied");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeText("too  many   spaces")).toBe("too many spaces");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("handles mixed underscores, hyphens, and spaces", () => {
    expect(normalizeText("real_estate-financing type")).toBe(
      "real estate financing type",
    );
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
    expect(normalizeText("")).toBe("");
  });
});

// =============================================================================
// getStateInfo
// =============================================================================

describe("getStateInfo", () => {
  it("resolves state abbreviation to info", () => {
    const info = getStateInfo("CA");
    expect(info).toEqual({ abbrev: "CA", name: "california" });
  });

  it("resolves full state name to info", () => {
    const info = getStateInfo("california");
    expect(info).toEqual({ abbrev: "CA", name: "california" });
  });

  it("handles case insensitivity for abbreviations", () => {
    // getStateInfo uppercases input, so 'ca' resolves to 'CA'
    expect(getStateInfo("ca")).toEqual({ abbrev: "CA", name: "california" });
    expect(getStateInfo("CA")).not.toBeNull();
  });

  it("handles case insensitivity for full names", () => {
    // getStateInfo lowercases input, so 'California' resolves
    expect(getStateInfo("California")).toEqual({
      abbrev: "CA",
      name: "california",
    });
    expect(getStateInfo("california")).not.toBeNull();
  });

  it("trims whitespace", () => {
    expect(getStateInfo(" CA ")).toEqual({ abbrev: "CA", name: "california" });
    expect(getStateInfo(" california ")).toEqual({
      abbrev: "CA",
      name: "california",
    });
  });

  it("returns null for unknown states", () => {
    expect(getStateInfo("XX")).toBeNull();
    expect(getStateInfo("atlantis")).toBeNull();
    expect(getStateInfo("")).toBeNull();
  });

  it("resolves all 50 states by abbreviation", () => {
    const abbreviations = Object.keys(ABBREV_TO_NAME);
    expect(abbreviations.length).toBe(50);
    for (const abbrev of abbreviations) {
      const info = getStateInfo(abbrev);
      expect(info).not.toBeNull();
      expect(info!.abbrev).toBe(abbrev);
    }
  });

  it("resolves all 50 states by name", () => {
    const names = Object.keys(NAME_TO_ABBREV);
    expect(names.length).toBe(50);
    for (const name of names) {
      const info = getStateInfo(name);
      expect(info).not.toBeNull();
      expect(info!.name).toBe(name);
    }
  });
});

// =============================================================================
// ABBREV_TO_NAME / NAME_TO_ABBREV
// =============================================================================

describe("state mappings", () => {
  it("ABBREV_TO_NAME has 50 entries", () => {
    expect(Object.keys(ABBREV_TO_NAME).length).toBe(50);
  });

  it("NAME_TO_ABBREV has 50 entries", () => {
    expect(Object.keys(NAME_TO_ABBREV).length).toBe(50);
  });

  it("mappings are bidirectional", () => {
    for (const [abbrev, name] of Object.entries(ABBREV_TO_NAME)) {
      expect(NAME_TO_ABBREV[name]).toBe(abbrev);
    }
  });

  it("all abbreviations are 2 uppercase letters", () => {
    for (const abbrev of Object.keys(ABBREV_TO_NAME)) {
      expect(abbrev).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("all names are lowercase", () => {
    for (const name of Object.values(ABBREV_TO_NAME)) {
      expect(name).toBe(name.toLowerCase());
    }
  });
});

// =============================================================================
// UNDERSERVED_STATES_BY_YEAR
// =============================================================================

describe("UNDERSERVED_STATES_BY_YEAR", () => {
  it("has entries for 2022-2025", () => {
    expect(UNDERSERVED_STATES_BY_YEAR[2022]).toBeDefined();
    expect(UNDERSERVED_STATES_BY_YEAR[2023]).toBeDefined();
    expect(UNDERSERVED_STATES_BY_YEAR[2024]).toBeDefined();
    expect(UNDERSERVED_STATES_BY_YEAR[2025]).toBeDefined();
  });

  it("2024 and 2025 are identical", () => {
    expect(UNDERSERVED_STATES_BY_YEAR[2024]).toEqual(
      UNDERSERVED_STATES_BY_YEAR[2025],
    );
  });

  it("all values are valid 2-letter state/territory codes", () => {
    for (const year of [2022, 2023, 2024, 2025]) {
      for (const code of UNDERSERVED_STATES_BY_YEAR[year]) {
        expect(code).toMatch(/^[A-Z]{2}$/);
      }
    }
  });

  it("AZ, CA, CO, FL, NC, TX, VA, WV appear in all years", () => {
    const allYearStates = ["AZ", "CA", "CO", "FL", "NC", "TX", "VA", "WV"];
    for (const year of [2022, 2023, 2024, 2025]) {
      for (const state of allYearStates) {
        expect(UNDERSERVED_STATES_BY_YEAR[year]).toContain(state);
      }
    }
  });

  it("2022 includes territories (VI, AS, GU, MP)", () => {
    expect(UNDERSERVED_STATES_BY_YEAR[2022]).toContain("VI");
    expect(UNDERSERVED_STATES_BY_YEAR[2022]).toContain("AS");
    expect(UNDERSERVED_STATES_BY_YEAR[2022]).toContain("GU");
    expect(UNDERSERVED_STATES_BY_YEAR[2022]).toContain("MP");
  });

  it("2024-2025 includes CT but 2022-2023 do not", () => {
    expect(UNDERSERVED_STATES_BY_YEAR[2024]).toContain("CT");
    expect(UNDERSERVED_STATES_BY_YEAR[2025]).toContain("CT");
    expect(UNDERSERVED_STATES_BY_YEAR[2022]).not.toContain("CT");
    expect(UNDERSERVED_STATES_BY_YEAR[2023]).not.toContain("CT");
  });
});
