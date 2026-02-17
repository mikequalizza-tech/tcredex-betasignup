"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";
import ClosingChecklist from "@/components/closing/ClosingChecklist";
import { getRequirementsForProgram } from "@/lib/closing/documentRequirements";
import { CallOverlay } from "@/components/closing-room";

type ClosingStatus =
  | "pending"
  | "active"
  | "on_hold"
  | "closing"
  | "closed"
  | "terminated";
type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  organization_name: string;
  permissions: { view: boolean; upload: boolean; approve: boolean };
  accepted_at: string | null;
}

interface Milestone {
  id: string;
  milestone_name: string;
  target_date: string;
  completed_at: string | null;
  sort_order: number;
}

interface Issue {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;
}

interface ChecklistItem {
  id: string;
  item_name: string;
  category: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

interface UploadedDocument {
  id: string;
  file_name: string;
  file_size: number;
  url: string;
  status: string;
  checklist_item?: string;
  uploaded_by?: string;
  created_at?: string;
}

interface ClosingActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user_id?: string;
}

interface ClosingRoomDetail {
  id: string;
  deal_id: string;
  status: ClosingStatus;
  target_close_date: string | null;
  actual_close_date: string | null;
  opened_at: string;
  allocation_amount: number;
  investment_amount: number;
  credit_type: ProgramType;
  notes: string | null;
  deals: {
    id: string;
    project_name: string;
    programs: string[];
    sponsor_name: string;
    total_project_cost: number;
    allocation_request: number;
    credit_type: string;
  };
  closing_room_participants: Participant[];
  closing_room_milestones: Milestone[];
  closing_room_issues: Issue[];
}

const statusConfig: Record<
  ClosingStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-gray-400", bg: "bg-gray-700" },
  active: { label: "Active", color: "text-blue-400", bg: "bg-blue-900/50" },
  on_hold: { label: "On Hold", color: "text-amber-400", bg: "bg-amber-900/50" },
  closing: { label: "Closing", color: "text-green-400", bg: "bg-green-900/50" },
  closed: { label: "Closed", color: "text-gray-400", bg: "bg-gray-700" },
  terminated: {
    label: "Terminated",
    color: "text-red-400",
    bg: "bg-red-900/50",
  },
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-700 text-gray-400",
  medium: "bg-blue-900/50 text-blue-400",
  high: "bg-amber-900/50 text-amber-400",
  critical: "bg-red-900/50 text-red-400",
};

export default function ClosingRoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dealId } = use(params);
  const { orgType, userId } = useCurrentUser();

  const [closingRoom, setClosingRoom] = useState<ClosingRoomDetail | null>(
    null,
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "checklist" | "documents" | "participants" | "issues"
  >("checklist");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, UploadedDocument[]>
  >({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ClosingActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Invite participant dialog state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("participant");
  const [inviteOrgName, setInviteOrgName] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Report issue dialog state
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issuePriority, setIssuePriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  // Voice/Video call overlay state
  const [callActive, setCallActive] = useState(false);
  const [callVideo, setCallVideo] = useState(false);

  const fetchClosingRoom = useCallback(async () => {
    try {
      const response = await fetch(`/api/closing-room?dealId=${dealId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          setError("Closing room not found");
        } else {
          throw new Error("Failed to fetch closing room");
        }
        return;
      }
      const data = await response.json();
      setClosingRoom(data.closingRoom);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load closing room");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  const fetchChecklist = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/closing-room/checklist?dealId=${dealId}`,
        { credentials: "include" },
      );
      if (response.ok) {
        const data = await response.json();
        setChecklist(data.items || []);
      }
    } catch (err) {
      console.error("Checklist fetch error:", err);
    }
  }, [dealId]);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const response = await fetch(
        `/api/closing-room/activity?dealId=${dealId}&limit=10`,
        {
          credentials: "include",
        },
      );
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Activity fetch error:", err);
    } finally {
      setActivitiesLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchClosingRoom();
    fetchChecklist();
    fetchActivities();
  }, [fetchClosingRoom, fetchChecklist, fetchActivities]);

  const handleStatusChange = async (newStatus: ClosingStatus) => {
    if (!closingRoom) return;
    setStatusUpdating(true);

    try {
      const response = await fetch("/api/closing-room", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closingRoomId: closingRoom.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setClosingRoom((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleChecklistToggle = async (itemId: number, completed: boolean) => {
    try {
      await fetch("/api/closing-room/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          itemId,
          completed,
        }),
      });
      // Refresh checklist
      fetchChecklist();
    } catch (err) {
      console.error("Checklist toggle error:", err);
    }
  };

  const fetchUploadedDocuments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/closing-room/documents/upload?dealId=${dealId}`,
        {
          credentials: "include",
        },
      );
      if (response.ok) {
        const data = await response.json();
        // Group documents by checklist item
        const grouped = (data.documents || []).reduce(
          (acc: Record<string, UploadedDocument[]>, doc: UploadedDocument) => {
            const key = doc.checklist_item || "general";
            if (!acc[key]) acc[key] = [];
            acc[key].push(doc);
            return acc;
          },
          {},
        );
        setUploadedDocs(grouped);
      }
    } catch (err) {
      console.error("Failed to fetch uploaded documents:", err);
    }
  }, [dealId]);

  useEffect(() => {
    if (activeTab === "documents") {
      fetchUploadedDocuments();
    }
  }, [activeTab, fetchUploadedDocuments]);

  const handleDocumentUpload = async (
    file: File,
    category: string,
    checklistItem: string,
  ) => {
    setUploadingDoc(checklistItem);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dealId", dealId);
      formData.append("category", category);
      formData.append("checklistItem", checklistItem);
      formData.append("uploadedBy", userId || "unknown");

      const response = await fetch("/api/closing-room/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      // Refresh documents list
      await fetchUploadedDocuments();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  // --- Invite Participant ---
  const handleInviteParticipant = async () => {
    if (!closingRoom || !inviteOrgName.trim()) return;
    setInviteSubmitting(true);

    try {
      const response = await fetch("/api/closing-room", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "add_participant",
          closingRoomId: closingRoom.id,
          role: inviteRole,
          organizationName: inviteOrgName.trim(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to invite participant");
      }

      await fetchClosingRoom();
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteOrgName("");
      setInviteRole("participant");
    } catch (err) {
      console.error("Invite error:", err);
      alert(
        err instanceof Error ? err.message : "Failed to invite participant",
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  // --- Report Issue ---
  const handleReportIssue = async () => {
    if (!closingRoom || !issueTitle.trim()) return;
    setIssueSubmitting(true);

    try {
      const response = await fetch("/api/closing-room", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "add_issue",
          closingRoomId: closingRoom.id,
          title: issueTitle.trim(),
          description: issueDescription.trim() || undefined,
          priority: issuePriority,
          reportedBy: userId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to report issue");
      }

      await fetchClosingRoom();
      await fetchActivities();
      setShowIssueDialog(false);
      setIssueTitle("");
      setIssueDescription("");
      setIssuePriority("medium");
    } catch (err) {
      console.error("Issue report error:", err);
      alert(err instanceof Error ? err.message : "Failed to report issue");
    } finally {
      setIssueSubmitting(false);
    }
  };

  const handleDocumentClick = (checklistItem: string, _docName: string) => {
    // Trigger file input for this document type
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleDocumentUpload(
          file,
          checklistItem.split(" ")[0] || "general",
          checklistItem,
        );
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </main>
    );
  }

  if (error || !closingRoom) {
    return (
      <main className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-4">
              {error || "Closing room not found"}
            </p>
            <Link
              href="/closing-room"
              className="text-indigo-400 hover:text-indigo-300"
            >
              ← Back to Closing Rooms
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const deal = closingRoom.deals;
  const program = (closingRoom.credit_type ||
    deal?.programs?.[0] ||
    "NMTC") as ProgramType;
  const completedIds = checklist
    .filter((c) => c.is_completed)
    .map((c) => Number(c.id));
  const progress =
    checklist.length > 0 ? (completedIds.length / checklist.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/closing-room"
                  className="text-gray-500 hover:text-gray-300"
                >
                  ← Back
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {deal?.project_name || "Closing Room"}
              </h1>
              <p className="text-gray-400 mt-1">{deal?.sponsor_name}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded text-sm font-medium bg-purple-900/50 text-purple-300">
                  {program}
                </span>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${statusConfig[closingRoom.status]?.bg} ${statusConfig[closingRoom.status]?.color}`}
                >
                  {statusConfig[closingRoom.status]?.label}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCallVideo(false);
                      setCallActive(true);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
                    title="Start voice call"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCallVideo(true);
                      setCallActive(true);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors group"
                    title="Start video call"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex gap-6 text-right">
              <div>
                <p className="text-sm text-gray-500">Allocation</p>
                <p className="text-xl font-bold text-white">
                  $
                  {((closingRoom.allocation_amount || 0) / 1_000_000).toFixed(
                    1,
                  )}
                  M
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Investment</p>
                <p className="text-xl font-bold text-green-400">
                  $
                  {((closingRoom.investment_amount || 0) / 1_000_000).toFixed(
                    1,
                  )}
                  M
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Close</p>
                <p className="text-xl font-bold text-white">
                  {closingRoom.target_close_date
                    ? new Date(
                        closingRoom.target_close_date,
                      ).toLocaleDateString()
                    : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="text-xl font-bold text-indigo-400">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  progress >= 90
                    ? "bg-green-500"
                    : progress >= 50
                      ? "bg-indigo-500"
                      : "bg-amber-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(
              ["checklist", "documents", "participants", "issues"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "issues" &&
                  closingRoom.closing_room_issues?.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-red-900/50 text-red-400">
                      {
                        closingRoom.closing_room_issues.filter(
                          (i) => i.status === "open",
                        ).length
                      }
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "checklist" && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Closing Checklist
                </h2>
                <ClosingChecklist
                  completedIds={completedIds}
                  onToggle={handleChecklistToggle}
                  onDocumentClick={handleDocumentClick}
                  showDocuments={true}
                  program={program}
                />
              </div>
            )}

            {activeTab === "documents" && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Document Vault
                  </h2>
                  <span className="text-xs text-gray-400">
                    {Object.values(uploadedDocs).flat().length} documents
                    uploaded
                  </span>
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {uploadError}
                    <button
                      onClick={() => setUploadError(null)}
                      className="ml-2 text-red-400 hover:text-red-200"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {getRequirementsForProgram(program).map((req) => {
                    const docsForItem = uploadedDocs[req.checklistItem] || [];
                    const isUploading = uploadingDoc === req.checklistItem;

                    return (
                      <div
                        key={req.checklistItem}
                        className="border border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-200">
                              {req.checklistItem}
                            </h3>
                            {docsForItem.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded">
                                {docsForItem.length} uploaded
                              </span>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-400">
                            {req.category}
                          </span>
                        </div>

                        {/* Uploaded documents for this item */}
                        {docsForItem.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {docsForItem.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-green-900/20 border border-green-500/20 rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400">✓</span>
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-200 hover:text-white"
                                  >
                                    {doc.file_name}
                                  </a>
                                  <span className="text-xs text-gray-500">
                                    ({(doc.file_size / 1024).toFixed(0)} KB)
                                  </span>
                                </div>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    doc.status === "approved"
                                      ? "bg-green-900/50 text-green-400"
                                      : doc.status === "rejected"
                                        ? "bg-red-900/50 text-red-400"
                                        : "bg-amber-900/50 text-amber-400"
                                  }`}
                                >
                                  {doc.status === "pending_review"
                                    ? "Pending Review"
                                    : doc.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Required documents list */}
                        <div className="space-y-2">
                          {req.requiredDocs.map((doc) => {
                            const hasUpload = docsForItem.some((d) =>
                              d.file_name
                                ?.toLowerCase()
                                .includes(doc.toLowerCase().split(" ")[0]),
                            );

                            return (
                              <div
                                key={doc}
                                className={`flex items-center justify-between p-2 rounded text-sm ${
                                  hasUpload
                                    ? "bg-gray-800/30 border border-gray-700"
                                    : "bg-gray-900/50"
                                }`}
                              >
                                <span
                                  className={
                                    hasUpload
                                      ? "text-gray-500"
                                      : "text-gray-400"
                                  }
                                >
                                  {hasUpload && (
                                    <span className="text-green-400 mr-2">
                                      ✓
                                    </span>
                                  )}
                                  {doc}
                                </span>
                                <button
                                  onClick={() =>
                                    handleDocumentClick(req.checklistItem, doc)
                                  }
                                  disabled={isUploading}
                                  className={`text-xs px-3 py-1 rounded transition-colors ${
                                    isUploading
                                      ? "bg-gray-700 text-gray-500 cursor-wait"
                                      : hasUpload
                                        ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                                  }`}
                                >
                                  {isUploading
                                    ? "Uploading..."
                                    : hasUpload
                                      ? "Replace"
                                      : "Upload"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "participants" && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Participants
                  </h2>
                  <button
                    onClick={() => setShowInviteDialog(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    + Invite Participant
                  </button>
                </div>

                {/* Invite Participant Dialog */}
                {showInviteDialog && (
                  <div className="mb-4 p-4 bg-gray-900 border border-indigo-500/30 rounded-lg space-y-3">
                    <h3 className="text-sm font-semibold text-indigo-300">
                      Invite Participant
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        value={inviteOrgName}
                        onChange={(e) => setInviteOrgName(e.target.value)}
                        placeholder="e.g. ABC Capital LLC"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="contact@organization.com"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm"
                      >
                        <option value="sponsor">Sponsor</option>
                        <option value="cde">CDE</option>
                        <option value="investor">Investor</option>
                        <option value="legal">Legal Counsel</option>
                        <option value="accountant">Accountant</option>
                        <option value="participant">Other Participant</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleInviteParticipant}
                        disabled={inviteSubmitting || !inviteOrgName.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded disabled:opacity-50 transition-colors"
                      >
                        {inviteSubmitting ? "Adding..." : "Add Participant"}
                      </button>
                      <button
                        onClick={() => setShowInviteDialog(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {closingRoom.closing_room_participants?.length > 0 ? (
                    closingRoom.closing_room_participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                            {p.organization_name?.[0] ||
                              p.role?.[0]?.toUpperCase() ||
                              "?"}
                          </div>
                          <div>
                            <p className="text-gray-200 font-medium">
                              {p.organization_name || "Unknown"}
                            </p>
                            <p className="text-gray-500 text-sm capitalize">
                              {p.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.permissions?.approve && (
                            <span className="text-xs px-2 py-1 rounded bg-green-900/50 text-green-400">
                              Approver
                            </span>
                          )}
                          {p.accepted_at ? (
                            <span className="text-green-400 text-sm">
                              ✓ Joined
                            </span>
                          ) : (
                            <span className="text-amber-400 text-sm">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No participants yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "issues" && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Issues & Blockers
                  </h2>
                  <button
                    onClick={() => setShowIssueDialog(true)}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    + Report Issue
                  </button>
                </div>

                {/* Report Issue Dialog */}
                {showIssueDialog && (
                  <div className="mb-4 p-4 bg-gray-900 border border-amber-500/30 rounded-lg space-y-3">
                    <h3 className="text-sm font-semibold text-amber-300">
                      Report Issue
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Issue Title *
                      </label>
                      <input
                        type="text"
                        value={issueTitle}
                        onChange={(e) => setIssueTitle(e.target.value)}
                        placeholder="e.g. Missing Phase I environmental report"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Priority
                      </label>
                      <div className="flex gap-2">
                        {(["low", "medium", "high", "critical"] as const).map(
                          (p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setIssuePriority(p)}
                              className={`px-3 py-1.5 text-xs rounded capitalize transition-colors ${
                                issuePriority === p
                                  ? priorityColors[p] + " ring-1 ring-white/20"
                                  : "bg-gray-800 text-gray-500 hover:text-gray-300"
                              }`}
                            >
                              {p}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        value={issueDescription}
                        onChange={(e) => setIssueDescription(e.target.value)}
                        placeholder="Provide additional details..."
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleReportIssue}
                        disabled={issueSubmitting || !issueTitle.trim()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded disabled:opacity-50 transition-colors"
                      >
                        {issueSubmitting ? "Submitting..." : "Submit Issue"}
                      </button>
                      <button
                        onClick={() => setShowIssueDialog(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {closingRoom.closing_room_issues?.length > 0 ? (
                    closingRoom.closing_room_issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="flex items-start justify-between p-3 bg-gray-900/50 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${priorityColors[issue.priority]}`}
                            >
                              {issue.priority}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                issue.status === "open"
                                  ? "bg-red-900/50 text-red-400"
                                  : issue.status === "in_progress"
                                    ? "bg-blue-900/50 text-blue-400"
                                    : "bg-green-900/50 text-green-400"
                              }`}
                            >
                              {issue.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-gray-200">{issue.title}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-green-400 mb-1">No open issues</p>
                      <p className="text-gray-500 text-sm">
                        All clear for closing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            {(orgType === "cde" || orgType === "admin") && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Update Status
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["active", "on_hold", "closing"] as ClosingStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={
                          statusUpdating || closingRoom.status === status
                        }
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          closingRoom.status === status
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
                        } disabled:opacity-50`}
                      >
                        {statusConfig[status].label}
                      </button>
                    ),
                  )}
                </div>
                {closingRoom.status !== "closed" && progress >= 100 && (
                  <button
                    onClick={() => handleStatusChange("closed")}
                    disabled={statusUpdating}
                    className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Mark as Closed
                  </button>
                )}
              </div>
            )}

            {/* Milestones */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Milestones
              </h3>
              <div className="space-y-3">
                {closingRoom.closing_room_milestones?.length > 0 ? (
                  closingRoom.closing_room_milestones
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            m.completed_at
                              ? "bg-green-900/50 text-green-400"
                              : "bg-gray-700 text-gray-500"
                          }`}
                        >
                          {m.completed_at ? "✓" : m.sort_order}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${m.completed_at ? "text-gray-300" : "text-gray-500"}`}
                          >
                            {m.milestone_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {m.completed_at
                              ? `Completed ${new Date(m.completed_at).toLocaleDateString()}`
                              : `Target: ${new Date(m.target_date).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No milestones set</p>
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Recent Activity
                </h3>
                <button
                  onClick={fetchActivities}
                  disabled={activitiesLoading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  {activitiesLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {activitiesLoading && activities.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type.includes("document")
                            ? "bg-blue-900/50 text-blue-400"
                            : activity.type.includes("checklist")
                              ? "bg-green-900/50 text-green-400"
                              : activity.type.includes("issue")
                                ? "bg-amber-900/50 text-amber-400"
                                : activity.type.includes("status")
                                  ? "bg-purple-900/50 text-purple-400"
                                  : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {activity.type.includes("document") && (
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                        {activity.type.includes("checklist") && (
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                        {activity.type.includes("issue") && (
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
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        )}
                        {activity.type.includes("status") && (
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
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        )}
                        {!activity.type.includes("document") &&
                          !activity.type.includes("checklist") &&
                          !activity.type.includes("issue") &&
                          !activity.type.includes("status") && (
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
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/deals/${dealId}`}
                  className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  View Deal Details →
                </Link>
                <Link
                  href={`/deals/${dealId}/room/general`}
                  className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  Deal Room Chat →
                </Link>
                <button className="w-full text-left px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                  Download Checklist PDF →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice/Video Call Overlay */}
      {callActive && (
        <CallOverlay
          dealId={dealId}
          roomId={`closing-${dealId}`}
          video={callVideo}
          onClose={() => setCallActive(false)}
        />
      )}
    </main>
  );
}
