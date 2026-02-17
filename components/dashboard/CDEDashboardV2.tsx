"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  Briefcase,
  DollarSign,
  FileText,
  Search,
  MapPin,
  Settings,
  Filter,
  ExternalLink,
  Map,
} from "lucide-react";
import { fetchApi } from "@/lib/api/fetch-utils";
import DDVaultSummaryWidget from "./widgets/DDVaultSummary";
import DealStatusTimeline, {
  mapDealStatusToStage,
} from "./widgets/DealStatusTimeline";
import MandateSettings from "@/components/cde/MandateSettings";

/**
 * Enhanced CDE Dashboard (V2)
 *
 * Pipeline management with:
 * - Match Queue (AutoMatch scored 0-100)
 * - Pipeline deals (outreach-invited + assigned)
 * - Mandate Settings integration
 * - UTS Strategy tracking
 */

interface MatchedDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  programs: string[];
  allocation: number;
  state: string;
  city: string;
  matchScore: number; // 0-100 from AutoMatch binary scoring
  matchReasons: string[];
  scoreBreakdown: Record<string, number>; // binary 0/1 per criterion
  status: string;
  tractType: string[];
}

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  programs: string[];
  allocation: number;
  state: string;
  city: string;
  status: string;
  ddCompletion?: number;
}

interface AllocationStatus {
  totalAllocation: number;
  deployed: number;
  available: number;
  reserved: number;
  year: number;
}

interface UTSStatus {
  targetPercentage: number;
  currentPercentage: number;
  targetStates: string[];
  deployedByState: { state: string; amount: number; percentage: number }[];
}

/** Raw deal shape from by-organization API */
interface RawCDEDeal {
  id: string;
  project_name?: string;
  sponsor_name?: string;
  sponsor_organization_name?: string;
  sponsors?: { organization_name?: string };
  programs?: string[];
  nmtc_financing_requested?: string | number;
  total_project_cost?: string | number;
  state?: string;
  city?: string;
  status?: string;
  dd_completion?: number;
}

/** Raw AutoMatch result */
interface RawAutoMatchResult {
  id: string;
  projectName?: string;
  sponsorName?: string;
  programType?: string;
  allocationRequest?: number;
  state?: string;
  city?: string;
  matchScore?: number;
  matchReasons?: string[];
  scoreBreakdown?: Record<string, number>;
  tractType?: string[];
}

/** Raw allocation row */
interface RawAllocation {
  awarded_amount?: number;
  deployed_amount?: number;
}

interface CDEDashboardV2Props {
  userName: string;
  orgName: string;
  cdeId?: string;
  organizationId?: string;
}

export default function CDEDashboardV2({
  userName,
  orgName,
  cdeId,
  organizationId,
}: CDEDashboardV2Props) {
  const [allocation, setAllocation] = useState<AllocationStatus>({
    totalAllocation: 0,
    deployed: 0,
    available: 0,
    reserved: 0,
    year: new Date().getFullYear(),
  });
  const [utsStatus, _setUtsStatus] = useState<UTSStatus>({
    targetPercentage: 25,
    currentPercentage: 0,
    targetStates: [],
    deployedByState: [],
  });
  const [matchQueue, setMatchQueue] = useState<MatchedDeal[]>([]);
  const [pipeline, setPipeline] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "queue" | "pipeline" | "mandate" | "uts"
  >("queue");
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<"all" | 1 | 2 | 3>("all");

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadDashboardData only depends on organizationId which is already in deps
  }, [organizationId]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const resolvedCdeId = cdeId || organizationId;

      // Fire all 3 API calls in PARALLEL instead of sequential waterfall
      const [autoMatchResult, pipelineResult, allocResult] = await Promise.all([
        // 1. AutoMatch scored deals for Match Queue
        organizationId
          ? fetch(
              `/api/automatch?scan=true&cdeId=${organizationId}&minScore=0`,
              { credentials: "include" },
            )
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          : Promise.resolve(null),
        // 2. Pipeline deals (outreach-invited + assigned)
        organizationId
          ? fetchApi<{ deals: RawCDEDeal[] }>(
              `/api/deals/by-organization?orgId=${organizationId}&orgType=cde`,
            )
          : Promise.resolve({ success: false, data: null }),
        // 3. CDE allocation data
        resolvedCdeId
          ? fetchApi<RawAllocation[]>(`/api/cdes/${resolvedCdeId}/allocations`)
          : Promise.resolve({ success: false, data: null }),
      ]);

      // Process AutoMatch results
      if (autoMatchResult?.matches && Array.isArray(autoMatchResult.matches)) {
        const scored: MatchedDeal[] = autoMatchResult.matches.map(
          (m: RawAutoMatchResult) => ({
            id: m.id,
            projectName: m.projectName || "Untitled",
            sponsorName: m.sponsorName || "Unknown",
            programs: [m.programType || "NMTC"],
            allocation: m.allocationRequest || 0,
            state: m.state || "",
            city: m.city || "",
            matchScore: m.matchScore || 0,
            matchReasons: m.matchReasons || [],
            scoreBreakdown: m.scoreBreakdown || {},
            status: "available",
            tractType: m.tractType || [],
          }),
        );
        setMatchQueue(scored);
      }

      // Process pipeline results
      if (pipelineResult.success && pipelineResult.data?.deals) {
        const pipelineDeals: PipelineDeal[] = pipelineResult.data.deals.map(
          (deal: RawCDEDeal) => ({
            id: deal.id,
            projectName: deal.project_name || "Untitled",
            sponsorName:
              deal.sponsors?.organization_name ||
              deal.sponsor_organization_name ||
              deal.sponsor_name ||
              "Unknown",
            programs: deal.programs || ["NMTC"],
            allocation:
              Number(deal.nmtc_financing_requested) ||
              Number(deal.total_project_cost) ||
              0,
            state: deal.state || "",
            city: deal.city || "",
            status: deal.status || "available",
            ddCompletion: deal.dd_completion,
          }),
        );
        setPipeline(pipelineDeals);
      }

      // Process allocation results — fetchApi already unwraps .data
      const allocs =
        allocResult.success && Array.isArray(allocResult.data)
          ? allocResult.data
          : [];
      if (allocs.length > 0) {
        const total = allocs.reduce(
          (sum: number, a: RawAllocation) => sum + (a.awarded_amount || 0),
          0,
        );
        const deployed = allocs.reduce(
          (sum: number, a: RawAllocation) => sum + (a.deployed_amount || 0),
          0,
        );
        if (total > 0) {
          setAllocation({
            totalAllocation: total,
            deployed,
            available: total - deployed,
            reserved: 0,
            year: new Date().getFullYear(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  // Filter by match strength tier
  const filteredQueue =
    tierFilter === "all"
      ? matchQueue
      : tierFilter === 1
        ? matchQueue.filter((d) => d.matchScore >= 80) // Excellent
        : tierFilter === 2
          ? matchQueue.filter((d) => d.matchScore >= 50 && d.matchScore < 80) // Good/Fair
          : matchQueue.filter((d) => d.matchScore < 50); // Weak

  const excellentCount = matchQueue.filter((d) => d.matchScore >= 80).length;

  const tabs = [
    {
      id: "queue",
      label: "Match Queue",
      icon: TrendingUp,
      count: matchQueue.length,
    },
    {
      id: "pipeline",
      label: "My Pipeline",
      icon: Briefcase,
      count: pipeline.length,
    },
    { id: "mandate", label: "Mandate Settings", icon: Settings },
    { id: "uts", label: "UTS Strategy", icon: Map },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur rounded-xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="text-blue-200 text-sm">
            {orgName} • Deployment Tracker
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/deals"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-lg text-sm font-medium transition-colors border border-white/20 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Browse Deals
          </Link>
          <Link
            href="/map"
            className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Map View
          </Link>
        </div>
      </div>

      {/* Allocation Status */}
      {allocation.totalAllocation > 0 && (
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              {allocation.year} Allocation
            </h2>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-400">
                  {formatCurrency(allocation.deployed)}
                </div>
                <div className="text-xs text-gray-500">Deployed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">
                  {formatCurrency(allocation.reserved)}
                </div>
                <div className="text-xs text-gray-500">Reserved</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">
                  {formatCurrency(allocation.available)}
                </div>
                <div className="text-xs text-gray-500">Available</div>
              </div>
            </div>
          </div>
          <AllocationBar allocation={allocation} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                UTS Progress
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {utsStatus.currentPercentage}%
              </p>
              <p className="text-xs text-gray-500">
                Target: {utsStatus.targetPercentage}%
              </p>
            </div>
            <UTSGauge
              current={utsStatus.currentPercentage}
              target={utsStatus.targetPercentage}
            />
          </div>
        </div>
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Strong Matches
              </p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {excellentCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                In Pipeline
              </p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {pipeline.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                DD Pending
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {pipeline.filter((d) => (d.ddCompletion || 0) < 80).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${
                  activeTab === tab.id
                    ? "text-blue-400 border-blue-400"
                    : "text-gray-400 border-transparent hover:text-gray-300"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {"count" in tab && tab.count !== undefined && (
                <span
                  className={`
                  px-2 py-0.5 rounded-full text-xs font-medium
                  ${activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400"}
                `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "queue" && (
          <MatchQueueTab
            deals={filteredQueue}
            loading={loading}
            tierFilter={tierFilter}
            onTierFilterChange={setTierFilter}
            expandedDeal={expandedDeal}
            onToggleDeal={(id) =>
              setExpandedDeal(expandedDeal === id ? null : id)
            }
          />
        )}

        {activeTab === "pipeline" && (
          <PipelineTab
            deals={pipeline}
            loading={loading}
            expandedDeal={expandedDeal}
            onToggleDeal={(id) =>
              setExpandedDeal(expandedDeal === id ? null : id)
            }
          />
        )}

        {activeTab === "mandate" && (cdeId || organizationId) && (
          <MandateSettings cdeId={cdeId || organizationId || ""} />
        )}

        {activeTab === "uts" && <UTSStrategyTab utsStatus={utsStatus} />}
      </div>
    </div>
  );
}

// Sub-components

function AllocationBar({ allocation }: { allocation: AllocationStatus }) {
  const deployedPct =
    allocation.totalAllocation > 0
      ? (allocation.deployed / allocation.totalAllocation) * 100
      : 0;
  const reservedPct =
    allocation.totalAllocation > 0
      ? (allocation.reserved / allocation.totalAllocation) * 100
      : 0;

  return (
    <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
      <div className="bg-emerald-500" style={{ width: `${deployedPct}%` }} />
      <div className="bg-purple-500" style={{ width: `${reservedPct}%` }} />
    </div>
  );
}

function UTSGauge({ current, target }: { current: number; target: number }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const color =
    percentage >= 100 ? "#10b981" : percentage >= 75 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative w-12 h-12">
      <svg className="transform -rotate-90" width={48} height={48}>
        <circle
          cx={24}
          cy={24}
          r={20}
          fill="none"
          stroke="#374151"
          strokeWidth="4"
        />
        <circle
          cx={24}
          cy={24}
          r={20}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={125.6}
          strokeDashoffset={125.6 - (percentage / 100) * 125.6}
        />
      </svg>
    </div>
  );
}

interface MatchQueueTabProps {
  deals: MatchedDeal[];
  loading: boolean;
  tierFilter: "all" | 1 | 2 | 3;
  onTierFilterChange: (filter: "all" | 1 | 2 | 3) => void;
  expandedDeal: string | null;
  onToggleDeal: (id: string) => void;
}

function MatchQueueTab({
  deals,
  loading,
  tierFilter,
  onTierFilterChange,
  expandedDeal,
  onToggleDeal,
}: MatchQueueTabProps) {
  const tierFilters = [
    { id: "all" as const, label: "All", color: "gray" },
    { id: 1 as const, label: "Excellent", color: "emerald" },
    { id: 2 as const, label: "Good", color: "amber" },
    { id: 3 as const, label: "Fair", color: "gray" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Match Strength Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        {tierFilters.map((filter) => (
          <button
            key={String(filter.id)}
            onClick={() => onTierFilterChange(filter.id)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${
                tierFilter === filter.id
                  ? filter.color === "emerald"
                    ? "bg-emerald-600 text-white"
                    : filter.color === "amber"
                      ? "bg-amber-600 text-white"
                      : "bg-gray-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Deals List */}
      {deals.length === 0 ? (
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
          <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No matches found
          </h3>
          <p className="text-gray-500 mb-4">
            No marketplace deals match your CDE criteria yet. Check back as new
            deals are submitted.
          </p>
          <Link
            href="/deals"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <MatchDealCard
              key={deal.id}
              deal={deal}
              expanded={expandedDeal === deal.id}
              onToggle={() => onToggleDeal(deal.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineTab({
  deals,
  loading,
  expandedDeal,
  onToggleDeal,
}: {
  deals: PipelineDeal[];
  loading: boolean;
  expandedDeal: string | null;
  onToggleDeal: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">No deals in your pipeline yet.</p>
        <p className="text-sm text-gray-500">
          When sponsors send you allocation requests, accepted deals will appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <PipelineDealCard
          key={deal.id}
          deal={deal}
          expanded={expandedDeal === deal.id}
          onToggle={() => onToggleDeal(deal.id)}
        />
      ))}
    </div>
  );
}

function UTSStrategyTab({ utsStatus }: { utsStatus: UTSStatus }) {
  if (utsStatus.targetStates.length === 0) {
    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
        <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-2">UTS Strategy Not Configured</p>
        <p className="text-sm text-gray-500">
          CDFI Fund Underserved Target States tracking will be available once
          your allocation data is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-400" />
          UTS Target States
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {utsStatus.targetStates.map((state) => (
            <span
              key={state}
              className="px-3 py-1 bg-blue-900/50 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium"
            >
              {state}
            </span>
          ))}
        </div>
        <div className="space-y-3">
          {utsStatus.deployedByState.map((item) => (
            <div key={item.state} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{item.state}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(item.percentage / utsStatus.targetPercentage) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-white w-16 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          Compliance Status
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Current UTS %</span>
            <span className="text-lg font-bold text-white">
              {utsStatus.currentPercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Target UTS %</span>
            <span className="text-lg font-bold text-blue-400">
              {utsStatus.targetPercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Gap</span>
            <span
              className={`text-lg font-bold ${
                utsStatus.currentPercentage >= utsStatus.targetPercentage
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {utsStatus.targetPercentage - utsStatus.currentPercentage}%
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              {utsStatus.currentPercentage >= utsStatus.targetPercentage
                ? "Meeting UTS requirements"
                : `Need ${utsStatus.targetPercentage - utsStatus.currentPercentage}% more deployment to UTS states`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchDealCard({
  deal,
  expanded,
  onToggle,
}: {
  deal: MatchedDeal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    return `$${(num / 1_000).toFixed(0)}K`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 65) return "text-blue-400";
    if (score >= 50) return "text-amber-400";
    return "text-gray-400";
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    return "Weak";
  };

  const getStrengthStyle = (score: number) => {
    if (score >= 80)
      return "bg-emerald-900/50 text-emerald-300 border-emerald-500/30";
    if (score >= 65) return "bg-blue-900/50 text-blue-300 border-blue-500/30";
    if (score >= 50)
      return "bg-amber-900/50 text-amber-300 border-amber-500/30";
    return "bg-gray-800 text-gray-400 border-gray-600";
  };

  return (
    <div className="bg-gray-900/80 rounded-xl border border-gray-800 hover:border-blue-500/30 transition-all overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {deal.programs.map((program) => (
                <span
                  key={program}
                  className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                  {program}
                </span>
              ))}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border ${getStrengthStyle(deal.matchScore)}`}
              >
                {getStrengthLabel(deal.matchScore)}
              </span>
              <span className="text-xs text-gray-500">
                {deal.city}, {deal.state}
              </span>
            </div>
            <h4 className="text-base font-semibold text-white">
              {deal.projectName}
            </h4>
            <p className="text-xs text-gray-500">
              {deal.sponsorName} • {formatCurrency(deal.allocation)} QEI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p
                className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}
              >
                {deal.matchScore}
              </p>
              <p className="text-xs text-gray-500">Score</p>
            </div>
            <button className="text-gray-400 hover:text-white">
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Match Reasons */}
          {deal.matchReasons.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                Why This Match
              </p>
              <div className="flex flex-wrap gap-2">
                {deal.matchReasons.map((reason, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tract Types */}
          {deal.tractType.length > 0 && (
            <div className="flex gap-2">
              {deal.tractType.map((tract) => (
                <span
                  key={tract}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    tract === "SD"
                      ? "bg-red-900/50 text-red-400 border border-red-700/50"
                      : tract === "QCT"
                        ? "bg-blue-900/50 text-blue-400 border border-blue-700/50"
                        : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {tract}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Link
              href={`/deals/${deal.id}`}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors text-center"
            >
              View Details
            </Link>
            <Link
              href={`/deals/${deal.id}`}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors text-center"
            >
              Review Project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineDealCard({
  deal,
  expanded,
  onToggle,
}: {
  deal: PipelineDeal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    return `$${(num / 1_000).toFixed(0)}K`;
  };

  return (
    <div className="bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {deal.programs.map((program) => (
                <span
                  key={program}
                  className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                >
                  {program}
                </span>
              ))}
              <span className="text-xs text-gray-500">
                {deal.city}, {deal.state}
              </span>
            </div>
            <h4 className="text-base font-semibold text-white">
              {deal.projectName}
            </h4>
            <p className="text-xs text-gray-500">
              {deal.sponsorName} • {formatCurrency(deal.allocation)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {deal.ddCompletion || 0}%
              </p>
              <p className="text-xs text-gray-500">DD Complete</p>
            </div>
            <button className="text-gray-400 hover:text-white">
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        <DealStatusTimeline
          currentStage={mapDealStatusToStage(deal.status)}
          compact
        />
      </div>

      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          <DDVaultSummaryWidget dealId={deal.id} />
          <div className="flex items-center gap-2">
            <Link
              href={`/deals/${deal.id}`}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors text-center"
            >
              View Deal
            </Link>
            <Link
              href={`/deals/${deal.id}/dd-vault`}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors text-center"
            >
              Request DD
            </Link>
            <Link
              href={`/closing-room/${deal.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
