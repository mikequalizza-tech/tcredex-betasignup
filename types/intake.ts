/**
 * tCredex Intake Form v4 - Complete Type Definitions
 * Single source of truth for all intake data structures
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ" | "Brownfield";
export type ProgramLevel = "federal" | "state";

export type OrganizationType =
  | "For-profit"
  | "Non-profit"
  | "Not-for-profit"
  | "Government"
  | "Tribal";
export type TriState = "Yes" | "No" | "Don't Know";
export type YesNo = "Yes" | "No";

export type SiteControlStatus =
  | "Owned"
  | "Under Contract"
  | "LOI"
  | "Negotiations"
  | "Sale to Related"
  | "None";
export type DueDiligenceStatus =
  | "Complete"
  | "In Progress"
  | "Not Started"
  | "Not Needed"
  | "Target Date";
export type DesignProgress = "Complete" | "Underway" | "Not Started";
export type CostEstimateBasis =
  | "Developer"
  | "Architect"
  | "Contractor"
  | "Third Party";

// Shovel-ready status for AutoMatch
export type ShovelReadyStatus = "Yes" | "No" | "Within 6 months";

// Standardized sector categories for AutoMatch
export type SectorCategory =
  | "Healthcare/Medical"
  | "Education/Schools"
  | "Housing/Residential"
  | "Industrial/Manufacturing"
  | "Retail/Commercial"
  | "Food Access/Grocery"
  | "Childcare/Early Education"
  | "Senior Services"
  | "Community Facility"
  | "Mixed-Use"
  | "Other";

export type LeverageStructure = "standard" | "self-leverage" | "hybrid";
export type HistoricStatus = "listed" | "contributing" | "pending" | "none";
export type PartStatus = "approved" | "submitted" | "not_started";
export type LIHTCType = "9%" | "4%";

export type TractType = "QCT" | "SD" | "LIC" | "DDA";

// =============================================================================
// DOCUMENT UPLOAD TYPES
// =============================================================================

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  category: DocumentCategory;
  tags: string[];
  uploadedAt: string;
  uploadedBy?: string;
  status: "pending" | "approved" | "rejected" | "needs_review";
  notes?: string;
}

export type DocumentCategory =
  | "legal"
  | "financial"
  | "environmental"
  | "construction"
  | "qalicb"
  | "entitlements"
  | "insurance"
  | "appraisal"
  | "market_study"
  | "tax"
  | "other";

export interface DocumentRequirement {
  id: string;
  name: string;
  category: DocumentCategory;
  required: boolean;
  programs: ProgramType[];
  description?: string;
  accepted?: boolean;
}

// =============================================================================
// PROJECT IMAGE TYPE
// =============================================================================

export interface ProjectImage {
  id?: string; // Stable unique identifier
  name: string;
  url: string; // Base64 data URL or server URL
  size: number;
  type?: string; // MIME type
  file?: File; // Only used during upload, not persisted
}

// =============================================================================
// FINANCING SOURCE TYPE
// =============================================================================

export interface FinancingSource {
  id: string;
  type: "Equity" | "Debt" | "Grant" | "Tax Credit" | "Other";
  source: string;
  amount: number;
  status: "Committed" | "Pending" | "Applied" | "Anticipated";
  notes?: string;
}

// =============================================================================
// TEAM MEMBER TYPE
// =============================================================================

export interface TeamMember {
  role: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  status: "Confirmed" | "TBD" | "N/A";
}

// =============================================================================
// MAIN INTAKE DATA INTERFACE
// =============================================================================

export interface IntakeData {
  // -------------------------------------------------------------------------
  // SECTION 1: GENERAL INFORMATION
  // -------------------------------------------------------------------------
  projectName?: string;
  dateSubmitted?: string;
  personCompletingForm?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // -------------------------------------------------------------------------
  // SECTION 2: SPONSOR INFORMATION
  // -------------------------------------------------------------------------
  sponsorName?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  organizationType?: OrganizationType;
  lowIncomeOwned?: TriState; // >50% LI board/ownership
  womanOwned?: YesNo;
  minorityOwned?: YesNo;
  veteranOwned?: YesNo;
  isOwnerOccupied?: boolean; // Sponsor will occupy the facility (NMTC: matches both RE and Business CDEs)

  // -------------------------------------------------------------------------
  // SECTION 3: PROJECT LOCATION
  // -------------------------------------------------------------------------
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  censusTract?: string;
  latitude?: number;
  longitude?: number;

  // Tract eligibility data (auto-populated)
  tractType?: TractType[];
  tractPovertyRate?: number;
  tractMedianIncome?: number;
  tractUnemployment?: number;
  tractEligible?: boolean;
  tractSeverelyDistressed?: boolean;
  tractClassification?: string;
  tractCounty?: string;
  tractState?: string;

  // AutoMatch tract data (auto-populated from tract API)
  isRural?: boolean; // Rural/Urban classification
  isUts?: boolean; // Underserved Targeted State
  isTribal?: boolean; // Tribal/AIAN area
  isAian?: boolean; // American Indian/Alaska Native area

  // TIF/EZ District
  inTifEzDistrict?: TriState;
  tifEzDescription?: string;

  // -------------------------------------------------------------------------
  // SECTION 4: PROJECT DESCRIPTION
  // -------------------------------------------------------------------------
  projectType?: string; // Real Estate subcategory (legacy)
  sectorCategory?: SectorCategory; // Standardized sector for AutoMatch
  ventureType?: "Real Estate" | "Business";
  projectDescription?: string;
  tenantMix?: string;
  projectImages?: ProjectImage[];
  featuredImageId?: string; // ID of the selected hero image

  // -------------------------------------------------------------------------
  // SECTION 5: SOCIAL INVESTMENT CRITERIA
  // -------------------------------------------------------------------------
  communitySupport?: string; // Local support narrative
  longTermDevelopment?: string; // Sustainable development contribution
  communityImpact?: string; // General impact statement

  // Environmental
  environmentalRemediation?: TriState;
  environmentalDescription?: string;

  // LEED / Green
  leedCertifiable?: TriState;
  leedCertificationSought?: TriState;
  leedLevel?: "Platinum" | "Gold" | "Silver" | "Certified";
  greenFeatures?: string;

  // -------------------------------------------------------------------------
  // SECTION 6: ECONOMIC & SOCIAL BENEFITS
  // -------------------------------------------------------------------------
  // Jobs
  permanentJobsFTE?: number;
  permanentJobsBasis?: string;
  permanentJobsBreakdown?: string;
  jobsValueToLIC?: string;

  constructionJobsFTE?: number;
  constructionJobsBasis?: string;

  jobsCreated?: number; // Legacy/simple field
  jobsRetained?: number;

  // Commercial Space
  commercialSqft?: number;
  commercialValueToLIC?: string;
  sqFootage?: number; // Legacy field

  // Community Facility
  communityFacilitySqft?: number;
  communityFacilityCapacity?: number;
  communityFacilityBasis?: string;

  // Housing
  housingUnits?: number;
  housingDescription?: string;
  affordableHousingUnits?: number;
  affordableHousingDescription?: string;

  // Need Statement
  needForNMTC?: string;
  communityBenefit?: string; // Legacy field

  // Community Benefits (for AutoMatch)
  hasDocumentedCommunityBenefits?: boolean; // Confirmed documented community benefits

  // -------------------------------------------------------------------------
  // SECTION 7: PROJECT TEAM
  // -------------------------------------------------------------------------
  projectTeam?: TeamMember[];

  // Individual team role fields (for simpler forms)
  architect?: string;
  generalContractor?: string;
  constructionManager?: string;
  ownersRepresentative?: string;
  leasingAgent?: string;
  propertyManager?: string;
  accountantReporting?: string;
  complianceReporter?: string;
  fundraiser?: string;
  nmtcConsultant?: string;
  nmtcAttorney?: string;
  nmtcAccountantModeler?: string;

  // -------------------------------------------------------------------------
  // SECTION 8: PROJECT FINANCING
  // -------------------------------------------------------------------------
  totalProjectCost?: number;
  nmtcFinancingRequested?: number;
  nmtcFinancingBasis?: string;
  financingGap?: number;
  requestedAllocation?: number; // Legacy field

  // Cost breakdown
  landCost?: number;
  acquisitionCost?: number;
  constructionCost?: number;
  softCosts?: number;
  contingency?: number;
  developerFee?: number;
  financingCosts?: number;
  reserves?: number;

  // Capital stack
  equityAmount?: number;
  debtAmount?: number;
  grantAmount?: number;
  otherAmount?: number;
  committedCapitalPct?: number;

  // Other financing sources
  financingSources?: FinancingSource[];
  primaryNMTCNeed?: "Capital gap" | "Reduce debt service" | "Other";

  // -------------------------------------------------------------------------
  // SECTION 9: PROJECT READINESS
  // -------------------------------------------------------------------------
  // Shovel-Ready Status (for AutoMatch)
  isShovelReady?: ShovelReadyStatus; // Explicit shovel-ready question

  // Site Control
  siteControl?: SiteControlStatus;
  siteControlDate?: string;
  siteControlContractExpires?: string;

  // Due Diligence Status
  phaseIEnvironmental?: DueDiligenceStatus;
  phaseIEnvironmentalDate?: string;
  phaseIIEnvironmental?: DueDiligenceStatus;
  phaseIIEnvironmentalDate?: string;
  noFurtherActionLetter?: DueDiligenceStatus;
  geotechSoilsStudy?: DueDiligenceStatus;
  marketStudy?: DueDiligenceStatus;
  acquisitionAppraisal?: DueDiligenceStatus;
  asBuiltAppraisal?: DueDiligenceStatus;
  dueDiligenceNotNeededExplanation?: string;

  // Design Progress
  schematicPlans?: DesignProgress;
  schematicPlansPercent?: number;
  fullArchitecturalDrawings?: DesignProgress;
  architecturalDrawingsPercent?: number;
  constructionDrawings?: DesignProgress;
  constructionDrawingsPercent?: number;

  // Entitlements
  zoningApproval?: DueDiligenceStatus;
  buildingPermits?: DueDiligenceStatus;
  entitlementsApproved?: boolean;
  entitlementsSubmitted?: boolean;
  entitlementsStarted?: boolean;
  zoningApproved?: boolean;

  // Construction Contracting
  constructionContract?: TriState;
  gmpContract?: TriState;
  nonGmpExplanation?: string;
  paymentPerformanceBond?: TriState;
  bondExplanation?: string;
  hardCostEstimateBasis?: CostEstimateBasis;

  // Timeline
  constructionStartMonths?: number;
  constructionStartDate?: string;
  projectedCompletionDate?: string;
  projectedClosingDate?: string;
  earliestCloseDate?: string;
  latestCloseDate?: string;
  closingDateDriver?: string;

  // -------------------------------------------------------------------------
  // PROGRAMS SELECTED
  // -------------------------------------------------------------------------
  programs?: ProgramType[];
  programLevel?: ProgramLevel[];
  stateProgram?: string;

  // -------------------------------------------------------------------------
  // PART B: QALICB ELIGIBILITY TESTS (NMTC)
  // -------------------------------------------------------------------------

  // Test 1: Services Test
  hasEmployees?: boolean;
  servicesOtherLocations?: boolean;
  servicesTest40PctRepresentation?: boolean;
  allLocationsDisclosed?: boolean;
  providesHealthInsurance?: boolean;
  continuesHealthInsurance?: boolean;
  providesRetirementBenefits?: boolean;
  continuesRetirementBenefits?: boolean;

  // Test 2: Tangible Property Test
  tangiblePropertyOtherLocations?: boolean;
  tangibleProperty40PctRepresentation?: boolean;

  // Simplified percentage inputs (UI sliders)
  qalicbGrossIncome?: number; // % for gross income test
  qalicbTangibleProperty?: number; // % for tangible property test
  qalicbEmployeeServices?: number; // % for services test

  // Test 10: Gross Income Test
  grossIncomeOtherLocations?: boolean;
  grossIncome50PctRepresentation?: boolean;

  // Test 11: Collectibles Test
  holdsCollectibles?: boolean;
  collectiblesUnder5Pct?: boolean;
  collectibles7YrRepresentation?: boolean;

  // Test 12: Non-Qualified Financial Property Test
  holdsNQFP?: boolean;
  nqfpUnder5Pct?: boolean;
  nqfp7YrRepresentation?: boolean;

  // Test 13: LIC Reasonable Expectation
  intends7YrOperation?: boolean;
  leasingLandBuildings?: boolean;
  leaseYearsRemaining?: number;
  expansionPlans7Yr?: boolean;

  // Test 14: Excluded Business
  isProhibitedBusiness?: boolean;
  primarilyRentalDevelopment?: boolean;
  excludedMassageParlor?: boolean;
  excludedHotTub?: boolean;
  excludedSuntan?: boolean;
  excludedCountryClub?: boolean;
  excludedGambling?: boolean;
  excludedAlcoholSales?: boolean;
  excludedIntangibles?: boolean;
  excludedGolfCourse?: boolean;
  excludedFarming?: boolean;

  // Test 15: Active Conduct
  activePrimarilyRental?: boolean;
  currentlyGeneratingRevenue?: boolean;
  revenueContinuationExpectation?: boolean;
  revenueStart3YrExpectation?: boolean;

  // Test 16: Related Party
  commonMgmtOwnershipTCredex?: boolean;
  postCloseCommonMgmt?: boolean;

  // Test 17: Rental Income
  derivesRentalIncome?: boolean;
  rentalPropertyListing?: string;

  // Leverage Structure
  leverageStructure?: LeverageStructure;

  // -------------------------------------------------------------------------
  // HTC SECTION
  // -------------------------------------------------------------------------
  htcTypes?: ("federal" | "state")[];
  historicStatus?: HistoricStatus;
  part1Status?: PartStatus;
  part2Status?: PartStatus;
  qreAmount?: number;
  hasStateHTC?: boolean;
  stateHTCState?: string;
  stateHTCRate?: number;
  htcRehabilitationScope?: string;
  htcSecretaryStandardsCompliance?: string;
  htcEligibleCostBreakdown?: number;
  htcSHPOCorrespondence?: string;

  // -------------------------------------------------------------------------
  // LIHTC SECTION
  // -------------------------------------------------------------------------
  totalUnits?: number;
  affordableUnits?: number;
  amiTargets?: number[];
  lihtcType?: LIHTCType;
  lihtcTotalUnits?: number;
  lihtcAffordableUnits?: number;
  lihtcAffordabilityLevels?: string;
  lihtcCompliancePeriod?: number;
  lihtcTenantVerification?: string;
  lihtcTenantSelection?: string;
  lihtcFairHousing?: string;
  lihtcRentCalculation?: string;

  // -------------------------------------------------------------------------
  // OZ SECTION
  // -------------------------------------------------------------------------
  ozInvestmentDate?: string;
  substantialImprovement?: boolean;
  holdingPeriod?: number;
  ozQualifyingBasis?: number;
  ozCapitalGainDeferred?: number;

  // -------------------------------------------------------------------------
  // DOCUMENTS
  // -------------------------------------------------------------------------
  documents?: UploadedDocument[];
  docsUploaded?: number;
  docsRequired?: number;

  // -------------------------------------------------------------------------
  // PLATFORM AGREEMENTS
  // -------------------------------------------------------------------------
  exclusivityAgreed?: boolean;
  exclusivityAgreedAt?: string;
  termsAgreed?: boolean;
  termsAgreedAt?: string;

  // -------------------------------------------------------------------------
  // METADATA
  // -------------------------------------------------------------------------
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  status?: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  readinessScore?: number;
  tier?: 1 | 2 | 3;

  // Catch-all for dynamic fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- IntakeData is a JSONB bag with dynamic keys; index signature must be `any` to allow typed properties above
  [key: string]: any;
}

// =============================================================================
// TIER DEFINITIONS
// =============================================================================

export interface TierRequirements {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  minScore: number;
  requiredFields: (keyof IntakeData)[];
  unlocks: string[];
}

export const TIER_CONFIG: TierRequirements[] = [
  {
    tier: 1,
    name: "DealCard Ready",
    description: "Minimum viable submission for marketplace listing",
    minScore: 25, // ~25% of Tier 1 fields: org info, address, project type, tax credit
    requiredFields: [
      "projectName",
      "sponsorName",
      "address",
      "city",
      "state",
      "censusTract",
      "programs",
      "totalProjectCost",
      "financingGap",
    ],
    unlocks: ["DealCard generation", "Marketplace listing", "CDE matching"],
  },
  {
    tier: 2,
    name: "Project Profile Ready",
    description: "Full profile for investor review",
    minScore: 55, // ~55-65%: paragraphs, pictures, Sources/Uses, Gap, QALICB
    requiredFields: [
      "projectDescription",
      "communityImpact",
      "permanentJobsFTE",
      "constructionJobsFTE",
      "siteControl",
      "constructionStartDate",
      "qalicbGrossIncome",
      "qalicbTangibleProperty",
      "qalicbEmployeeServices",
      "isProhibitedBusiness",
    ],
    unlocks: ["Project Profile", "Investor visibility", "Pricing estimates"],
  },
  {
    tier: 3,
    name: "Due Diligence Ready",
    description: "Complete package for closing",
    minScore: 80, // ~80%+: more details + Due Diligence docs
    requiredFields: [
      "phaseIEnvironmental",
      "zoningApproval",
      "buildingPermits",
      "constructionDrawings",
      "constructionContract",
    ],
    unlocks: [
      "Due diligence checklist",
      "Closing room access",
      "Final pricing",
    ],
  },
];

// =============================================================================
// DOCUMENT REQUIREMENTS BY PROGRAM
// =============================================================================

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  // Legal
  {
    id: "org_docs",
    name: "Organizational Documents",
    category: "legal",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "title_report",
    name: "Title Report / Commitment",
    category: "legal",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "purchase_agreement",
    name: "Purchase Agreement / Contract",
    category: "legal",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "legal_opinion",
    name: "Legal Opinion",
    category: "legal",
    required: false,
    programs: ["NMTC"],
  },

  // Financial
  {
    id: "financial_statements",
    name: "Financial Statements (3 years)",
    category: "financial",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "projections",
    name: "Financial Projections",
    category: "financial",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "sources_uses",
    name: "Sources & Uses",
    category: "financial",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "operating_proforma",
    name: "Operating Pro Forma (10-year)",
    category: "financial",
    required: true,
    programs: ["NMTC", "LIHTC"],
  },
  {
    id: "development_budget",
    name: "Development Budget",
    category: "financial",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },

  // Environmental
  {
    id: "phase_i",
    name: "Phase I Environmental",
    category: "environmental",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ", "Brownfield"],
  },
  {
    id: "phase_ii",
    name: "Phase II Environmental",
    category: "environmental",
    required: false,
    programs: ["NMTC", "HTC", "LIHTC", "OZ", "Brownfield"],
  },
  {
    id: "nfa_letter",
    name: "No Further Action Letter",
    category: "environmental",
    required: false,
    programs: ["Brownfield"],
  },

  // Construction
  {
    id: "construction_contract",
    name: "Construction Contract",
    category: "construction",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC"],
  },
  {
    id: "architect_agreement",
    name: "Architect Agreement",
    category: "construction",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC"],
  },
  {
    id: "construction_drawings",
    name: "Construction Drawings",
    category: "construction",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC"],
  },
  {
    id: "construction_schedule",
    name: "Construction Schedule",
    category: "construction",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC"],
  },

  // QALICB (NMTC-specific)
  {
    id: "qalicb_certificate",
    name: "QALICB Eligibility Certificate",
    category: "qalicb",
    required: true,
    programs: ["NMTC"],
  },
  {
    id: "business_description",
    name: "Business Activities Description",
    category: "qalicb",
    required: true,
    programs: ["NMTC"],
  },
  {
    id: "employee_list",
    name: "Employee List & Locations",
    category: "qalicb",
    required: false,
    programs: ["NMTC"],
  },

  // Entitlements
  {
    id: "zoning_approval",
    name: "Zoning Approval",
    category: "entitlements",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "building_permits",
    name: "Building Permits",
    category: "entitlements",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "alta_survey",
    name: "ALTA Survey",
    category: "entitlements",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC"],
  },

  // Appraisal
  {
    id: "appraisal",
    name: "Appraisal Report",
    category: "appraisal",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "market_study",
    name: "Market Study",
    category: "market_study",
    required: true,
    programs: ["NMTC", "LIHTC"],
  },

  // Insurance
  {
    id: "insurance_cert",
    name: "Insurance Certificate",
    category: "insurance",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC", "OZ"],
  },
  {
    id: "builders_risk",
    name: "Builder's Risk Policy",
    category: "insurance",
    required: true,
    programs: ["NMTC", "HTC", "LIHTC"],
  },

  // HTC-specific
  {
    id: "part_1_approval",
    name: "Part 1 Approval (NPS)",
    category: "tax",
    required: true,
    programs: ["HTC"],
  },
  {
    id: "part_2_approval",
    name: "Part 2 Approval (NPS)",
    category: "tax",
    required: true,
    programs: ["HTC"],
  },
  {
    id: "shpo_correspondence",
    name: "SHPO Correspondence",
    category: "tax",
    required: false,
    programs: ["HTC"],
  },

  // LIHTC-specific
  {
    id: "lihtc_allocation",
    name: "LIHTC Allocation Letter",
    category: "tax",
    required: true,
    programs: ["LIHTC"],
  },
  {
    id: "extended_use_agreement",
    name: "Extended Use Agreement",
    category: "tax",
    required: true,
    programs: ["LIHTC"],
  },
  {
    id: "rent_roll",
    name: "Current Rent Roll",
    category: "tax",
    required: false,
    programs: ["LIHTC"],
  },
];
