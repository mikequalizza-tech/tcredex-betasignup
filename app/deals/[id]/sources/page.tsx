"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Types from pipeline API
interface PipelineRelationship {
  id: string;
  targetId: string;
  targetType: "cde" | "investor";
  targetOrgId?: string;
  targetName: string;
  stage: string;
  stageLabel: string;
  stageColor: string;
  stageBgColor: string;
  matchScore?: number;
  matchStrength?: string;
  requestedAmount?: number;
  committedAmount?: number;
  lastActivity?: string;
  nextAction?: string;
  nextActionDue?: string;
  loiId?: string;
  loiStatus?: string;
  loiAmount?: number;
  commitmentId?: string;
  commitmentStatus?: string;
  contactedAt?: string;
  deniedAt?: string;
}

interface PipelineSummary {
  total: number;
  cdeCount: number;
  investorCount: number;
  byStage: Record<string, number>;
  totalRequested: number;
  totalCommitted: number;
}

// Types from capital-stack API
interface CapitalSource {
  id: string;
  type: "loi" | "commitment" | "other";
  sourceType: "cde" | "investor" | "equity" | "debt" | "grant";
  sourceName: string;
  sourceId: string;
  amount: number;
  status: string;
  statusLabel: string;
  creditType?: string;
  issuedAt?: string;
  expiresAt?: string;
  acceptedAt?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

interface CapitalStackSummary {
  totalCommitted: number;
  totalPending: number;
  totalExpired: number;
  fundingGap: number;
  readyForClosing: boolean;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Stage progression for pipeline
const STAGE_PROGRESSION = [
  { key: "contacted", label: "Contacted", icon: "📤" },
  { key: "viewed", label: "Viewed", icon: "👁️" },
  { key: "interested", label: "Interested", icon: "✨" },
  { key: "verbal_approval", label: "Verbal", icon: "🗣️" },
  { key: "loi_issued", label: "LOI", icon: "📝" },
  { key: "loi_accepted", label: "LOI Accepted", icon: "✅" },
  { key: "committed", label: "Committed", icon: "🤝" },
  { key: "closing", label: "Closing", icon: "📋" },
  { key: "closed", label: "Closed", icon: "🎉" },
];

export default function SourcesPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [allocationNeeded, setAllocationNeeded] = useState(0);
  const [capitalSources, setCapitalSources] = useState<CapitalSource[]>([]);
  const [capitalSummary, setCapitalSummary] =
    useState<CapitalStackSummary | null>(null);
  const [relationships, setRelationships] = useState<PipelineRelationship[]>(
    [],
  );
  const [pipelineSummary, setPipelineSummary] =
    useState<PipelineSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "sources">(
    "pipeline",
  );

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!dealId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch both APIs in parallel
      const [capitalRes, pipelineRes] = await Promise.all([
        fetch(`/api/deals/${dealId}/capital-stack`),
        fetch(`/api/deals/${dealId}/pipeline`),
      ]);

      if (!capitalRes.ok || !pipelineRes.ok) {
        throw new Error("Failed to fetch deal data");
      }

      const capitalData = await capitalRes.json();
      const pipelineData = await pipelineRes.json();

      if (capitalData.success) {
        setProjectName(capitalData.projectName || "Unknown Project");
        setAllocationNeeded(capitalData.allocationNeeded || 0);
        setCapitalSources(capitalData.sources || []);
        setCapitalSummary(capitalData.summary);
      }

      if (pipelineData.relationships) {
        setRelationships(pipelineData.relationships);
        setPipelineSummary(pipelineData.summary);
      }
    } catch (err) {
      console.error("Error fetching sources data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate progress percentage
  const progressPercent =
    capitalSummary && allocationNeeded > 0
      ? Math.min(
          100,
          Math.round((capitalSummary.totalCommitted / allocationNeeded) * 100),
        )
      : 0;

  // Group relationships by stage for pipeline view
  const activeRelationships = relationships.filter(
    (r) => !["denied", "withdrawn", "expired"].includes(r.stage),
  );
  const inactiveRelationships = relationships.filter((r) =>
    ["denied", "withdrawn", "expired"].includes(r.stage),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/deals/${dealId}`}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">Funding Sources</h1>
              <p className="text-gray-400">{projectName}</p>
            </div>
            <button
              onClick={() =>
                router.push(`/dashboard/automatch?dealId=${dealId}`)
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Find More CDEs
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Capital Stack Summary Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Path to Closing
              </h2>
              <p className="text-gray-400 text-sm">
                Track your progress from gap to close
              </p>
            </div>
            {capitalSummary?.readyForClosing && (
              <span className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Ready for Closing
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Funding Progress</span>
              <span
                className={`font-bold ${
                  progressPercent >= 100
                    ? "text-green-400"
                    : progressPercent >= 75
                      ? "text-emerald-400"
                      : progressPercent >= 50
                        ? "text-amber-400"
                        : "text-gray-400"
                }`}
              >
                {progressPercent}%
              </span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent >= 100
                    ? "bg-green-500"
                    : progressPercent >= 75
                      ? "bg-emerald-500"
                      : progressPercent >= 50
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Allocation Needed</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(allocationNeeded)}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/30">
              <p className="text-sm text-emerald-400 mb-1">Committed</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(capitalSummary?.totalCommitted || 0)}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-amber-500/30">
              <p className="text-sm text-amber-400 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(capitalSummary?.totalPending || 0)}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-red-500/30">
              <p className="text-sm text-red-400 mb-1">Gap Remaining</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(capitalSummary?.fundingGap || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "pipeline"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Pipeline ({relationships.length})
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "sources"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            LOIs & Commitments ({capitalSources.length})
          </button>
        </div>

        {/* Pipeline Tab */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            {/* Pipeline Stage Summary */}
            {pipelineSummary && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {STAGE_PROGRESSION.map((stage) => {
                  const count = pipelineSummary.byStage[stage.key] || 0;
                  return (
                    <div
                      key={stage.key}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg border text-center min-w-[80px] ${
                        count > 0
                          ? "bg-gray-800 border-gray-600"
                          : "bg-gray-900 border-gray-800 opacity-50"
                      }`}
                    >
                      <div className="text-lg mb-1">{stage.icon}</div>
                      <div className="text-xs text-gray-400">{stage.label}</div>
                      <div
                        className={`text-sm font-bold ${count > 0 ? "text-white" : "text-gray-600"}`}
                      >
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Relationships */}
            {activeRelationships.length > 0 ? (
              <div className="space-y-3">
                {activeRelationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            rel.targetType === "cde"
                              ? "bg-emerald-900/50"
                              : "bg-blue-900/50"
                          }`}
                        >
                          <span className="text-lg">
                            {rel.targetType === "cde" ? "🏛️" : "🏦"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {rel.targetName}
                          </p>
                          <p className="text-sm text-gray-400 capitalize">
                            {rel.targetType}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${rel.stageBgColor} ${rel.stageColor}`}
                        >
                          {rel.stageLabel}
                        </span>
                        {rel.matchScore && (
                          <p className="text-xs text-gray-500 mt-1">
                            {rel.matchScore}% match
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-4 text-sm">
                        {rel.requestedAmount && (
                          <div>
                            <span className="text-gray-500">Requested: </span>
                            <span className="text-white font-medium">
                              {formatCurrency(rel.requestedAmount)}
                            </span>
                          </div>
                        )}
                        {rel.committedAmount && (
                          <div>
                            <span className="text-gray-500">Committed: </span>
                            <span className="text-emerald-400 font-medium">
                              {formatCurrency(rel.committedAmount)}
                            </span>
                          </div>
                        )}
                        {rel.lastActivity && (
                          <div className="text-gray-500">
                            Last activity: {formatDate(rel.lastActivity)}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* LOI Action */}
                        {rel.loiId && (
                          <Link
                            href={`/deals/${dealId}/loi/${rel.loiId}`}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg"
                          >
                            View LOI
                          </Link>
                        )}
                        {/* Commitment Action */}
                        {rel.commitmentId && (
                          <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg">
                            View Commitment
                          </button>
                        )}
                        {/* Message Action */}
                        {!rel.loiId && !rel.commitmentId && (
                          <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">
                            Send Message
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Next Action */}
                    {rel.nextAction && (
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-sm">
                        <span className="text-amber-400">⏳</span>
                        <span className="text-gray-400">Next:</span>
                        <span className="text-white">{rel.nextAction}</span>
                        {rel.nextActionDue && (
                          <span className="text-gray-500">
                            by {formatDate(rel.nextActionDue)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Active Sources Yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Run AutoMatch to find CDEs and Investors that align with your
                  project.
                </p>
                <button
                  onClick={() =>
                    router.push(`/dashboard/automatch?dealId=${dealId}`)
                  }
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                >
                  Find Matching CDEs
                </button>
              </div>
            )}

            {/* Inactive Relationships */}
            {inactiveRelationships.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Inactive ({inactiveRelationships.length})
                </h3>
                <div className="space-y-2">
                  {inactiveRelationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="bg-gray-900/50 rounded-lg border border-gray-800/50 p-3 opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {rel.targetType === "cde" ? "🏛️" : "🏦"}
                          </span>
                          <span className="text-gray-400">
                            {rel.targetName}
                          </span>
                        </div>
                        <span className={`text-sm ${rel.stageColor}`}>
                          {rel.stageLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sources Tab (LOIs & Commitments) */}
        {activeTab === "sources" && (
          <div className="space-y-4">
            {capitalSources.length > 0 ? (
              capitalSources.map((source) => (
                <div
                  key={source.id}
                  className={`bg-gray-900 rounded-xl border p-5 ${
                    source.type === "commitment"
                      ? "border-emerald-500/30"
                      : source.type === "loi"
                        ? "border-amber-500/30"
                        : "border-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          source.type === "commitment"
                            ? "bg-emerald-900/50"
                            : source.type === "loi"
                              ? "bg-amber-900/50"
                              : "bg-gray-800"
                        }`}
                      >
                        <span className="text-2xl">
                          {source.type === "commitment"
                            ? "🤝"
                            : source.type === "loi"
                              ? "📝"
                              : "💰"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {source.sourceName}
                        </p>
                        <p className="text-sm text-gray-400 capitalize">
                          {source.type === "loi"
                            ? "Letter of Intent"
                            : source.type === "commitment"
                              ? "Commitment Letter"
                              : source.sourceType}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold ${
                          source.type === "commitment"
                            ? "text-emerald-400"
                            : source.type === "loi"
                              ? "text-amber-400"
                              : "text-white"
                        }`}
                      >
                        {formatCurrency(source.amount)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          source.status === "all_accepted" ||
                          source.status === "sponsor_accepted"
                            ? "bg-green-900/50 text-green-400"
                            : source.status === "expired" ||
                                source.status === "rejected"
                              ? "bg-red-900/50 text-red-400"
                              : "bg-amber-900/50 text-amber-400"
                        }`}
                      >
                        {source.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-4 text-sm">
                    {source.issuedAt && (
                      <div>
                        <span className="text-gray-500">Issued: </span>
                        <span className="text-gray-300">
                          {formatDate(source.issuedAt)}
                        </span>
                      </div>
                    )}
                    {source.expiresAt && (
                      <div>
                        <span className="text-gray-500">Expires: </span>
                        <span
                          className={`${
                            new Date(source.expiresAt) < new Date()
                              ? "text-red-400"
                              : "text-gray-300"
                          }`}
                        >
                          {formatDate(source.expiresAt)}
                        </span>
                      </div>
                    )}
                    {source.contactName && (
                      <div>
                        <span className="text-gray-500">Contact: </span>
                        <span className="text-gray-300">
                          {source.contactName}
                        </span>
                      </div>
                    )}
                    {source.creditType && (
                      <div>
                        <span className="text-gray-500">Credit: </span>
                        <span className="text-indigo-400">
                          {source.creditType}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {(source.status === "issued" ||
                    source.status === "pending_sponsor") && (
                    <div className="mt-4 flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium">
                        Accept
                      </button>
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
                        Counter
                      </button>
                      <button className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-900/30 rounded-lg">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No LOIs or Commitments Yet
                </h3>
                <p className="text-gray-400">
                  When CDEs or Investors issue Letters of Intent or Commitment
                  Letters, they'll appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ready for Closing CTA */}
        {capitalSummary?.readyForClosing && (
          <div className="mt-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Your Deal is Fully Funded!
            </h3>
            <p className="text-gray-400 mb-4">
              You have enough committed capital to proceed to closing.
            </p>
            <Link
              href={`/deals/${dealId}/dd-vault`}
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold"
            >
              Enter Closing Room
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
