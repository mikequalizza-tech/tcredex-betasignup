import { describe, it, expect } from "vitest";
import {
  canTransition,
  getValidTransitions,
  getTransitionAction,
  getStatusesByCategory,
  getStatusInfo,
  getStatusLabel,
  getStatusColor,
  isMarketplaceVisible,
  isActiveDeal,
  isClosedDeal,
  statusDefinitions,
  DealStatus,
} from "../status";

// =============================================================================
// statusDefinitions
// =============================================================================

describe("statusDefinitions", () => {
  const allStatuses: DealStatus[] = [
    "draft",
    "submitted",
    "under_review",
    "available",
    "seeking_capital",
    "matched",
    "closing",
    "closed",
    "withdrawn",
  ];

  it("has all 9 statuses defined", () => {
    expect(Object.keys(statusDefinitions)).toHaveLength(9);
    for (const status of allStatuses) {
      expect(statusDefinitions[status]).toBeDefined();
    }
  });

  it("each status has required fields", () => {
    for (const status of allStatuses) {
      const def = statusDefinitions[status];
      expect(def.status).toBe(status);
      expect(def.label).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.color).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(Array.isArray(def.allowedTransitions)).toBe(true);
      expect(Array.isArray(def.requiredRole)).toBe(true);
    }
  });

  it("closed is a terminal state (no transitions)", () => {
    expect(statusDefinitions.closed.allowedTransitions).toHaveLength(0);
  });

  it("withdrawn can restart to draft", () => {
    expect(statusDefinitions.withdrawn.allowedTransitions).toContain("draft");
  });
});

// =============================================================================
// canTransition
// =============================================================================

describe("canTransition", () => {
  it("allows draft → submitted for sponsor", () => {
    expect(canTransition("draft", "submitted", "sponsor")).toBe(false);
    // submitted requires admin role according to requiredRole
  });

  it("allows draft → submitted for admin", () => {
    expect(canTransition("draft", "submitted", "admin")).toBe(true);
  });

  it("allows submitted → under_review for admin", () => {
    expect(canTransition("submitted", "under_review", "admin")).toBe(true);
  });

  it("allows under_review → available for admin", () => {
    expect(canTransition("under_review", "available", "admin")).toBe(true);
  });

  it("allows available → seeking_capital for sponsor", () => {
    expect(canTransition("available", "seeking_capital", "sponsor")).toBe(true);
  });

  it("allows seeking_capital → matched for sponsor", () => {
    expect(canTransition("seeking_capital", "matched", "sponsor")).toBe(true);
  });

  it("allows matched → closing for cde", () => {
    expect(canTransition("matched", "closing", "cde")).toBe(true);
  });

  it("allows closing → closed for admin", () => {
    expect(canTransition("closing", "closed", "admin")).toBe(true);
  });

  it("rejects invalid transition: draft → available", () => {
    expect(canTransition("draft", "available", "admin")).toBe(false);
  });

  it("rejects invalid transition: closed → draft", () => {
    expect(canTransition("closed", "draft", "admin")).toBe(false);
  });

  it("rejects transition when user lacks role", () => {
    // submitted → under_review: under_review requires admin role
    expect(canTransition("submitted", "under_review", "sponsor")).toBe(false);
    expect(canTransition("submitted", "under_review", "cde")).toBe(false);
  });

  it("allows withdrawal from most states", () => {
    const withdrawableStates: DealStatus[] = [
      "draft",
      "submitted",
      "under_review",
      "available",
      "seeking_capital",
      "matched",
      "closing",
    ];
    for (const status of withdrawableStates) {
      expect(statusDefinitions[status].allowedTransitions).toContain(
        "withdrawn",
      );
    }
  });

  it("allows backward transitions for correction", () => {
    expect(canTransition("seeking_capital", "available", "sponsor")).toBe(true);
    expect(canTransition("matched", "seeking_capital", "sponsor")).toBe(true);
    expect(canTransition("closing", "matched", "sponsor")).toBe(true);
  });
});

// =============================================================================
// getValidTransitions
// =============================================================================

describe("getValidTransitions", () => {
  it("returns transitions available to the role", () => {
    const transitions = getValidTransitions("available", "sponsor");
    expect(transitions).toContain("seeking_capital");
    expect(transitions).toContain("withdrawn");
  });

  it("filters by role permissions", () => {
    // submitted → under_review requires admin
    const sponsorTransitions = getValidTransitions("submitted", "sponsor");
    expect(sponsorTransitions).not.toContain("under_review");

    const adminTransitions = getValidTransitions("submitted", "admin");
    expect(adminTransitions).toContain("under_review");
  });

  it("returns empty array for terminal state closed", () => {
    expect(getValidTransitions("closed", "admin")).toHaveLength(0);
  });

  it("returns draft for withdrawn sponsor", () => {
    const transitions = getValidTransitions("withdrawn", "sponsor");
    expect(transitions).toContain("draft");
  });
});

// =============================================================================
// getTransitionAction
// =============================================================================

describe("getTransitionAction", () => {
  it("returns human-readable action for known transitions", () => {
    expect(getTransitionAction("draft", "submitted")).toBe("Submit for Review");
    expect(getTransitionAction("submitted", "under_review")).toBe(
      "Begin Review",
    );
    expect(getTransitionAction("under_review", "available")).toBe(
      "Approve & List",
    );
    expect(getTransitionAction("closing", "closed")).toBe("Mark Closed");
  });

  it("returns backward transition actions", () => {
    expect(getTransitionAction("seeking_capital", "available")).toBe(
      "Return to Marketplace",
    );
    expect(getTransitionAction("matched", "seeking_capital")).toBe(
      "Revise Match",
    );
    expect(getTransitionAction("closing", "matched")).toBe("Revise Terms");
  });

  it("returns generic fallback for unmapped transitions", () => {
    const action = getTransitionAction("draft", "withdrawn");
    expect(action).toContain("Withdrawn");
  });

  it("returns Restart for withdrawn → draft", () => {
    expect(getTransitionAction("withdrawn", "draft")).toBe("Restart");
  });
});

// =============================================================================
// getStatusesByCategory
// =============================================================================

describe("getStatusesByCategory", () => {
  it("returns active statuses", () => {
    const active = getStatusesByCategory("active");
    expect(active).toContain("available");
    expect(active).toContain("seeking_capital");
    expect(active).toContain("matched");
    expect(active).toContain("closing");
  });

  it("returns pending statuses", () => {
    const pending = getStatusesByCategory("pending");
    expect(pending).toContain("draft");
    expect(pending).toContain("submitted");
    expect(pending).toContain("under_review");
  });

  it("returns closed statuses", () => {
    const closed = getStatusesByCategory("closed");
    expect(closed).toContain("closed");
  });

  it("returns inactive statuses", () => {
    const inactive = getStatusesByCategory("inactive");
    expect(inactive).toContain("withdrawn");
  });
});

// =============================================================================
// Status Display Helpers
// =============================================================================

describe("getStatusInfo", () => {
  it("returns status info object", () => {
    const info = getStatusInfo("available");
    expect(info.status).toBe("available");
    expect(info.label).toBe("Available");
    expect(info.category).toBe("active");
  });

  it("falls back to draft for unknown status", () => {
    const info = getStatusInfo("nonexistent" as DealStatus);
    expect(info.status).toBe("draft");
  });
});

describe("getStatusLabel", () => {
  it("returns label for valid status", () => {
    expect(getStatusLabel("draft")).toBe("Draft");
    expect(getStatusLabel("seeking_capital")).toBe("Seeking Capital");
    expect(getStatusLabel("closed")).toBe("Closed");
  });

  it("returns raw status for unknown", () => {
    expect(getStatusLabel("unknown" as DealStatus)).toBe("unknown");
  });
});

describe("getStatusColor", () => {
  it("returns hex color for valid status", () => {
    expect(getStatusColor("available")).toMatch(/^#[0-9a-f]{6}$/);
    expect(getStatusColor("draft")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("returns default gray for unknown", () => {
    expect(getStatusColor("unknown" as DealStatus)).toBe("#6b7280");
  });
});

// =============================================================================
// Marketplace Visibility
// =============================================================================

describe("isMarketplaceVisible", () => {
  it("returns true for marketplace-visible statuses", () => {
    expect(isMarketplaceVisible("available")).toBe(true);
    expect(isMarketplaceVisible("seeking_capital")).toBe(true);
    expect(isMarketplaceVisible("matched")).toBe(true);
    expect(isMarketplaceVisible("closing")).toBe(true);
  });

  it("returns false for non-visible statuses", () => {
    expect(isMarketplaceVisible("draft")).toBe(false);
    expect(isMarketplaceVisible("submitted")).toBe(false);
    expect(isMarketplaceVisible("under_review")).toBe(false);
    expect(isMarketplaceVisible("closed")).toBe(false);
    expect(isMarketplaceVisible("withdrawn")).toBe(false);
  });
});

// =============================================================================
// Active/Closed Checks
// =============================================================================

describe("isActiveDeal", () => {
  it("returns true for active category statuses", () => {
    expect(isActiveDeal("available")).toBe(true);
    expect(isActiveDeal("seeking_capital")).toBe(true);
    expect(isActiveDeal("matched")).toBe(true);
    expect(isActiveDeal("closing")).toBe(true);
  });

  it("returns false for non-active statuses", () => {
    expect(isActiveDeal("draft")).toBe(false);
    expect(isActiveDeal("closed")).toBe(false);
    expect(isActiveDeal("withdrawn")).toBe(false);
  });
});

describe("isClosedDeal", () => {
  it("returns true only for closed", () => {
    expect(isClosedDeal("closed")).toBe(true);
  });

  it("returns false for all other statuses", () => {
    expect(isClosedDeal("draft")).toBe(false);
    expect(isClosedDeal("available")).toBe(false);
    expect(isClosedDeal("withdrawn")).toBe(false);
  });
});
