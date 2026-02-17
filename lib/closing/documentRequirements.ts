/**
 * tCredex Closing Room — Document Requirements
 *
 * This connects Intake → Closing Room → Compliance
 *
 * Every checklist item can:
 * - Require documents
 * - Block closing if incomplete
 * - Show progress visually
 *
 * ⚠️ Do NOT bypass checklist → document link
 */

export interface DocumentRequirement {
  checklistItem: string;
  requiredDocs: string[];
  program?: "NMTC" | "HTC" | "LIHTC" | "OZ" | "ALL";
  category?: string;
  blocksClosing?: boolean;
}

/**
 * Document requirements by checklist item
 * Program-specific items marked with program field
 */
export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  // NMTC-Specific
  {
    checklistItem: "QALICB Eligibility Certification",
    requiredDocs: [
      "Organizational Documents",
      "NAICS Certification",
      "Operating Agreement",
      "QALICB Certification Letter",
    ],
    program: "NMTC",
    category: "Eligibility",
    blocksClosing: true,
  },
  {
    checklistItem: "NMTC Allocation Agreement",
    requiredDocs: [
      "Allocation Agreement (Executed)",
      "CDE Board Approval",
      "Allocation Award Letter",
    ],
    program: "NMTC",
    category: "Allocation",
    blocksClosing: true,
  },
  {
    checklistItem: "CDE Sub-Allocation Approval",
    requiredDocs: [
      "Sub-Allocation Agreement",
      "CDE Due Diligence Memo",
      "Investment Committee Approval",
    ],
    program: "NMTC",
    category: "Allocation",
    blocksClosing: true,
  },
  {
    checklistItem: "QLICI Loan Documents",
    requiredDocs: [
      "QLICI Loan Agreement",
      "Promissory Note (QLICI)",
      "Security Agreement",
      "Collateral Documents",
    ],
    program: "NMTC",
    category: "Financing",
    blocksClosing: true,
  },

  // HTC-Specific
  {
    checklistItem: "HTC Part 1 Approval",
    requiredDocs: [
      "Part 1 Application (Submitted)",
      "Part 1 Approval Letter",
      "Historic Significance Documentation",
    ],
    program: "HTC",
    category: "Historic Certification",
    blocksClosing: true,
  },
  {
    checklistItem: "HTC Part 2 Submission",
    requiredDocs: [
      "Part 2 Application",
      "Architectural Plans",
      "SHPO Correspondence",
      "Historic Preservation Plan",
    ],
    program: "HTC",
    category: "Historic Certification",
    blocksClosing: true,
  },
  {
    checklistItem: "HTC Part 3 Certification",
    requiredDocs: [
      "Part 3 Application",
      "Completed Work Photos",
      "Final Inspection Report",
      "Part 3 Approval Letter",
    ],
    program: "HTC",
    category: "Historic Certification",
    blocksClosing: false, // Post-closing
  },

  // LIHTC-Specific
  {
    checklistItem: "LIHTC Allocation Award",
    requiredDocs: [
      "Allocation Award Letter",
      "Carryover Allocation Agreement",
      "State HFA Application",
    ],
    program: "LIHTC",
    category: "Allocation",
    blocksClosing: true,
  },
  {
    checklistItem: "LIHTC Extended Use Agreement",
    requiredDocs: [
      "Extended Use Agreement (Draft)",
      "Extended Use Agreement (Executed)",
      "LURA Recording",
    ],
    program: "LIHTC",
    category: "Compliance",
    blocksClosing: true,
  },
  {
    checklistItem: "Rent & Income Limits Certification",
    requiredDocs: [
      "Rent Roll",
      "Income Limit Schedule",
      "Unit Mix Summary",
      "Tenant Eligibility Procedures",
    ],
    program: "LIHTC",
    category: "Compliance",
    blocksClosing: true,
  },

  // OZ-Specific
  {
    checklistItem: "QOZ Certification",
    requiredDocs: [
      "QOZ Self-Certification (Form 8996)",
      "Tract Eligibility Documentation",
      "Investment Schedule",
    ],
    program: "OZ",
    category: "Eligibility",
    blocksClosing: true,
  },
  {
    checklistItem: "QOZB Compliance",
    requiredDocs: [
      "70% Asset Test Documentation",
      "Substantial Improvement Documentation",
      "Working Capital Safe Harbor Plan",
    ],
    program: "OZ",
    category: "Compliance",
    blocksClosing: true,
  },

  // Common to All Programs
  {
    checklistItem: "Leverage Loan Documents",
    requiredDocs: [
      "Leverage Loan Agreement",
      "Promissory Note",
      "Security Documents",
      "Guaranty Agreement",
    ],
    program: "ALL",
    category: "Financing",
    blocksClosing: true,
  },
  {
    checklistItem: "Equity Investment Documents",
    requiredDocs: [
      "Equity Contribution Agreement",
      "Operating Agreement (Investment Entity)",
      "Capital Call Schedule",
      "Investor Subscription Agreement",
    ],
    program: "ALL",
    category: "Financing",
    blocksClosing: true,
  },
  {
    checklistItem: "Title & Survey",
    requiredDocs: [
      "Title Commitment",
      "Title Policy",
      "ALTA Survey",
      "Legal Description",
    ],
    program: "ALL",
    category: "Real Estate",
    blocksClosing: true,
  },
  {
    checklistItem: "Environmental Reports",
    requiredDocs: [
      "Phase I Environmental Assessment",
      "Phase II (if required)",
      "Environmental Insurance (if required)",
    ],
    program: "ALL",
    category: "Real Estate",
    blocksClosing: true,
  },
  {
    checklistItem: "Appraisal",
    requiredDocs: [
      "As-Is Appraisal",
      "As-Completed Appraisal",
      "Appraisal Review Letter",
    ],
    program: "ALL",
    category: "Real Estate",
    blocksClosing: true,
  },
  {
    checklistItem: "Insurance Certificates",
    requiredDocs: [
      "Property Insurance Certificate",
      "Liability Insurance Certificate",
      "Builders Risk (during construction)",
      "Flood Insurance (if applicable)",
    ],
    program: "ALL",
    category: "Insurance",
    blocksClosing: true,
  },
  {
    checklistItem: "Organizational Documents",
    requiredDocs: [
      "Articles of Incorporation/Organization",
      "Bylaws/Operating Agreement",
      "Good Standing Certificate",
      "Incumbency Certificate",
      "Resolutions/Authorizations",
    ],
    program: "ALL",
    category: "Corporate",
    blocksClosing: true,
  },
  {
    checklistItem: "Construction Documents",
    requiredDocs: [
      "Construction Contract",
      "Plans & Specifications",
      "Building Permit",
      "Construction Budget",
      "Construction Schedule",
    ],
    program: "ALL",
    category: "Construction",
    blocksClosing: true,
  },
  {
    checklistItem: "Legal Opinions",
    requiredDocs: [
      "Tax Opinion Letter",
      "Enforceability Opinion",
      "Due Authorization Opinion",
    ],
    program: "ALL",
    category: "Legal",
    blocksClosing: true,
  },
];

/**
 * Get documents required for a specific checklist item
 */
export function getDocsForChecklistItem(checklistItem: string): string[] {
  const requirement = DOCUMENT_REQUIREMENTS.find(
    (d) => d.checklistItem === checklistItem,
  );
  return requirement?.requiredDocs || [];
}

/**
 * Get all document requirements for a specific program
 */
export function getRequirementsForProgram(
  program: "NMTC" | "HTC" | "LIHTC" | "OZ",
): DocumentRequirement[] {
  return DOCUMENT_REQUIREMENTS.filter(
    (r) => r.program === program || r.program === "ALL",
  );
}

/**
 * Get all unique categories
 */
export function getDocumentCategories(): string[] {
  const categories = new Set(
    DOCUMENT_REQUIREMENTS.map((r) => r.category).filter(Boolean),
  );
  return Array.from(categories) as string[];
}

/**
 * Check if a checklist item blocks closing
 */
export function blocksClosing(checklistItem: string): boolean {
  const requirement = DOCUMENT_REQUIREMENTS.find(
    (d) => d.checklistItem === checklistItem,
  );
  return requirement?.blocksClosing ?? true;
}

/**
 * Get total document count for a program
 */
export function getTotalDocsForProgram(
  program: "NMTC" | "HTC" | "LIHTC" | "OZ",
): number {
  const requirements = getRequirementsForProgram(program);
  return requirements.reduce((count, r) => count + r.requiredDocs.length, 0);
}
