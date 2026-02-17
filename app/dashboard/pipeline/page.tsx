"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/lib/auth";
import { fetchDealsByOrganization } from "@/lib/supabase/queries";
import { DealStatus } from "@/lib/data/deals";

// ============================================
// PIPELINE STAGES (CANONICAL DEAL STATUS)
// ============================================

type PipelineStage = DealStatus;

interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
}

const STAGE_CONFIG: Record<PipelineStage, StageConfig> = {
  draft: { label: "Draft", color: "text-gray-300", bgColor: "bg-gray-800/50" },
  submitted: {
    label: "Submitted",
    color: "text-blue-300",
    bgColor: "bg-blue-900/50",
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-300",
    bgColor: "bg-amber-900/50",
  },
  available: {
    label: "Available",
    color: "text-teal-300",
    bgColor: "bg-teal-900/50",
  },
  seeking_capital: {
    label: "Seeking Capital",
    color: "text-indigo-300",
    bgColor: "bg-indigo-900/50",
  },
  matched: {
    label: "Matched",
    color: "text-purple-300",
    bgColor: "bg-purple-900/50",
  },
  closing: {
    label: "Closing",
    color: "text-pink-300",
    bgColor: "bg-pink-900/50",
  },
  closed: {
    label: "Closed",
    color: "text-green-300",
    bgColor: "bg-green-900/50",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-gray-400",
    bgColor: "bg-gray-900/50",
  },
};

// ============================================
// PIPELINE DEAL INTERFACE
// ============================================

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  cdeName?: string;
  investorName?: string;
  city: string;
  state: string;
  programType: "NMTC" | "HTC" | "LIHTC" | "OZ" | "DRAFT";
  allocationRequest: number;
  stage: PipelineStage;
  matchScore: number;
  tractType: string[];
  daysInStage: number;
  submittedDate: string;
  assignedTo?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  isDraft?: boolean;
  readinessScore?: number;
  holdExpires?: string; // 3-day hold for CDEs
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PipelinePage() {
  return (
    <ProtectedRoute>
      <PipelineContent />
    </ProtectedRoute>
  );
}

function PipelineContent() {
  const router = useRouter();
  const { orgType, currentDemoRole, organizationId, userEmail } =
    useCurrentUser();
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null);
  const [drafts, setDrafts] = useState<PipelineDeal[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [supabaseDeals, setSupabaseDeals] = useState<PipelineDeal[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // Get role-specific configuration
  const effectiveRole = currentDemoRole === "admin" ? "cde" : orgType;

  const mapStatusToStage = (status: DealStatus | undefined): PipelineStage =>
    status || "draft";

  useEffect(() => {
    async function loadSupabaseDeals() {
      setIsLoadingSupabase(true);
      try {
        // Fetch assigned/invited deals via by-organization API
        const fetched = await fetchDealsByOrganization(
          organizationId || "",
          userEmail,
          effectiveRole,
        );

        const mapped: PipelineDeal[] = fetched.map((d) => {
          const mappedStage = mapStatusToStage(d.status as DealStatus);
          return {
            id: d.id,
            projectName: d.projectName,
            sponsorName: d.sponsorName,
            city: d.city,
            state: d.state,
            programType: d.programType as PipelineDeal["programType"],
            allocationRequest: d.allocation,
            stage: mappedStage,
            isDraft: mappedStage === "draft",
            readinessScore:
              (
                d as unknown as {
                  readinessScore?: number;
                  readiness_score?: number;
                }
              ).readinessScore ||
              (d as unknown as { readiness_score?: number }).readiness_score,
            matchScore: 0,
            tractType: d.tractType,
            daysInStage: Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(d.submittedDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            ),
            submittedDate: d.submittedDate,
          };
        });

        // For CDE/Investor: also fetch AutoMatch results so they see matched deals
        // (same data source as CDEDashboardV2 "Match Queue")
        let autoMatchDeals: PipelineDeal[] = [];
        if (
          (effectiveRole === "cde" || effectiveRole === "investor") &&
          organizationId
        ) {
          try {
            const res = await fetch(
              `/api/automatch?scan=true&cdeId=${organizationId}&minScore=0`,
              { credentials: "include" },
            );
            if (res.ok) {
              const data = await res.json();
              if (data?.matches && Array.isArray(data.matches)) {
                const existingIds = new Set(mapped.map((d) => d.id));
                interface AutoMatchResult {
                  id: string;
                  projectName?: string;
                  sponsorName?: string;
                  city?: string;
                  state?: string;
                  programType?: string;
                  allocationRequest?: number;
                  allocation?: number;
                  status?: string;
                  readinessScore?: number;
                  matchScore?: number;
                  tractType?: string[];
                  submittedDate?: string;
                }
                autoMatchDeals = data.matches
                  .filter((m: AutoMatchResult) => !existingIds.has(m.id))
                  .map((m: AutoMatchResult) => ({
                    id: m.id,
                    projectName: m.projectName || "Untitled",
                    sponsorName: m.sponsorName || "Unknown",
                    city: m.city || "",
                    state: m.state || "",
                    programType: m.programType || "NMTC",
                    allocationRequest: m.allocationRequest || m.allocation || 0,
                    stage: mapStatusToStage(m.status as DealStatus),
                    isDraft: false,
                    readinessScore: m.readinessScore || 0,
                    matchScore: m.matchScore || 0,
                    tractType: m.tractType || [],
                    daysInStage: 0,
                    submittedDate: m.submittedDate || "",
                  }));
              }
            }
          } catch {
            // AutoMatch fetch failed — still show assigned deals
          }
        }

        // For sponsors, filter out draft-status deals since they're shown from drafts API
        const filtered =
          effectiveRole === "sponsor"
            ? mapped.filter((d) => d.stage !== "draft")
            : [...mapped, ...autoMatchDeals];
        setSupabaseDeals(filtered);
      } catch (error) {
        console.error("Failed to load deals from Supabase:", error);
      } finally {
        setIsLoadingSupabase(false);
      }
    }
    loadSupabaseDeals();
  }, [effectiveRole, organizationId, userEmail]);

  const getStageConfig = (): Record<PipelineStage, StageConfig> => STAGE_CONFIG;

  const getPageTitle = (): string => "Deal Pipeline";

  const getPageSubtitle = (): string => "Track deals across canonical stages";

  const stageConfig = useMemo(() => getStageConfig(), []);
  const _pipeline = useMemo(() => {
    if (effectiveRole === "sponsor") {
      // Filter out draft-status deals from supabaseDeals to avoid duplicates
      // (drafts are shown separately in the drafts section)
      const nonDraftDeals = supabaseDeals.filter((d) => d.stage !== "draft");
      return [...drafts, ...nonDraftDeals];
    }
    return supabaseDeals;
  }, [drafts, supabaseDeals, effectiveRole]);

  // Load drafts for sponsors only
  useEffect(() => {
    if (effectiveRole !== "sponsor") {
      setIsLoadingDrafts(false);
      return;
    }

    const loadDrafts = async () => {
      if (!organizationId) {
        setIsLoadingDrafts(false);
        return;
      }

      try {
        // Use fetchApi utility for consistent error handling and credentials
        const { fetchApi } = await import("@/lib/api/fetch-utils");

        interface RawDraft {
          id: string;
          project_name?: string;
          sponsor_name?: string;
          city?: string;
          state?: string;
          programs?: string[];
          total_project_cost?: number;
          readiness_score?: number;
          updated_at?: string;
          created_at?: string;
          draft_data?: Record<string, unknown>;
          intake_data?: Record<string, unknown>;
        }
        const result = await fetchApi<{
          drafts?: RawDraft[];
          draft?: RawDraft;
        }>(`/api/drafts?orgId=${encodeURIComponent(organizationId)}`);

        if (!result.success) {
          console.error("[Pipeline] Draft fetch failed:", result.error);
          setDrafts([]);
          setIsLoadingDrafts(false);
          return;
        }

        const draftData = result.data;

        // Handle both single draft and array of drafts
        const draftsList =
          draftData?.drafts || (draftData?.draft ? [draftData.draft] : []);

        if (draftsList.length > 0) {
          const mappedDrafts: PipelineDeal[] = draftsList.map(
            (draft: RawDraft) => {
              // Get draft data - handle both draft_data and intake_data
              const draftData = (draft.draft_data ||
                draft.intake_data ||
                {}) as Record<string, unknown>;

              // Extract program type from draft data
              const programs = (draftData.programs || draft.programs) as
                | string[]
                | undefined;
              const draftProgram =
                Array.isArray(programs) && programs.length > 0
                  ? programs[0]
                  : null;

              return {
                id: draft.id,
                projectName:
                  draft.project_name ||
                  (draftData.projectName as string) ||
                  "Untitled Draft",
                sponsorName:
                  (draftData.sponsorName as string) ||
                  draft.sponsor_name ||
                  "Not specified",
                city: (draftData.city as string) || draft.city || "",
                state: (draftData.state as string) || draft.state || "",
                programType: (draftProgram ||
                  "DRAFT") as PipelineDeal["programType"],
                allocationRequest: Number(
                  draftData.totalProjectCost || draft.total_project_cost || 0,
                ),
                stage: "draft" as const,
                matchScore: draft.readiness_score || 0,
                tractType: [],
                daysInStage: Math.floor(
                  (Date.now() -
                    new Date(
                      draft.updated_at || draft.created_at || Date.now(),
                    ).getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
                submittedDate: draft.created_at || "",
                isDraft: true,
                readinessScore: draft.readiness_score,
              };
            },
          );
          setDrafts(mappedDrafts);
        } else {
          setDrafts([]);
        }
      } catch (error) {
        console.error("[Pipeline] Failed to load drafts:", error);
        setDrafts([]);
      } finally {
        setIsLoadingDrafts(false);
      }
    };

    loadDrafts();
  }, [effectiveRole, organizationId]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const totalPipeline = supabaseDeals.reduce(
    (sum, d) => sum + d.allocationRequest,
    0,
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-yellow-400";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  const handleDealClick = (deal: PipelineDeal) => {
    if (deal.isDraft) {
      // Draft deal - go to intake to continue
      router.push(`/intake?draftId=${deal.id}`);
    } else if (effectiveRole === "sponsor") {
      // Sponsor clicking their own deal - go to deal detail page (they can edit from there)
      router.push(`/deals/${deal.id}`);
    } else {
      // CDE/Investor - show detail modal
      setSelectedDeal(deal);
    }
  };

  const _handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this draft? This cannot be undone.")) return;

    try {
      await fetch(`/api/drafts?id=${draftId}`, { method: "DELETE" });
      setDrafts([]);
    } catch (error) {
      console.error("[Pipeline] Failed to delete draft:", error);
    }
  };

  const _getHoldStatus = () => null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{getPageTitle()}</h1>
          <p className="text-gray-400 mt-1">{getPageSubtitle()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {effectiveRole === "investor"
                ? "Investment Pipeline"
                : "Active Pipeline"}
            </div>
            <div className="text-2xl font-bold text-indigo-400">
              {formatCurrency(totalPipeline)}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded text-sm font-medium text-gray-300 border border-gray-700">
            List View
          </div>
          {effectiveRole === "sponsor" && (
            <Link
              href="/deals/new"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2"
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
              New Deal
            </Link>
          )}
        </div>
      </div>

      {isLoadingSupabase && isLoadingDrafts ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : null}

      {/* List View */}
      {!isLoadingSupabase && !isLoadingDrafts && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  C-Score
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase"
                  title="CDE matches - run AutoMatch on deal page"
                >
                  Matches
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Days
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {/* Drafts first (sponsors only) */}
              {effectiveRole === "sponsor" &&
                drafts.map((draft) => (
                  <tr
                    key={`draft-${draft.id}`}
                    className="hover:bg-gray-800/50 cursor-pointer bg-gray-800/20"
                    onClick={() => router.push(`/intake?draftId=${draft.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                            DRAFT
                          </span>
                          <span className="font-medium text-gray-100">
                            {draft.projectName}
                          </span>
                        </div>
                        {(draft.city || draft.state) && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {draft.city}
                            {draft.city && draft.state ? ", " : ""}
                            {draft.state}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {draft.programType && draft.programType !== "DRAFT" ? (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            (
                              {
                                NMTC: "bg-emerald-900/50 text-emerald-300",
                                HTC: "bg-blue-900/50 text-blue-300",
                                LIHTC: "bg-purple-900/50 text-purple-300",
                                OZ: "bg-amber-900/50 text-amber-300",
                                Brownfield: "bg-orange-900/50 text-orange-300",
                              } as Record<string, string>
                            )[draft.programType] || "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {draft.programType}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${draft.readinessScore || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {draft.readinessScore || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {draft.allocationRequest > 0 ? (
                        <span className="font-medium text-gray-100">
                          {formatCurrency(draft.allocationRequest)}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {draft.readinessScore ? (
                        <span
                          className={`text-sm font-medium ${getScoreColor(draft.readinessScore)}`}
                        >
                          {draft.readinessScore}%
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">—</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {draft.daysInStage}d
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-400 hover:text-indigo-300 text-sm">
                        Continue →
                      </span>
                    </td>
                  </tr>
                ))}

              {/* Active deals - deduplicate by ID and exclude drafts for sponsors (shown above) */}
              {supabaseDeals
                .filter((deal) => !deal.isDraft)
                .filter(
                  (deal) =>
                    !(effectiveRole === "sponsor" && deal.stage === "draft"),
                )
                .filter((deal) => {
                  // For sponsors, also filter by project name to catch duplicates between drafts table and deals table
                  if (effectiveRole === "sponsor" && drafts.length > 0) {
                    const draftNames = drafts.map((d) =>
                      d.projectName?.toLowerCase().trim(),
                    );
                    return !draftNames.includes(
                      deal.projectName?.toLowerCase().trim(),
                    );
                  }
                  return true;
                })
                .filter(
                  (deal, index, arr) =>
                    arr.findIndex((d) => d.id === deal.id) === index,
                )
                .map((deal) => {
                  const config = stageConfig[deal.stage];
                  const programColors: Record<string, string> = {
                    NMTC: "bg-emerald-900/50 text-emerald-300",
                    HTC: "bg-blue-900/50 text-blue-300",
                    LIHTC: "bg-purple-900/50 text-purple-300",
                    OZ: "bg-amber-900/50 text-amber-300",
                    Brownfield: "bg-orange-900/50 text-orange-300",
                  };
                  return (
                    <tr
                      key={`deal-${deal.id}`}
                      className="hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => handleDealClick(deal)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-100">
                            {deal.projectName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {deal.city}, {deal.state}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${programColors[deal.programType] || "bg-gray-700 text-gray-300"}`}
                        >
                          {deal.programType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${config?.bgColor} ${config?.color}`}
                        >
                          {config?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-100">
                          {formatCurrency(deal.allocationRequest)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {deal.readinessScore ? (
                          <span
                            className={`text-sm font-medium ${getScoreColor(deal.readinessScore)}`}
                          >
                            {deal.readinessScore}%
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {deal.matchScore > 0 ? (
                          <span
                            className={`text-sm font-medium ${getScoreColor(deal.matchScore)}`}
                          >
                            {deal.matchScore}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {deal.daysInStage}d
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-indigo-400 hover:text-indigo-300 text-sm">
                          View →
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && !selectedDeal.isDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedDeal(null)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedDeal.projectName}
                </h3>
                <p className="text-gray-400">
                  {effectiveRole === "sponsor" && selectedDeal.cdeName}
                  {effectiveRole === "cde" && selectedDeal.sponsorName}
                  {effectiveRole === "investor" && selectedDeal.cdeName}
                </p>
              </div>
              <button
                onClick={() => setSelectedDeal(null)}
                className="text-gray-500 hover:text-white"
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

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Program
                  </label>
                  <p className="text-lg font-semibold text-emerald-400">
                    {selectedDeal.programType}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    {effectiveRole === "investor"
                      ? "Investment Amount"
                      : "Allocation"}
                  </label>
                  <p className="text-lg font-semibold text-indigo-400">
                    {formatCurrency(selectedDeal.allocationRequest)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    C-Score
                  </label>
                  <p
                    className={`text-lg font-semibold ${getScoreColor(selectedDeal.readinessScore || 0)}`}
                  >
                    {selectedDeal.readinessScore
                      ? `${selectedDeal.readinessScore}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    CDE Matches
                  </label>
                  <p className="text-lg font-semibold text-gray-400">
                    Run AutoMatch
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">
                  Location
                </label>
                <p className="text-gray-100">
                  {selectedDeal.city}, {selectedDeal.state}
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase block mb-2">
                  Current Stage
                </label>
                <p className="text-gray-100">
                  {stageConfig[selectedDeal.stage]?.label}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link
                href={`/deals/${selectedDeal.id}`}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-center"
              >
                View Full Deal
              </Link>
              <button
                onClick={() => setSelectedDeal(null)}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
