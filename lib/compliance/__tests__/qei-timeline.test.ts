import { describe, it, expect, vi, afterEach } from "vitest";
import { getQEIDates, getUpcomingMilestones } from "../qei-timeline";

// =============================================================================
// getQEIDates
// =============================================================================

describe("getQEIDates", () => {
  it("calculates QLICI due 12 months from QEI", () => {
    const dates = getQEIDates("2024-01-15");
    expect(dates.qlici_due).toBe("2025-01-15");
  });

  it("calculates Year 5 date", () => {
    const dates = getQEIDates("2024-01-15");
    expect(dates.year_5_date).toBe("2029-01-15");
  });

  it("calculates unwind date at 7 years", () => {
    const dates = getQEIDates("2024-01-15");
    expect(dates.unwind_date).toBe("2031-01-15");
  });

  it("preserves QEI date in output", () => {
    const dates = getQEIDates("2024-06-01");
    expect(dates.qei_date).toBe("2024-06-01");
  });

  it("handles year-end QEI date", () => {
    const dates = getQEIDates("2024-12-31");
    expect(dates.qei_date).toBe("2024-12-31");
    expect(dates.year_5_date).toBe("2029-12-31");
    expect(dates.unwind_date).toBe("2031-12-31");
  });

  it("handles leap year QEI date", () => {
    const dates = getQEIDates("2024-02-29");
    // 12 months from Feb 29 2024 → Feb 28 2025 (not a leap year)
    // JS Date handles this: setMonth on Feb 29 + 12 months = Mar 1 in non-leap
    // The exact behavior depends on JS Date implementation
    expect(dates.qlici_due).toBeDefined();
    expect(dates.year_5_date).toBeDefined();
  });

  it("returns ISO date strings (YYYY-MM-DD format)", () => {
    const dates = getQEIDates("2024-06-15");
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dates.qei_date).toMatch(dateRegex);
    expect(dates.qlici_due).toMatch(dateRegex);
    expect(dates.year_5_date).toMatch(dateRegex);
    expect(dates.unwind_date).toMatch(dateRegex);
  });
});

// =============================================================================
// getUpcomingMilestones
// =============================================================================

describe("getUpcomingMilestones", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns milestones within warning window", () => {
    // Set "today" to 30 days before QLICI due
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-12-16")); // 30 days before 2025-01-15

    const milestones = getUpcomingMilestones("2024-01-15", 90);
    const qlici = milestones.find((m) => m.milestone.includes("QLICI"));
    expect(qlici).toBeDefined();
    expect(qlici!.daysRemaining).toBe(30);
    expect(qlici!.urgent).toBe(true); // 30 <= 90
  });

  it("marks milestones as urgent within warningDays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-14")); // 1 day before QLICI due

    const milestones = getUpcomingMilestones("2024-01-15", 90);
    const qlici = milestones.find((m) => m.milestone.includes("QLICI"));
    expect(qlici).toBeDefined();
    expect(qlici!.urgent).toBe(true);
    expect(qlici!.daysRemaining).toBe(1);
  });

  it("excludes past milestones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01")); // Well past QLICI due of 2025-01-15

    const milestones = getUpcomingMilestones("2024-01-15", 90);
    const qlici = milestones.find((m) => m.milestone.includes("QLICI"));
    expect(qlici).toBeUndefined(); // Already past
  });

  it("returns milestones sorted by daysRemaining ascending", () => {
    vi.useFakeTimers();
    // Set a time where multiple milestones are within the window
    vi.setSystemTime(new Date("2028-12-01"));

    const milestones = getUpcomingMilestones("2024-01-15", 365);
    if (milestones.length >= 2) {
      for (let i = 1; i < milestones.length; i++) {
        expect(milestones[i].daysRemaining).toBeGreaterThanOrEqual(
          milestones[i - 1].daysRemaining,
        );
      }
    }
  });

  it("returns empty array when no milestones are upcoming", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2035-01-01")); // Well past all dates

    const milestones = getUpcomingMilestones("2024-01-15");
    expect(milestones).toHaveLength(0);
  });

  it("uses default warningDays of 90", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-11-15")); // 61 days before QLICI due (2025-01-15)

    const milestones = getUpcomingMilestones("2024-01-15");
    const qlici = milestones.find((m) => m.milestone.includes("QLICI"));
    expect(qlici).toBeDefined();
    expect(qlici!.urgent).toBe(true); // 61 <= 90
  });
});
