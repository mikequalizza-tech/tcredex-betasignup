"use client";

import { useState, useCallback, useMemo } from "react";
import {
  IntakeData,
  UploadedDocument,
  DocumentCategory,
  DOCUMENT_REQUIREMENTS,
} from "@/types/intake";

interface DueDiligenceDocsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const CATEGORY_LABELS: Record<
  DocumentCategory,
  { label: string; icon: string; color: string }
> = {
  legal: { label: "Legal", icon: "⚖️", color: "blue" },
  financial: { label: "Financial", icon: "💰", color: "green" },
  environmental: { label: "Environmental", icon: "🌍", color: "emerald" },
  construction: { label: "Construction", icon: "🏗️", color: "orange" },
  qalicb: { label: "QALICB", icon: "📋", color: "purple" },
  entitlements: { label: "Entitlements", icon: "📄", color: "indigo" },
  insurance: { label: "Insurance", icon: "🛡️", color: "cyan" },
  appraisal: { label: "Appraisal", icon: "📊", color: "yellow" },
  market_study: { label: "Market Study", icon: "📈", color: "pink" },
  tax: { label: "Tax Credits", icon: "💳", color: "red" },
  other: { label: "Other", icon: "📁", color: "gray" },
};

export function DueDiligenceDocs({ data, onChange }: DueDiligenceDocsProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    DocumentCategory | "all"
  >("all");
  const [dragOver, setDragOver] = useState(false);

  const programs = data.programs || [];
  const documents = useMemo(() => data.documents || [], [data.documents]);

  // Filter requirements based on selected programs
  const applicableRequirements = DOCUMENT_REQUIREMENTS.filter((req) =>
    req.programs.some((p) => programs.includes(p)),
  );

  // Group requirements by category
  const requirementsByCategory = applicableRequirements.reduce(
    (acc, req) => {
      if (!acc[req.category]) acc[req.category] = [];
      acc[req.category].push(req);
      return acc;
    },
    {} as Record<DocumentCategory, typeof applicableRequirements>,
  );

  // Calculate completion stats
  const requiredDocs = applicableRequirements.filter((r) => r.required);
  const uploadedRequired = requiredDocs.filter((req) =>
    documents.some(
      (doc) =>
        doc.category === req.category &&
        doc.name.toLowerCase().includes(req.name.toLowerCase().split(" ")[0]),
    ),
  );
  const completionPct =
    requiredDocs.length > 0
      ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
      : 0;

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList, category: DocumentCategory = "other") => {
      if (!files.length) return;

      setUploading(true);
      const newDocs: UploadedDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Create blob URL for preview (in real app, upload to cloud storage)
        const url = URL.createObjectURL(file);

        newDocs.push({
          id: `doc_${Date.now()}_${i}`,
          name: file.name,
          url: url,
          size: file.size,
          mimeType: file.type,
          category: category,
          tags: [],
          uploadedAt: new Date().toISOString(),
          status: "pending",
        });
      }

      onChange({
        documents: [...documents, ...newDocs],
        docsUploaded: (data.docsUploaded || 0) + newDocs.length,
      });
      setUploading(false);
    },
    [documents, data.docsUploaded, onChange],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files);
      }
    },
    [handleFileUpload],
  );

  // Remove document
  const removeDocument = useCallback(
    (docId: string) => {
      const doc = documents.find((d) => d.id === docId);
      if (doc?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(doc.url);
      }
      onChange({
        documents: documents.filter((d) => d.id !== docId),
        docsUploaded: Math.max(0, (data.docsUploaded || 0) - 1),
      });
    },
    [documents, data.docsUploaded, onChange],
  );

  // Update document category
  const updateDocCategory = useCallback(
    (docId: string, category: DocumentCategory) => {
      onChange({
        documents: documents.map((d) =>
          d.id === docId ? { ...d, category } : d,
        ),
      });
    },
    [documents, onChange],
  );

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get icon for file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("image")) return "🖼️";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
      return "📊";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    return "📄";
  };

  const filteredDocs =
    selectedCategory === "all"
      ? documents
      : documents.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            Upload due diligence documents for CDE and investor review
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-400">
              {documents.length}
            </div>
            <div className="text-xs text-gray-500">Documents</div>
          </div>
          <div
            className={`px-3 py-2 rounded-lg ${
              completionPct >= 80
                ? "bg-green-900/30 border border-green-500/30"
                : completionPct >= 50
                  ? "bg-yellow-900/30 border border-yellow-500/30"
                  : "bg-gray-800 border border-gray-700"
            }`}
          >
            <div
              className={`text-xl font-bold ${
                completionPct >= 80
                  ? "text-green-400"
                  : completionPct >= 50
                    ? "text-yellow-400"
                    : "text-gray-400"
              }`}
            >
              {completionPct}%
            </div>
            <div className="text-xs text-gray-500">Required</div>
          </div>
        </div>
      </div>

      {/* No Programs Warning */}
      {programs.length === 0 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-amber-300 font-medium text-sm">
              Select Programs First
            </p>
            <p className="text-xs text-amber-400/70">
              Document requirements depend on which programs you're pursuing
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver
            ? "border-indigo-500 bg-indigo-900/20"
            : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <input
          type="file"
          id="docUpload"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
        <label htmlFor="docUpload" className="cursor-pointer">
          <div className="text-4xl mb-3">{uploading ? "⏳" : "📁"}</div>
          {uploading ? (
            <p className="text-gray-400">Uploading...</p>
          ) : (
            <>
              <p className="text-indigo-400 font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, Word, Excel, or images up to 25MB each
              </p>
            </>
          )}
        </label>
      </div>

      {/* Requirements Checklist */}
      {programs.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200">
              Required Documents Checklist
            </h3>
            <span className="text-xs text-gray-500">
              {uploadedRequired.length}/{requiredDocs.length} required uploaded
            </span>
          </div>
          <div className="divide-y divide-gray-700/50 max-h-80 overflow-y-auto">
            {Object.entries(requirementsByCategory).map(([category, reqs]) => (
              <details key={category} className="group">
                <summary className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {CATEGORY_LABELS[category as DocumentCategory].icon}
                    </span>
                    <span className="text-sm font-medium text-gray-300">
                      {CATEGORY_LABELS[category as DocumentCategory].label}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({reqs.length} items)
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-4 pb-3 space-y-2">
                  {reqs.map((req) => {
                    const hasDoc = documents.some(
                      (d) =>
                        d.category === req.category &&
                        d.name
                          .toLowerCase()
                          .includes(req.name.toLowerCase().split(" ")[0]),
                    );
                    return (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 py-1"
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            hasDoc
                              ? "bg-green-600 text-white"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {hasDoc ? "✓" : req.required ? "*" : "○"}
                        </span>
                        <span
                          className={`text-sm ${hasDoc ? "text-gray-300" : "text-gray-400"}`}
                        >
                          {req.name}
                          {req.required && (
                            <span className="text-red-400 ml-1">*</span>
                          )}
                        </span>
                        {!hasDoc && (
                          <label className="ml-auto">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                e.target.files &&
                                handleFileUpload(e.target.files, req.category)
                              }
                              className="hidden"
                            />
                            <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                              + Upload
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">
              Uploaded Documents
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-400"
                }`}
              >
                All ({documents.length})
              </button>
              {Object.entries(
                documents.reduce(
                  (acc, d) => {
                    acc[d.category] = (acc[d.category] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              ).map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as DocumentCategory)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {CATEGORY_LABELS[cat as DocumentCategory]?.icon} {count}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 flex items-center gap-3"
              >
                <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatSize(doc.size)} •{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={doc.category}
                  onChange={(e) =>
                    updateDocCategory(
                      doc.id,
                      e.target.value as DocumentCategory,
                    )
                  }
                  className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.icon} {val.label}
                    </option>
                  ))}
                </select>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    doc.status === "approved"
                      ? "bg-green-900/50 text-green-300"
                      : doc.status === "rejected"
                        ? "bg-red-900/50 text-red-300"
                        : doc.status === "needs_review"
                          ? "bg-yellow-900/50 text-yellow-300"
                          : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {doc.status === "approved"
                    ? "✓ Approved"
                    : doc.status === "rejected"
                      ? "✗ Rejected"
                      : doc.status === "needs_review"
                        ? "⚠ Review"
                        : "Pending"}
                </span>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove document"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier 3 Note */}
      {completionPct < 80 && programs.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-gray-300 font-medium text-sm">
                Due Diligence Completion
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Complete document uploads unlock Tier 3 (Due Diligence Ready)
                status, enabling full CDE and investor review in the Closing
                Room.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DueDiligenceDocs;
