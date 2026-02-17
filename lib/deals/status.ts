/**
 * tCredex Deal Status Workflow
 *
 * State machine for deal lifecycle management
 * Defines all statuses, valid transitions, and required actions
 */

export type DealStatus =
  | "draft" // Sponsor started intake but not submitted
  | "submitted" // Intake complete, awaiting review
  | "under_review" // Admin reviewing submission
  | "available" // Live on marketplace, accepting interest
  | "seeking_capital" // Active discussions with CDEs/investors
  | "matched" // Matched with CDE, term sheet stage
  | "closing" // In closing process
  | "closed" // Deal closed and funded
  | "withdrawn"; // Sponsor withdrew or deal expired/declined

export type DealStatusCategory = "active" | "pending" | "closed" | "inactive";

export interface StatusInfo {
  status: DealStatus;
  label: string;
  description: string;
  category: DealStatusCategory;
  color: string;
  icon: string;
  allowedTransitions: DealStatus[];
  requiredRole: ("sponsor" | "cde" | "admin")[];
}

/**
 * Complete status definitions with metadata
 */
export const statusDefinitions: Record<DealStatus, StatusInfo> = {
  draft: {
    status: "draft",
    label: "Draft",
    description: "Intake form started but not submitted",
    category: "pending",
    color: "#6b7280", // gray
    icon: "FileEdit",
    allowedTransitions: ["submitted", "withdrawn"],
    requiredRole: ["sponsor"],
  },
  submitted: {
    status: "submitted",
    label: "Submitted",
    description: "Awaiting admin review",
    category: "pending",
    color: "#3b82f6", // blue
    icon: "Send",
    allowedTransitions: ["under_review", "withdrawn"],
    requiredRole: ["admin"],
  },
  under_review: {
    status: "under_review",
    label: "Under Review",
    description: "Admin is reviewing the submission",
    category: "pending",
    color: "#8b5cf6", // purple
    icon: "Eye",
    allowedTransitions: ["available", "withdrawn"],
    requiredRole: ["admin"],
  },
  available: {
    status: "available",
    label: "Available",
    description: "Live on marketplace",
    category: "active",
    color: "#22c55e", // green
    icon: "Globe",
    allowedTransitions: ["seeking_capital", "withdrawn"],
    requiredRole: ["sponsor", "cde", "admin"],
  },
  seeking_capital: {
    status: "seeking_capital",
    label: "Seeking Capital",
    description: "Active discussions with CDEs and investors",
    category: "active",
    color: "#6366f1", // indigo
    icon: "MessageSquare",
    allowedTransitions: ["matched", "available", "withdrawn"],
    requiredRole: ["sponsor", "cde"],
  },
  matched: {
    status: "matched",
    label: "Matched",
    description: "Matched with CDE, term sheet stage",
    category: "active",
    color: "#0ea5e9", // sky
    icon: "FileText",
    allowedTransitions: ["closing", "seeking_capital", "withdrawn"],
    requiredRole: ["sponsor", "cde"],
  },
  closing: {
    status: "closing",
    label: "Closing",
    description: "In closing process",
    category: "active",
    color: "#14b8a6", // teal
    icon: "Clock",
    allowedTransitions: ["closed", "matched", "withdrawn"],
    requiredRole: ["sponsor", "cde", "admin"],
  },
  closed: {
    status: "closed",
    label: "Closed",
    description: "Deal closed and funded",
    category: "closed",
    color: "#22c55e", // green
    icon: "DollarSign",
    allowedTransitions: [], // Terminal state
    requiredRole: ["admin"],
  },
  withdrawn: {
    status: "withdrawn",
    label: "Withdrawn",
    description: "Sponsor withdrew from marketplace",
    category: "inactive",
    color: "#6b7280", // gray
    icon: "MinusCircle",
    allowedTransitions: ["draft"], // Can restart
    requiredRole: ["sponsor"],
  },
};

/**
 * Check if a status transition is valid
 */
export function canTransition(
  currentStatus: DealStatus,
  newStatus: DealStatus,
  userRole: "sponsor" | "cde" | "admin",
): boolean {
  const currentDef = statusDefinitions[currentStatus];
  const newDef = statusDefinitions[newStatus];

  // Check if transition is allowed
  if (!currentDef.allowedTransitions.includes(newStatus)) {
    return false;
  }

  // Check if user has permission
  if (!newDef.requiredRole.includes(userRole)) {
    return false;
  }

  return true;
}

/**
 * Get all valid next statuses for current state and user
 */
export function getValidTransitions(
  currentStatus: DealStatus,
  userRole: "sponsor" | "cde" | "admin",
): DealStatus[] {
  const currentDef = statusDefinitions[currentStatus];

  return currentDef.allowedTransitions.filter((status) => {
    const targetDef = statusDefinitions[status];
    return targetDef.requiredRole.includes(userRole);
  });
}

/**
 * Get human-readable transition action name
 */
export function getTransitionAction(from: DealStatus, to: DealStatus): string {
  const actionMap: Record<string, string> = {
    "draft->submitted": "Submit for Review",
    "submitted->under_review": "Begin Review",
    "under_review->available": "Approve & List",
    "available->seeking_capital": "Start Discussions",
    "seeking_capital->matched": "Confirm Match",
    "matched->closing": "Begin Closing",
    "closing->closed": "Mark Closed",
    // Backwards/alternative
    "seeking_capital->available": "Return to Marketplace",
    "matched->seeking_capital": "Revise Match",
    "closing->matched": "Revise Terms",
    // Exits
    "withdrawn->draft": "Restart",
  };

  return (
    actionMap[`${from}->${to}`] || `Move to ${statusDefinitions[to].label}`
  );
}

/**
 * Get deals by status category
 */
export function getStatusesByCategory(
  category: DealStatusCategory,
): DealStatus[] {
  return Object.values(statusDefinitions)
    .filter((def) => def.category === category)
    .map((def) => def.status);
}

/**
 * Status display helpers
 */
export function getStatusInfo(status: DealStatus): StatusInfo {
  return statusDefinitions[status] || statusDefinitions.draft;
}

export function getStatusLabel(status: DealStatus): string {
  return statusDefinitions[status]?.label || status;
}

export function getStatusColor(status: DealStatus): string {
  return statusDefinitions[status]?.color || "#6b7280";
}

/**
 * Marketplace visibility check
 */
export function isMarketplaceVisible(status: DealStatus): boolean {
  const visibleStatuses: DealStatus[] = [
    "available",
    "seeking_capital",
    "matched",
    "closing",
  ];
  return visibleStatuses.includes(status);
}

/**
 * Check if deal is in active/working state
 */
export function isActiveDeal(status: DealStatus): boolean {
  return statusDefinitions[status]?.category === "active";
}

/**
 * Check if deal is closed/complete
 */
export function isClosedDeal(status: DealStatus): boolean {
  return statusDefinitions[status]?.category === "closed";
}
