"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  Briefcase,
  DollarSign,
  FileText,
  Clock,
  Search,
  MapPin,
  Shield,
  ExternalLink,
  PieChart,
  BarChart3,
  Map,
} from "lucide-react";
import { fetchApi } from "@/lib/api/fetch-utils";
import DDVaultSummaryWidget from "./widgets/DDVaultSummary";
import DealStatusTimeline, {
  mapDealStatusToStage,
} from "./widgets/DealStatusTimeline";
import RiskFilters from "@/components/investor/RiskFilters";

/**
 * Enhanced Investor Dashboard (V2)
 *
 * Underwriting workbench with:
 * - Investable deals from marketplace
 * - Pipeline deals (outreach-invited + committed)
 * - Risk filters integration
 * - CRA eligibility tracking (computed from real pipeline data)
 * - Portfolio management (computed from commitments)
 */

interface InvestableDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  cdeName?: string;
  programs: string[];
  allocation: number;
  creditPrice: number;
  state: string;
  city: string;
  intakeTier: number; // 1-3 intake tier (form completeness stage)
  completeness: number; // 0-100 form completeness percentage
  ddCompletion?: number;
  status: string;
  craEligible: boolean;
  povertyRate?: number;
  closingDate?: string;
}

interface PortfolioStats {
  totalInvested: number;
  totalCredits: number;
  activeDeals: number;
  pendingCredits: number;
  byCreditType: { type: string; amount: number; percentage: number }[];
  byState: { state: string; amount: number; percentage: number }[];
}

interface CRAStatus {
  totalCRAEligible: number;
  craPercentage: number;
  targetPercentage: number;
  lmiDealsCount: number;
}

/** Raw deal shape from marketplace / by-organization API */
interface RawDeal {
  id: string;
  projectName?: string;
  project_name?: string;
  sponsorName?: string;
  sponsor_name?: string;
  cdeName?: string;
  cde_name?: string;
  programs?: string[];
  programType?: string;
  allocation?: number;
  nmtc_financing_requested?: string | number;
  total_project_cost?: string | number;
  creditPrice?: number;
  state?: string;
  city?: string;
  intake_data?: Record<string, unknown>;
  tier?: number;
  readiness_score?: number;
  dd_completion?: number;
  status?: string;
  cra_eligible?: boolean;
  povertyRate?: number;
  tract_poverty_rate?: number;
  expected_closing_date?: string;
  closingDate?: string;
}

/** Raw commitment shape from /api/commitments */
interface RawCommitment {
  id: string;
  status: string;
  investment_amount?: string | number;
  expected_credits?: string | number;
  credit_type?: string;
  cra_eligible?: boolean;
}

interface InvestorDashboardV2Props {
  userName: string;
  orgName: string;
  investorId?: string;
  organizationId?: string;
}

export default function InvestorDashboardV2({
  userName,
  orgName,
  investorId,
  organizationId,
}: InvestorDashboardV2Props) {
  // Portfolio & CRA stats — computed from real pipeline data, not hardcoded
  const [portfolio, setPortfolio] = useState<PortfolioStats>({
    totalInvested: 0,
    totalCredits: 0,
    activeDeals: 0,
    pendingCredits: 0,
    byCreditType: [],
    byState: [],
  });
  const [craStatus, setCraStatus] = useState<CRAStatus>({
    totalCRAEligible: 0,
    craPercentage: 0,
    targetPercentage: 70, // Default CRA target
    lmiDealsCount: 0,
  });
  const [investableDeals, setInvestableDeals] = useState<InvestableDeal[]>([]);
  const [pipeline, setPipeline] = useState<InvestableDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "deals" | "pipeline" | "filters" | "cra" | "portfolio"
  >("deals");
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadDashboardData only depends on organizationId which is already in deps
  }, [organizationId]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Fire all API calls in PARALLEL
      const [marketplaceResult, pipelineResult, commitmentsResult] =
        await Promise.all([
          // 1. Investable deals from marketplace
          fetchApi<{ deals: RawDeal[] }>("/api/deals/marketplace"),
          // 2. Pipeline deals (outreach-invited + committed)
          organizationId
            ? fetchApi<{ deals: RawDeal[] }>(
                `/api/deals/by-organization?orgId=${organizationId}&orgType=investor`,
              )
            : Promise.resolve({ success: false, data: null }),
          // 3. Commitments (auto-filtered to this investor by API)
          fetchApi<{ commitments: RawCommitment[]; total: number }>(
            "/api/commitments",
          ),
        ]);

      // Process marketplace results
      if (marketplaceResult.success && marketplaceResult.data?.deals) {
        const deals = marketplaceResult.data.deals
          .filter(
            (d) => d.status === "available" || d.status === "seeking_capital",
          )
          .map((deal) => mapDealToInvestable(deal))
          .slice(0, 10);
        setInvestableDeals(deals);
      }

      // Process pipeline results
      const pipelineDeals =
        pipelineResult.success && pipelineResult.data?.deals
          ? pipelineResult.data.deals.map((deal) => mapDealToInvestable(deal))
          : [];
      setPipeline(pipelineDeals);

      // Process commitments and compute portfolio stats
      const commitments =
        commitmentsResult.success && commitmentsResult.data?.commitments
          ? commitmentsResult.data.commitments
          : [];

      computePortfolioStats(pipelineDeals, commitments);
      computeCRAStats(pipelineDeals, commitments);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  /** Map raw API deal to InvestableDeal — no random values, no FORBIDDEN scoring */
  function mapDealToInvestable(deal: RawDeal): InvestableDeal {
    const intake = (deal.intake_data || {}) as Record<string, string>;
    const tier = deal.tier || 1;
    const completeness = deal.readiness_score || 0;

    return {
      id: deal.id,
      projectName: deal.projectName || deal.project_name || "Untitled",
      sponsorName: deal.sponsorName || deal.sponsor_name || "Unknown Sponsor",
      cdeName: deal.cdeName || deal.cde_name,
      programs: deal.programs || [deal.programType || "NMTC"],
      allocation:
        deal.allocation ||
        Number(deal.nmtc_financing_requested) ||
        Number(deal.total_project_cost) ||
        0,
      creditPrice: deal.creditPrice || 0,
      state: deal.state || intake.state || "",
      city: deal.city || intake.city || "",
      intakeTier: tier,
      completeness,
      ddCompletion: deal.dd_completion,
      status: deal.status || "available",
      craEligible: deal.cra_eligible === true,
      povertyRate:
        deal.povertyRate ||
        deal.tract_poverty_rate ||
        (intake.tractPovertyRate ? Number(intake.tractPovertyRate) : undefined),
      closingDate: deal.expected_closing_date || deal.closingDate,
    };
  }

  /** Compute portfolio stats from real pipeline deals + commitments */
  function computePortfolioStats(
    deals: InvestableDeal[],
    commitments: RawCommitment[],
  ) {
    const activeDeals = deals.filter(
      (d) => !["closed", "withdrawn", "draft"].includes(d.status),
    );
    const totalInvested = commitments
      .filter((c) => !["withdrawn", "rejected"].includes(c.status))
      .reduce((sum: number, c) => sum + (Number(c.investment_amount) || 0), 0);

    // Credits from commitments
    const closedCommitments = commitments.filter((c) => c.status === "closed");
    const totalCredits = closedCommitments.reduce(
      (sum: number, c) => sum + (Number(c.expected_credits) || 0),
      0,
    );
    const pendingCommitments = commitments.filter((c) =>
      ["issued", "pending_sponsor", "pending_cde", "all_accepted"].includes(
        c.status,
      ),
    );
    const pendingCredits = pendingCommitments.reduce(
      (sum: number, c) => sum + (Number(c.expected_credits) || 0),
      0,
    );

    // Aggregate by credit type from commitments
    const typeAgg: Record<string, number> = {};
    for (const c of commitments.filter(
      (c) => !["withdrawn", "rejected"].includes(c.status),
    )) {
      const type = c.credit_type || "NMTC";
      typeAgg[type] = (typeAgg[type] || 0) + (Number(c.investment_amount) || 0);
    }
    const byCreditType = Object.entries(typeAgg)
      .map(([type, amount]) => ({
        type,
        amount,
        percentage:
          totalInvested > 0 ? Math.round((amount / totalInvested) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Aggregate by state from pipeline deals
    const stateAgg: Record<string, number> = {};
    for (const deal of activeDeals) {
      if (deal.state) {
        stateAgg[deal.state] = (stateAgg[deal.state] || 0) + deal.allocation;
      }
    }
    const dealTotal = activeDeals.reduce((sum, d) => sum + d.allocation, 0);
    const byState = Object.entries(stateAgg)
      .map(([state, amount]) => ({
        state,
        amount,
        percentage: dealTotal > 0 ? Math.round((amount / dealTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    setPortfolio({
      totalInvested,
      totalCredits,
      activeDeals: activeDeals.length,
      pendingCredits,
      byCreditType,
      byState,
    });
  }

  /** Compute CRA compliance from real pipeline deals + commitments */
  function computeCRAStats(
    deals: InvestableDeal[],
    commitments: RawCommitment[],
  ) {
    // Use commitments for CRA if available, fall back to pipeline deals
    const activeCommitments = commitments.filter(
      (c) => !["withdrawn", "rejected"].includes(c.status),
    );
    const totalFromCommitments = activeCommitments.reduce(
      (sum: number, c) => sum + (Number(c.investment_amount) || 0),
      0,
    );

    const craCommitments = activeCommitments.filter((c) => c.cra_eligible);
    const craFromCommitments = craCommitments.reduce(
      (sum: number, c) => sum + (Number(c.investment_amount) || 0),
      0,
    );

    // Also count from pipeline deals for deals without commitments yet
    const activeDeals = deals.filter(
      (d) => !["closed", "withdrawn", "draft"].includes(d.status),
    );
    const totalFromDeals = activeDeals.reduce(
      (sum, d) => sum + d.allocation,
      0,
    );
    const craDeals = activeDeals.filter((d) => d.craEligible);
    const craFromDeals = craDeals.reduce((sum, d) => sum + d.allocation, 0);

    // Use commitment data if available, otherwise pipeline
    const totalInvested =
      totalFromCommitments > 0 ? totalFromCommitments : totalFromDeals;
    const craTotal =
      totalFromCommitments > 0 ? craFromCommitments : craFromDeals;

    // Count deals in LMI tracts (poverty rate > 20%)
    const lmiDeals = activeDeals.filter(
      (d) => d.povertyRate && d.povertyRate > 20,
    );

    setCraStatus({
      totalCRAEligible: craTotal,
      craPercentage:
        totalInvested > 0 ? Math.round((craTotal / totalInvested) * 100) : 0,
      targetPercentage: 70,
      lmiDealsCount: lmiDeals.length,
    });
  }

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const hasPortfolioData =
    portfolio.totalInvested > 0 || portfolio.activeDeals > 0;

  const tabs = [
    {
      id: "deals",
      label: "Investable Deals",
      icon: TrendingUp,
      count: investableDeals.length,
    },
    {
      id: "pipeline",
      label: "My Pipeline",
      icon: Briefcase,
      count: pipeline.length,
    },
    { id: "filters", label: "Risk Filters", icon: Shield },
    { id: "cra", label: "CRA / Geography", icon: Map },
    { id: "portfolio", label: "Portfolio", icon: PieChart },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600/90 to-teal-600/90 backdrop-blur rounded-xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="text-emerald-200 text-sm">
            {orgName} • Investment Portal
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
            className="px-4 py-2 bg-white text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            CRA Map
          </Link>
        </div>
      </div>

      {/* Portfolio Summary — only show if there's real data */}
      {hasPortfolioData && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Total Invested
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(portfolio.totalInvested)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Total Credits
                </p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {formatCurrency(portfolio.totalCredits)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Active Deals
                </p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {portfolio.activeDeals}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  CRA Eligible
                </p>
                <p className="text-2xl font-bold text-teal-400 mt-1">
                  {craStatus.craPercentage}%
                </p>
              </div>
              <CRAGauge
                current={craStatus.craPercentage}
                target={craStatus.targetPercentage}
              />
            </div>
          </div>
          <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Pending Credits
                </p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {formatCurrency(portfolio.pendingCredits)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      )}

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
                    ? "text-emerald-400 border-emerald-400"
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
                  ${activeTab === tab.id ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400"}
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
        {activeTab === "deals" && (
          <InvestableDealsTab
            deals={investableDeals}
            loading={loading}
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

        {activeTab === "filters" && (organizationId || investorId) && (
          <RiskFilters investorId={investorId || organizationId || ""} />
        )}

        {activeTab === "cra" && (
          <CRATab
            craStatus={craStatus}
            portfolio={portfolio}
            hasData={hasPortfolioData}
          />
        )}

        {activeTab === "portfolio" && (
          <PortfolioTab portfolio={portfolio} hasData={hasPortfolioData} />
        )}
      </div>
    </div>
  );
}

// Sub-components

function CRAGauge({ current, target }: { current: number; target: number }) {
  const percentage = Math.min((current / 100) * 100, 100);
  const color =
    current >= target
      ? "#10b981"
      : current >= target * 0.9
        ? "#f59e0b"
        : "#f43f5e";

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

function InvestableDealsTab({
  deals,
  loading,
  expandedDeal,
  onToggleDeal,
}: {
  deals: InvestableDeal[];
  loading: boolean;
  expandedDeal: string | null;
  onToggleDeal: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">
          No investable deals available right now.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Check back soon or adjust your risk filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <InvestableDealCard
          key={deal.id}
          deal={deal}
          expanded={expandedDeal === deal.id}
          onToggle={() => onToggleDeal(deal.id)}
        />
      ))}
    </div>
  );
}

function PipelineTab({
  deals,
  loading,
  expandedDeal,
  onToggleDeal,
}: {
  deals: InvestableDeal[];
  loading: boolean;
  expandedDeal: string | null;
  onToggleDeal: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
        <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 mb-4">No deals in your pipeline yet.</p>
        <p className="text-sm text-gray-500">
          When sponsors invite you to invest, deals will appear here.
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

function CRATab({
  craStatus,
  portfolio,
  hasData,
}: {
  craStatus: CRAStatus;
  portfolio: PortfolioStats;
  hasData: boolean;
}) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    return `$${(num / 1_000).toFixed(0)}K`;
  };

  if (!hasData) {
    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
        <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No CRA data yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          CRA compliance will be tracked as deals enter your pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Map className="w-4 h-4 text-teal-400" />
          CRA Compliance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              CRA Eligible Investment
            </span>
            <span className="text-lg font-bold text-white">
              {formatCurrency(craStatus.totalCRAEligible)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">CRA Percentage</span>
            <span
              className={`text-lg font-bold ${
                craStatus.craPercentage >= craStatus.targetPercentage
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {craStatus.craPercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Target</span>
            <span className="text-lg font-bold text-blue-400">
              {craStatus.targetPercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">LMI Deals</span>
            <span className="text-lg font-bold text-white">
              {craStatus.lmiDealsCount}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-800">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  craStatus.craPercentage >= craStatus.targetPercentage
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${craStatus.craPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {craStatus.craPercentage >= craStatus.targetPercentage
                ? "Meeting CRA requirements"
                : `Need ${craStatus.targetPercentage - craStatus.craPercentage}% more CRA-eligible investment`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Investment by State
        </h3>
        {portfolio.byState.length > 0 ? (
          <div className="space-y-3">
            {portfolio.byState.map((item) => (
              <div
                key={item.state}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-400">{item.state}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-white w-16 text-right">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No state data yet.
          </p>
        )}
      </div>
    </div>
  );
}

function PortfolioTab({
  portfolio,
  hasData,
}: {
  portfolio: PortfolioStats;
  hasData: boolean;
}) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    return `$${(num / 1_000).toFixed(0)}K`;
  };

  if (!hasData) {
    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-12 text-center">
        <PieChart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No portfolio data yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Your portfolio breakdown will appear as you commit to deals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-400" />
          Investment by Credit Type
        </h3>
        {portfolio.byCreditType.length > 0 ? (
          <div className="space-y-3">
            {portfolio.byCreditType.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      item.type === "NMTC"
                        ? "bg-emerald-600 text-white"
                        : item.type === "HTC"
                          ? "bg-blue-600 text-white"
                          : item.type === "LIHTC"
                            ? "bg-purple-600 text-white"
                            : item.type === "OZ"
                              ? "bg-amber-600 text-white"
                              : "bg-gray-600 text-white"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.type === "NMTC"
                          ? "bg-emerald-500"
                          : item.type === "HTC"
                            ? "bg-blue-500"
                            : item.type === "LIHTC"
                              ? "bg-purple-500"
                              : item.type === "OZ"
                                ? "bg-amber-500"
                                : "bg-gray-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-white w-20 text-right">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No credit type data yet.
          </p>
        )}
      </div>

      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Credit Delivery Schedule
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Credits Received</span>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(portfolio.totalCredits)}
              </span>
            </div>
            {portfolio.totalCredits + portfolio.pendingCredits > 0 && (
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${(portfolio.totalCredits / (portfolio.totalCredits + portfolio.pendingCredits)) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Pending Credits</span>
              <span className="text-lg font-bold text-amber-400">
                {formatCurrency(portfolio.pendingCredits)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Expected within next 12 months
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvestableDealCard({
  deal,
  expanded,
  onToggle,
}: {
  deal: InvestableDeal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    return `$${(num / 1_000).toFixed(0)}K`;
  };

  // Intake tier styling (1=basic, 2=standard, 3=premium)
  const tierConfig: Record<
    number,
    { bg: string; text: string; border: string; label: string }
  > = {
    1: {
      bg: "bg-gray-800",
      text: "text-gray-400",
      border: "border-gray-600",
      label: "Tier 1",
    },
    2: {
      bg: "bg-amber-900/50",
      text: "text-amber-300",
      border: "border-amber-500/30",
      label: "Tier 2",
    },
    3: {
      bg: "bg-emerald-900/50",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      label: "Tier 3",
    },
  };

  const config = tierConfig[deal.intakeTier] || tierConfig[1];

  return (
    <div className="bg-gray-900/80 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {deal.programs.map((program) => (
                <span
                  key={program}
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    program === "NMTC"
                      ? "bg-emerald-600 text-white"
                      : program === "HTC"
                        ? "bg-blue-600 text-white"
                        : program === "LIHTC"
                          ? "bg-purple-600 text-white"
                          : program === "OZ"
                            ? "bg-amber-600 text-white"
                            : "bg-gray-600 text-white"
                  }`}
                >
                  {program}
                </span>
              ))}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
              >
                {config.label}
              </span>
              {deal.craEligible && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-900/50 text-teal-300 border border-teal-500/30">
                  CRA
                </span>
              )}
              <span className="text-xs text-gray-500">
                {deal.city}
                {deal.city && deal.state ? ", " : ""}
                {deal.state}
              </span>
            </div>
            <h4 className="text-base font-semibold text-white">
              {deal.projectName}
            </h4>
            <p className="text-xs text-gray-500">
              {deal.sponsorName}
              {deal.cdeName && ` \u2022 via ${deal.cdeName}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {formatCurrency(deal.allocation)}
              </p>
              <p className="text-xs text-gray-500">Allocation</p>
            </div>
            {deal.creditPrice > 0 && (
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">
                  ${deal.creditPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Credit Price</p>
              </div>
            )}
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
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Completeness</p>
              <p className="text-lg font-bold text-white">
                {deal.completeness}%
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Poverty Rate</p>
              <p className="text-lg font-bold text-white">
                {deal.povertyRate ? `${deal.povertyRate}%` : "\u2014"}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">DD Complete</p>
              <p className="text-lg font-bold text-white">
                {deal.ddCompletion || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/deals/${deal.id}`}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors text-center"
            >
              View Details
            </Link>
            <Link
              href={`/deals/${deal.id}?action=interest`}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors text-center"
            >
              Express Interest
            </Link>
            <Link
              href={`/deals/${deal.id}/dd-vault`}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
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
  deal: InvestableDeal;
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
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    program === "NMTC"
                      ? "bg-emerald-600 text-white"
                      : program === "HTC"
                        ? "bg-blue-600 text-white"
                        : program === "LIHTC"
                          ? "bg-purple-600 text-white"
                          : program === "OZ"
                            ? "bg-amber-600 text-white"
                            : "bg-gray-600 text-white"
                  }`}
                >
                  {program}
                </span>
              ))}
              {deal.craEligible && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-900/50 text-teal-300 border border-teal-500/30">
                  CRA
                </span>
              )}
              <span className="text-xs text-gray-500">
                {deal.city}
                {deal.city && deal.state ? ", " : ""}
                {deal.state}
              </span>
            </div>
            <h4 className="text-base font-semibold text-white">
              {deal.projectName}
            </h4>
            <p className="text-xs text-gray-500">
              {deal.sponsorName} \u2022 {formatCurrency(deal.allocation)}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
