/**
 * Deal Types and Constants
 *
 * Core types for deals - NO MOCK DATA, just type definitions
 */

import { ProjectImage } from "@/types/intake";

// Program Types
export type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ";
export type ProgramLevel = "federal" | "state";
export type TractType = "QCT" | "SD" | "LIC" | "DDA";

// DealStatus - Unified with lib/db/types.ts (the database source of truth)
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

// Financing source/use item
export interface FinancingItem {
  name: string;
  amount: number;
}

// Team member type
export interface TeamMember {
  role: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  status: "Confirmed" | "TBD" | "N/A";
}

// Sponsor Organization Info (for DealCard display)
export interface SponsorInfo {
  organizationName?: string;
  primaryContactName?: string;
  organizationType?: string; // 'nonprofit' | 'forprofit' | 'government' | 'tribal'
  lowIncomeOwned?: boolean;
  womanOwned?: boolean;
  minorityOwned?: boolean;
  veteranOwned?: boolean;
  totalProjectsCompleted?: number;
  totalProjectValue?: number;
  exclusivityAgreed?: boolean;
  exclusivityAgreedAt?: string;
}

// Tribal/Geographic Data (for AIAN tracts)
export interface TribalData {
  state?: string;
  county?: string;
  tract?: string;
  msa2023?: string;
  aian?: number; // American Indian/Alaska Native indicator
  dtsIa?: number; // Distressed Tribal Statistical Area indicator
  geoid?: string;
}

// Deal Interface
export interface Deal {
  id: string;
  projectName: string;
  sponsorName: string;
  sponsorOrganizationId?: string; // For ownership detection
  sponsorDescription?: string;
  website?: string;

  // Sponsor Organization Details
  sponsor?: SponsorInfo;

  programType: ProgramType;
  programs?: ProgramType[]; // Multiple programs supported
  programLevel: ProgramLevel;
  stateProgram?: string;
  allocation: number;
  creditPrice: number;
  state: string;
  city: string;
  address?: string;
  tractType: TractType[];
  status: DealStatus;
  description?: string;
  communityImpact?: string;
  projectHighlights?: string[];
  useOfFunds?: { category: string; amount: number }[];
  timeline?: { milestone: string; date: string; completed: boolean }[];
  foundedYear?: number;
  submittedDate: string;
  povertyRate?: number;
  medianIncome?: number;
  jobsCreated?: number;
  visible: boolean;
  coordinates?: [number, number];
  projectCost?: number;
  financingGap?: number;
  censusTract?: string;
  unemployment?: number;
  shovelReady?: boolean;
  completionDate?: string;

  // Tract Eligibility Details
  tractEligible?: boolean;
  tractSeverelyDistressed?: boolean;
  tractClassification?: string;

  // Tribal/Geographic Data (for AIAN areas)
  tribalData?: TribalData;
  // Additional financial fields for deal cards
  stateNMTCAllocation?: number; // State NMTC allocation request
  htcAmount?: number; // HTC amount (if HTC program)
  // Profile media fields
  logoUrl?: string;
  heroImageUrl?: string;
  projectImages?: ProjectImage[];
  featuredImageId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draftData?: Record<string, any>;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sources?: FinancingItem[];
  uses?: FinancingItem[];
  totalSources?: number;
  totalUses?: number;
  // Extended intake data fields
  zipCode?: string;
  county?: string;
  organizationType?: string;
  projectType?: string;
  ventureType?: string;
  tenantMix?: string;
  // Jobs & Economic Impact
  permanentJobsFTE?: number;
  constructionJobsFTE?: number;
  jobsRetained?: number;
  commercialSqft?: number;
  housingUnits?: number;
  affordableHousingUnits?: number;
  // Community & Social
  communitySupport?: string;
  longTermDevelopment?: string;
  needForNMTC?: string;
  environmentalRemediation?: string;
  leedCertification?: string;
  greenFeatures?: string;
  // Project Readiness
  siteControl?: string;
  phaseIEnvironmental?: string;
  zoningApproval?: string;
  constructionContract?: string;
  entitlementsApproved?: boolean;
  // Team
  projectTeam?: TeamMember[];
  // QALICB Data (NMTC)
  qalicbData?: {
    leverageStructure?: string;
    isProhibitedBusiness?: boolean;
    [key: string]: unknown;
  };
  // HTC Data
  htcData?: {
    historicStatus?: string;
    part1Status?: string;
    part2Status?: string;
    qreAmount?: number;
    [key: string]: unknown;
  };
  // LIHTC Data
  lihtcData?: {
    lihtcType?: string;
    totalUnits?: number;
    affordableUnits?: number;
    [key: string]: unknown;
  };
  // Dates
  constructionStartDate?: string;
  projectedClosingDate?: string;
  // Lifecycle dates
  submittedAt?: string;
  matchedAt?: string;
  closingStartedAt?: string;
  closedAt?: string;

  // Detailed Cost Breakdown (Uses)
  landCost?: number;
  acquisitionCost?: number;
  constructionCost?: number;
  softCosts?: number;
  contingency?: number;
  developerFee?: number;
  financingCosts?: number;
  reserves?: number;

  // Sources Breakdown
  equityAmount?: number;
  debtAmount?: number;
  grantAmount?: number;
  otherAmount?: number;
  committedCapitalPct?: number;

  // Readiness & Scoring
  readinessScore?: number;
  tier?: number;

  // Raw intake data from database (intake_data JSONB column)
  intake_data?: Record<string, unknown>;

  // Enriched/computed fields added by API queries
  matchScore?: number;
  matchReasons?: string[];
  allocations?: Array<{ year: number; amount: number; [key: string]: unknown }>;
  cdeAllocations?: Array<{
    year: number;
    amount: number;
    [key: string]: unknown;
  }>;
  dd_completion?: number;

  // Boolean flags derived from tract/intake data for scoring
  isRural?: boolean;
  isNonProfit?: boolean;
  isMinorityOwned?: boolean;
  isOwnerOccupied?: boolean;
  isUts?: boolean;
  isTribal?: boolean;
}

// Status Configuration
export const STATUS_CONFIG: Record<
  DealStatus,
  { label: string; color: string }
> = {
  draft: { label: "Draft", color: "bg-gray-700 text-gray-400" },
  submitted: { label: "Submitted", color: "bg-blue-900/50 text-blue-400" },
  under_review: {
    label: "Under Review",
    color: "bg-amber-900/50 text-amber-400",
  },
  available: { label: "Available", color: "bg-green-900/50 text-green-400" },
  seeking_capital: {
    label: "Seeking Capital",
    color: "bg-indigo-900/50 text-indigo-400",
  },
  matched: { label: "Matched", color: "bg-purple-900/50 text-purple-400" },
  closing: { label: "Closing", color: "bg-teal-900/50 text-teal-400" },
  closed: { label: "Closed", color: "bg-emerald-900/50 text-emerald-400" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-700 text-gray-400" },
};

// Program Colors
export const PROGRAM_COLORS: Record<
  ProgramType,
  { gradient: string; bg: string; text: string; border: string }
> = {
  NMTC: {
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-900/30",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  HTC: {
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-900/30",
    text: "text-blue-300",
    border: "border-blue-500/30",
  },
  LIHTC: {
    gradient: "from-purple-500 to-pink-600",
    bg: "bg-purple-900/30",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  OZ: {
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-900/30",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
};

// Tract Labels
export const TRACT_LABELS: Record<TractType, string> = {
  QCT: "Qualified Census Tract",
  SD: "Severely Distressed",
  LIC: "Low-Income Community",
  DDA: "Difficult Development Area",
};
