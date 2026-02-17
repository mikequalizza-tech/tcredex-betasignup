"use client";

import { useState, useEffect } from "react";
import { Document, formatFileSize } from "@/lib/documents/types";

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
  onDownload?: (doc: Document) => void;
  onCheckout?: (doc: Document) => void;
}

export default function DocumentPreviewModal({
  document,
  onClose,
  onDownload,
  onCheckout,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const mimeType = document.currentVersion.mimeType;
  const fileName = document.currentVersion.fileName;
  const storageUrl = document.currentVersion.storageUrl;
  const previewUrl = document.currentVersion.previewUrl || storageUrl;

  // For demo, we'll use a sample PDF from the web
  // In production, this would be your actual document URL
  const getDemoUrl = () => {
    if (mimeType === "application/pdf") {
      // Use a real PDF for demo - replace with actual storageUrl in production
      return "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf";
    }
    return previewUrl;
  };

  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");
  const isText = mimeType.startsWith("text/");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    } else {
      const link = window.document.createElement("a");
      link.href = storageUrl;
      link.download = fileName;
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl w-full max-w-6xl mx-4 shadow-2xl max-h-[95vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
              {isPdf && (
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z" />
                </svg>
              )}
              {isImage && (
                <svg
                  className="w-5 h-5 text-blue-400"
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
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-100 truncate">
                {document.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{fileName}</span>
                <span>•</span>
                <span>{formatFileSize(document.currentVersion.fileSize)}</span>
                <span>•</span>
                <span>v{document.currentVersion.versionNumber}</span>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* Zoom controls for PDF */}
            {isPdf && (
              <div className="flex items-center gap-1 mr-2 bg-gray-800 rounded-lg px-2 py-1">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Zoom out"
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
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span className="text-xs text-gray-400 w-10 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 text-gray-400 hover:text-white"
                  title="Zoom in"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Checkout button */}
            {!document.lock?.isLocked && onCheckout && (
              <button
                onClick={() => onCheckout(document)}
                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex items-center gap-1"
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Check Out
              </button>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-1"
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

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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

        {/* Lock banner */}
        {document.lock?.isLocked && (
          <div className="px-4 py-2 bg-red-900/30 border-b border-red-500/30 flex items-center gap-2 text-sm text-red-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              This document is checked out by{" "}
              <strong>{document.lock.lockedBy?.name}</strong>. You can view but
              not edit until it&apos;s checked back in.
            </span>
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-950 min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-red-500 mx-auto mb-4"
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
                <p className="text-red-400 mb-2">Failed to load preview</p>
                <p className="text-gray-500 text-sm">{error}</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm"
                >
                  Download Instead
                </button>
              </div>
            </div>
          ) : isPdf ? (
            <div className="h-full flex items-center justify-center p-4">
              <div
                className="bg-white rounded-lg shadow-2xl overflow-hidden"
                style={{
                  width: `${zoom}%`,
                  maxWidth: "100%",
                  height: "100%",
                  minHeight: "600px",
                }}
              >
                {/* 
                  In production, use your actual document URL.
                  For demo purposes, we show a placeholder.
                  Options for PDF viewing:
                  1. <iframe src={storageUrl}> - works if PDF served with correct headers
                  2. Google Docs Viewer: https://docs.google.com/viewer?url={encodedUrl}&embedded=true
                  3. PDF.js library for full control
                */}
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(getDemoUrl())}&embedded=true`}
                  className="w-full h-full border-0"
                  title={document.name}
                  onLoad={() => setLoading(false)}
                  onError={() => setError("Unable to load PDF preview")}
                />
              </div>
            </div>
          ) : isImage ? (
            <div className="h-full flex items-center justify-center p-8">
              <img
                src={previewUrl}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                style={{ transform: `scale(${zoom / 100})` }}
                onLoad={() => setLoading(false)}
                onError={() => setError("Unable to load image")}
              />
            </div>
          ) : isText ? (
            <div className="h-full p-6">
              <pre className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm overflow-auto h-full font-mono">
                {/* In production, fetch and display text content */}
                Unable to load text preview. Click download to view the file.
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="w-24 h-24 text-gray-600 mx-auto mb-6"
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
                <h4 className="text-lg font-medium text-gray-300 mb-2">
                  Preview not available
                </h4>
                <p className="text-gray-500 mb-4">
                  This file type ({mimeType}) cannot be previewed in the
                  browser.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg"
                >
                  Download to View
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with document info */}
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Uploaded by {document.currentVersion.uploadedBy.name}</span>
            <span>•</span>
            <span>
              {new Date(document.currentVersion.uploadedAt).toLocaleString()}
            </span>
            {document.currentVersion.changeNotes && (
              <>
                <span>•</span>
                <span className="text-gray-400">
                  &quot;{document.currentVersion.changeNotes}&quot;
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                document.status === "approved"
                  ? "bg-green-900/50 text-green-300"
                  : document.status === "pending_review"
                    ? "bg-amber-900/50 text-amber-300"
                    : "bg-gray-800 text-gray-400"
              }`}
            >
              {document.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
