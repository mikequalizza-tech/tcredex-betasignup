"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Document,
  DOCUMENT_CATEGORIES,
  formatFileSize,
  isPreviewable,
} from "@/lib/documents/types";

interface DocumentCardProps {
  document: Document;
  onShare?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
  onPreview?: (doc: Document) => void;
  onCheckout?: (doc: Document) => void;
  onCheckin?: (doc: Document) => void;
  showEntity?: boolean;
  currentUserId?: string;
}

export default function DocumentCard({
  document: doc, // Rename to avoid shadowing browser's document
  onShare,
  onDelete,
  onPreview,
  onCheckout,
  onCheckin,
  showEntity = true,
  currentUserId = "u1", // Demo: current user ID
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const category = DOCUMENT_CATEGORIES[doc.category];
  const canPreview = isPreviewable(doc.currentVersion.mimeType);
  const isLockedByMe =
    doc.lock?.isLocked && doc.lock.lockedBy?.id === currentUserId;
  const isLockedByOther =
    doc.lock?.isLocked && doc.lock.lockedBy?.id !== currentUserId;

  const getFileIcon = () => {
    const mimeType = doc.currentVersion.mimeType;
    if (mimeType === "application/pdf") {
      return (
        <svg
          className="w-6 h-6 text-red-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
          <path d="M8.5 13.5c0-.55.45-1 1-1h.5c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-.5c-.55 0-1-.45-1-1v-3zm3.5 0c0-.55.45-1 1-1h.5c.55 0 1 .45 1 1v1.5h.5c.28 0 .5.22.5.5s-.22.5-.5.5H15v1c0 .55-.45 1-1 1h-.5c-.55 0-1-.45-1-1v-3.5z" />
        </svg>
      );
    }
    if (mimeType.startsWith("image/")) {
      return (
        <svg
          className="w-6 h-6 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return (
        <svg
          className="w-6 h-6 text-green-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
          <path d="M8 12h2v2H8v-2zm0 3h2v2H8v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2z" />
        </svg>
      );
    }
    if (mimeType.includes("document") || mimeType.includes("word")) {
      return (
        <svg
          className="w-6 h-6 text-blue-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
          <path d="M8 12h8v1H8v-1zm0 2h8v1H8v-1zm0 2h5v1H8v-1z" />
        </svg>
      );
    }
    return (
      <svg
        className="w-6 h-6 text-gray-400"
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
    );
  };

  const getStatusColor = () => {
    switch (doc.status) {
      case "approved":
        return "bg-green-900/50 text-green-300 border-green-500/30";
      case "pending_review":
        return "bg-amber-900/50 text-amber-300 border-amber-500/30";
      case "draft":
        return "bg-gray-800 text-gray-400 border-gray-700";
      case "archived":
        return "bg-gray-900 text-gray-500 border-gray-800";
      default:
        return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDownload = () => {
    // Create download link - in production this would be a signed URL from storage
    const link = document.createElement("a");
    link.href = doc.currentVersion.storageUrl;
    link.download = doc.currentVersion.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`bg-gray-900 rounded-xl border p-4 transition-colors group ${
        isLockedByOther
          ? "border-red-500/50 bg-red-900/10"
          : isLockedByMe
            ? "border-green-500/50 bg-green-900/10"
            : "border-gray-800 hover:border-gray-700"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 relative">
          {getFileIcon()}
          {/* Lock indicator on icon */}
          {doc.lock?.isLocked && (
            <div
              className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                isLockedByMe ? "bg-green-600" : "bg-red-600"
              }`}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/dashboard/documents/${doc.id}`}
                className="text-gray-100 font-medium hover:text-indigo-400 transition-colors truncate block"
              >
                {doc.name}
              </Link>
              <p className="text-xs text-gray-500 truncate">
                {doc.currentVersion.fileName}
              </p>
            </div>

            {/* Always visible action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Preview Button */}
              <button
                onClick={() => onPreview?.(doc)}
                disabled={!canPreview}
                className={`p-2 rounded-lg transition-colors ${
                  canPreview
                    ? "text-gray-400 hover:text-blue-400 hover:bg-blue-900/30"
                    : "text-gray-600 cursor-not-allowed"
                }`}
                title={
                  canPreview
                    ? "Preview document"
                    : "Preview not available for this file type"
                }
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

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
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

              {/* Checkout/Checkin Button */}
              {isLockedByMe ? (
                <button
                  onClick={() => onCheckin?.(doc)}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-lg transition-colors"
                  title="Check in document (release lock)"
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
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              ) : isLockedByOther ? (
                <button
                  disabled
                  className="p-2 text-red-400 cursor-not-allowed rounded-lg"
                  title={`Locked by ${doc.lock?.lockedBy?.name}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => onCheckout?.(doc)}
                  className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-900/30 rounded-lg transition-colors"
                  title="Check out document for editing"
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </button>
              )}

              {/* More Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-t-lg"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/dashboard/documents/${doc.id}/versions`}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Version History
                      </Link>
                      <button
                        onClick={() => {
                          onShare?.(doc);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        Share
                      </button>
                      <hr className="border-gray-700 my-1" />
                      <button
                        onClick={() => {
                          onDelete?.(doc);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lock status banner */}
          {doc.lock?.isLocked && (
            <div
              className={`flex items-center gap-2 mt-2 px-2 py-1 rounded text-xs ${
                isLockedByMe
                  ? "bg-green-900/30 text-green-300"
                  : "bg-red-900/30 text-red-300"
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              {isLockedByMe ? (
                <span>Checked out by you</span>
              ) : (
                <span>Checked out by {doc.lock.lockedBy?.name}</span>
              )}
              {doc.lock.lockedAt && (
                <span className="text-gray-500">
                  • {formatDate(doc.lock.lockedAt)}
                </span>
              )}
            </div>
          )}

          {/* Active collaborators */}
          {doc.collaborators && doc.collaborators.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {doc.collaborators.slice(0, 3).map((collab) => (
                  <div
                    key={collab.id}
                    className={`w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-medium ${
                      collab.activity === "editing"
                        ? "bg-green-600"
                        : "bg-blue-600"
                    }`}
                    title={`${collab.name} (${collab.activity})`}
                  >
                    {collab.name.charAt(0)}
                  </div>
                ))}
                {doc.collaborators.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                    +{doc.collaborators.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {doc.collaborators.length} active
              </span>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor()}`}
            >
              {doc.status.replace("_", " ")}
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
              {category.label}
            </span>
            {doc.requiredForClosing && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-300 border border-red-500/30">
                Required
              </span>
            )}
          </div>

          {/* Footer info */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>{formatFileSize(doc.currentVersion.fileSize)}</span>
            <span>v{doc.currentVersion.versionNumber}</span>
            <span>{formatDate(doc.updatedAt)}</span>
            {doc.shares.length > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {doc.shares.length} shared
              </span>
            )}
          </div>

          {/* Entity association */}
          {showEntity && (
            <p className="text-xs text-gray-600 mt-2">
              {doc.entityType}: {doc.entityName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
