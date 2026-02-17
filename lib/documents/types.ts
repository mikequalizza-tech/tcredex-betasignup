// Document Management Types

export type DocumentCategory =
  | "intake"
  | "due_diligence"
  | "legal"
  | "financial"
  | "compliance"
  | "closing"
  | "environmental"
  | "appraisal"
  | "other";

// NMTC-specific document tags
export type DocumentTag =
  | "Intake"
  | "LOI"
  | "QEI"
  | "Legal"
  | "CDE Agreements"
  | "Term Sheet"
  | "QALICB"
  | "QLICI"
  | "Allocation"
  | "Compliance"
  | "Impact"
  | "Closing"
  | "Tax Opinion"
  | "Audit"
  | "Insurance"
  | "Title"
  | "Environmental"
  | "Appraisal"
  | "Financial Projections"
  | "Community Benefits";

export const DOCUMENT_TAGS: DocumentTag[] = [
  "Intake",
  "LOI",
  "QEI",
  "Legal",
  "CDE Agreements",
  "Term Sheet",
  "QALICB",
  "QLICI",
  "Allocation",
  "Compliance",
  "Impact",
  "Closing",
  "Tax Opinion",
  "Audit",
  "Insurance",
  "Title",
  "Environmental",
  "Appraisal",
  "Financial Projections",
  "Community Benefits",
];

export type AccessLevel = "owner" | "admin" | "editor" | "viewer";

export type EntityType = "organization" | "project" | "deal" | "user";

// Document lock status for checkout/check-in
export interface DocumentLock {
  isLocked: boolean;
  lockedBy?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  lockedAt?: string;
  lockExpiresAt?: string;
  lockReason?: string;
}

// Active collaborators currently viewing/editing
export interface DocumentCollaborator {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  activity: "viewing" | "editing";
  lastActiveAt: string;
  cursor?: { page: number; position: number };
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  changeNotes?: string;
  checksum: string;
  storageUrl: string;
  // Preview URLs for different formats
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface DocumentShare {
  id: string;
  sharedWith: {
    type: "user" | "organization" | "role";
    id: string;
    name: string;
  };
  accessLevel: AccessLevel;
  sharedBy: {
    id: string;
    name: string;
  };
  sharedAt: string;
  expiresAt?: string;
  canReshare: boolean;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  category: DocumentCategory;

  // Entity association - primary
  entityType: EntityType;
  entityId: string;
  entityName: string;

  // Project/Deal linking - secondary associations
  projectId?: string;
  projectName?: string;
  dealId?: string;
  dealName?: string;

  // Current version
  currentVersion: DocumentVersion;
  versionCount: number;

  // Access control
  owner: {
    id: string;
    name: string;
    email: string;
  };
  organizationId: string;
  shares: DocumentShare[];
  isPublic: boolean;

  // Document control (checkout/check-in) - nullable when not locked
  lock: DocumentLock | null;
  collaborators: DocumentCollaborator[];

  // Metadata
  tags: DocumentTag[];
  status: "draft" | "pending_review" | "approved" | "archived";
  requiredForClosing: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
}

export interface DocumentUploadRequest {
  file: File;
  name: string;
  description?: string;
  category: DocumentCategory;
  entityType: EntityType;
  entityId: string;
  projectId?: string;
  dealId?: string;
  tags?: DocumentTag[];
  requiredForClosing?: boolean;
  changeNotes?: string; // For new versions
}

export interface DocumentFilter {
  search?: string;
  category?: DocumentCategory;
  entityType?: EntityType;
  entityId?: string;
  projectId?: string;
  dealId?: string;
  status?: Document["status"];
  uploadedAfter?: string;
  uploadedBefore?: string;
  tags?: DocumentTag[];
  sharedWithMe?: boolean;
  ownedByMe?: boolean;
}

export interface DocumentPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canUploadVersion: boolean;
  canChangeStatus: boolean;
  canManageAccess: boolean;
  canCheckout: boolean;
  canCheckin: boolean;
}

// Document action types for the API
export type DocumentAction =
  | "checkout" // Lock document for editing
  | "checkin" // Unlock document, optionally with new version
  | "force_unlock" // Admin override to unlock
  | "join_session" // Join collaborative editing
  | "leave_session";

// Category metadata for UI
export const DOCUMENT_CATEGORIES: Record<
  DocumentCategory,
  { label: string; color: string; icon: string }
> = {
  intake: { label: "Intake", color: "blue", icon: "clipboard" },
  due_diligence: { label: "Due Diligence", color: "purple", icon: "search" },
  legal: { label: "Legal", color: "red", icon: "scale" },
  financial: { label: "Financial", color: "green", icon: "dollar" },
  compliance: { label: "Compliance", color: "amber", icon: "shield" },
  closing: { label: "Closing", color: "indigo", icon: "check-circle" },
  environmental: { label: "Environmental", color: "emerald", icon: "leaf" },
  appraisal: { label: "Appraisal", color: "orange", icon: "home" },
  other: { label: "Other", color: "gray", icon: "folder" },
};

// Tag colors for UI
export const TAG_COLORS: Record<DocumentTag, string> = {
  Intake: "bg-blue-900/50 text-blue-300",
  LOI: "bg-purple-900/50 text-purple-300",
  QEI: "bg-green-900/50 text-green-300",
  Legal: "bg-red-900/50 text-red-300",
  "CDE Agreements": "bg-indigo-900/50 text-indigo-300",
  "Term Sheet": "bg-amber-900/50 text-amber-300",
  QALICB: "bg-emerald-900/50 text-emerald-300",
  QLICI: "bg-teal-900/50 text-teal-300",
  Allocation: "bg-cyan-900/50 text-cyan-300",
  Compliance: "bg-orange-900/50 text-orange-300",
  Impact: "bg-pink-900/50 text-pink-300",
  Closing: "bg-violet-900/50 text-violet-300",
  "Tax Opinion": "bg-rose-900/50 text-rose-300",
  Audit: "bg-fuchsia-900/50 text-fuchsia-300",
  Insurance: "bg-lime-900/50 text-lime-300",
  Title: "bg-sky-900/50 text-sky-300",
  Environmental: "bg-emerald-900/50 text-emerald-300",
  Appraisal: "bg-orange-900/50 text-orange-300",
  "Financial Projections": "bg-green-900/50 text-green-300",
  "Community Benefits": "bg-purple-900/50 text-purple-300",
};

// File type helpers
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "text/csv",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPreviewable(mimeType: string): boolean {
  return [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/csv",
  ].includes(mimeType);
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "spreadsheet";
  if (mimeType.includes("document") || mimeType.includes("word"))
    return "document";
  return "file";
}
