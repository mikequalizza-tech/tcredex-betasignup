// CDE (Community Development Entity) Types for tCredex Platform
// These types define what CDEs share about their allocation preferences

// New: Individual allocation entry for multi-allocation support
export interface AllocationEntry {
  id: string;
  type: 'federal' | 'state';
  year: string;
  awardedAmount: number;
  availableOnPlatform: number;
  percentageWon?: number;           // For federal allocations where they won partial
  state?: string;                   // For state allocations (e.g., 'IL', 'CA')
  deploymentDeadline?: string;
}

export interface CDEProfile {
  id: string;
  
  // Basic Info
  organizationName: string;
  cdeCertificationNumber?: string;
  parentOrganization?: string;
  yearEstablished?: number;
  website?: string;
  
  // Contact
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone?: string;
  };
  
  // Allocation Info - UPDATED for multi-allocation
  allocation: {
    allocations: AllocationEntry[];   // NEW: Multiple allocations
    totalAllocation: number;          // Total NMTC allocation received (sum of all)
    remainingAllocation: number;      // Available for new deals (sum of availableOnPlatform)
    allocationYears: string[];        // e.g., ['2022', '2023'] - derived from allocations
    deploymentDeadline?: string;      // Earliest deadline across allocations
    averageDealSize: {
      min: number;
      max: number;
    };
    smallDealFund?: boolean;          // Accepts <$5M deals
  };
  
  // Geographic Focus
  geography: {
    serviceAreaType: 'national' | 'regional' | 'state' | 'local';
    primaryStates: string[];          // State codes
    targetRegions?: string[];         // e.g., 'Midwest', 'Gulf Coast'
    excludedStates?: string[];
    ruralFocus: boolean;
    urbanFocus: boolean;
    nativeAmericanFocus: boolean;
    underservedStatesFocus: boolean;
  };
  
  // Mission & Impact Priorities
  mission: {
    statement: string;
    impactPriorities: CDEImpactPriority[];
    targetSectors: string[];          // From PROJECT_TYPES
    specialFocus?: string[];          // e.g., 'Minority-owned', 'Women-owned', 'Veteran-owned'
  };
  
  // Deal Preferences
  dealPreferences: {
    projectTypes: string[];
    
    // Distress Requirements
    requireSeverelyDistressed: boolean;
    requireQCT: boolean;
    minDistressScore?: number;
    
    // Financial Requirements
    minProjectCost?: number;
    maxProjectCost?: number;
    minQliciRequest?: number;
    maxQliciRequest?: number;
    leverageRequirements?: string;    // e.g., '3:1 minimum'
    
    // Impact Requirements
    minJobsCreated?: number;
    minJobsRetained?: number;
    requireCommunityBenefits: boolean;
    
    // Readiness
    requireShovelReady: boolean;
    maxTimeToClose?: number;          // months
    
    // Compliance
    relatedPartyPolicy: 'prohibited' | 'case-by-case' | 'allowed-with-disclosure';
    
    // Additional Credits - ADDED NMTC
    nmtcExperience: boolean;
    htcExperience: boolean;
    lihtcExperience: boolean;
    ozExperience: boolean;
    stackedDealsPreferred: boolean;
  };
  
  // Track Record (for Sponsor confidence)
  trackRecord?: {
    totalDealsCompleted: number;
    totalQliciDeployed: number;
    averageCloseTime: number;         // days
    sectorsServed: string[];
    statesServed: string[];
  };
  
  // Platform Status
  status: 'active' | 'fully-deployed' | 'pending-allocation' | 'inactive';
  verifiedAt?: string;
  lastUpdated: string;
  createdAt: string;
}

export type CDEImpactPriority = 
  | 'job-creation'
  | 'job-retention'
  | 'community-services'
  | 'healthcare-access'
  | 'education-childcare'
  | 'food-access'
  | 'affordable-housing'
  | 'wealth-creation'
  | 'environmental-sustainability'
  | 'small-business-support'
  | 'manufacturing-revival'
  | 'rural-development'
  | 'native-american-communities'
  | 'minority-owned-business'
  | 'women-owned-business'
  | 'veteran-owned-business';

// Per-year allocation detail — each CDE can have multiple allocation years
// Each year has different CDFI Fund underserved/targeted states
export interface YearAllocation {
  id: string;
  year: number;
  allocationType: string;           // 'federal' | 'state'
  totalAllocation: number;
  amountFinalized: number;
  amountRemaining: number;
  nonMetroCommitment: number;       // percentage
  deploymentDeadline?: string;
  underservedStates: string[];      // CDFI Fund targeted states for this round
  // Per-year QEI metadata
  serviceArea?: string;
  serviceAreaType?: string;
  predominantFinancing?: string;
  predominantMarket?: string;
  innovativeActivities?: string;
}

// What shows on the CDE Deal Card (compact view for Sponsors)
// Maps directly to cdes_merged table columns
export interface CDEDealCard {
  id: string;
  organizationId?: string;             // organization_id (for linking to org)

  // Core Identity (from cdes_merged)
  organizationName: string;            // name
  year?: number;                       // year
  controllingEntity?: string;          // controlling_entity
  contactName?: string;                // contact_name

  // Allocation (from cdes_merged)
  allocationType?: string;             // allocation_type (federal/state)
  totalAllocation?: number;            // total_allocation (summed across years)
  amountFinalized?: number;            // amount_finalized
  remainingAllocation: number;         // amount_remaining (summed across years)
  allocationDeadline?: string;         // computed
  // Per-year allocation details (preserves underserved states per round)
  yearAllocations?: YearAllocation[];
  allocationYears?: number[];          // e.g. [2025, 2023, 2022]

  // Geography (from cdes_merged)
  serviceArea?: string;                // service_area
  serviceAreaType?: string;            // service_area_type
  primaryStates: string[];             // primary_states[]
  excludedStates?: string[];           // excluded_states[]

  // Deal Preferences (from cdes_merged)
  dealSizeRange: {
    min: number;                       // min_deal_size
    max: number;                       // max_deal_size
  };
  smallDealFund: boolean;              // small_deal_fund

  // Focus Areas (from cdes_merged)
  ruralFocus: boolean;                 // rural_focus
  urbanFocus: boolean;                 // urban_focus
  minorityFocus?: boolean;             // minority_focus
  utsFocus?: boolean;                  // uts_focus (underserved target states)
  nonMetroCommitment?: number;         // non_metro_commitment (%)

  // Entity Preferences (from cdes_merged)
  nonprofitPreferred?: boolean;        // nonprofit_preferred
  forprofitAccepted?: boolean;         // forprofit_accepted
  ownerOccupiedPreferred?: boolean;    // owner_occupied_preferred

  // Market Focus (from cdes_merged)
  predominantFinancing?: string;       // predominant_financing
  predominantMarket?: string;          // predominant_market
  targetSectors: string[];             // target_sectors[]
  preferredProjectTypes?: string[];    // preferred_project_types[]
  specialFocus?: string[];             // special_focus[]

  // Requirements (from cdes_merged)
  requireSeverelyDistressed: boolean;  // require_severely_distressed
  prefersSeverelyDistressed?: boolean; // prefers_severely_distressed
  requireQct?: boolean;                // require_qct
  prefersQct?: boolean;                // prefers_qct
  minDistressPercentile?: number;      // min_distress_percentile

  // Special Programs (from cdes_merged)
  innovativeActivities?: string;       // innovative_activities

  // Status (from cdes_merged)
  status: 'active' | 'fully-deployed' | 'pending-allocation';  // status

  // Tribal/Native American Focus Data (from tribal_data if applicable)
  tribalData?: {
    state?: string;
    county?: string;
    tract?: string;
    msa2023?: string;
    aian?: number;       // American Indian/Alaska Native indicator
    dtsIa?: number;      // Distressed Tribal Statistical Area indicator
    geoid?: string;
  };
  nativeAmericanFocus?: boolean;  // From geography.nativeAmericanFocus
  underservedStatesFocus?: boolean;  // underserved_states_focus

  // Optional legacy fields
  missionSnippet?: string;
  impactPriorities?: CDEImpactPriority[];
  htcExperience?: boolean;
  lihtcExperience?: boolean;
  ozExperience?: boolean;

  // Location (from cdes_merged)
  city?: string;
  state?: string;
  headquartersCity?: string;
  headquartersState?: string;
  website?: string;

  // Contact (from cdes_merged)
  contactEmail?: string;
  contactPhone?: string;

  // Allocation year info
  allocationYear?: string;

  // Match score (calculated when sponsor has a project)
  matchScore?: number;
  matchReasons?: string[];

  lastUpdated?: string;
}

// CDE Intake Form Data (what CDEs fill out)
export interface CDEIntakeData {
  // Step 1: Organization Basics
  organizationName: string;
  cdeCertificationNumber?: string;
  parentOrganization?: string;
  yearEstablished?: number;
  website?: string;
  
  // Step 2: Contact
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  
  // Step 3: Allocation - UPDATED for multi-allocation
  allocations?: AllocationEntry[];    // NEW: Multiple allocations
  totalAllocation: number;            // Computed from allocations
  remainingAllocation: number;        // Computed from allocations (sum of availableOnPlatform)
  allocationYears: string[];          // Derived from allocations
  deploymentDeadline?: string;
  minDealSize: number;
  maxDealSize: number;
  isSmallDealFund: boolean;
  
  // Step 4: Geographic Focus
  serviceAreaType: 'national' | 'regional' | 'state' | 'local';
  primaryStates: string[];
  targetRegions?: string[];
  excludedStates?: string[];
  ruralFocus: boolean;
  urbanFocus: boolean;
  nativeAmericanFocus: boolean;
  underservedStatesFocus: boolean;
  
  // Step 5: Mission & Impact
  missionStatement: string;
  impactPriorities: CDEImpactPriority[];
  targetSectors: string[];
  specialFocus?: string[];
  
  // Step 6: Deal Preferences
  preferredProjectTypes: string[];
  requireSeverelyDistressed: boolean;
  requireQCT: boolean;
  minProjectCost?: number;
  maxProjectCost?: number;
  minJobsCreated?: number;
  requireCommunityBenefits: boolean;
  requireShovelReady: boolean;
  maxTimeToClose?: number;
  relatedPartyPolicy: 'prohibited' | 'case-by-case' | 'allowed-with-disclosure';
  
  // Step 7: Experience - ADDED NMTC
  nmtcExperience: boolean;
  htcExperience: boolean;
  lihtcExperience: boolean;
  ozExperience: boolean;
  stackedDealsPreferred: boolean;
  totalDealsCompleted?: number;
  
  // Meta
  programs: ('NMTC' | 'HTC')[];       // CDEs typically do NMTC and/or HTC
}

// Default empty CDE intake
export const defaultCDEIntakeData: CDEIntakeData = {
  organizationName: '',
  primaryContactName: '',
  primaryContactTitle: '',
  primaryContactEmail: '',
  allocations: [],                    // NEW: Start with empty allocations
  totalAllocation: 0,
  remainingAllocation: 0,
  allocationYears: [],
  minDealSize: 1000000,
  maxDealSize: 15000000,
  isSmallDealFund: false,
  serviceAreaType: 'national',
  primaryStates: [],
  ruralFocus: false,
  urbanFocus: true,
  nativeAmericanFocus: false,
  underservedStatesFocus: false,
  missionStatement: '',
  impactPriorities: [],
  targetSectors: [],
  preferredProjectTypes: [],
  requireSeverelyDistressed: false,
  requireQCT: false,
  requireCommunityBenefits: true,
  requireShovelReady: false,
  relatedPartyPolicy: 'case-by-case',
  nmtcExperience: true,               // ADDED - default true for CDEs
  htcExperience: false,
  lihtcExperience: false,
  ozExperience: false,
  stackedDealsPreferred: false,
  programs: ['NMTC'],
};

// Impact priority labels
export const IMPACT_PRIORITY_LABELS: Record<CDEImpactPriority, string> = {
  'job-creation': 'Job Creation',
  'job-retention': 'Job Retention',
  'community-services': 'Community Services',
  'healthcare-access': 'Healthcare Access',
  'education-childcare': 'Education & Childcare',
  'food-access': 'Food Access / Grocery',
  'affordable-housing': 'Affordable Housing',
  'wealth-creation': 'Wealth Creation',
  'environmental-sustainability': 'Environmental / Clean Energy',
  'small-business-support': 'Small Business Support',
  'manufacturing-revival': 'Manufacturing Revival',
  'rural-development': 'Rural Development',
  'native-american-communities': 'Native American Communities',
  'minority-owned-business': 'Minority-Owned Business',
  'women-owned-business': 'Women-Owned Business',
  'veteran-owned-business': 'Veteran-Owned Business',
};
