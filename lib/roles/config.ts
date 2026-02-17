/**
 * Centralized Role Configuration
 * ==============================
 * Single source of truth for all role-based behavior in tCredex.
 *
 * Three primary org types:
 * - sponsor: Project developers seeking NMTC/HTC financing
 * - cde: Community Development Entities with allocation to deploy
 * - investor: Tax credit buyers/capital providers
 */

export type OrgType = "sponsor" | "cde" | "investor";

// Pipeline stage definitions per role
export interface PipelineStage {
  id: string;
  label: string;
  color: string;
  description: string;
}

export const PIPELINE_STAGES: Record<OrgType, PipelineStage[]> = {
  sponsor: [
    {
      id: "draft",
      label: "Draft",
      color: "gray",
      description: "Deal in preparation",
    },
    {
      id: "submitted",
      label: "Submitted",
      color: "blue",
      description: "Awaiting CDE review",
    },
    {
      id: "loi_received",
      label: "LOI Received",
      color: "purple",
      description: "Letter of Intent from CDE",
    },
    {
      id: "committed",
      label: "Committed",
      color: "emerald",
      description: "Commitment letter signed",
    },
    {
      id: "closing",
      label: "Closing",
      color: "teal",
      description: "In closing process",
    },
  ],
  cde: [
    {
      id: "new",
      label: "New Requests",
      color: "blue",
      description: "Newly matched deals",
    },
    {
      id: "reviewing",
      label: "Reviewing",
      color: "amber",
      description: "Under due diligence",
    },
    {
      id: "loi_issued",
      label: "LOI Issued",
      color: "purple",
      description: "LOI sent to sponsor",
    },
    {
      id: "committed",
      label: "Committed",
      color: "emerald",
      description: "Commitment confirmed",
    },
    {
      id: "closing",
      label: "Closing",
      color: "teal",
      description: "In closing process",
    },
  ],
  investor: [
    {
      id: "reviewing",
      label: "Reviewing",
      color: "amber",
      description: "Evaluating opportunity",
    },
    {
      id: "loi_issued",
      label: "LOI Issued",
      color: "purple",
      description: "LOI submitted",
    },
    {
      id: "committed",
      label: "Committed",
      color: "emerald",
      description: "Investment committed",
    },
    {
      id: "closing",
      label: "Closing",
      color: "teal",
      description: "Closing process",
    },
  ],
};

// Marketplace view configuration per role
export interface MarketplaceConfig {
  entityType: "deals" | "cdes" | "investors" | "sponsors";
  title: string;
  description: string;
  emptyStateMessage: string;
  showMatchScore: boolean;
  showRequestButton: boolean;
  requestButtonLabel: string;
}

export const MARKETPLACE_CONFIG: Record<OrgType, MarketplaceConfig> = {
  sponsor: {
    entityType: "investors", // Sponsors primarily see INVESTORS (LIHTC is bigger market)
    title: "Find Investors & CDEs",
    description:
      "Browse investors seeking tax credit opportunities and CDEs with NMTC allocation",
    emptyStateMessage: "No investors or CDEs match your project criteria yet.",
    showMatchScore: true,
    showRequestButton: true,
    requestButtonLabel: "Request Info",
  },
  cde: {
    entityType: "deals", // CDEs see Projects/Deals
    title: "NMTC Project Pipeline",
    description:
      "Review NMTC projects seeking allocation that match your criteria",
    emptyStateMessage: "No NMTC projects match your investment criteria yet.",
    showMatchScore: true,
    showRequestButton: true,
    requestButtonLabel: "Review Deal",
  },
  investor: {
    entityType: "deals", // Investors see Projects/Deals
    title: "Tax Credit Investment Opportunities",
    description:
      "Discover LIHTC, HTC, OZ, and other tax credit investment opportunities",
    emptyStateMessage: "No investment opportunities match your criteria yet.",
    showMatchScore: true,
    showRequestButton: true,
    requestButtonLabel: "Express Interest",
  },
};

// Map page configuration per role
export interface MapConfig {
  showDealCards: boolean; // Show project/deal markers
  showCDECards: boolean; // Show CDE markers
  showInvestorCards: boolean; // Show investor markers
  cardClickAction: "view_deal" | "view_cde" | "view_investor";
  filterByMatch: boolean;
}

export const MAP_CONFIG: Record<OrgType, MapConfig> = {
  sponsor: {
    showDealCards: false, // Sponsors don't need to see other deals
    showCDECards: true, // Sponsors see CDE locations (for NMTC only)
    showInvestorCards: true, // Sponsors see Investor locations (primary for LIHTC/HTC/OZ)
    cardClickAction: "view_investor", // Primary action is investor (LIHTC is bigger market)
    filterByMatch: true,
  },
  cde: {
    showDealCards: true, // CDEs see NMTC project locations only
    showCDECards: false, // CDEs don't need to see other CDEs
    showInvestorCards: false, // CDEs connect with investors elsewhere
    cardClickAction: "view_deal",
    filterByMatch: true,
  },
  investor: {
    showDealCards: true, // Investors see all project locations (LIHTC, HTC, OZ, NMTC)
    showCDECards: false, // Investors work with CDEs on NMTC deals only
    showInvestorCards: false, // Investors don't need to see other investors
    cardClickAction: "view_deal",
    filterByMatch: true,
  },
};

// Navigation items visibility per role
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  visibleTo: OrgType[];
  requiresAuth: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "home",
    visibleTo: ["sponsor", "cde", "investor"],
    requiresAuth: true,
  },
  {
    id: "marketplace",
    label: "Deals",
    href: "/deals",
    icon: "shopping-cart",
    visibleTo: ["sponsor", "cde", "investor"],
    requiresAuth: false,
  },
  {
    id: "pipeline",
    label: "Pipeline",
    href: "/dashboard/pipeline",
    icon: "funnel",
    visibleTo: ["sponsor", "cde", "investor"],
    requiresAuth: true,
  },
  {
    id: "map",
    label: "Map",
    href: "/map",
    icon: "map",
    visibleTo: ["sponsor", "cde", "investor"],
    requiresAuth: false,
  },
  {
    id: "deals",
    label: "My Deals",
    href: "/dashboard/deals",
    icon: "document",
    visibleTo: ["sponsor"],
    requiresAuth: true,
  },
  {
    id: "allocations",
    label: "Allocations",
    href: "/dashboard/allocations",
    icon: "chart-pie",
    visibleTo: ["cde"],
    requiresAuth: true,
  },
  {
    id: "investments",
    label: "Portfolio",
    href: "/dashboard/portfolio",
    icon: "currency-dollar",
    visibleTo: ["investor"],
    requiresAuth: true,
  },
  {
    id: "intake",
    label: "Submit Deal",
    href: "/dashboard/intake",
    icon: "plus-circle",
    visibleTo: ["sponsor"],
    requiresAuth: true,
  },
];

// Deal card visibility tiers (what info is shown)
export type VisibilityTier = "public" | "expanded" | "full";

export interface DealCardVisibility {
  showProjectName: boolean;
  showSponsorName: boolean;
  showLocation: boolean;
  showAllocation: boolean;
  showCreditPrice: boolean;
  showProgramType: boolean;
  showTractDetails: boolean;
  showCommunityImpact: boolean;
  showFinancials: boolean;
  showContactInfo: boolean;
  showDocuments: boolean;
}

export const DEAL_VISIBILITY: Record<VisibilityTier, DealCardVisibility> = {
  public: {
    showProjectName: true,
    showSponsorName: false, // Anonymized until request
    showLocation: true, // State/City only
    showAllocation: true,
    showCreditPrice: false,
    showProgramType: true,
    showTractDetails: true,
    showCommunityImpact: true,
    showFinancials: false,
    showContactInfo: false,
    showDocuments: false,
  },
  expanded: {
    // CDE view after match/interest
    showProjectName: true,
    showSponsorName: true,
    showLocation: true,
    showAllocation: true,
    showCreditPrice: true,
    showProgramType: true,
    showTractDetails: true,
    showCommunityImpact: true,
    showFinancials: true,
    showContactInfo: false,
    showDocuments: false,
  },
  full: {
    // Investor view after commitment
    showProjectName: true,
    showSponsorName: true,
    showLocation: true,
    showAllocation: true,
    showCreditPrice: true,
    showProgramType: true,
    showTractDetails: true,
    showCommunityImpact: true,
    showFinancials: true,
    showContactInfo: true,
    showDocuments: true,
  },
};

// 3-Request Rule: Anti-abuse limiting for sponsors
export const REQUEST_LIMITS = {
  sponsor: {
    maxConcurrentCDERequests: 3,
    maxConcurrentInvestorRequests: 3,
    cooldownDays: 7, // Days before a declined request slot opens
  },
};

// Helper functions
export function getMarketplaceConfig(
  orgType: OrgType | undefined,
): MarketplaceConfig {
  return MARKETPLACE_CONFIG[orgType || "sponsor"];
}

export function getPipelineStages(
  orgType: OrgType | undefined,
): PipelineStage[] {
  return PIPELINE_STAGES[orgType || "sponsor"];
}

export function getMapConfig(orgType: OrgType | undefined): MapConfig {
  return MAP_CONFIG[orgType || "sponsor"];
}

export function getNavItemsForRole(orgType: OrgType | undefined): NavItem[] {
  if (!orgType) return NAV_ITEMS.filter((item) => !item.requiresAuth);
  return NAV_ITEMS.filter((item) => item.visibleTo.includes(orgType));
}

export function getDealVisibility(tier: VisibilityTier): DealCardVisibility {
  return DEAL_VISIBILITY[tier];
}

export function canAccessPage(
  orgType: OrgType | undefined,
  pageId: string,
): boolean {
  const navItem = NAV_ITEMS.find((item) => item.id === pageId);
  if (!navItem) return false;
  if (!navItem.requiresAuth) return true;
  if (!orgType) return false;
  return navItem.visibleTo.includes(orgType);
}
