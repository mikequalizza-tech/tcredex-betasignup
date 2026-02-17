"use client";

import { useState, useEffect } from "react";

// ============================================
// RELATIONSHIP STATUS CONFIG (matches DB enum)
// ============================================

type RelationshipStatus =
  | "contacted"
  | "viewed"
  | "in_review"
  | "interested"
  | "verbal_approval"
  | "loi_issued"
  | "loi_accepted"
  | "committed"
  | "closing"
  | "closed"
  | "denied"
  | "withdrawn"
  | "expired";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  order: number;
}

const STATUS_CONFIG: Record<RelationshipStatus, StatusConfig> = {
  contacted: {
    label: "Contacted",
    color: "text-blue-300",
    bgColor: "bg-blue-900/50",
    order: 1,
  },
  viewed: {
    label: "Viewed",
    color: "text-sky-300",
    bgColor: "bg-sky-900/50",
    order: 2,
  },
  in_review: {
    label: "In Review",
    color: "text-amber-300",
    bgColor: "bg-amber-900/50",
    order: 3,
  },
  interested: {
    label: "Interested",
    color: "text-teal-300",
    bgColor: "bg-teal-900/50",
    order: 4,
  },
  verbal_approval: {
    label: "Verbal Approval",
    color: "text-indigo-300",
    bgColor: "bg-indigo-900/50",
    order: 5,
  },
  loi_issued: {
    label: "LOI Issued",
    color: "text-purple-300",
    bgColor: "bg-purple-900/50",
    order: 6,
  },
  loi_accepted: {
    label: "LOI Accepted",
    color: "text-violet-300",
    bgColor: "bg-violet-900/50",
    order: 7,
  },
  committed: {
    label: "Committed",
    color: "text-pink-300",
    bgColor: "bg-pink-900/50",
    order: 8,
  },
  closing: {
    label: "Closing",
    color: "text-rose-300",
    bgColor: "bg-rose-900/50",
    order: 9,
  },
  closed: {
    label: "Closed",
    color: "text-green-300",
    bgColor: "bg-green-900/50",
    order: 10,
  },
  denied: {
    label: "Denied",
    color: "text-red-400",
    bgColor: "bg-red-900/50",
    order: 11,
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-gray-400",
    bgColor: "bg-gray-800/50",
    order: 12,
  },
  expired: {
    label: "Expired",
    color: "text-gray-500",
    bgColor: "bg-gray-900/50",
    order: 13,
  },
};

// Pipeline stages in order (for progress indicator)
const PIPELINE_STAGES: RelationshipStatus[] = [
  "contacted",
  "viewed",
  "in_review",
  "interested",
  "verbal_approval",
  "loi_issued",
  "loi_accepted",
  "committed",
  "closing",
  "closed",
];

// ============================================
// TYPES
// ============================================

interface DealRelationship {
  id: string;
  dealId?: string;
  targetType: "cde" | "investor";
  targetId: string;
  targetOrgId?: string;
  targetName: string;
  stage: RelationshipStatus;
  stageLabel?: string;
  stageColor?: string;
  stageBgColor?: string;
  statusNote?: string;
  matchScore?: number;
  matchStrength?: string;
  matchReasons?: string[];
  requestedAmount?: number;
  committedAmount?: number;
  contactedAt?: string;
  interestedAt?: string;
  verbalApprovalAt?: string;
  loiIssuedAt?: string;
  loiAcceptedAt?: string;
  committedAt?: string;
  closedAt?: string;
  deniedAt?: string;
  lastActivity?: string;
  nextAction?: string;
  nextActionDue?: string;
}

interface PipelineSummary {
  total: number;
  cdeCount: number;
  investorCount: number;
  byStage: Record<string, number>;
  totalRequested: number;
  totalCommitted: number;
}

interface PipelineResponse {
  dealId: string;
  relationships: DealRelationship[];
  summary: PipelineSummary;
}

interface DealPipelineTrackerProps {
  dealId: string;
  onStatusChange?: (
    relationshipId: string,
    newStatus: RelationshipStatus,
  ) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DealPipelineTracker({
  dealId,
  onStatusChange,
}: DealPipelineTrackerProps) {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] =
    useState<DealRelationship | null>(null);
  const [filterType, setFilterType] = useState<"all" | "cde" | "investor">(
    "all",
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch pipeline data
  useEffect(() => {
    const fetchPipeline = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/deals/${dealId}/pipeline`);
        if (!res.ok) {
          throw new Error("Failed to fetch pipeline data");
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("[Pipeline] Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipeline();
  }, [dealId]);

  // Update relationship status
  const handleStatusUpdate = async (
    relationshipId: string,
    newStatus: RelationshipStatus,
    note?: string,
  ) => {
    setUpdatingId(relationshipId);

    try {
      const res = await fetch(`/api/deals/${dealId}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationshipId,
          status: newStatus,
          statusNote: note,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh data
      const refreshRes = await fetch(`/api/deals/${dealId}/pipeline`);
      if (refreshRes.ok) {
        const result = await refreshRes.json();
        setData(result);
      }

      onStatusChange?.(relationshipId, newStatus);
    } catch (err) {
      console.error("[Pipeline] Update error:", err);
    } finally {
      setUpdatingId(null);
      setSelectedRelationship(null);
    }
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return null;
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
    );
    return days;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-yellow-400";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  // Filter relationships
  const filteredRelationships =
    data?.relationships?.filter((r) => {
      if (filterType === "all") return true;
      return r.targetType === filterType;
    }) || [];

  // Sort by stage order (active stages first, then denied/withdrawn/expired)
  const sortedRelationships = [...filteredRelationships].sort((a, b) => {
    const orderA = STATUS_CONFIG[a.stage]?.order || 99;
    const orderB = STATUS_CONFIG[b.stage]?.order || 99;
    return orderA - orderB;
  });

  // Get progress percentage for a relationship
  const getProgressPercent = (stage: RelationshipStatus): number => {
    const idx = PIPELINE_STAGES.indexOf(stage);
    if (idx === -1) return 0; // denied/withdrawn/expired
    return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Failed to load pipeline</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !data.relationships || data.relationships.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">
            CDE & Investor Pipeline
          </h3>
        </div>
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-gray-400 mb-2">
            No CDE or Investor relationships yet
          </p>
          <p className="text-gray-500 text-sm">
            Use AutoMatch to find potential partners or add them manually
          </p>
        </div>
      </div>
    );
  }

  // Calculate parallel track stats
  const getTrackStats = (targetType: "cde" | "investor") => {
    const rels =
      data?.relationships?.filter((r) => r.targetType === targetType) || [];
    const total = rels.length;

    // Group stages into simplified pipeline: Outreach → Verbal → Committed → Closed
    const outreach = rels.filter((r) =>
      ["contacted", "viewed", "in_review"].includes(r.stage),
    ).length;
    const interested = rels.filter((r) =>
      ["interested", "verbal_approval"].includes(r.stage),
    ).length;
    const committed = rels.filter((r) =>
      ["loi_issued", "loi_accepted", "committed", "closing"].includes(r.stage),
    ).length;
    const closed = rels.filter((r) => r.stage === "closed").length;
    const declined = rels.filter((r) =>
      ["denied", "withdrawn", "expired"].includes(r.stage),
    ).length;

    return { total, outreach, interested, committed, closed, declined };
  };

  const cdeStats = getTrackStats("cde");
  const investorStats = getTrackStats("investor");

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">
            CDE & Investor Pipeline
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {data.summary.total} relationship
            {data.summary.total !== 1 ? "s" : ""} •{data.summary.cdeCount} CDE
            {data.summary.cdeCount !== 1 ? "s" : ""} •
            {data.summary.investorCount} Investor
            {data.summary.investorCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {(["all", "cde", "investor"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filterType === type
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {type === "all" ? "All" : type === "cde" ? "CDEs" : "Investors"}
            </button>
          ))}
        </div>
      </div>

      {/* Parallel Track Visualization */}
      <div className="p-4 border-b border-gray-800 bg-gray-800/20">
        <div className="grid grid-cols-2 gap-6">
          {/* CDE Track */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/50 text-emerald-300">
                CDE
              </span>
              <span className="text-sm text-gray-400">
                {cdeStats.total} Total
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrackStage
                label="Outreach"
                count={cdeStats.outreach}
                color="blue"
              />
              <div className="w-3 h-0.5 bg-gray-700" />
              <TrackStage
                label="Interested"
                count={cdeStats.interested}
                color="amber"
              />
              <div className="w-3 h-0.5 bg-gray-700" />
              <TrackStage
                label="Committed"
                count={cdeStats.committed}
                color="purple"
              />
              <div className="w-3 h-0.5 bg-gray-700" />
              <TrackStage
                label="Closed"
                count={cdeStats.closed}
                color="green"
                isSuccess
              />
              {cdeStats.declined > 0 && (
                <>
                  <div className="w-3 h-0.5 bg-gray-700 ml-2" />
                  <TrackStage
                    label="Declined"
                    count={cdeStats.declined}
                    color="red"
                  />
                </>
              )}
            </div>
          </div>

          {/* Investor Track */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
                INVESTOR
              </span>
              <span className="text-sm text-gray-400">
                {investorStats.total} Total
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrackStage
                label="Outreach"
                count={investorStats.outreach}
                color="blue"
              />
              <div className="w-3 h-0.5 bg-gray-700" />
              <TrackStage
                label="Interested"
                count={investorStats.interested}
                color="amber"
              />
              <div className="w-3 h-0.5 bg-gray-700" />
              <TrackStage
                label="Committed"
                count={investorStats.committed}
                color="purple"
              />
              <div className="w-3 h-0.5 bg-gray-700" />
              <TrackStage
                label="Closed"
                count={investorStats.closed}
                color="green"
                isSuccess
              />
              {investorStats.declined > 0 && (
                <>
                  <div className="w-3 h-0.5 bg-gray-700 ml-2" />
                  <TrackStage
                    label="Declined"
                    count={investorStats.declined}
                    color="red"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {data.summary.totalCommitted > 0 && (
        <div className="px-4 py-3 bg-gray-800/30 border-b border-gray-800 flex items-center gap-6">
          <div>
            <span className="text-xs text-gray-500 uppercase">Requested</span>
            <span className="ml-2 text-gray-100 font-medium">
              {formatCurrency(data.summary.totalRequested)}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Committed</span>
            <span className="ml-2 text-green-400 font-medium">
              {formatCurrency(data.summary.totalCommitted)}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <table className="w-full">
        <thead className="bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Partner
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Progress
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Match
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
              Last Contact
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sortedRelationships.map((rel) => {
            const config = STATUS_CONFIG[rel.stage];
            const progress = getProgressPercent(rel.stage);
            const daysAgo = getDaysAgo(rel.lastActivity || rel.contactedAt);
            const isTerminal = [
              "denied",
              "withdrawn",
              "expired",
              "closed",
            ].includes(rel.stage);

            return (
              <tr
                key={rel.id}
                className={`hover:bg-gray-800/50 cursor-pointer ${isTerminal && rel.stage !== "closed" ? "opacity-60" : ""}`}
                onClick={() => setSelectedRelationship(rel)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-100">
                      {rel.targetName}
                    </p>
                    {rel.matchReasons && rel.matchReasons.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                        {rel.matchReasons[0]}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      rel.targetType === "cde"
                        ? "bg-emerald-900/50 text-emerald-300"
                        : "bg-blue-900/50 text-blue-300"
                    }`}
                  >
                    {rel.targetType.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                  >
                    {config.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!isTerminal || rel.stage === "closed" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rel.stage === "closed" ? "bg-green-500" : "bg-indigo-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{progress}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {rel.matchScore ? (
                    <span
                      className={`text-sm font-medium ${getScoreColor(rel.matchScore)}`}
                    >
                      {rel.matchScore}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {rel.committedAmount ? (
                    <span className="text-green-400 font-medium">
                      {formatCurrency(rel.committedAmount)}
                    </span>
                  ) : rel.requestedAmount ? (
                    <span className="text-gray-300">
                      {formatCurrency(rel.requestedAmount)}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {daysAgo !== null
                    ? daysAgo === 0
                      ? "Today"
                      : `${daysAgo}d ago`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {updatingId === rel.id ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Detail/Update Modal */}
      {selectedRelationship && (
        <RelationshipDetailModal
          relationship={selectedRelationship}
          onClose={() => setSelectedRelationship(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={updatingId === selectedRelationship.id}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ============================================
// DETAIL MODAL COMPONENT
// ============================================

interface RelationshipDetailModalProps {
  relationship: DealRelationship;
  onClose: () => void;
  onStatusUpdate: (
    id: string,
    status: RelationshipStatus,
    note?: string,
  ) => void;
  isUpdating: boolean;
  formatCurrency: (n: number) => string;
  formatDate: (d?: string) => string;
}

function RelationshipDetailModal({
  relationship,
  onClose,
  onStatusUpdate,
  isUpdating,
  formatCurrency,
  formatDate,
}: RelationshipDetailModalProps) {
  const [newStatus, setNewStatus] = useState<RelationshipStatus>(
    relationship.stage,
  );
  const [note, setNote] = useState("");

  const config = STATUS_CONFIG[relationship.stage];
  const progress = getProgressPercent(relationship.stage);
  const isTerminal = ["denied", "withdrawn", "expired"].includes(
    relationship.stage,
  );

  // Get next logical statuses
  const getNextStatuses = (): RelationshipStatus[] => {
    const currentIdx = PIPELINE_STAGES.indexOf(relationship.stage);
    if (currentIdx === -1) return []; // Terminal status

    // Can move to next stage, or mark as denied/withdrawn
    const nextStages: RelationshipStatus[] = [];
    if (currentIdx < PIPELINE_STAGES.length - 1) {
      nextStages.push(PIPELINE_STAGES[currentIdx + 1]);
    }
    nextStages.push("denied", "withdrawn");
    return nextStages;
  };

  const nextStatuses = getNextStatuses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  relationship.targetType === "cde"
                    ? "bg-emerald-900/50 text-emerald-300"
                    : "bg-blue-900/50 text-blue-300"
                }`}
              >
                {relationship.targetType.toUpperCase()}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
              >
                {config.label}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white">
              {relationship.targetName}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
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

        {/* Progress Bar */}
        {!isTerminal && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Pipeline Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${relationship.stage === "closed" ? "bg-green-500" : "bg-indigo-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Contacted</span>
              <span>Closed</span>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {relationship.matchScore && (
            <div>
              <label className="text-xs text-gray-500 uppercase block mb-1">
                Match Score
              </label>
              <p
                className={`text-lg font-semibold ${
                  relationship.matchScore >= 90
                    ? "text-green-400"
                    : relationship.matchScore >= 80
                      ? "text-yellow-400"
                      : relationship.matchScore >= 70
                        ? "text-orange-400"
                        : "text-red-400"
                }`}
              >
                {relationship.matchScore}
              </p>
            </div>
          )}

          {relationship.committedAmount ? (
            <div>
              <label className="text-xs text-gray-500 uppercase block mb-1">
                Committed Amount
              </label>
              <p className="text-lg font-semibold text-green-400">
                {formatCurrency(relationship.committedAmount)}
              </p>
            </div>
          ) : relationship.requestedAmount ? (
            <div>
              <label className="text-xs text-gray-500 uppercase block mb-1">
                Requested Amount
              </label>
              <p className="text-lg font-semibold text-gray-100">
                {formatCurrency(relationship.requestedAmount)}
              </p>
            </div>
          ) : null}

          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">
              First Contact
            </label>
            <p className="text-gray-100">
              {formatDate(relationship.contactedAt)}
            </p>
          </div>

          {relationship.lastActivity && (
            <div>
              <label className="text-xs text-gray-500 uppercase block mb-1">
                Last Activity
              </label>
              <p className="text-gray-100">
                {formatDate(relationship.lastActivity)}
              </p>
            </div>
          )}
        </div>

        {/* Match Reasons */}
        {relationship.matchReasons && relationship.matchReasons.length > 0 && (
          <div className="mb-6">
            <label className="text-xs text-gray-500 uppercase block mb-2">
              Match Reasons
            </label>
            <div className="flex flex-wrap gap-2">
              {relationship.matchReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 uppercase block mb-3">
            Timeline
          </label>
          <div className="space-y-2">
            {relationship.contactedAt && (
              <TimelineItem
                label="Contacted"
                date={relationship.contactedAt}
                active={relationship.stage === "contacted"}
              />
            )}
            {relationship.interestedAt && (
              <TimelineItem
                label="Interested"
                date={relationship.interestedAt}
                active={relationship.stage === "interested"}
              />
            )}
            {relationship.verbalApprovalAt && (
              <TimelineItem
                label="Verbal Approval"
                date={relationship.verbalApprovalAt}
                active={relationship.stage === "verbal_approval"}
              />
            )}
            {relationship.loiIssuedAt && (
              <TimelineItem
                label="LOI Issued"
                date={relationship.loiIssuedAt}
                active={relationship.stage === "loi_issued"}
              />
            )}
            {relationship.loiAcceptedAt && (
              <TimelineItem
                label="LOI Accepted"
                date={relationship.loiAcceptedAt}
                active={relationship.stage === "loi_accepted"}
              />
            )}
            {relationship.committedAt && (
              <TimelineItem
                label="Committed"
                date={relationship.committedAt}
                active={relationship.stage === "committed"}
              />
            )}
            {relationship.closedAt && (
              <TimelineItem
                label="Closed"
                date={relationship.closedAt}
                active={relationship.stage === "closed"}
                completed
              />
            )}
            {relationship.deniedAt && (
              <TimelineItem
                label="Denied"
                date={relationship.deniedAt}
                active={relationship.stage === "denied"}
                denied
              />
            )}
          </div>
        </div>

        {/* Status Note */}
        {relationship.statusNote && (
          <div className="mb-6">
            <label className="text-xs text-gray-500 uppercase block mb-1">
              Last Note
            </label>
            <p className="text-gray-300 text-sm bg-gray-800/50 rounded p-3">
              {relationship.statusNote}
            </p>
          </div>
        )}

        {/* Next Action */}
        {relationship.nextAction && (
          <div className="mb-6 p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <label className="text-xs text-amber-400 uppercase block mb-1">
              Next Action
            </label>
            <p className="text-amber-100">{relationship.nextAction}</p>
            {relationship.nextActionDue && (
              <p className="text-xs text-amber-400 mt-1">
                Due: {formatDate(relationship.nextActionDue)}
              </p>
            )}
          </div>
        )}

        {/* Update Status Section */}
        {!isTerminal && nextStatuses.length > 0 && (
          <div className="border-t border-gray-800 pt-4 mt-4">
            <label className="text-xs text-gray-500 uppercase block mb-3">
              Update Status
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {nextStatuses.map((status) => {
                const statusConfig = STATUS_CONFIG[status];
                const isSelected = newStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setNewStatus(status)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isSelected
                        ? `${statusConfig.bgColor} ${statusConfig.color} ring-2 ring-offset-2 ring-offset-gray-900 ring-indigo-500`
                        : "bg-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {statusConfig.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this status change..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 text-sm resize-none"
              rows={2}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  onStatusUpdate(relationship.id, newStatus, note || undefined)
                }
                disabled={isUpdating || newStatus === relationship.stage}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Update to ${STATUS_CONFIG[newStatus].label}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Close button for terminal states */}
        {isTerminal && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TIMELINE ITEM COMPONENT
// ============================================

interface TimelineItemProps {
  label: string;
  date: string;
  active?: boolean;
  completed?: boolean;
  denied?: boolean;
}

function TimelineItem({
  label,
  date,
  active,
  completed,
  denied,
}: TimelineItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${
          completed
            ? "bg-green-500"
            : denied
              ? "bg-red-500"
              : active
                ? "bg-indigo-500"
                : "bg-gray-600"
        }`}
      />
      <span
        className={`text-sm ${active ? "text-gray-100 font-medium" : "text-gray-400"}`}
      >
        {label}
      </span>
      <span className="text-xs text-gray-500 ml-auto">
        {new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}

// Helper function outside component
function getProgressPercent(status: RelationshipStatus): number {
  const idx = PIPELINE_STAGES.indexOf(status);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
}

// ============================================
// TRACK STAGE COMPONENT (for parallel visualization)
// ============================================

interface TrackStageProps {
  label: string;
  count: number;
  color: "blue" | "amber" | "purple" | "green" | "red";
  isSuccess?: boolean;
}

function TrackStage({ label, count, color, isSuccess }: TrackStageProps) {
  const colorClasses = {
    blue: "bg-blue-900/40 text-blue-300 border-blue-700/50",
    amber: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    purple: "bg-purple-900/40 text-purple-300 border-purple-700/50",
    green: "bg-green-900/40 text-green-300 border-green-700/50",
    red: "bg-red-900/40 text-red-400 border-red-700/50",
  };

  const hasItems = count > 0;

  return (
    <div
      className={`flex flex-col items-center px-3 py-2 rounded-lg border transition-all ${
        hasItems
          ? colorClasses[color]
          : "bg-gray-800/30 text-gray-500 border-gray-700/30"
      } ${isSuccess && hasItems ? "ring-1 ring-green-500/50" : ""}`}
    >
      <span className={`text-lg font-bold ${hasItems ? "" : "text-gray-600"}`}>
        {count}
      </span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}
