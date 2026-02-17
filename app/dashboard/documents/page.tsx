"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type DocumentCategory =
  | "all"
  | "corporate"
  | "project"
  | "financial"
  | "real_estate"
  | "legal"
  | "qalicb"
  | "insurance"
  | "closing";
type DocumentStatus =
  | "all"
  | "pending"
  | "uploaded"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  projectName: string;
  projectId: string;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  version: number;
  aiFlags?: string[];
  fileUrl?: string;
}

/** Shape of document rows returned from the /api/documents endpoint. */
interface DocumentApiRow {
  id: string;
  name?: string;
  category?: string;
  status?: string;
  deal_id?: string;
  deals?: { project_name?: string };
  deal?: { project_name?: string };
  deal_name?: string;
  uploaded_by_name?: string;
  uploaded_by?: string;
  created_at?: string;
  file_size?: number;
  version?: number;
  version_number?: number;
  doc_version?: number;
  ai_flags?: string[];
  file_url?: string;
}

/** Shape of deal rows returned from the /api/deals endpoint. */
interface DealApiRow {
  id: string;
  projectName?: string;
  project_name?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  all: "All Categories",
  corporate: "Corporate",
  project: "Project",
  financial: "Financial",
  real_estate: "Real Estate",
  legal: "Legal",
  qalicb: "QALICB",
  insurance: "Insurance",
  closing: "Closing",
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  all: "",
  pending: "bg-gray-700 text-gray-300",
  uploaded: "bg-blue-900/50 text-blue-300",
  under_review: "bg-amber-900/50 text-amber-300",
  approved: "bg-green-900/50 text-green-300",
  rejected: "bg-red-900/50 text-red-300",
  expired: "bg-red-900/50 text-red-300",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  all: "All Status",
  pending: "Pending",
  uploaded: "Uploaded",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory>("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  // Check for upload query param to auto-open modal
  useEffect(() => {
    if (searchParams?.get("upload") === "true") {
      setShowUploadModal(true);
      // Clear the query param from URL
      router.replace("/dashboard/documents", { scroll: false });
    }
  }, [searchParams, router]);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState<string>(""); // Changed from uploadCategory to uploadProjectId
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pipelineProjects, setPipelineProjects] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/documents?${params.toString()}`);
      const data = await response.json();

      if (data.documents) {
        const mapped: Document[] = data.documents.map(
          (doc: DocumentApiRow) => ({
            id: doc.id,
            name: doc.name || "Untitled",
            category: mapCategory(doc.category || ""),
            status: mapStatus(doc.status || ""),
            projectName:
              doc.deals?.project_name ||
              doc.deal?.project_name ||
              doc.deal_name ||
              "Unknown Project",
            projectId: doc.deal_id || "",
            uploadedBy: doc.uploaded_by_name || doc.uploaded_by || "",
            uploadedDate: doc.created_at
              ? new Date(doc.created_at).toISOString().split("T")[0]
              : "",
            size: formatFileSize(doc.file_size || 0),
            version: normalizeVersion(
              doc.version ?? doc.version_number ?? doc.doc_version ?? 1,
            ),
            aiFlags: doc.ai_flags || [],
            fileUrl: doc.file_url,
          }),
        );
        setDocuments(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    fetchDocuments();
    loadPipelineProjects(); // Load pipeline projects for upload dropdown
  }, [fetchDocuments]);

  // Load pipeline projects for upload dropdown
  const loadPipelineProjects = async () => {
    try {
      const response = await fetch("/api/deals", { credentials: "include" }); // Get user's deals
      const deals = await response.json();
      const dealArray = Array.isArray(deals)
        ? deals
        : deals?.deals || deals?.data || [];
      const projects = dealArray.map((deal: DealApiRow) => ({
        id: deal.id,
        name: deal.projectName || deal.project_name || "Untitled Project",
      }));
      setPipelineProjects(projects);
    } catch (error) {
      console.error("Failed to load pipeline projects:", error);
    }
  };

  // Client-side search filtering
  const filteredDocs = documents.filter((doc) => {
    if (
      searchQuery &&
      !doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter((d) => d.status === "pending").length,
    underReview: documents.filter((d) => d.status === "under_review").length,
    approved: documents.filter((d) => d.status === "approved").length,
    aiFlags: documents.filter((d) => d.aiFlags && d.aiFlags.length > 0).length,
  };

  function normalizeVersion(value: unknown): number {
    if (typeof value === "number") return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : 1;
  }

  function mapCategory(cat: string): DocumentCategory {
    const valid: DocumentCategory[] = [
      "corporate",
      "project",
      "financial",
      "real_estate",
      "legal",
      "qalicb",
      "insurance",
      "closing",
    ];
    return valid.includes(cat as DocumentCategory)
      ? (cat as DocumentCategory)
      : "project";
  }

  function mapStatus(status: string): DocumentStatus {
    const statusMap: Record<string, DocumentStatus> = {
      pending: "pending",
      uploaded: "uploaded",
      under_review: "under_review",
      approved: "approved",
      rejected: "rejected",
      expired: "expired",
      draft: "pending",
      pending_review: "under_review",
    };
    return statusMap[status] || "pending";
  }

  const handlePreview = (doc: Document) => {
    setPreviewDoc(doc);
  };

  const handleDownload = (doc: Document) => {
    const content = `Document: ${doc.name}\nProject: ${doc.projectName}\nCategory: ${doc.category}\nStatus: ${doc.status}\nUploaded: ${doc.uploadedDate}\nUploaded By: ${doc.uploadedBy}\nSize: ${doc.size}\nVersion: ${doc.version}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = doc.name.replace(".pdf", ".txt").replace(".xlsx", ".txt");
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // File upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size exceeds 50MB limit");
      return;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setUploadError("Only PDF, DOC, DOCX, XLS, and XLSX files are allowed");
      return;
    }

    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError("Please select a file to upload");
      return;
    }

    if (!uploadProjectId) {
      setUploadError('Please select a project or choose "Other"');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Step 1: Upload file directly to Supabase via our API
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadProjectId && uploadProjectId !== "other") {
        formData.append("dealId", uploadProjectId);
      }

      const uploadResponse = await fetch("/api/documents", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to upload file",
        );
      }

      const { publicUrl } = await uploadResponse.json();

      // Step 2: Create document record in database
      const docResponse = await fetch("/api/documents", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadFile.name,
          file_url: publicUrl,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          category: "project", // Always set to project since we're linking to projects
          deal_id:
            uploadProjectId && uploadProjectId !== "other"
              ? uploadProjectId
              : undefined,
        }),
      });

      if (!docResponse.ok) {
        const errorData = await docResponse.json();
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to create document record",
        );
      }

      // Success! Refresh documents list and close modal
      await fetchDocuments();
      setShowUploadModal(false);
      resetUploadForm();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadProjectId(""); // Reset to empty instead of 'project'
    setUploadDescription("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadForm();
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Documents</h1>
          <p className="text-gray-400 mt-1">
            Manage all documents across your projects
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Documents</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-gray-400">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-500">Pending Upload</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-amber-400">
            {stats.underReview}
          </div>
          <div className="text-sm text-gray-500">Under Review</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">
            {stats.approved}
          </div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-red-400">{stats.aiFlags}</div>
          <div className="text-sm text-gray-500">AI Flags</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search documents or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as DocumentCategory)
            }
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatus)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-400">Loading documents...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                            {doc.name.endsWith(".pdf") ? (
                              <svg
                                className="w-5 h-5 text-red-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-green-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-100">
                              {doc.name}
                            </div>
                            {doc.version > 1 && (
                              <div className="text-xs text-gray-500">
                                v{doc.version}
                              </div>
                            )}
                            {doc.aiFlags && doc.aiFlags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg
                                  className="w-4 h-4 text-amber-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                <span className="text-xs text-amber-400">
                                  {doc.aiFlags[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/deals/${doc.projectId}`}
                          className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                          {doc.projectName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400 capitalize">
                          {doc.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}
                        >
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {doc.uploadedDate ? (
                          <div>
                            <div className="text-sm text-gray-300">
                              {doc.uploadedDate}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.uploadedBy}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {doc.size || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {doc.status === "pending" ? (
                          <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                            Upload
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreview(doc)}
                              className="text-gray-400 hover:text-blue-400 p-1 rounded hover:bg-blue-900/30 transition-colors"
                              title="Preview document"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="text-gray-400 hover:text-green-400 p-1 rounded hover:bg-green-900/30 transition-colors"
                              title="Download document"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDocs.length === 0 && (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 text-gray-600 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-400">
                  No documents found matching your filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="relative bg-gray-900 rounded-xl w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] flex flex-col border border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  {previewDoc.name.endsWith(".pdf") ? (
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">
                    {previewDoc.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {previewDoc.projectName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-950">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 min-h-[500px] flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6">
                    {previewDoc.name.endsWith(".pdf") ? (
                      <svg
                        className="w-12 h-12 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-12 h-12 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-2">
                    {previewDoc.name}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-400 mb-6">
                    <p>
                      <span className="text-gray-500">Project:</span>{" "}
                      {previewDoc.projectName}
                    </p>
                    <p>
                      <span className="text-gray-500">Category:</span>{" "}
                      {previewDoc.category.replace("_", " ")}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[previewDoc.status]}`}
                      >
                        {STATUS_LABELS[previewDoc.status]}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-500">Size:</span>{" "}
                      {previewDoc.size}
                    </p>
                    <p>
                      <span className="text-gray-500">Version:</span>{" "}
                      {previewDoc.version}
                    </p>
                    <p>
                      <span className="text-gray-500">Uploaded:</span>{" "}
                      {previewDoc.uploadedDate} by {previewDoc.uploadedBy}
                    </p>
                  </div>

                  {previewDoc.aiFlags && previewDoc.aiFlags.length > 0 && (
                    <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        AI Flags
                      </div>
                      <ul className="text-sm text-amber-300">
                        {previewDoc.aiFlags.map((flag, i) => (
                          <li key={i}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    Document preview will display here when connected to file
                    storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closeUploadModal}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100">
                Upload Document
              </h3>
              <button
                onClick={closeUploadModal}
                className="text-gray-500 hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Error Message */}
              {uploadError && (
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {uploadError}
                </div>
              )}

              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project *
                </label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a project...</option>
                  {pipelineProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                  <option value="other">Other (General Document)</option>
                </select>
              </div>

              {/* Description (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of this document..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* File Drop Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  File *
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-900/20"
                      : uploadFile
                        ? "border-green-500/50 bg-green-900/10"
                        : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        {uploadFile.name.endsWith(".pdf") ? (
                          <svg
                            className="w-5 h-5 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-200">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.size)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                        }}
                        className="ml-2 p-1 text-gray-500 hover:text-red-400 rounded"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-10 h-10 text-gray-500 mx-auto mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-400">
                        Drag and drop or{" "}
                        <span className="text-indigo-400 font-medium">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DOC, XLSX up to 50MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeUploadModal}
                disabled={isUploading}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadProjectId || isUploading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DocumentsPageContent />
    </Suspense>
  );
}
