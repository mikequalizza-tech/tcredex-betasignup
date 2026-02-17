import { describe, it, expect } from "vitest";
import {
  DOCUMENT_REQUIREMENTS,
  getDocsForChecklistItem,
  getRequirementsForProgram,
  getDocumentCategories,
  blocksClosing,
  getTotalDocsForProgram,
} from "../documentRequirements";

// =============================================================================
// DOCUMENT_REQUIREMENTS
// =============================================================================

describe("DOCUMENT_REQUIREMENTS", () => {
  it("has entries for all programs", () => {
    const programs = new Set(DOCUMENT_REQUIREMENTS.map((r) => r.program));
    expect(programs.has("NMTC")).toBe(true);
    expect(programs.has("HTC")).toBe(true);
    expect(programs.has("LIHTC")).toBe(true);
    expect(programs.has("OZ")).toBe(true);
    expect(programs.has("ALL")).toBe(true);
  });

  it("each requirement has required fields", () => {
    for (const req of DOCUMENT_REQUIREMENTS) {
      expect(req.checklistItem).toBeTruthy();
      expect(Array.isArray(req.requiredDocs)).toBe(true);
      expect(req.requiredDocs.length).toBeGreaterThan(0);
    }
  });

  it("each requirement has a category", () => {
    for (const req of DOCUMENT_REQUIREMENTS) {
      expect(req.category).toBeTruthy();
    }
  });
});

// =============================================================================
// getDocsForChecklistItem
// =============================================================================

describe("getDocsForChecklistItem", () => {
  it("returns docs for known checklist item", () => {
    const docs = getDocsForChecklistItem("QALICB Eligibility Certification");
    expect(docs.length).toBeGreaterThan(0);
    expect(docs).toContain("Organizational Documents");
  });

  it("returns docs for Title & Survey", () => {
    const docs = getDocsForChecklistItem("Title & Survey");
    expect(docs).toContain("Title Commitment");
    expect(docs).toContain("ALTA Survey");
  });

  it("returns empty array for unknown checklist item", () => {
    const docs = getDocsForChecklistItem("Nonexistent Item");
    expect(docs).toHaveLength(0);
  });
});

// =============================================================================
// getRequirementsForProgram
// =============================================================================

describe("getRequirementsForProgram", () => {
  it("returns NMTC-specific and ALL requirements for NMTC", () => {
    const reqs = getRequirementsForProgram("NMTC");
    const programs = new Set(reqs.map((r) => r.program));
    expect(programs.has("NMTC")).toBe(true);
    expect(programs.has("ALL")).toBe(true);
    expect(programs.has("HTC")).toBe(false);
  });

  it("returns HTC-specific and ALL requirements for HTC", () => {
    const reqs = getRequirementsForProgram("HTC");
    const programs = new Set(reqs.map((r) => r.program));
    expect(programs.has("HTC")).toBe(true);
    expect(programs.has("ALL")).toBe(true);
    expect(programs.has("NMTC")).toBe(false);
  });

  it("returns LIHTC-specific and ALL requirements for LIHTC", () => {
    const reqs = getRequirementsForProgram("LIHTC");
    const hasLihtc = reqs.some((r) => r.program === "LIHTC");
    const hasAll = reqs.some((r) => r.program === "ALL");
    expect(hasLihtc).toBe(true);
    expect(hasAll).toBe(true);
  });

  it("returns OZ-specific and ALL requirements for OZ", () => {
    const reqs = getRequirementsForProgram("OZ");
    const hasOz = reqs.some((r) => r.program === "OZ");
    const hasAll = reqs.some((r) => r.program === "ALL");
    expect(hasOz).toBe(true);
    expect(hasAll).toBe(true);
  });

  it("ALL requirements appear in every program query", () => {
    const allReqs = DOCUMENT_REQUIREMENTS.filter((r) => r.program === "ALL");
    for (const program of ["NMTC", "HTC", "LIHTC", "OZ"] as const) {
      const reqs = getRequirementsForProgram(program);
      for (const allReq of allReqs) {
        expect(reqs).toContainEqual(allReq);
      }
    }
  });
});

// =============================================================================
// getDocumentCategories
// =============================================================================

describe("getDocumentCategories", () => {
  it("returns unique categories", () => {
    const categories = getDocumentCategories();
    const unique = new Set(categories);
    expect(categories.length).toBe(unique.size);
  });

  it("includes expected categories", () => {
    const categories = getDocumentCategories();
    expect(categories).toContain("Eligibility");
    expect(categories).toContain("Financing");
    expect(categories).toContain("Real Estate");
    expect(categories).toContain("Legal");
  });

  it("has more than 5 categories", () => {
    expect(getDocumentCategories().length).toBeGreaterThan(5);
  });
});

// =============================================================================
// blocksClosing
// =============================================================================

describe("blocksClosing", () => {
  it("returns true for closing-blocking items", () => {
    expect(blocksClosing("QALICB Eligibility Certification")).toBe(true);
    expect(blocksClosing("Title & Survey")).toBe(true);
    expect(blocksClosing("Legal Opinions")).toBe(true);
  });

  it("returns false for non-blocking items", () => {
    expect(blocksClosing("HTC Part 3 Certification")).toBe(false); // Post-closing
  });

  it("defaults to true for unknown items", () => {
    expect(blocksClosing("Unknown Item")).toBe(true);
  });
});

// =============================================================================
// getTotalDocsForProgram
// =============================================================================

describe("getTotalDocsForProgram", () => {
  it("returns total doc count for NMTC", () => {
    const count = getTotalDocsForProgram("NMTC");
    expect(count).toBeGreaterThan(0);
  });

  it("returns total doc count for HTC", () => {
    const count = getTotalDocsForProgram("HTC");
    expect(count).toBeGreaterThan(0);
  });

  it("returns total doc count for LIHTC", () => {
    const count = getTotalDocsForProgram("LIHTC");
    expect(count).toBeGreaterThan(0);
  });

  it("returns total doc count for OZ", () => {
    const count = getTotalDocsForProgram("OZ");
    expect(count).toBeGreaterThan(0);
  });

  it("NMTC has more docs than OZ (more requirements)", () => {
    expect(getTotalDocsForProgram("NMTC")).toBeGreaterThan(
      getTotalDocsForProgram("OZ"),
    );
  });
});
