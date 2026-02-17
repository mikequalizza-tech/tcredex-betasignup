import { describe, it, expect } from "vitest";
import {
  canTransitionLOI,
  getNextLOIStates,
  isLOITerminal,
  isLOIActive,
  isLOIAccepted,
  requiresLOISponsorAction,
  requiresLOICDEAction,
  canTransitionCommitment,
  getNextCommitmentStates,
  isCommitmentTerminal,
  isCommitmentActive,
  isCommitmentFullyAccepted,
  requiresCommitmentSponsorAction,
  requiresCommitmentCDEAction,
  requiresCommitmentInvestorAction,
  resolveCommitmentStatus,
  getDealStatusFromLOI,
  getDealStatusFromCommitment,
  isExpired,
  daysUntilExpiry,
  isExpiringWithin,
} from "../stateMachine";
import { LOIStatus, CommitmentStatus } from "@/types/loi";

// =============================================================================
// LOI STATE MACHINE
// =============================================================================

describe("canTransitionLOI", () => {
  it("allows draft → issued", () => {
    expect(canTransitionLOI("draft", "issued")).toBe(true);
  });

  it("allows draft → withdrawn", () => {
    expect(canTransitionLOI("draft", "withdrawn")).toBe(true);
  });

  it("allows issued → pending_sponsor", () => {
    expect(canTransitionLOI("issued", "pending_sponsor")).toBe(true);
  });

  it("allows pending_sponsor → sponsor_accepted", () => {
    expect(canTransitionLOI("pending_sponsor", "sponsor_accepted")).toBe(true);
  });

  it("allows pending_sponsor → sponsor_rejected", () => {
    expect(canTransitionLOI("pending_sponsor", "sponsor_rejected")).toBe(true);
  });

  it("allows pending_sponsor → sponsor_countered", () => {
    expect(canTransitionLOI("pending_sponsor", "sponsor_countered")).toBe(true);
  });

  it("allows sponsor_countered → issued (re-issue)", () => {
    expect(canTransitionLOI("sponsor_countered", "issued")).toBe(true);
  });

  it("rejects invalid transition: draft → sponsor_accepted", () => {
    expect(canTransitionLOI("draft", "sponsor_accepted")).toBe(false);
  });

  it("rejects transition from terminal states", () => {
    expect(canTransitionLOI("sponsor_rejected", "draft")).toBe(false);
    expect(canTransitionLOI("expired", "issued")).toBe(false);
    expect(canTransitionLOI("superseded", "draft")).toBe(false);
  });
});

describe("getNextLOIStates", () => {
  it("returns valid transitions from draft", () => {
    const next = getNextLOIStates("draft");
    expect(next).toContain("issued");
    expect(next).toContain("withdrawn");
  });

  it("returns empty array for terminal states", () => {
    expect(getNextLOIStates("sponsor_rejected")).toHaveLength(0);
    expect(getNextLOIStates("expired")).toHaveLength(0);
    expect(getNextLOIStates("superseded")).toHaveLength(0);
  });
});

describe("isLOITerminal", () => {
  it("returns true for terminal states", () => {
    expect(isLOITerminal("sponsor_rejected")).toBe(true);
    expect(isLOITerminal("expired")).toBe(true);
    expect(isLOITerminal("withdrawn")).toBe(true);
    expect(isLOITerminal("superseded")).toBe(true);
  });

  it("returns false for non-terminal states", () => {
    expect(isLOITerminal("draft")).toBe(false);
    expect(isLOITerminal("issued")).toBe(false);
    expect(isLOITerminal("pending_sponsor")).toBe(false);
  });
});

describe("isLOIActive", () => {
  it("returns true for active statuses", () => {
    expect(isLOIActive("draft")).toBe(true);
    expect(isLOIActive("issued")).toBe(true);
    expect(isLOIActive("pending_sponsor")).toBe(true);
    expect(isLOIActive("sponsor_countered")).toBe(true);
  });

  it("returns false for non-active statuses", () => {
    expect(isLOIActive("sponsor_accepted")).toBe(false);
    expect(isLOIActive("sponsor_rejected")).toBe(false);
    expect(isLOIActive("expired")).toBe(false);
    expect(isLOIActive("withdrawn")).toBe(false);
  });
});

describe("isLOIAccepted", () => {
  it("returns true only for sponsor_accepted", () => {
    expect(isLOIAccepted("sponsor_accepted")).toBe(true);
  });

  it("returns false for all other statuses", () => {
    const others: LOIStatus[] = [
      "draft",
      "issued",
      "pending_sponsor",
      "sponsor_rejected",
      "sponsor_countered",
      "expired",
      "withdrawn",
      "superseded",
    ];
    for (const s of others) {
      expect(isLOIAccepted(s)).toBe(false);
    }
  });
});

describe("requiresLOISponsorAction", () => {
  it("returns true only for pending_sponsor", () => {
    expect(requiresLOISponsorAction("pending_sponsor")).toBe(true);
  });

  it("returns false for other states", () => {
    expect(requiresLOISponsorAction("draft")).toBe(false);
    expect(requiresLOISponsorAction("issued")).toBe(false);
    expect(requiresLOISponsorAction("sponsor_accepted")).toBe(false);
  });
});

describe("requiresLOICDEAction", () => {
  it("returns true for draft and sponsor_countered", () => {
    expect(requiresLOICDEAction("draft")).toBe(true);
    expect(requiresLOICDEAction("sponsor_countered")).toBe(true);
  });

  it("returns false for other states", () => {
    expect(requiresLOICDEAction("issued")).toBe(false);
    expect(requiresLOICDEAction("pending_sponsor")).toBe(false);
    expect(requiresLOICDEAction("sponsor_accepted")).toBe(false);
  });
});

// =============================================================================
// COMMITMENT STATE MACHINE
// =============================================================================

describe("canTransitionCommitment", () => {
  it("allows draft → issued", () => {
    expect(canTransitionCommitment("draft", "issued")).toBe(true);
  });

  it("allows issued → pending_sponsor", () => {
    expect(canTransitionCommitment("issued", "pending_sponsor")).toBe(true);
  });

  it("allows issued → pending_cde", () => {
    expect(canTransitionCommitment("issued", "pending_cde")).toBe(true);
  });

  it("allows dual acceptance flow: sponsor_accepted → all_accepted", () => {
    expect(canTransitionCommitment("sponsor_accepted", "all_accepted")).toBe(
      true,
    );
  });

  it("allows dual acceptance flow: cde_accepted → all_accepted", () => {
    expect(canTransitionCommitment("cde_accepted", "all_accepted")).toBe(true);
  });

  it("allows sponsor_accepted → pending_cde", () => {
    expect(canTransitionCommitment("sponsor_accepted", "pending_cde")).toBe(
      true,
    );
  });

  it("allows cde_accepted → pending_sponsor", () => {
    expect(canTransitionCommitment("cde_accepted", "pending_sponsor")).toBe(
      true,
    );
  });

  it("rejects transitions from terminal states", () => {
    expect(canTransitionCommitment("rejected", "draft")).toBe(false);
    expect(canTransitionCommitment("expired", "issued")).toBe(false);
  });
});

describe("getNextCommitmentStates", () => {
  it("returns valid transitions from issued", () => {
    const next = getNextCommitmentStates("issued");
    expect(next).toContain("pending_sponsor");
    expect(next).toContain("pending_cde");
    expect(next).toContain("withdrawn");
  });

  it("returns empty array for terminal states", () => {
    expect(getNextCommitmentStates("rejected")).toHaveLength(0);
    expect(getNextCommitmentStates("expired")).toHaveLength(0);
  });
});

describe("isCommitmentTerminal", () => {
  it("returns true for terminal states", () => {
    expect(isCommitmentTerminal("rejected")).toBe(true);
    expect(isCommitmentTerminal("expired")).toBe(true);
    expect(isCommitmentTerminal("withdrawn")).toBe(true);
    expect(isCommitmentTerminal("superseded")).toBe(true);
  });

  it("returns false for non-terminal states", () => {
    expect(isCommitmentTerminal("draft")).toBe(false);
    expect(isCommitmentTerminal("all_accepted")).toBe(false);
  });
});

describe("isCommitmentActive", () => {
  it("returns true for active statuses", () => {
    const active: CommitmentStatus[] = [
      "draft",
      "issued",
      "pending_sponsor",
      "pending_cde",
      "sponsor_accepted",
      "cde_accepted",
    ];
    for (const s of active) {
      expect(isCommitmentActive(s)).toBe(true);
    }
  });

  it("returns false for terminal and fully accepted", () => {
    expect(isCommitmentActive("all_accepted")).toBe(false);
    expect(isCommitmentActive("rejected")).toBe(false);
    expect(isCommitmentActive("expired")).toBe(false);
  });
});

describe("isCommitmentFullyAccepted", () => {
  it("returns true only for all_accepted", () => {
    expect(isCommitmentFullyAccepted("all_accepted")).toBe(true);
  });

  it("returns false for partial acceptance", () => {
    expect(isCommitmentFullyAccepted("sponsor_accepted")).toBe(false);
    expect(isCommitmentFullyAccepted("cde_accepted")).toBe(false);
  });
});

describe("requiresCommitmentSponsorAction", () => {
  it("returns true only for pending_sponsor", () => {
    expect(requiresCommitmentSponsorAction("pending_sponsor")).toBe(true);
    expect(requiresCommitmentSponsorAction("pending_cde")).toBe(false);
  });
});

describe("requiresCommitmentCDEAction", () => {
  it("returns true only for pending_cde", () => {
    expect(requiresCommitmentCDEAction("pending_cde")).toBe(true);
    expect(requiresCommitmentCDEAction("pending_sponsor")).toBe(false);
  });
});

describe("requiresCommitmentInvestorAction", () => {
  it("returns true only for draft", () => {
    expect(requiresCommitmentInvestorAction("draft")).toBe(true);
    expect(requiresCommitmentInvestorAction("issued")).toBe(false);
  });
});

// =============================================================================
// resolveCommitmentStatus
// =============================================================================

describe("resolveCommitmentStatus", () => {
  it("returns all_accepted when both accepted (with CDE)", () => {
    expect(
      resolveCommitmentStatus({
        sponsor_accepted: true,
        cde_accepted: true,
        requires_cde: true,
      }),
    ).toBe("all_accepted");
  });

  it("returns all_accepted when sponsor accepted and CDE not required", () => {
    expect(
      resolveCommitmentStatus({
        sponsor_accepted: true,
        cde_accepted: false,
        requires_cde: false,
      }),
    ).toBe("all_accepted");
  });

  it("returns pending_cde when sponsor accepted but CDE still needed", () => {
    expect(
      resolveCommitmentStatus({
        sponsor_accepted: true,
        cde_accepted: false,
        requires_cde: true,
      }),
    ).toBe("pending_cde");
  });

  it("returns pending_sponsor when CDE accepted but sponsor has not", () => {
    expect(
      resolveCommitmentStatus({
        sponsor_accepted: false,
        cde_accepted: true,
        requires_cde: true,
      }),
    ).toBe("pending_sponsor");
  });

  it("returns issued when neither accepted", () => {
    expect(
      resolveCommitmentStatus({
        sponsor_accepted: false,
        cde_accepted: false,
        requires_cde: true,
      }),
    ).toBe("issued");
  });
});

// =============================================================================
// Deal Status Mapping
// =============================================================================

describe("getDealStatusFromLOI", () => {
  it("maps active LOI statuses to loi_pending", () => {
    expect(getDealStatusFromLOI("issued")).toBe("loi_pending");
    expect(getDealStatusFromLOI("pending_sponsor")).toBe("loi_pending");
    expect(getDealStatusFromLOI("sponsor_countered")).toBe("loi_pending");
  });

  it("maps sponsor_accepted to seeking_capital", () => {
    expect(getDealStatusFromLOI("sponsor_accepted")).toBe("seeking_capital");
  });

  it("maps draft/terminal to seeking_allocation", () => {
    expect(getDealStatusFromLOI("draft")).toBe("seeking_allocation");
    expect(getDealStatusFromLOI("sponsor_rejected")).toBe("seeking_allocation");
    expect(getDealStatusFromLOI("expired")).toBe("seeking_allocation");
    expect(getDealStatusFromLOI("withdrawn")).toBe("seeking_allocation");
  });
});

describe("getDealStatusFromCommitment", () => {
  it("maps active commitment statuses to commitment_pending", () => {
    expect(getDealStatusFromCommitment("issued")).toBe("commitment_pending");
    expect(getDealStatusFromCommitment("pending_sponsor")).toBe(
      "commitment_pending",
    );
    expect(getDealStatusFromCommitment("pending_cde")).toBe(
      "commitment_pending",
    );
    expect(getDealStatusFromCommitment("sponsor_accepted")).toBe(
      "commitment_pending",
    );
    expect(getDealStatusFromCommitment("cde_accepted")).toBe(
      "commitment_pending",
    );
  });

  it("maps all_accepted to committed", () => {
    expect(getDealStatusFromCommitment("all_accepted")).toBe("committed");
  });

  it("maps terminal states to seeking_capital", () => {
    expect(getDealStatusFromCommitment("draft")).toBe("seeking_capital");
    expect(getDealStatusFromCommitment("rejected")).toBe("seeking_capital");
    expect(getDealStatusFromCommitment("expired")).toBe("seeking_capital");
    expect(getDealStatusFromCommitment("withdrawn")).toBe("seeking_capital");
  });
});

// =============================================================================
// Expiration Logic
// =============================================================================

describe("isExpired", () => {
  it("returns true for past dates", () => {
    expect(isExpired("2020-01-01")).toBe(true);
  });

  it("returns false for future dates", () => {
    expect(isExpired("2099-01-01")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isExpired(null)).toBe(false);
    expect(isExpired(undefined)).toBe(false);
  });
});

describe("daysUntilExpiry", () => {
  it("returns null for null/undefined", () => {
    expect(daysUntilExpiry(null)).toBeNull();
    expect(daysUntilExpiry(undefined)).toBeNull();
  });

  it("returns negative for past dates", () => {
    const result = daysUntilExpiry("2020-01-01");
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(0);
  });

  it("returns positive for future dates", () => {
    const result = daysUntilExpiry("2099-01-01");
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });
});

describe("isExpiringWithin", () => {
  it("returns false for null", () => {
    expect(isExpiringWithin(null, 30)).toBe(false);
  });

  it("returns false for past dates", () => {
    expect(isExpiringWithin("2020-01-01", 30)).toBe(false);
  });

  it("returns false for far future dates", () => {
    expect(isExpiringWithin("2099-01-01", 30)).toBe(false);
  });
});
