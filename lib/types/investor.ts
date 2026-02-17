// Investor Types for tCredex Platform
// These types define what Investors share about their investment preferences

import { ProgramType } from "@/lib/data/deals";

// What shows on the Investor Card (for CDEs/Sponsors to see potential capital sources)
export interface InvestorCard {
  id: string;
  organizationId?: string; // organization_id (for linking)

  // Core Identity
  organizationName: string; // organization_name
  primaryContactName?: string; // primary_contact_name
  primaryContactEmail?: string; // primary_contact_email
  primaryContactPhone?: string; // primary_contact_phone

  // Investor Classification
  investorType?: string; // investor_type (e.g., 'bank', 'insurance', 'fund', 'family_office')
  craMotivated: boolean; // cra_motivated - Important for NMTC deals
  accredited: boolean; // accredited investor status

  // Investment Preferences
  minInvestment?: number; // min_investment
  maxInvestment?: number; // max_investment
  targetCreditTypes: ProgramType[]; // target_credit_types[] (NMTC, HTC, LIHTC, OZ)
  targetStates: string[]; // target_states[] (state codes)
  targetSectors: string[]; // target_sectors[] (healthcare, manufacturing, etc.)

  // Track Record
  totalInvestments?: number; // total_investments (count)
  totalInvested?: number; // total_invested ($ amount)

  // Match score (calculated when CDE/Sponsor is viewing)
  matchScore?: number;
  matchReasons?: string[];

  // Status
  status: "active" | "inactive" | "pending";
  lastUpdated?: string;
}

// Investor Profile (full detail view)
export interface InvestorProfile extends InvestorCard {
  // Additional profile fields
  website?: string;
  description?: string;

  // Investment History (for confidence display)
  recentInvestments?: {
    projectName: string;
    programType: ProgramType;
    amount: number;
    year: number;
    state: string;
  }[];

  // Preferences
  preferredDealSize?: {
    min: number;
    max: number;
  };
  preferredClosingTimeline?: number; // months

  // CRA-specific (for banks)
  craAssessmentAreas?: string[]; // Assessment areas for CRA credit
  craTargetPercentage?: number; // Target % for CRA-eligible investments

  createdAt: string;
  verifiedAt?: string;
}

// Investor intake form data
export interface InvestorIntakeData {
  // Step 1: Organization Basics
  organizationName: string;
  investorType: string;
  website?: string;
  description?: string;

  // Step 2: Contact Info
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;

  // Step 3: Investment Preferences
  minInvestment: number;
  maxInvestment: number;
  targetCreditTypes: ProgramType[];
  targetStates: string[];
  targetSectors: string[];
  accredited: boolean;

  // Step 4: CRA Motivation (for banks)
  craMotivated: boolean;
  craAssessmentAreas?: string[];
  craTargetPercentage?: number;

  // Step 5: Track Record
  totalInvestments?: number;
  totalInvested?: number;
}

// Default empty investor intake
export const defaultInvestorIntakeData: InvestorIntakeData = {
  organizationName: "",
  investorType: "bank",
  primaryContactName: "",
  primaryContactEmail: "",
  minInvestment: 1000000,
  maxInvestment: 25000000,
  targetCreditTypes: ["NMTC"],
  targetStates: [],
  targetSectors: [],
  accredited: true,
  craMotivated: false,
};

// Investor type labels
export const INVESTOR_TYPE_LABELS: Record<string, string> = {
  bank: "Bank / Financial Institution",
  insurance: "Insurance Company",
  fund: "Investment Fund",
  family_office: "Family Office",
  cdfi: "CDFI",
  foundation: "Foundation",
  corporate: "Corporate Investor",
  other: "Other",
};
