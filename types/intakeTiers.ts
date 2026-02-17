/**
 * tCredex Intake Tier Progression System
 *
 * Progressive disclosure: fields unlock as deal advances
 *
 * Tier 1 (Initial)    → Basic info for Deal Card + Section C Score
 * Tier 2 (LOI Issued) → Additional details for CDE allocation decision
 * Tier 3 (Commitment) → Full due diligence for investor underwriting
 * Tier 4 (Closing)    → Final verification for closing room
 */

// =============================================================================
// TIER DEFINITIONS
// =============================================================================

export type IntakeTier = 1 | 2 | 3 | 4;

export const TIER_NAMES: Record<IntakeTier, string> = {
  1: "Initial Submission",
  2: "LOI Stage",
  3: "Commitment Stage",
  4: "Closing Stage",
};

export const TIER_DESCRIPTIONS: Record<IntakeTier, string> = {
  1: "Basic project info for marketplace listing and initial scoring",
  2: "Detailed financials and site info for CDE allocation decision",
  3: "Full due diligence package for investor underwriting",
  4: "Final verification and closing documentation",
};

export const TIER_TRIGGERS: Record<IntakeTier, string> = {
  1: "Deal submitted",
  2: "LOI issued by CDE",
  3: "Commitment issued by investor",
  4: "All parties accepted, closing room opened",
};

// =============================================================================
// FIELD CATEGORIES
// =============================================================================

export type FieldCategory =
  | "project_basics"
  | "location"
  | "financials"
  | "sources_uses"
  | "jobs_impact"
  | "site_control"
  | "third_party_reports"
  | "legal_structure"
  | "sponsor_background"
  | "closing_docs";

export const CATEGORY_LABELS: Record<FieldCategory, string> = {
  project_basics: "Project Basics",
  location: "Location & Census Tract",
  financials: "Financial Summary",
  sources_uses: "Sources & Uses",
  jobs_impact: "Jobs & Community Impact",
  site_control: "Site Control",
  third_party_reports: "Third Party Reports",
  legal_structure: "Legal Structure",
  sponsor_background: "Sponsor Background",
  closing_docs: "Closing Documentation",
};

// =============================================================================
// FIELD DEFINITION
// =============================================================================

export interface FieldDefinition {
  key: string;
  label: string;
  category: FieldCategory;
  type:
    | "text"
    | "number"
    | "currency"
    | "percent"
    | "date"
    | "select"
    | "multiselect"
    | "boolean"
    | "file"
    | "textarea"
    | "address";
  required_at_tier: IntakeTier;
  visible_at_tier: IntakeTier;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help_text?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // Function name for custom validation
  };
  depends_on?: {
    field: string;
    value: unknown;
  };
}

// =============================================================================
// TIER 1 FIELDS - Initial Submission (Deal Card + Scoring)
// =============================================================================

export const TIER_1_FIELDS: FieldDefinition[] = [
  // Project Basics
  {
    key: "projectName",
    label: "Project Name",
    category: "project_basics",
    type: "text",
    required_at_tier: 1,
    visible_at_tier: 1,
    placeholder: "e.g., Downtown Health Center",
  },
  {
    key: "projectDescription",
    label: "Project Description",
    category: "project_basics",
    type: "textarea",
    required_at_tier: 1,
    visible_at_tier: 1,
    placeholder: "Brief description of the project and its community impact",
  },
  {
    key: "sectorCategory",
    label: "Project Sector",
    category: "project_basics",
    type: "select",
    required_at_tier: 1,
    visible_at_tier: 1,
    options: [
      { value: "Healthcare/Medical", label: "Healthcare / Medical" },
      { value: "Education/Schools", label: "Education / Schools" },
      { value: "Housing/Residential", label: "Housing / Residential" },
      {
        value: "Industrial/Manufacturing",
        label: "Industrial / Manufacturing",
      },
      { value: "Retail/Commercial", label: "Retail / Commercial" },
      { value: "Food Access/Grocery", label: "Food Access / Grocery" },
      {
        value: "Childcare/Early Education",
        label: "Childcare / Early Education",
      },
      { value: "Senior Services", label: "Senior Services" },
      { value: "Community Facility", label: "Community Facility" },
      { value: "Mixed-Use", label: "Mixed-Use" },
      { value: "Other", label: "Other" },
    ],
  },
  {
    key: "sponsorName",
    label: "Sponsor / Developer Name",
    category: "project_basics",
    type: "text",
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  {
    key: "sponsorEmail",
    label: "Sponsor Email",
    category: "project_basics",
    type: "text",
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  {
    key: "sponsorPhone",
    label: "Sponsor Phone",
    category: "project_basics",
    type: "text",
    required_at_tier: 1,
    visible_at_tier: 1,
  },

  // Location
  {
    key: "address",
    label: "Project Address",
    category: "location",
    type: "address",
    required_at_tier: 1,
    visible_at_tier: 1,
    help_text: "Full street address for geocoding",
  },
  {
    key: "city",
    label: "City",
    category: "location",
    type: "text",
    required_at_tier: 1,
    visible_at_tier: 1,
  },
  {
    key: "state",
    label: "State",
    category: "location",
    type: "select",
    required_at_tier: 1,
    visible_at_tier: 1,
    options: [], // Populated dynamically
  },
  {
    key: "zipCode",
    label: "ZIP Code",
    category: "location",
    type: "text",
    required_at_tier: 1,
    visible_at_tier: 1,
  },

  // Financials (basic)
  {
    key: "totalProjectCost",
    label: "Total Project Cost",
    category: "financials",
    type: "currency",
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 100000 },
  },
  {
    key: "nmtcFinancingRequested",
    label: "NMTC Allocation Request",
    category: "financials",
    type: "currency",
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 1000000 },
    help_text: "Minimum $1M allocation",
  },

  // Jobs & Impact (basic)
  {
    key: "permanentJobsFTE",
    label: "Permanent Jobs Created/Retained",
    category: "jobs_impact",
    type: "number",
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 0 },
  },
  {
    key: "constructionJobsFTE",
    label: "Construction Jobs",
    category: "jobs_impact",
    type: "number",
    required_at_tier: 1,
    visible_at_tier: 1,
    validation: { min: 0 },
  },

  // Site Control (basic)
  {
    key: "siteControl",
    label: "Site Control Status",
    category: "site_control",
    type: "select",
    required_at_tier: 1,
    visible_at_tier: 1,
    options: [
      { value: "Owned", label: "Owned" },
      { value: "Under Contract", label: "Under Contract" },
      { value: "Option / LOI", label: "Option / LOI" },
      { value: "Site Identified", label: "Site Identified" },
      { value: "None", label: "No Site Yet" },
    ],
  },

  // Timeline
  {
    key: "projectedClosingDate",
    label: "Target Closing Date",
    category: "project_basics",
    type: "date",
    required_at_tier: 1,
    visible_at_tier: 1,
  },
];

// =============================================================================
// TIER 2 FIELDS - LOI Stage (CDE Decision)
// =============================================================================

export const TIER_2_FIELDS: FieldDefinition[] = [
  // Enhanced Financials (Uses)
  {
    key: "acquisitionCost",
    label: "Acquisition Cost",
    category: "financials",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "constructionCost",
    label: "Hard Costs (Construction)",
    category: "financials",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "softCosts",
    label: "Soft Costs",
    category: "financials",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "contingency",
    label: "Contingency",
    category: "financials",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "financingCosts",
    label: "Financing Costs",
    category: "financials",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },

  // Sources
  {
    key: "debtAmount",
    label: "Senior Debt",
    category: "sources_uses",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "debtLender",
    label: "Senior Debt Lender",
    category: "sources_uses",
    type: "text",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "debtStatus",
    label: "Senior Debt Status",
    category: "sources_uses",
    type: "select",
    required_at_tier: 2,
    visible_at_tier: 2,
    options: [
      { value: "committed", label: "Committed" },
      { value: "term_sheet", label: "Term Sheet" },
      { value: "application", label: "Application Submitted" },
      { value: "discussions", label: "In Discussions" },
      { value: "not_started", label: "Not Started" },
    ],
  },
  {
    key: "equityAmount",
    label: "Sponsor Equity",
    category: "sources_uses",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "otherAmount",
    label: "Other Sources",
    category: "sources_uses",
    type: "currency",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "otherSourcesDescription",
    label: "Other Sources Description",
    category: "sources_uses",
    type: "textarea",
    required_at_tier: 2,
    visible_at_tier: 2,
    depends_on: { field: "otherAmount", value: { gt: 0 } },
  },

  // Enhanced Impact
  {
    key: "servesLmiDirectly",
    label: "Directly Serves LMI Residents?",
    category: "jobs_impact",
    type: "boolean",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "lmiServiceDescription",
    label: "LMI Service Description",
    category: "jobs_impact",
    type: "textarea",
    required_at_tier: 2,
    visible_at_tier: 2,
    depends_on: { field: "servesLmiDirectly", value: true },
  },
  {
    key: "employsLmiResidents",
    label: "Will Employ LMI Residents?",
    category: "jobs_impact",
    type: "boolean",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "communitySupportLetters",
    label: "Has Community Support Letters?",
    category: "jobs_impact",
    type: "boolean",
    required_at_tier: 2,
    visible_at_tier: 2,
  },

  // Third Party Reports Status
  {
    key: "hasProForma",
    label: "Pro Forma Available?",
    category: "third_party_reports",
    type: "boolean",
    required_at_tier: 2,
    visible_at_tier: 2,
  },
  {
    key: "phaseIEnvironmental",
    label: "Phase I ESA Status",
    category: "third_party_reports",
    type: "select",
    required_at_tier: 2,
    visible_at_tier: 2,
    options: [
      { value: "Complete", label: "Complete" },
      { value: "In Progress", label: "In Progress" },
      { value: "Ordered", label: "Ordered" },
      { value: "Not Started", label: "Not Started" },
    ],
  },
  {
    key: "appraisalStatus",
    label: "Appraisal Status",
    category: "third_party_reports",
    type: "select",
    required_at_tier: 2,
    visible_at_tier: 2,
    options: [
      { value: "Complete", label: "Complete" },
      { value: "In Progress", label: "In Progress" },
      { value: "Ordered", label: "Ordered" },
      { value: "Not Started", label: "Not Started" },
    ],
  },
];

// =============================================================================
// TIER 3 FIELDS - Commitment Stage (Investor Underwriting)
// =============================================================================

export const TIER_3_FIELDS: FieldDefinition[] = [
  // Legal Structure
  {
    key: "borrowerEntityName",
    label: "Borrower Entity Name",
    category: "legal_structure",
    type: "text",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "borrowerEntityType",
    label: "Borrower Entity Type",
    category: "legal_structure",
    type: "select",
    required_at_tier: 3,
    visible_at_tier: 3,
    options: [
      { value: "llc", label: "LLC" },
      { value: "corporation", label: "Corporation" },
      { value: "partnership", label: "Partnership" },
      { value: "nonprofit", label: "Non-Profit" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "borrowerStateOfFormation",
    label: "State of Formation",
    category: "legal_structure",
    type: "select",
    required_at_tier: 3,
    visible_at_tier: 3,
    options: [], // Populated dynamically
  },
  {
    key: "borrowerEin",
    label: "Borrower EIN",
    category: "legal_structure",
    type: "text",
    required_at_tier: 3,
    visible_at_tier: 3,
    validation: { pattern: "^\\d{2}-\\d{7}$" },
    placeholder: "XX-XXXXXXX",
  },

  // Sponsor Background
  {
    key: "sponsorEntityName",
    label: "Sponsor Entity Name",
    category: "sponsor_background",
    type: "text",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "sponsorYearsExperience",
    label: "Years of Development Experience",
    category: "sponsor_background",
    type: "number",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "sponsorPriorNmtc",
    label: "Prior NMTC Experience?",
    category: "sponsor_background",
    type: "boolean",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "sponsorPriorNmtcCount",
    label: "Number of Prior NMTC Deals",
    category: "sponsor_background",
    type: "number",
    required_at_tier: 3,
    visible_at_tier: 3,
    depends_on: { field: "sponsorPriorNmtc", value: true },
  },
  {
    key: "sponsorFinancialStatements",
    label: "Sponsor Financial Statements",
    category: "sponsor_background",
    type: "file",
    required_at_tier: 3,
    visible_at_tier: 3,
    help_text: "Last 2 years of audited financials",
  },

  // Complete Third Party Reports
  {
    key: "phaseIReport",
    label: "Phase I ESA Report",
    category: "third_party_reports",
    type: "file",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "appraisalReport",
    label: "Appraisal Report",
    category: "third_party_reports",
    type: "file",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "marketStudy",
    label: "Market Study",
    category: "third_party_reports",
    type: "file",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "titleCommitment",
    label: "Title Commitment",
    category: "third_party_reports",
    type: "file",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
  {
    key: "survey",
    label: "Survey",
    category: "third_party_reports",
    type: "file",
    required_at_tier: 3,
    visible_at_tier: 3,
  },
];

// =============================================================================
// TIER 4 FIELDS - Closing Stage (Final Verification)
// =============================================================================

export const TIER_4_FIELDS: FieldDefinition[] = [
  // Closing Documentation
  {
    key: "finalSourcesUses",
    label: "Final Sources & Uses",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: "finalProForma",
    label: "Final Pro Forma",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: "organizationalDocs",
    label: "Organizational Documents",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
    help_text: "Operating Agreement, Articles, etc.",
  },
  {
    key: "seniorLoanCommitment",
    label: "Senior Loan Commitment Letter",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: "insuranceCertificates",
    label: "Insurance Certificates",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: "constructionContract",
    label: "Construction Contract",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: "permitsApprovals",
    label: "Permits & Approvals",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },

  // Final Verification
  {
    key: "qalicbCertification",
    label: "QALICB Certification Signed",
    category: "closing_docs",
    type: "boolean",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
  {
    key: "communityImpactPlanFinal",
    label: "Final Community Impact Plan",
    category: "closing_docs",
    type: "file",
    required_at_tier: 4,
    visible_at_tier: 4,
  },
];

// =============================================================================
// ALL FIELDS COMBINED
// =============================================================================

export const ALL_INTAKE_FIELDS: FieldDefinition[] = [
  ...TIER_1_FIELDS,
  ...TIER_2_FIELDS,
  ...TIER_3_FIELDS,
  ...TIER_4_FIELDS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getFieldsForTier(tier: IntakeTier): FieldDefinition[] {
  return ALL_INTAKE_FIELDS.filter((f) => f.visible_at_tier <= tier);
}

export function getRequiredFieldsForTier(tier: IntakeTier): FieldDefinition[] {
  return ALL_INTAKE_FIELDS.filter((f) => f.required_at_tier <= tier);
}

export function getNewFieldsAtTier(tier: IntakeTier): FieldDefinition[] {
  return ALL_INTAKE_FIELDS.filter((f) => f.visible_at_tier === tier);
}

export function getFieldsByCategory(
  tier: IntakeTier,
): Record<FieldCategory, FieldDefinition[]> {
  const fields = getFieldsForTier(tier);
  const result = {} as Record<FieldCategory, FieldDefinition[]>;

  for (const category of Object.keys(CATEGORY_LABELS) as FieldCategory[]) {
    result[category] = fields.filter((f) => f.category === category);
  }

  return result;
}

export function getFieldByKey(key: string): FieldDefinition | undefined {
  return ALL_INTAKE_FIELDS.find((f) => f.key === key);
}
