/**
 * Comprehensive TypeScript definitions for tCredex marketplace
 * Eliminates the need for 'any' types in marketplace-related code
 */

import { Deal } from "@/lib/data/deals";

// ============================================================================
// Base Entity Types
// ============================================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationEntity extends BaseEntity {
  organization_id: string;
  organization_name: string;
}

// ============================================================================
// Deal Types
// ============================================================================

export type DealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "available"
  | "seeking_capital"
  | "matched"
  | "closing"
  | "closed"
  | "withdrawn";

export type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ" | "BROWNFIELD";
export type ProgramLevel = "federal" | "state";

export interface DealFilters {
  creditTypes: ProgramType[];
  includeStateCredits: boolean;
  shovelReadyOnly: boolean;
  seekingAllocation: boolean;
  inClosing: boolean;
  severelyDistressedOnly: boolean;
  qctOnly: boolean;
  areaType: "all" | "rural" | "urban";
  projectTypes: string[];
  allocationRequest: {
    min?: number;
    max?: number;
  };
}

export interface DealWithSponsor extends Deal {
  sponsors?: Sponsor | null;
  sponsor_organization_name?: string;
  sponsor_organization_id?: string;
}

// ============================================================================
// CDE Types
// ============================================================================

export interface CDEDealCard extends BaseEntity {
  organization_id: string;
  organizationName: string;
  missionSnippet?: string;
  headquartersCity?: string;
  headquartersState?: string;
  allocationType: "federal" | "state";
  totalAllocation?: number;
  remainingAllocation?: number;
  dealSizeRange?: {
    min: number;
    max: number;
  };
  primaryStates: string[];
  serviceArea?: string;
  serviceAreaType: "national" | "regional" | "local";
  predominantFinancing?: string;
  targetSectors: string[];
  specialFocus?: string[];
  ruralFocus: boolean;
  urbanFocus: boolean;
  requireSeverelyDistressed: boolean;
  prefersSeverelyDistressed: boolean;
  prefersQct: boolean;
  smallDealFund: boolean;
  nonprofitPreferred: boolean;
  nativeAmericanFocus: boolean;
  htcExperience: boolean;
  minorityFocus: boolean;
  utsFocus: boolean;
  forprofitAccepted: boolean;
}

// ============================================================================
// Investor Types
// ============================================================================

export interface InvestorCard extends BaseEntity {
  organization_id: string;
  organizationName: string;
  investorType: string;
  programs: ProgramType[];
  availableCapital?: number;
  minInvestment: number;
  maxInvestment: number;
  targetGeographies?: string[];
  targetSectors?: string[];
  accredited: boolean;
}

// ============================================================================
// Sponsor Types
// ============================================================================

export interface Sponsor extends OrganizationEntity {
  organization_type: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  woman_owned: boolean;
  minority_owned: boolean;
  veteran_owned: boolean;
  low_income_owned: boolean;
  description?: string;
  website?: string;
  year_founded?: number;
}

// ============================================================================
// User & Role Types
// ============================================================================

export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "MEMBER";
export type OrganizationType = "sponsor" | "cde" | "investor" | "admin";

export interface UserProfile extends BaseEntity {
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  title?: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at?: string;
  role_type: OrganizationType;
  organization_id?: string;
  organization_name?: string;
}

// ============================================================================
// Marketplace Types
// ============================================================================

export type EntityView = "deals" | "cdes" | "investors" | "sponsors";

export interface MarketplaceResult {
  deals: Deal[];
  cdes: CDEDealCard[];
  investors: InvestorCard[];
  sponsors?: Sponsor[];
}

export interface MarketplaceConfig {
  title: string;
  emptyStateMessage: string;
  requestButtonLabel: string;
  showMatchScore: boolean;
}

// ============================================================================
// AutoMatch Types
// ============================================================================

export interface MatchCriteria {
  severelyDistressed: boolean;
  sector: boolean;
  dealSize: boolean;
  smallDealFund: boolean;
  distressPercentile: boolean;
  minorityFocus: boolean;
  utsFocus: boolean;
  entityType: boolean;
  ownerOccupied: boolean;
  tribal: boolean;
  urbanRural: boolean;
  hasAllocation: boolean;
  geographic: boolean;
  financing: boolean;
}

export interface AutoMatchResult {
  cdeId: string;
  score: number;
  reasons: string[];
}

export interface DealMatchCriteria {
  state: string;
  projectType: string;
  projectName: string;
  allocationRequest: number;
  severelyDistressed: boolean;
  isQct: boolean;
  distressScore: number;
  isRural: boolean;
  isNonProfit: boolean;
  isMinorityOwned: boolean;
  isOwnerOccupied: boolean;
  isRealEstate: boolean | undefined;
  isUts: boolean;
  isTribal: boolean;
  allocationType: ProgramLevel;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface DealsApiResponse extends PaginatedResponse<DealWithSponsor> {
  // Additional metadata specific to deals
}

export interface CDEsApiResponse extends PaginatedResponse<CDEDealCard> {
  // Additional metadata specific to CDEs
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export type SortField =
  | "projectName"
  | "sponsorName"
  | "programType"
  | "allocation"
  | "creditPrice"
  | "state"
  | "status"
  | "submittedDate"
  | "organizationName"
  | "remainingAllocation";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => unknown;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Type guard functions
export const isDealStatus = (status: string): status is DealStatus => {
  return [
    "draft",
    "submitted",
    "under_review",
    "available",
    "seeking_capital",
    "matched",
    "closing",
    "closed",
    "withdrawn",
  ].includes(status);
};

export const isProgramType = (program: string): program is ProgramType => {
  return ["NMTC", "HTC", "LIHTC", "OZ", "BROWNFIELD"].includes(program);
};

export const isProgramLevel = (level: string): level is ProgramLevel => {
  return ["federal", "state"].includes(level);
};

export const isOrganizationType = (type: string): type is OrganizationType => {
  return ["sponsor", "cde", "investor", "admin"].includes(type);
};

export const isUserRole = (role: string): role is UserRole => {
  return ["SUPER_ADMIN", "ORG_ADMIN", "MEMBER"].includes(role);
};
