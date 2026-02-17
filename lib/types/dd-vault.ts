/**
 * Due Diligence Vault Types
 *
 * Comprehensive document tracking for tax credit deals.
 * Supports 15+ document categories with status workflow.
 */

export type DDDocumentCategory =
  // Core Project Documents
  | "pro_forma" // Financial projections
  | "sources_and_uses" // Capital stack breakdown
  | "site_control" // Deed, lease, purchase agreement
  | "environmental_phase1" // Phase I ESA
  | "environmental_phase2" // Phase II ESA (if needed)
  | "appraisal" // Property appraisal
  | "market_study" // Market feasibility study
  // Legal & Compliance
  | "organizational_docs" // Articles, bylaws, operating agreement
  | "title_commitment" // Title insurance commitment
  | "zoning_confirmation" // Zoning letter or approval
  | "building_permits" // Permit status/approvals
  // Construction
  | "construction_contract" // GC contract
  | "construction_drawings" // Plans and specs
  | "construction_budget" // Detailed budget
  // Program-Specific (NMTC)
  | "qalicb_certification" // QALICB eligibility docs
  | "community_benefits" // Community impact documentation
  // Program-Specific (HTC)
  | "part1_approval" // NPS Part 1 approval
  | "part2_approval" // NPS Part 2 approval
  | "shpo_correspondence" // State Historic Preservation Office
  // Program-Specific (LIHTC)
  | "allocation_letter" // LIHTC allocation award
  | "unit_mix_schedule" // Unit/AMI breakdown
  | "rent_schedule" // Rent roll projections
  // Investor Documents
  | "investor_financials" // Investor financial capacity
  | "cra_eligibility" // CRA qualification memo
  // Other
  | "other"; // Miscellaneous documents

export type DDDocumentStatus =
  | "not_started" // Not yet requested or uploaded
  | "requested" // Requested by CDE/Investor
  | "pending" // Uploaded, awaiting review
  | "under_review" // Being reviewed
  | "approved" // Approved by reviewer
  | "rejected" // Rejected, needs resubmission
  | "waived" // Requirement waived
  | "expired"; // Document expired, needs refresh

export type DDRequiredBy = "all" | "cde" | "investor" | "sponsor";

export interface DDDocument {
  id: string;
  dealId: string;
  category: DDDocumentCategory;
  documentId?: string;
  status: DDDocumentStatus;
  required: boolean;
  requiredBy: DDRequiredBy;
  requestedById?: string;
  requestedByOrg?: string;
  requestedAt?: string;
  uploadedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewNotes?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  document?: {
    id: string;
    name: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    version?: number;
  };
}

export interface DDVaultSummary {
  dealId: string;
  total: number;
  byStatus: Record<DDDocumentStatus, number>;
  completionPercentage: number;
  greenCount: number; // approved + waived
  yellowCount: number; // pending + under_review + requested
  redCount: number; // not_started + rejected + expired
  requiredComplete: number;
  requiredTotal: number;
}

/**
 * Document category metadata for UI display
 */
export interface DDCategoryMeta {
  category: DDDocumentCategory;
  label: string;
  description: string;
  programs: ("NMTC" | "HTC" | "LIHTC" | "all")[];
  defaultRequired: boolean;
  expirationDays?: number; // Days until document expires
}

export const DD_CATEGORIES: DDCategoryMeta[] = [
  // Core Project Documents
  {
    category: "pro_forma",
    label: "Pro Forma",
    description:
      "Financial projections including income, expenses, and cash flow",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "sources_and_uses",
    label: "Sources & Uses",
    description: "Capital stack breakdown showing all funding sources",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "site_control",
    label: "Site Control",
    description: "Deed, lease agreement, or purchase contract",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "environmental_phase1",
    label: "Phase I ESA",
    description: "Phase I Environmental Site Assessment",
    programs: ["all"],
    defaultRequired: true,
    expirationDays: 180, // 6 months
  },
  {
    category: "environmental_phase2",
    label: "Phase II ESA",
    description: "Phase II Environmental Site Assessment (if required)",
    programs: ["all"],
    defaultRequired: false,
    expirationDays: 180,
  },
  {
    category: "appraisal",
    label: "Appraisal",
    description: "Third-party property appraisal",
    programs: ["all"],
    defaultRequired: true,
    expirationDays: 365, // 1 year
  },
  {
    category: "market_study",
    label: "Market Study",
    description: "Market feasibility analysis",
    programs: ["LIHTC"],
    defaultRequired: true,
    expirationDays: 365,
  },
  // Legal & Compliance
  {
    category: "organizational_docs",
    label: "Organizational Documents",
    description: "Articles of incorporation, bylaws, operating agreement",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "title_commitment",
    label: "Title Commitment",
    description: "Title insurance commitment or title report",
    programs: ["all"],
    defaultRequired: true,
    expirationDays: 90, // 3 months
  },
  {
    category: "zoning_confirmation",
    label: "Zoning Confirmation",
    description: "Zoning letter or approval documentation",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "building_permits",
    label: "Building Permits",
    description: "Permit status or approved permits",
    programs: ["all"],
    defaultRequired: false,
  },
  // Construction
  {
    category: "construction_contract",
    label: "Construction Contract",
    description: "General contractor agreement",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "construction_drawings",
    label: "Construction Drawings",
    description: "Architectural plans and specifications",
    programs: ["all"],
    defaultRequired: true,
  },
  {
    category: "construction_budget",
    label: "Construction Budget",
    description: "Detailed construction cost breakdown",
    programs: ["all"],
    defaultRequired: true,
  },
  // NMTC Specific
  {
    category: "qalicb_certification",
    label: "QALICB Certification",
    description: "Qualified Active Low-Income Community Business documentation",
    programs: ["NMTC"],
    defaultRequired: true,
  },
  {
    category: "community_benefits",
    label: "Community Benefits",
    description: "Community impact and benefits documentation",
    programs: ["NMTC"],
    defaultRequired: true,
  },
  // HTC Specific
  {
    category: "part1_approval",
    label: "NPS Part 1",
    description: "National Park Service Part 1 Historic Designation approval",
    programs: ["HTC"],
    defaultRequired: true,
  },
  {
    category: "part2_approval",
    label: "NPS Part 2",
    description: "National Park Service Part 2 Rehabilitation Plan approval",
    programs: ["HTC"],
    defaultRequired: true,
  },
  {
    category: "shpo_correspondence",
    label: "SHPO Correspondence",
    description: "State Historic Preservation Office communications",
    programs: ["HTC"],
    defaultRequired: false,
  },
  // LIHTC Specific
  {
    category: "allocation_letter",
    label: "Allocation Letter",
    description: "LIHTC allocation award letter",
    programs: ["LIHTC"],
    defaultRequired: true,
  },
  {
    category: "unit_mix_schedule",
    label: "Unit Mix Schedule",
    description: "Unit breakdown by AMI level",
    programs: ["LIHTC"],
    defaultRequired: true,
  },
  {
    category: "rent_schedule",
    label: "Rent Schedule",
    description: "Projected rent roll by unit type",
    programs: ["LIHTC"],
    defaultRequired: true,
  },
  // Investor Documents
  {
    category: "investor_financials",
    label: "Investor Financials",
    description: "Investor financial capacity documentation",
    programs: ["all"],
    defaultRequired: false,
  },
  {
    category: "cra_eligibility",
    label: "CRA Eligibility Memo",
    description: "Community Reinvestment Act qualification memo",
    programs: ["all"],
    defaultRequired: false,
  },
  // Other
  {
    category: "other",
    label: "Other Documents",
    description: "Miscellaneous supporting documents",
    programs: ["all"],
    defaultRequired: false,
  },
];

/**
 * Get categories applicable to specific programs
 */
export function getCategoriesForPrograms(
  programs: ("NMTC" | "HTC" | "LIHTC")[],
): DDCategoryMeta[] {
  return DD_CATEGORIES.filter(
    (cat) =>
      cat.programs.includes("all") ||
      cat.programs.some((p) =>
        programs.includes(p as "NMTC" | "HTC" | "LIHTC"),
      ),
  );
}

/**
 * Get status color for UI
 */
export function getStatusColor(
  status: DDDocumentStatus,
): "green" | "yellow" | "red" | "gray" {
  switch (status) {
    case "approved":
    case "waived":
      return "green";
    case "pending":
    case "under_review":
    case "requested":
      return "yellow";
    case "rejected":
    case "expired":
      return "red";
    case "not_started":
    default:
      return "gray";
  }
}

/**
 * Get status label for UI
 */
export function getStatusLabel(status: DDDocumentStatus): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "requested":
      return "Requested";
    case "pending":
      return "Pending Review";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "waived":
      return "Waived";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

/**
 * Calculate vault summary from documents
 */
export function calculateVaultSummary(
  dealId: string,
  documents: DDDocument[],
): DDVaultSummary {
  const byStatus: Record<DDDocumentStatus, number> = {
    not_started: 0,
    requested: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    waived: 0,
    expired: 0,
  };

  let greenCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let requiredComplete = 0;
  let requiredTotal = 0;

  for (const doc of documents) {
    byStatus[doc.status]++;

    const color = getStatusColor(doc.status);
    if (color === "green") greenCount++;
    else if (color === "yellow") yellowCount++;
    else if (color === "red") redCount++;

    if (doc.required) {
      requiredTotal++;
      if (doc.status === "approved" || doc.status === "waived") {
        requiredComplete++;
      }
    }
  }

  return {
    dealId,
    total: documents.length,
    byStatus,
    completionPercentage:
      requiredTotal > 0
        ? Math.round((requiredComplete / requiredTotal) * 100)
        : 0,
    greenCount,
    yellowCount,
    redCount,
    requiredComplete,
    requiredTotal,
  };
}
