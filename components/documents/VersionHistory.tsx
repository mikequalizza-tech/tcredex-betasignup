"use client";

import { useState } from "react";
import { DocumentVersion, formatFileSize } from "@/lib/documents/types";

interface VersionHistoryProps {
  versions: DocumentVersion[];
  currentVersionId: string;
  onRestore?: (version: DocumentVersion) => void;
  onDownload?: (version: DocumentVersion) => void;
  canRestore?: boolean;
}

export default function VersionHistory({
  versions,
  currentVersionId,
  onRestore,
  onDownload,
  canRestore = true,
}: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] =
    useState<DocumentVersion | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleRestore = (version: DocumentVersion) => {
    setShowConfirmRestore(version);
  };

  const confirmRestore = () => {
    if (showConfirmRestore && onRestore) {
      onRestore(showConfirmRestore);
      setShowConfirmRestore(null);
    }
  };

  // Sort versions by version number descending
  const sortedVersions = [...versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  );

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-gray-100">Version History</h3>
        <p className="text-sm text-gray-400 mt-1">
          {versions.length} version(s)
        </p>
      </div>

      <div className="divide-y divide-gray-800">
        {sortedVersions.map((version) => {
          const isCurrent = version.id === currentVersionId;
          const isExpanded = expandedVersion === version.id;

          return (
            <div key={version.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Version badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCurrent
                        ? "bg-green-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    v{version.versionNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-medium">
                        {version.fileName}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {version.uploadedBy.name} •{" "}
                      {formatDate(version.uploadedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(version.fileSize)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDownload?.(version)}
                    className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Download"
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
                  {!isCurrent && canRestore && (
                    <button
                      onClick={() => handleRestore(version)}
                      className="p-2 text-gray-400 hover:text-amber-400 transition-colors"
                      title="Restore this version"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setExpandedVersion(isExpanded ? null : version.id)
                    }
                    className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
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
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 ml-11 p-3 bg-gray-800 rounded-lg">
                  {version.changeNotes ? (
                    <>
                      <p className="text-sm text-gray-500 mb-1">
                        Change Notes:
                      </p>
                      <p className="text-sm text-gray-300">
                        {version.changeNotes}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No change notes provided
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      Checksum:{" "}
                      <span className="font-mono text-gray-400">
                        {version.checksum}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Restore confirmation modal */}
      {showConfirmRestore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Restore Version?
            </h3>
            <p className="text-gray-400 mb-4">
              This will create a new version based on v
              {showConfirmRestore.versionNumber}. The current version will be
              preserved in history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmRestore(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
