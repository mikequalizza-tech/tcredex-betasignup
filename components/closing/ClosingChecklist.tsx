"use client";

import { useState } from "react";
import {
  getDocsForChecklistItem,
  blocksClosing,
} from "@/lib/closing/documentRequirements";

export interface ChecklistItem {
  id: number;
  label: string;
  required: boolean;
  category?: string;
}

// Extended checklist items aligned with document requirements
export const closingChecklistItems: ChecklistItem[] = [
  // Eligibility
  {
    id: 1,
    label: "QALICB Eligibility Certification",
    required: true,
    category: "Eligibility",
  },

  // Allocation
  {
    id: 2,
    label: "NMTC Allocation Agreement",
    required: true,
    category: "Allocation",
  },
  {
    id: 3,
    label: "CDE Sub-Allocation Approval",
    required: true,
    category: "Allocation",
  },

  // Financing
  {
    id: 4,
    label: "QLICI Loan Documents",
    required: true,
    category: "Financing",
  },
  {
    id: 5,
    label: "Leverage Loan Documents",
    required: true,
    category: "Financing",
  },
  {
    id: 6,
    label: "Equity Investment Documents",
    required: true,
    category: "Financing",
  },

  // Real Estate
  { id: 7, label: "Title & Survey", required: true, category: "Real Estate" },
  {
    id: 8,
    label: "Environmental Reports",
    required: true,
    category: "Real Estate",
  },
  { id: 9, label: "Appraisal", required: true, category: "Real Estate" },

  // Corporate
  {
    id: 10,
    label: "Organizational Documents",
    required: true,
    category: "Corporate",
  },

  // Insurance
  {
    id: 11,
    label: "Insurance Certificates",
    required: true,
    category: "Insurance",
  },

  // Construction
  {
    id: 12,
    label: "Construction Documents",
    required: false,
    category: "Construction",
  },

  // Legal
  { id: 13, label: "Legal Opinions", required: true, category: "Legal" },
];

interface DocumentStatus {
  name: string;
  uploaded: boolean;
  uploadedAt?: string;
}

interface ChecklistItemStatus {
  itemId: number;
  completed: boolean;
  documents: DocumentStatus[];
}

interface ClosingChecklistProps {
  completedIds?: number[];
  documentStatuses?: ChecklistItemStatus[];
  onToggle?: (itemId: number, completed: boolean) => void;
  onDocumentClick?: (checklistItem: string, docName: string) => void;
  readOnly?: boolean;
  showDocuments?: boolean;
  program?: "NMTC" | "HTC" | "LIHTC" | "OZ";
}

export default function ClosingChecklist({
  completedIds = [],
  documentStatuses = [],
  onToggle,
  onDocumentClick,
  readOnly = false,
  showDocuments = true,
  program: _program = "NMTC",
}: ClosingChecklistProps) {
  const [completed, setCompleted] = useState<number[]>(completedIds);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const handleToggle = (itemId: number) => {
    if (readOnly) return;

    const isCompleted = completed.includes(itemId);
    const newCompleted = isCompleted
      ? completed.filter((id) => id !== itemId)
      : [...completed, itemId];

    setCompleted(newCompleted);
    onToggle?.(itemId, !isCompleted);
  };

  const toggleExpand = (itemId: number) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  // Get document status for a checklist item
  const getDocStatus = (
    itemId: number,
    docName: string,
  ): DocumentStatus | undefined => {
    const itemStatus = documentStatuses.find((s) => s.itemId === itemId);
    return itemStatus?.documents.find((d) => d.name === docName);
  };

  // Check if all docs for an item are uploaded
  const _allDocsUploaded = (item: ChecklistItem): boolean => {
    const requiredDocs = getDocsForChecklistItem(item.label);
    if (requiredDocs.length === 0) return true;

    const itemStatus = documentStatuses.find((s) => s.itemId === item.id);
    if (!itemStatus) return false;

    return requiredDocs.every((docName) =>
      itemStatus.documents.some((d) => d.name === docName && d.uploaded),
    );
  };

  // Get uploaded count for an item
  const getUploadedCount = (
    item: ChecklistItem,
  ): { uploaded: number; total: number } => {
    const requiredDocs = getDocsForChecklistItem(item.label);
    const itemStatus = documentStatuses.find((s) => s.itemId === item.id);
    const uploaded = requiredDocs.filter((docName) =>
      itemStatus?.documents.some((d) => d.name === docName && d.uploaded),
    ).length;
    return { uploaded, total: requiredDocs.length };
  };

  const requiredComplete = closingChecklistItems
    .filter((item) => item.required)
    .every((item) => completed.includes(item.id));

  const progress = (completed.length / closingChecklistItems.length) * 100;

  // Group items by category
  const categories = Array.from(
    new Set(closingChecklistItems.map((i) => i.category)),
  );

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Closing Progress</span>
          <span className="text-gray-300">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist items grouped by category */}
      {categories.map((category) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            {category}
          </h4>

          {closingChecklistItems
            .filter((item) => item.category === category)
            .map((item) => {
              const docs = getDocsForChecklistItem(item.label);
              const hasDocs = docs.length > 0;
              const isExpanded = expandedItems.includes(item.id);
              const docCount = getUploadedCount(item);
              const isBlocker = blocksClosing(item.label);

              return (
                <div key={item.id} className="space-y-0">
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      completed.includes(item.id)
                        ? "bg-green-900/20 border-green-700"
                        : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={completed.includes(item.id)}
                      onChange={() => handleToggle(item.id)}
                      disabled={readOnly}
                      className="w-5 h-5 rounded border-gray-500 text-green-600 focus:ring-green-500"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`${
                            completed.includes(item.id)
                              ? "text-gray-300"
                              : "text-gray-400"
                          } ${item.required ? "font-medium" : ""}`}
                        >
                          {item.label}
                        </span>
                        {item.required && isBlocker && (
                          <span className="text-xs px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded">
                            Required
                          </span>
                        )}
                      </div>

                      {/* Document count indicator */}
                      {hasDocs && showDocuments && (
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs ${
                              docCount.uploaded === docCount.total
                                ? "text-green-400"
                                : "text-amber-400"
                            }`}
                          >
                            📄 {docCount.uploaded}/{docCount.total} docs
                          </span>
                        </div>
                      )}
                    </div>

                    {completed.includes(item.id) && (
                      <span className="text-green-400">✓</span>
                    )}

                    {/* Expand button for documents */}
                    {hasDocs && showDocuments && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <svg
                          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Expanded document list */}
                  {hasDocs && showDocuments && isExpanded && (
                    <div className="ml-8 pl-4 border-l-2 border-gray-700 py-2 space-y-1">
                      {docs.map((docName) => {
                        const docStatus = getDocStatus(item.id, docName);
                        const isUploaded = docStatus?.uploaded ?? false;

                        return (
                          <div
                            key={docName}
                            className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${
                              isUploaded
                                ? "bg-green-900/20 text-green-300"
                                : "bg-gray-800/30 text-gray-500 hover:bg-gray-800/50"
                            }`}
                            onClick={() =>
                              onDocumentClick?.(item.label, docName)
                            }
                          >
                            <span
                              className={
                                isUploaded ? "text-green-400" : "text-gray-600"
                              }
                            >
                              {isUploaded ? "✓" : "○"}
                            </span>
                            <span className="flex-1">{docName}</span>
                            {isUploaded && docStatus?.uploadedAt && (
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  docStatus.uploadedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {!isUploaded && (
                              <span className="text-xs text-amber-500">
                                Upload →
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ))}

      {/* Ready to close indicator */}
      {requiredComplete && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg text-center">
          <p className="text-green-300 font-semibold">
            ✓ All required items complete — Ready to close!
          </p>
        </div>
      )}

      {/* Blocking items warning */}
      {!requiredComplete && (
        <div className="p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
          <p className="text-amber-300 text-sm">
            <strong>⚠️ Blocking Items:</strong>{" "}
            {closingChecklistItems
              .filter((item) => item.required && !completed.includes(item.id))
              .map((item) => item.label)
              .join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
