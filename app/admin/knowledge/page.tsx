"use client";

import { useState, useEffect } from "react";

interface KnowledgeDocument {
  id: string;
  filename: string;
  category: string;
  program?: string;
  title?: string;
  pageCount?: number;
  uploadedAt: string;
  chunksCount?: number;
}

const CATEGORIES = [
  {
    value: "platform",
    label: "Platform Docs",
    color: "bg-purple-100 text-purple-700",
  },
  { value: "nmtc", label: "NMTC", color: "bg-emerald-100 text-emerald-700" },
  { value: "htc", label: "HTC", color: "bg-blue-100 text-blue-700" },
  { value: "lihtc", label: "LIHTC", color: "bg-violet-100 text-violet-700" },
  {
    value: "oz",
    label: "Opportunity Zone",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "compliance",
    label: "Compliance",
    color: "bg-red-100 text-red-700",
  },
  {
    value: "state",
    label: "State Credits",
    color: "bg-cyan-100 text-cyan-700",
  },
  { value: "general", label: "General", color: "bg-gray-100 text-gray-700" },
];

export default function KnowledgeAdminPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("platform");
  const [uploadProgram, setUploadProgram] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Test query state
  const [testQuery, setTestQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/knowledge/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      if (uploadProgram) formData.append("program", uploadProgram);

      const response = await fetch("/api/knowledge/ingest", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully ingested: ${result.chunksCreated} chunks created`);
        setUploadModalOpen(false);
        setUploadFile(null);
        loadDocuments();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (_error) {
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (
      !confirm(`Delete "${filename}"? This will remove all associated chunks.`)
    )
      return;

    try {
      const response = await fetch(`/api/knowledge/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadDocuments();
      } else {
        alert("Failed to delete document");
      }
    } catch (_error) {
      alert("Failed to delete document");
    }
  };

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;

    setIsTesting(true);
    try {
      const response = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsTesting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryStyle = (category: string) => {
    return (
      CATEGORIES.find((c) => c.value === category)?.color ||
      "bg-gray-100 text-gray-700"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            ChatTC Knowledge Base
          </h1>
          <p className="text-gray-500">
            Manage documents for RAG-powered chat responses
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Documents</div>
            <div className="text-2xl font-bold text-gray-900">
              {documents.length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Platform Docs</div>
            <div className="text-2xl font-bold text-purple-600">
              {documents.filter((d) => d.category === "platform").length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Program Docs</div>
            <div className="text-2xl font-bold text-emerald-600">
              {
                documents.filter((d) =>
                  ["nmtc", "htc", "lihtc", "oz"].includes(d.category),
                ).length
              }
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Chunks</div>
            <div className="text-2xl font-bold text-blue-600">
              {documents.reduce((sum, d) => sum + (d.chunksCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            + Upload Document
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Document
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Program
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Pages
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">
                  Uploaded
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Loading documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No documents found. Upload your first document to get
                    started.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {doc.title || doc.filename}
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.filename}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getCategoryStyle(doc.category)}`}
                      >
                        {CATEGORIES.find((c) => c.value === doc.category)
                          ?.label || doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.program || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.pageCount || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Test Search Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Test Knowledge Search
          </h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Enter a test query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              onKeyDown={(e) => e.key === "Enter" && handleTestSearch()}
            />
            <button
              onClick={handleTestSearch}
              disabled={isTesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? "Searching..." : "Search"}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              {testResults.map((result, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {result.chunk.metadata.filename}
                      {result.chunk.metadata.page &&
                        ` (page ${result.chunk.metadata.page})`}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {(result.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {result.chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File (PDF or TXT)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program (optional)
                </label>
                <select
                  value={uploadProgram}
                  onChange={(e) => setUploadProgram(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  <option value="NMTC">NMTC</option>
                  <option value="HTC">HTC</option>
                  <option value="LIHTC">LIHTC</option>
                  <option value="OZ">Opportunity Zone</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
