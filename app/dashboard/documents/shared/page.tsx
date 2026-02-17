"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Document,
  DocumentCategory,
  DOCUMENT_CATEGORIES,
  DocumentTag,
  TAG_COLORS,
} from "@/lib/documents/types";

type SortOption = "recent" | "name" | "sharedDate";

export default function SharedDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<
    DocumentCategory | "all"
  >("all");
  const [filterTag, setFilterTag] = useState<DocumentTag | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category", filterCategory);

      const response = await fetch(
        `/api/documents/shared?${params.toString()}`,
      );
      const data = await response.json();

      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch shared documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (filterCategory !== "all" && doc.category !== filterCategory)
      return false;
    if (filterTag !== "all" && !doc.tags.includes(filterTag)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(query) ||
        doc.entityName.toLowerCase().includes(query) ||
        doc.owner.name.toLowerCase().includes(query) ||
        doc.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "sharedDate":
        const aShare = a.shares[0]?.sharedAt || a.createdAt;
        const bShare = b.shares[0]?.sharedAt || b.createdAt;
        return new Date(bShare).getTime() - new Date(aShare).getTime();
      case "recent":
      default:
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  });

  // Get unique tags from documents
  const availableTags = Array.from(new Set(documents.flatMap((d) => d.tags)));

  const formatSharedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Shared With Me</h1>
        <p className="text-gray-400 mt-1">
          Documents that others have shared with you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Total Shared</p>
          <p className="text-2xl font-bold text-indigo-400">
            {documents.length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Can Edit</p>
          <p className="text-2xl font-bold text-green-400">
            {
              documents.filter((d) =>
                d.shares.some(
                  (s) =>
                    s.accessLevel === "editor" || s.accessLevel === "admin",
                ),
              ).length
            }
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">View Only</p>
          <p className="text-2xl font-bold text-amber-400">
            {
              documents.filter((d) =>
                d.shares.every((s) => s.accessLevel === "viewer"),
              ).length
            }
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-sm text-gray-500">Expiring Soon</p>
          <p className="text-2xl font-bold text-red-400">
            {documents.filter((d) => d.shares.some((s) => s.expiresAt)).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shared documents..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as DocumentCategory | "all")
          }
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
        >
          <option value="all">All Categories</option>
          {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Tag filter */}
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value as DocumentTag | "all")}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
        >
          <option value="all">All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
        >
          <option value="recent">Recently Updated</option>
          <option value="sharedDate">Recently Shared</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-gray-900 rounded-xl border border-gray-800">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-400">
              Loading shared documents...
            </span>
          </div>
        ) : sortedDocuments.length > 0 ? (
          sortedDocuments.map((doc) => {
            const share = doc.shares[0]; // The share that gives current user access
            return (
              <div
                key={doc.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {doc.currentVersion.mimeType.includes("pdf")
                      ? "📄"
                      : doc.currentVersion.mimeType.includes("word")
                        ? "📝"
                        : doc.currentVersion.mimeType.includes("sheet")
                          ? "📊"
                          : "📁"}
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
                        <p className="text-sm text-gray-400 mt-0.5">
                          {doc.description}
                        </p>
                      </div>

                      {/* Access Level Badge */}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                          share?.accessLevel === "editor" ||
                          share?.accessLevel === "admin"
                            ? "bg-green-900/50 text-green-300"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {share?.accessLevel === "editor"
                          ? "Can Edit"
                          : share?.accessLevel === "admin"
                            ? "Full Access"
                            : "View Only"}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded text-xs ${TAG_COLORS[tag] || "bg-gray-800 text-gray-400"}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Shared by {doc.owner.name}</span>
                      <span>
                        {formatSharedDate(share?.sharedAt || doc.createdAt)}
                      </span>
                      <span>
                        {doc.entityType}: {doc.entityName}
                      </span>
                      {share?.expiresAt && (
                        <span className="text-amber-400">
                          Expires{" "}
                          {new Date(share.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                    >
                      View
                    </Link>
                    <a
                      href={doc.currentVersion.storageUrl}
                      download
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
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
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <p className="text-gray-400">
              No documents have been shared with you yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
