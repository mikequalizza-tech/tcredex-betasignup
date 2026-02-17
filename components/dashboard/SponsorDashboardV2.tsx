"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  ChevronRight,
  Target,
  Briefcase,
  ChevronDown,
  ChevronUp,
  DollarSign,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { fetchApi } from "@/lib/api/fetch-utils";
import { calculateReadiness } from "@/lib/intake/readinessScore";
import MatchRequestSlotsWidget from "./widgets/MatchRequestSlots";
import DDVaultSummaryWidget from "./widgets/DDVaultSummary";
import NotificationsWidget from "./widgets/NotificationsWidget";
import IncomingOffersWidget from "./widgets/IncomingOffersWidget";
import DealStatusTimeline, {
  mapDealStatusToStage,
  type DealStage,
} from "./widgets/DealStatusTimeline";

/**
 * Enhanced Sponsor Dashboard (V2)
 *
 * Command center for project tracking with:
 * - 3-Request Limit slots widget
 * - DD Vault status per deal
 * - 6-stage deal timeline
 * - Match management
 */

interface DealSummary {
  id: string;
  projectName: string;
  programs: ("NMTC" | "HTC" | "LIHTC")[];
  allocation: number;
  status: string;
  stage: DealStage;
  readinessScore: number;
  city?: string;
  state?: string;
  intakeTier?: number; // 1 = DealCard Ready, 2 = Profile Ready, 3 = DD Ready
  ddCompletion?: number;
  matchCount?: {
    cde: number;
    investor: number;
  };
  timestamps?: {
    submitted?: string;
    scoring?: string;
    in_market?: string;
    matched?: string;
    closing?: string;
    closed?: string;
  };
}

interface DashboardStats {
  totalDeals: number;
  totalBasis: number; // Changed from totalAllocation - basis is what fees are paid on
  inClosing: number;
  matched: number;
  tierCounts: {
    tier1: number; // DealCard Ready (>=25%)
    tier2: number; // Profile Ready (>=55%)
    tier3: number; // DD Ready (>=80%)
  };
}

interface SponsorDashboardV2Props {
  userName: string;
  orgName: string;
  sponsorId?: string;
  organizationId?: string;
}

export default function SponsorDashboardV2({
  userName,
  orgName,
  sponsorId,
  organizationId,
}: SponsorDashboardV2Props) {
  const [stats, setStats] = useState<DashboardStats>({
    totalDeals: 0,
    totalBasis: 0,
    inClosing: 0,
    matched: 0,
    tierCounts: { tier1: 0, tier2: 0, tier3: 0 },
  });
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadDashboardData only depends on organizationId which is already in deps
  }, [organizationId]);

  async function loadDashboardData() {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchApi<{ deals: Record<string, unknown>[] }>(
        `/api/deals/by-organization?orgId=${organizationId}`,
      );

      if (result.success && result.data?.deals) {
        const mappedDeals: DealSummary[] = result.data.deals.map(
          (deal: Record<string, unknown>) => {
            // Calculate readiness score dynamically using same algorithm as Deal Page
            const draftData = (deal.draft_data ||
              deal.draftData ||
              {}) as Record<string, unknown>;
            const intakeData = (deal.intake_data || {}) as Record<
              string,
              unknown
            >;
            const mergedData = { ...draftData, ...intakeData };
            let computedReadiness = 0;
            try {
              const result = calculateReadiness(mergedData);
              computedReadiness = result?.percentage || 0;
            } catch {
              computedReadiness = (deal.readiness_score as number) || 0; // Fallback to stored value
            }

            // Calculate basis per program type (matches /api/dashboard/stats logic)
            const programs = (deal.programs as string[]) || [
              (deal.programType as string) ||
                (deal.program_type as string) ||
                "NMTC",
            ];
            let dealBasis = 0;
            if (programs.includes("NMTC")) {
              dealBasis += Number(deal.nmtc_financing_requested) || 0;
              dealBasis += Number(deal.state_nmtc_allocation) || 0;
            }
            if (programs.includes("HTC")) {
              dealBasis += Number(deal.htc_amount) || 0;
            }
            if (programs.includes("OZ")) {
              dealBasis += Number(deal.oz_investment) || 0;
            }
            if (programs.includes("LIHTC")) {
              dealBasis += Number(deal.lihtc_basis) || 0;
            }

            const matchCount = deal.match_count as
              | Record<string, unknown>
              | undefined;

            return {
              id: deal.id as string,
              projectName:
                (deal.projectName as string) ||
                (deal.project_name as string) ||
                "Untitled Project",
              programs: programs as ("NMTC" | "HTC" | "LIHTC")[],
              allocation:
                dealBasis ||
                Number(deal.allocation) ||
                Number(deal.qei_amount) ||
                0,
              status: deal.status as string,
              stage: mapDealStatusToStage(deal.status as string),
              readinessScore: computedReadiness,
              city: deal.city as string | undefined,
              state: deal.state as string | undefined,
              intakeTier: deal.tier
                ? Number(deal.tier)
                : computedReadiness >= 80
                  ? 3
                  : computedReadiness >= 55
                    ? 2
                    : computedReadiness >= 25
                      ? 1
                      : 0,
              ddCompletion: deal.dd_completion as number | undefined,
              matchCount: {
                cde: (matchCount?.cde as number) || 0,
                investor: (matchCount?.investor as number) || 0,
              },
              timestamps: {
                submitted: deal.submitted_at as string | undefined,
                matched: deal.matched_at as string | undefined,
                closing: deal.closing_at as string | undefined,
                closed: deal.closed_at as string | undefined,
              },
            };
          },
        );

        setDeals(mappedDeals);
        setStats({
          totalDeals: mappedDeals.length,
          totalBasis: mappedDeals.reduce((sum, d) => sum + d.allocation, 0), // Now uses program-aware basis
          inClosing: mappedDeals.filter((d) => d.stage === "closing").length,
          matched: mappedDeals.filter((d) =>
            ["matched", "closing", "closed"].includes(d.stage),
          ).length,
          tierCounts: {
            tier1: mappedDeals.filter((d) => d.intakeTier === 1).length,
            tier2: mappedDeals.filter((d) => d.intakeTier === 2).length,
            tier3: mappedDeals.filter((d) => d.intakeTier === 3).length,
          },
        });

        // Auto-expand first deal
        if (mappedDeals.length > 0) {
          setExpandedDeal(mappedDeals[0].id);
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur rounded-xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {userName.split(" ")[0]}!
          </h1>
          <p className="text-indigo-200 text-sm">
            {orgName} • Project Command Center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/deals/new"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-lg text-sm font-medium transition-colors border border-white/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
          <Link
            href="/map"
            className="px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Check Eligibility
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Active Projects"
          value={stats.totalDeals}
          icon={Building2}
          color="indigo"
        />
        <StatCard
          label="Total Basis"
          value={formatCurrency(stats.totalBasis)}
          icon={DollarSign}
          color="emerald"
        />
        {/* Tier Breakdown Card */}
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Intake Tiers
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm">
                  <span className="text-green-400 font-bold">
                    {stats.tierCounts.tier3}
                  </span>
                  <span className="text-gray-500 text-xs ml-0.5">DD Ready</span>
                </span>
                <span className="text-sm">
                  <span className="text-amber-400 font-bold">
                    {stats.tierCounts.tier2}
                  </span>
                  <span className="text-gray-500 text-xs ml-0.5">Profile</span>
                </span>
                <span className="text-sm">
                  <span className="text-blue-400 font-bold">
                    {stats.tierCounts.tier1}
                  </span>
                  <span className="text-gray-500 text-xs ml-0.5">Basic</span>
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-600/20 text-purple-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>
        <StatCard
          label="Matched"
          value={stats.matched}
          icon={Users}
          color="blue"
        />
        <StatCard
          label="In Closing"
          value={stats.inClosing}
          icon={Briefcase}
          color="teal"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Deals Pipeline (2 cols) */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Active Pipeline
            </h2>
            <Link
              href="/dashboard/pipeline"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deals.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  expanded={expandedDeal === deal.id}
                  onToggle={() =>
                    setExpandedDeal(expandedDeal === deal.id ? null : deal.id)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-4">
          {/* Incoming Offers - LOIs and Commitments */}
          <IncomingOffersWidget organizationId={organizationId} />

          {/* Match Request Slots */}
          {sponsorId && <MatchRequestSlotsWidget sponsorId={sponsorId} />}

          {/* DD Vault for First Deal */}
          {deals.length > 0 && (
            <DDVaultSummaryWidget
              dealId={deals[0].id}
              dealName={deals[0].projectName}
            />
          )}

          {/* Notifications */}
          <NotificationsWidget />
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: "indigo" | "emerald" | "purple" | "blue" | "teal";
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    indigo: "bg-indigo-600/20 text-indigo-400",
    emerald: "bg-emerald-600/20 text-emerald-400",
    purple: "bg-purple-600/20 text-purple-400",
    blue: "bg-blue-600/20 text-blue-400",
    teal: "bg-teal-600/20 text-teal-400",
  };

  const valueColors = {
    indigo: "text-white",
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
    teal: "text-teal-400",
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${valueColors[color]}`}>
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

interface DealCardProps {
  deal: DealSummary;
  expanded: boolean;
  onToggle: () => void;
}

function DealCard({ deal, expanded, onToggle }: DealCardProps) {
  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const tierConfig: Record<number, { classes: string; label: string }> = {
    3: {
      classes: "bg-emerald-900/50 text-emerald-300 border-emerald-500/30",
      label: "Tier 3 — DD Ready",
    },
    2: {
      classes: "bg-amber-900/50 text-amber-300 border-amber-500/30",
      label: "Tier 2 — Profile",
    },
    1: {
      classes: "bg-blue-900/50 text-blue-300 border-blue-500/30",
      label: "Tier 1 — Basic",
    },
    0: {
      classes: "bg-gray-800 text-gray-400 border-gray-600",
      label: "Not Listed",
    },
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 hover:border-purple-500/30 transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between mb-4">
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
              {deal.intakeTier != null && deal.intakeTier > 0 && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${tierConfig[deal.intakeTier]?.classes || tierConfig[0].classes}`}
                >
                  {tierConfig[deal.intakeTier]?.label ||
                    `Tier ${deal.intakeTier}`}
                </span>
              )}
              <span className="text-gray-500 text-xs">
                {deal.city}, {deal.state}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">
              {deal.projectName}
            </h3>
            <p className="text-sm text-gray-400">
              {formatCurrency(deal.allocation)} QEI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ReadinessGauge score={deal.readinessScore} size={60} />
            <button className="text-gray-400 hover:text-white transition-colors">
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <DealStatusTimeline
          currentStage={deal.stage}
          timestamps={deal.timestamps}
          compact
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* DD Vault Mini */}
          <DDVaultSummaryWidget dealId={deal.id} />

          {/* Match Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-500">CDE Interest</span>
              </div>
              <p className="text-lg font-bold text-white">
                {deal.matchCount?.cde || 0}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-500">Investor Interest</span>
              </div>
              <p className="text-lg font-bold text-white">
                {deal.matchCount?.investor || 0}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Link
              href={`/deals/${deal.id}`}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors text-center"
            >
              View Details
            </Link>
            <Link
              href={`/deals/${deal.id}/dd-vault`}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors text-center"
            >
              Manage DD
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadinessGauge({
  score,
  size = 60,
}: {
  score: number;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No Projects Yet</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
        Start by submitting your first project to find CDEs and investors for
        your tax credit deal.
      </p>
      <Link
        href="/deals/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
      >
        <Plus className="w-5 h-5" />
        Submit Your First Project
      </Link>
    </div>
  );
}
