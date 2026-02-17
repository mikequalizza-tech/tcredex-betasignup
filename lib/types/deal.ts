/**
 * tCredex Deal Data Contract v1.1
 *
 * This defines the shape of a Deal record including:
 * - Basic deal info
 * - Intake data
 * - Readiness score
 * - Checklist with document tracking
 */

export type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ";
export type ProgramLevel = "federal" | "state";
// Unified with lib/db/types.ts (the database source of truth)
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
export type TractType = "QCT" | "SD" | "LIC" | "DDA";

export interface DocumentRecord {
  id: string;
  name: string;
  uploaded: boolean;
  uploadedAt?: string;
  uploadedBy?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  version?: number;
  aiFlags?: string[];
}

export interface ChecklistItemRecord {
  complete: boolean;
  completedAt?: string;
  completedBy?: string;
  documents: DocumentRecord[];
  notes?: string;
}

export interface IntakeData {
  // Site Control
  siteControl?: "Owned" | "Under Contract" | "LOI" | "None";
  siteAddress?: string;
  siteCensusTract?: string;

  // Capital Stack
  committedCapitalPct?: number;
  totalProjectCost?: number;
  requestedAllocation?: number;

  // Documentation
  docsUploaded?: number;
  docsRequired?: number;

  // Approvals
  entitlementsApproved?: boolean;
  entitlementsSubmitted?: boolean;
  entitlementsStarted?: boolean;

  // Timeline
  constructionStartMonths?: number;
  projectedClosingDate?: string;

  // Additional fields can be added
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSONB intake data has dynamic fields with heterogeneous value types
  [key: string]: any;
}

export interface Deal {
  // Core identifiers
  id: string;
  createdAt: string;
  updatedAt: string;

  // Basic info
  projectName: string;
  sponsorId: string;
  sponsorName: string;
  sponsorWebsite?: string;

  // Program info
  programs: ProgramType[];
  programLevel: ProgramLevel;
  stateProgram?: string; // e.g., "CA State LIHTC"

  // Location
  state: string;
  city: string;
  censusTract?: string;
  tractTypes: TractType[];

  // Financials
  allocation: number;
  creditPrice: number;
  totalProjectCost?: number;

  // Status
  status: DealStatus;
  visible: boolean;

  // Intake data (from form)
  intakeData: IntakeData;

  // Readiness (calculated from intakeData)
  readinessScore: number;

  // Closing checklist with documents
  checklist: Record<string, ChecklistItemRecord>;

  // Metadata
  submittedAt?: string;
  matchedAt?: string;
  closedAt?: string;

  // Participants
  cdeId?: string;
  cdeName?: string;
  investorId?: string;
  investorName?: string;

  // Additional data
  povertyRate?: number;
  medianIncome?: number;
  jobsCreated?: number;
  sqFootage?: number;

  // Flags
  aiFlags?: string[];
}

/**
 * Create a new deal with defaults
 */
export function createDeal(
  projectName: string,
  sponsorId: string,
  sponsorName: string,
  programs: ProgramType[],
): Deal {
  return {
    id: `deal-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectName,
    sponsorId,
    sponsorName,
    programs,
    programLevel: "federal",
    state: "",
    city: "",
    tractTypes: [],
    allocation: 0,
    creditPrice: 0,
    status: "draft",
    visible: false,
    intakeData: {},
    readinessScore: 0,
    checklist: {},
  };
}

/**
 * Check if a deal is ready for closing
 */
export function isReadyForClosing(deal: Deal): boolean {
  // Must have readiness score >= 60
  if (deal.readinessScore < 60) return false;

  // Must have all required checklist items complete
  const requiredItems = Object.entries(deal.checklist).filter(
    ([_, record]) => record.complete === false,
  );

  return requiredItems.length === 0;
}

/**
 * Get deal completion percentage
 */
export function getDealCompletion(deal: Deal): number {
  const checklistItems = Object.values(deal.checklist);
  if (checklistItems.length === 0) return 0;

  const complete = checklistItems.filter((item) => item.complete).length;
  return Math.round((complete / checklistItems.length) * 100);
}
