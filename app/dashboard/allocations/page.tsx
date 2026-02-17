"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  fetchCDEAllocations,
  fetchCDECriteria,
  fetchCDEPipelineDeals,
} from "@/lib/supabase/queries";

// Types for CDE Allocation Management
interface AllocationSource {
  id: string;
  name: string;
  source: "federal" | "state";
  roundYear: string;
  stateProgram?: string;
  totalAmount: number;
  deployedAmount: number;
  availableAmount: number;
  deploymentDeadline: string;
  status: "active" | "fully_deployed" | "expiring_soon";
  commitments: {
    nonMetroMinPercent: number;
    nonMetroCurrentPercent: number;
    ruralCDEStatus: boolean;
    severelyDistressedTarget?: number;
  };
}

interface InvestmentCriteria {
  serviceArea: {
    type: "national" | "multi_state" | "single_state" | "local";
    states: string[];
  };
  dealSize: {
    minQEI: number;
    maxQEI: number;
  };
  prioritySectors: string[];
  impactRequirements: {
    minJobsPerMillion: number;
    bipocOwnershipPreferred: boolean;
    mbeSpendingRequired: boolean;
  };
  tractPreferences: {
    severelyDistressedRequired: boolean;
    qctRequired: boolean;
    minPovertyRate?: number;
  };
}

interface PipelineDeal {
  id: string;
  projectName: string;
  sponsorName: string;
  city: string;
  state: string;
  requestedQEI: number;
  matchScore: number;
  status: "new" | "reviewing" | "approved" | "declined";
  submittedDate: string;
  tractType: string[];
}

// No demo data — all data fetched from Supabase

export default function AllocationsPage() {
  const { orgType } = useCurrentUser();
  return (
    <ProtectedRoute allowedOrgTypes={["cde", "sponsor"]}>
      {orgType === "sponsor" ? (
        <SponsorFillTheGap />
      ) : (
        <CDEAllocationsContent />
      )}
    </ProtectedRoute>
  );
}

// =============================================================================
// SPONSOR: Deals Capital Stack — Capital Stack + Tax Credit Benefit Calculator
// =============================================================================

interface SponsorDeal {
  id: string;
  projectName: string;
  city: string;
  state: string;
  programs: string[];
  status: string;
  totalProjectCost: number;
  nmtcFinancingRequested: number;
  financingGap: number;
  sources: Array<{ name: string; amount: number }>;
  uses: Array<{ name: string; amount: number }>;
  cdeRequests: number;
  investorRequests: number;
}

const NMTC_DEFAULT_PRICING = 0.75; // $0.75 per $1 of credit
const LIHTC_BASIC_RATE = 0.09; // 9% annual for new construction (simplified)
const LIHTC_BOOST_MULTIPLIER = 1.3; // 30% boost for DDAs/QCTs
const LIHTC_CREDIT_PERIOD = 10; // 10-year credit period
const HTC_CREDIT_RATE = 0.2; // 20% of qualified rehabilitation expenditures
const HTC_DEFAULT_PRICING = 0.8; // $0.80 per $1 of credit

function SponsorFillTheGap() {
  const { orgName, organizationId } = useCurrentUser();
  const [deals, setDeals] = useState<SponsorDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [investorPricing, setInvestorPricing] = useState(NMTC_DEFAULT_PRICING);

  useEffect(() => {
    async function loadDeals() {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/deals/by-organization?orgId=${organizationId}&orgType=sponsor`,
          { credentials: "include" },
        );
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDeals = (json.deals || []) as Array<Record<string, any>>;

        const mapped: SponsorDeal[] = rawDeals
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((d: Record<string, any>) => d.status !== "withdrawn")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((d: Record<string, any>) => {
            const intake = d.intake_data || {};
            const totalCost = Number(
              intake.totalProjectCost || d.total_project_cost || 0,
            );
            const nmtcReq = Number(
              intake.nmtcFinancingRequested || d.nmtc_financing_requested || 0,
            );
            const gap =
              Number(intake.financingGap || d.financing_gap || 0) ||
              (nmtcReq > 0 ? nmtcReq : totalCost * 0.2);

            // Extract sources
            const sources: Array<{ name: string; amount: number }> = [];
            if (intake.financingSources) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              intake.financingSources.forEach((s: any) => {
                if (s.source && s.amount)
                  sources.push({ name: s.source, amount: Number(s.amount) });
              });
            } else {
              if (intake.equityAmount)
                sources.push({
                  name: "Equity",
                  amount: Number(intake.equityAmount),
                });
              if (intake.debtAmount)
                sources.push({
                  name: "Debt",
                  amount: Number(intake.debtAmount),
                });
              if (intake.grantAmount)
                sources.push({
                  name: "Grants",
                  amount: Number(intake.grantAmount),
                });
            }
            if (nmtcReq > 0)
              sources.push({
                name: "NMTC Equity (Requested)",
                amount: nmtcReq,
              });

            // Extract uses
            const uses: Array<{ name: string; amount: number }> = [];
            if (intake.landCost)
              uses.push({ name: "Land", amount: Number(intake.landCost) });
            if (intake.acquisitionCost)
              uses.push({
                name: "Acquisition",
                amount: Number(intake.acquisitionCost),
              });
            if (intake.constructionCost)
              uses.push({
                name: "Construction",
                amount: Number(intake.constructionCost),
              });
            if (intake.softCosts)
              uses.push({
                name: "Soft Costs",
                amount: Number(intake.softCosts),
              });
            if (intake.developerFee)
              uses.push({
                name: "Developer Fee",
                amount: Number(intake.developerFee),
              });
            if (intake.contingency)
              uses.push({
                name: "Contingency",
                amount: Number(intake.contingency),
              });

            return {
              id: d.id,
              projectName: d.project_name || "Untitled",
              city: d.city || intake.city || "",
              state: d.state || intake.state || "",
              programs: d.programs || [],
              status: d.status || "draft",
              totalProjectCost: totalCost,
              nmtcFinancingRequested: nmtcReq,
              financingGap: gap,
              sources,
              uses,
              cdeRequests: 0,
              investorRequests: 0,
            };
          });

        setDeals(mapped);
        if (mapped.length > 0) setSelectedDeal(mapped[0].id);
      } catch (err) {
        console.error("Failed to load deals:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDeals();
  }, [organizationId]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const deal = deals.find((d) => d.id === selectedDeal);
  const isNMTC = deal?.programs.some((p) => p.toUpperCase().includes("NMTC"));
  const isLIHTC = deal?.programs.some((p) => p.toUpperCase().includes("LIHTC"));
  const isHTC = deal?.programs.some(
    (p) =>
      p.toUpperCase().includes("HTC") || p.toUpperCase().includes("HISTORIC"),
  );

  // NMTC benefit: Allocation × Investor Pricing = Gross Benefit
  const nmtcAllocation =
    deal?.nmtcFinancingRequested || deal?.financingGap || 0;
  const nmtcGrossBenefit = nmtcAllocation * investorPricing;

  // LIHTC benefit: Basic + Boost
  const lihtcBasis = deal?.totalProjectCost || 0;
  const lihtcBasicCredit = lihtcBasis * LIHTC_BASIC_RATE * LIHTC_CREDIT_PERIOD;
  const lihtcBoostedCredit =
    lihtcBasis *
    LIHTC_BASIC_RATE *
    LIHTC_BOOST_MULTIPLIER *
    LIHTC_CREDIT_PERIOD;

  // HTC benefit: 20% of QRE basis × Investor Pricing ($0.80)
  const htcBasis = deal?.totalProjectCost || 0;
  const htcCredits = htcBasis * HTC_CREDIT_RATE;
  const htcGrossBenefit = htcCredits * HTC_DEFAULT_PRICING;

  const totalSourced = deal?.sources.reduce((s, src) => s + src.amount, 0) || 0;
  const totalUses = deal?.uses.reduce((s, u) => s + u.amount, 0) || 0;
  const gap =
    deal?.financingGap || (deal?.totalProjectCost || 0) - totalSourced;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Projects...</p>
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Deals Capital Stack
        </h1>
        <p className="text-gray-400 mb-6">
          Tax credit benefit calculator for your projects
        </p>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-gray-400 mb-4">
            No projects found. Submit a deal to see your financing gap analysis.
          </p>
          <Link
            href="/intake"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium"
          >
            Start New Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Deals Capital Stack
          </h1>
          <p className="text-gray-400 mt-1">
            {orgName || "Your Organization"} — Tax Credit Benefit Analysis
          </p>
        </div>
        <Link
          href="/intake"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium"
        >
          + New Project
        </Link>
      </div>

      {/* Deal Selector */}
      {deals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {deals.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDeal(d.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                d.id === selectedDeal
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {d.projectName}
            </button>
          ))}
        </div>
      )}

      {deal && (
        <>
          {/* Gap Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">
                Total Project Cost
              </p>
              <p className="text-xl font-bold text-gray-100">
                {formatCurrency(deal.totalProjectCost)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-500 uppercase mb-1">
                Sourced Capital
              </p>
              <p className="text-xl font-bold text-emerald-400">
                {formatCurrency(totalSourced)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-amber-700/50 p-5">
              <p className="text-xs text-amber-400 uppercase mb-1">
                Financing Gap
              </p>
              <p className="text-xl font-bold text-amber-400">
                {formatCurrency(gap)}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-indigo-700/50 p-5">
              <p className="text-xs text-indigo-400 uppercase mb-1">
                Tax Credit Request
              </p>
              <p className="text-xl font-bold text-indigo-400">
                {formatCurrency(nmtcAllocation)}
              </p>
            </div>
          </div>

          {/* Gap Progress Bar */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Capital Stack Coverage</span>
              <span className="text-gray-300">
                {deal.totalProjectCost > 0
                  ? Math.round((totalSourced / deal.totalProjectCost) * 100)
                  : 0}
                % funded
              </span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
              {totalSourced > 0 && (
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${Math.min((totalSourced / (deal.totalProjectCost || 1)) * 100, 100)}%`,
                  }}
                  title={`Sourced: ${formatCurrency(totalSourced)}`}
                />
              )}
              {nmtcAllocation > 0 && (
                <div
                  className="h-full bg-indigo-500/60"
                  style={{
                    width: `${Math.min((nmtcAllocation / (deal.totalProjectCost || 1)) * 100, 100 - (totalSourced / (deal.totalProjectCost || 1)) * 100)}%`,
                  }}
                  title={`Tax Credit Request: ${formatCurrency(nmtcAllocation)}`}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sourced
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Tax
                Credit Request
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-700" /> Unfunded
              </span>
            </div>
          </div>

          {/* Sources & Uses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sources */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Sources
              </h3>
              {deal.sources.length > 0 ? (
                <div className="space-y-3">
                  {deal.sources.map((src, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-300">{src.name}</span>
                      <span className="font-medium text-gray-100">
                        {formatCurrency(src.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-200">
                      Total Sources
                    </span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(totalSourced)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No sources entered yet. Update your project intake form.
                </p>
              )}
            </div>

            {/* Uses */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Uses</h3>
              {deal.uses.length > 0 ? (
                <div className="space-y-3">
                  {deal.uses.map((use, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-300">{use.name}</span>
                      <span className="font-medium text-gray-100">
                        {formatCurrency(use.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-700 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-200">
                      Total Uses
                    </span>
                    <span className="font-bold text-gray-100">
                      {formatCurrency(totalUses)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No cost breakdown entered yet. Update your project intake
                  form.
                </p>
              )}
            </div>
          </div>

          {/* Tax Credit Benefit Calculator */}
          <div className="bg-gray-900 rounded-xl border border-indigo-800/50 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Tax Credit Benefit Estimate
            </h3>

            {isNMTC && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs font-medium">
                    NMTC
                  </span>
                  <span className="text-sm text-gray-400">
                    New Markets Tax Credit
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      NMTC Allocation
                    </p>
                    <p className="text-lg font-bold text-gray-100">
                      {formatCurrency(nmtcAllocation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Investor Pricing
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-100">
                        ${investorPricing.toFixed(2)}
                      </span>
                      <input
                        type="range"
                        min="0.60"
                        max="0.85"
                        step="0.01"
                        value={investorPricing}
                        onChange={(e) =>
                          setInvestorPricing(parseFloat(e.target.value))
                        }
                        className="w-24 accent-indigo-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">per $1 of credit</p>
                  </div>
                  <div className="bg-indigo-900/20 rounded-lg p-3">
                    <p className="text-xs text-indigo-400 mb-1">
                      Gross Benefit
                    </p>
                    <p className="text-xl font-bold text-indigo-300">
                      {formatCurrency(nmtcGrossBenefit)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Formula: Allocation ({formatCurrency(nmtcAllocation)}) x
                  Investor Price (${investorPricing.toFixed(2)}) ={" "}
                  {formatCurrency(nmtcGrossBenefit)}
                </p>
              </div>
            )}

            {isLIHTC && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-purple-900/50 text-purple-400 rounded text-xs font-medium">
                    LIHTC
                  </span>
                  <span className="text-sm text-gray-400">
                    Low-Income Housing Tax Credit
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Eligible Basis</p>
                    <p className="text-lg font-bold text-gray-100">
                      {formatCurrency(lihtcBasis)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Basic (9% x 10yr)
                    </p>
                    <p className="text-lg font-bold text-gray-100">
                      {formatCurrency(lihtcBasicCredit)}
                    </p>
                  </div>
                  <div className="bg-purple-900/20 rounded-lg p-3">
                    <p className="text-xs text-purple-400 mb-1">
                      With 130% Boost
                    </p>
                    <p className="text-xl font-bold text-purple-300">
                      {formatCurrency(lihtcBoostedCredit)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Basic: {formatCurrency(lihtcBasis)} x 9% x 10 years ={" "}
                  {formatCurrency(lihtcBasicCredit)} | Boost (DDA/QCT): x 1.3 ={" "}
                  {formatCurrency(lihtcBoostedCredit)}
                </p>
              </div>
            )}

            {isHTC && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-amber-900/50 text-amber-400 rounded text-xs font-medium">
                    HTC
                  </span>
                  <span className="text-sm text-gray-400">
                    Historic Tax Credit
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      QRE Basis (20%)
                    </p>
                    <p className="text-lg font-bold text-gray-100">
                      {formatCurrency(htcBasis)}
                    </p>
                    <p className="text-xs text-gray-500">
                      x 20% = {formatCurrency(htcCredits)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Investor Pricing
                    </p>
                    <p className="text-lg font-bold text-gray-100">
                      ${HTC_DEFAULT_PRICING.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">per $1 of credit</p>
                  </div>
                  <div className="bg-amber-900/20 rounded-lg p-3">
                    <p className="text-xs text-amber-400 mb-1">Gross Benefit</p>
                    <p className="text-xl font-bold text-amber-300">
                      {formatCurrency(htcGrossBenefit)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Formula: {formatCurrency(htcBasis)} basis x 20% ={" "}
                  {formatCurrency(htcCredits)} credits x $
                  {HTC_DEFAULT_PRICING.toFixed(2)} ={" "}
                  {formatCurrency(htcGrossBenefit)}
                </p>
              </div>
            )}

            {!isNMTC && !isLIHTC && !isHTC && (
              <p className="text-sm text-gray-500">
                Select a program (NMTC, LIHTC, or HTC) in your intake form to
                see benefit calculations.
              </p>
            )}
          </div>

          {/* Action: Browse CDEs / Request Allocation */}
          <div className="flex gap-4">
            <Link
              href={`/deals/${deal.id}`}
              className="flex-1 text-center px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              View Project Details
            </Link>
            <Link
              href={`/deals/${deal.id}#outreach`}
              className="flex-1 text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
            >
              Request CDE Allocation
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

const getMonthsUntilDeadline = (deadline: string) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return (
    (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
    deadlineDate.getMonth() -
    now.getMonth()
  );
};

function getDeadlineStatus(
  deadline?: string,
  available?: number,
): "active" | "fully_deployed" | "expiring_soon" {
  if (!available || available <= 0) return "fully_deployed";
  if (!deadline) return "active";
  const months = getMonthsUntilDeadline(deadline);
  if (months <= 6) return "expiring_soon";
  return "active";
}

function CDEAllocationsContent() {
  const { orgName, organizationId, orgType } = useCurrentUser();
  const [allocations, setAllocations] = useState<AllocationSource[]>([]);
  const [criteria, setCriteria] = useState<InvestmentCriteria | null>(null);
  const [pipeline, setPipeline] = useState<PipelineDeal[]>([]);
  const [showCriteriaEditor, setShowCriteriaEditor] = useState(false);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [newAllocType, setNewAllocType] = useState<"federal" | "state">(
    "federal",
  );
  const [newAllocYear, setNewAllocYear] = useState("");
  const [newAllocAmount, setNewAllocAmount] = useState("");
  const [newAllocDeadline, setNewAllocDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    async function loadData() {
      if (!organizationId || orgType !== "cde") {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch allocations
        const supabaseAllocations = await fetchCDEAllocations(organizationId);
        if (supabaseAllocations.length > 0) {
          // Transform Supabase data to component format
          const transformed: AllocationSource[] = supabaseAllocations.map(
            (alloc) => ({
              id: alloc.id,
              name: `${alloc.type === "federal" ? "Federal" : alloc.stateCode || "State"} ${alloc.year}`,
              source: alloc.type,
              roundYear: alloc.year,
              stateProgram: alloc.stateCode
                ? `${alloc.stateCode} NMTC`
                : undefined,
              totalAmount: alloc.awardedAmount,
              deployedAmount: alloc.deployedAmount,
              availableAmount: alloc.availableOnPlatform,
              deploymentDeadline: alloc.deploymentDeadline || "",
              status: getDeadlineStatus(
                alloc.deploymentDeadline,
                alloc.availableOnPlatform,
              ),
              commitments: {
                nonMetroMinPercent: 20, // Default values, would come from CDE preferences
                nonMetroCurrentPercent: 0,
                ruralCDEStatus: false,
                severelyDistressedTarget: 50,
              },
            }),
          );
          setAllocations(transformed);
        }

        // Fetch investment criteria
        const cdeCriteria = await fetchCDECriteria(organizationId);
        if (cdeCriteria) {
          setCriteria({
            serviceArea: {
              type:
                cdeCriteria.primaryStates.length > 3
                  ? "multi_state"
                  : cdeCriteria.primaryStates.length === 1
                    ? "single_state"
                    : "multi_state",
              states: cdeCriteria.primaryStates,
            },
            dealSize: {
              minQEI: cdeCriteria.minDealSize,
              maxQEI: cdeCriteria.maxDealSize,
            },
            prioritySectors: cdeCriteria.targetSectors,
            impactRequirements: {
              minJobsPerMillion: cdeCriteria.minJobsPerMillion || 28,
              bipocOwnershipPreferred: true,
              mbeSpendingRequired: false,
            },
            tractPreferences: {
              severelyDistressedRequired: cdeCriteria.requireSeverelyDistressed,
              qctRequired: true,
              minPovertyRate: 20,
            },
          });
        }

        // Fetch pipeline deals
        const pipelineDeals = await fetchCDEPipelineDeals(organizationId);
        if (pipelineDeals.length > 0) {
          const transformedPipeline: PipelineDeal[] = pipelineDeals.map(
            (deal) => ({
              id: deal.id,
              projectName: deal.projectName,
              sponsorName: deal.sponsorName,
              city: deal.city,
              state: deal.state,
              requestedQEI: deal.allocation,
              matchScore: 0, // Score calculated at runtime by AutoMatch, not stored on deal
              status: mapDealStatus(deal.status),
              submittedDate: deal.submittedDate,
              tractType: deal.tractType || [],
            }),
          );
          setPipeline(transformedPipeline);
        }
      } catch (error) {
        console.error("Error loading CDE data:", error);
        // State already initialized to empty arrays/null
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [organizationId, orgType]);

  // Map deal status to pipeline status
  function mapDealStatus(
    status: string,
  ): "new" | "reviewing" | "approved" | "declined" {
    switch (status) {
      case "submitted":
        return "new";
      case "under_review":
        return "reviewing";
      case "matched":
      case "closing":
      case "closed":
        return "approved";
      case "withdrawn":
        return "declined";
      default:
        return "new";
    }
  }

  // Calculations
  const totalAvailable = allocations.reduce(
    (sum, a) => sum + a.availableAmount,
    0,
  );
  const totalDeployed = allocations.reduce(
    (sum, a) => sum + a.deployedAmount,
    0,
  );
  const totalAllocation = allocations.reduce(
    (sum, a) => sum + a.totalAmount,
    0,
  );
  const deploymentPercent =
    totalAllocation > 0 ? (totalDeployed / totalAllocation) * 100 : 0;

  // Compliance alerts
  const complianceAlerts: string[] = [];
  allocations.forEach((alloc) => {
    if (
      alloc.commitments.nonMetroCurrentPercent <
      alloc.commitments.nonMetroMinPercent
    ) {
      complianceAlerts.push(
        `${alloc.name}: Non-metro at ${alloc.commitments.nonMetroCurrentPercent}% (need ${alloc.commitments.nonMetroMinPercent}%)`,
      );
    }
    if (alloc.status === "expiring_soon") {
      complianceAlerts.push(`${alloc.name}: Deployment deadline approaching!`);
    }
  });

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-yellow-400";
    if (score >= 70) return "text-orange-400";
    return "text-red-400";
  };

  const getStatusBadge = (status: PipelineDeal["status"]) => {
    const styles = {
      new: "bg-blue-900/50 text-blue-400",
      reviewing: "bg-yellow-900/50 text-yellow-400",
      approved: "bg-green-900/50 text-green-400",
      declined: "bg-red-900/50 text-red-400",
    };
    return styles[status];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Allocation Management
          </h1>
          <p className="text-gray-400 mt-1">{orgName || "Your Organization"}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCriteriaEditor(true)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Edit Investment Criteria
          </button>
          <button
            onClick={() => setShowAddAllocation(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            + Add Allocation
          </button>
        </div>
      </div>

      {/* Compliance Alerts */}
      {complianceAlerts.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0"
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
            <div>
              <h3 className="font-semibold text-amber-400">
                Compliance Attention Needed
              </h3>
              <ul className="mt-1 space-y-1">
                {complianceAlerts.map((alert, i) => (
                  <li key={i} className="text-sm text-amber-200/80">
                    • {alert}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">
            Allocation Overview
          </h2>
          <span className="text-sm text-gray-400">
            {allocations.length} active sources
          </span>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-400">Total Allocation</p>
            <p className="text-2xl font-bold text-gray-100">
              {formatCurrency(totalAllocation)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Deployed</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalDeployed)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Available</p>
            <p className="text-2xl font-bold text-indigo-400">
              {formatCurrency(totalAvailable)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Pipeline Requests</p>
            <p className="text-2xl font-bold text-purple-400">
              {formatCurrency(pipeline.reduce((s, p) => s + p.requestedQEI, 0))}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Deployment Progress</span>
            <span className="text-gray-300">
              {deploymentPercent.toFixed(0)}% deployed
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${deploymentPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Allocation Sources Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          Allocation Sources
        </h2>
        {allocations.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-400 mb-2">No allocation data found.</p>
            <p className="text-sm text-gray-500">
              Your NMTC allocation data from the CDFI Fund will appear here once
              imported. Click &quot;+ Add Allocation&quot; to add manually.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allocations.map((alloc) => {
              const monthsLeft = getMonthsUntilDeadline(
                alloc.deploymentDeadline,
              );
              const deployPercent =
                (alloc.deployedAmount / alloc.totalAmount) * 100;

              return (
                <div
                  key={alloc.id}
                  className={`bg-gray-900 rounded-xl border p-5 cursor-pointer transition-all hover:border-indigo-500 ${
                    alloc.status === "expiring_soon"
                      ? "border-amber-600"
                      : "border-gray-800"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-100">
                        {alloc.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {alloc.source === "federal"
                          ? "Federal NMTC"
                          : alloc.stateProgram}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alloc.status === "active"
                          ? "bg-green-900/50 text-green-400"
                          : alloc.status === "expiring_soon"
                            ? "bg-amber-900/50 text-amber-400"
                            : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {alloc.status === "expiring_soon"
                        ? "Urgent"
                        : alloc.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total</span>
                      <span className="text-gray-200 font-medium">
                        {formatCurrency(alloc.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Available</span>
                      <span className="text-indigo-400 font-medium">
                        {formatCurrency(alloc.availableAmount)}
                      </span>
                    </div>

                    {/* Mini progress */}
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${deployPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs pt-2 border-t border-gray-800">
                      <span className="text-gray-500">Deadline</span>
                      <span
                        className={`font-medium ${monthsLeft <= 6 ? "text-amber-400" : "text-gray-400"}`}
                      >
                        {monthsLeft} months left
                      </span>
                    </div>
                  </div>

                  {/* Compliance indicators */}
                  {alloc.commitments.nonMetroCurrentPercent <
                    alloc.commitments.nonMetroMinPercent && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-2 text-xs text-amber-400">
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
                            d="M12 9v2m0 4h.01"
                          />
                        </svg>
                        <span>
                          Non-metro: {alloc.commitments.nonMetroCurrentPercent}%
                          of {alloc.commitments.nonMetroMinPercent}% min
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Investment Criteria Summary */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">
            Investment Criteria
          </h2>
          <button
            onClick={() => setShowCriteriaEditor(true)}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Edit →
          </button>
        </div>

        {criteria ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">
                Service Area
              </p>
              <p className="text-gray-200 font-medium">
                {criteria.serviceArea.states.join(", ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Deal Size</p>
              <p className="text-gray-200 font-medium">
                {formatCurrency(criteria.dealSize.minQEI)} -{" "}
                {formatCurrency(criteria.dealSize.maxQEI)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">
                Priority Sectors
              </p>
              <div className="flex flex-wrap gap-1">
                {criteria.prioritySectors.slice(0, 3).map((sector) => (
                  <span
                    key={sector}
                    className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300"
                  >
                    {sector}
                  </span>
                ))}
                {criteria.prioritySectors.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                    +{criteria.prioritySectors.length - 3}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">
                Impact Requirements
              </p>
              <p className="text-gray-200 font-medium">
                {criteria.impactRequirements.minJobsPerMillion} jobs/$M
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No investment criteria configured yet. Click &quot;Edit&quot; to set
            your preferences.
          </p>
        )}
      </div>

      {/* Pipeline Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">
            Matched Pipeline
          </h2>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded-full text-xs font-medium">
              {pipeline.filter((p) => p.status === "new").length} new
            </span>
            <Link
              href="/deals"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              Browse Marketplace →
            </Link>
          </div>
        </div>

        {pipeline.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 mb-2">
              No projects in your pipeline yet.
            </p>
            <p className="text-sm text-gray-500">
              When sponsors send you outreach requests or deals are assigned to
              you, they will appear here.
            </p>
            <Link
              href="/deals"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    QEI Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Match Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Tract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {pipeline.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-100">
                          {deal.projectName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {deal.sponsorName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {deal.city}, {deal.state}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-100">
                        {formatCurrency(deal.requestedQEI)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-lg font-bold ${getScoreColor(deal.matchScore)}`}
                      >
                        {deal.matchScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {deal.tractType.map((tract) => (
                          <span
                            key={tract}
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              tract === "SD"
                                ? "bg-red-900/50 text-red-400"
                                : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {tract}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(deal.status)}`}
                      >
                        {deal.status.charAt(0).toUpperCase() +
                          deal.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Investment Criteria Editor Modal */}
      {showCriteriaEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCriteriaEditor(false)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-6">
              Edit Investment Criteria
            </h3>

            <div className="space-y-6">
              {/* Service Area */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Area Type
                </label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
                  <option value="national">National</option>
                  <option value="multi_state">Multi-State</option>
                  <option value="single_state">Single State</option>
                  <option value="local">Local (City/County)</option>
                </select>
              </div>

              {/* States */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target States
                </label>
                <div className="flex flex-wrap gap-2">
                  {["IL", "MO", "IN", "WI", "MI", "OH", "IA", "MN"].map(
                    (state) => (
                      <button
                        key={state}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          criteria?.serviceArea.states.includes(state)
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {state}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Deal Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum QEI
                  </label>
                  <input
                    type="text"
                    defaultValue="$2,000,000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum QEI
                  </label>
                  <input
                    type="text"
                    defaultValue="$15,000,000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>
              </div>

              {/* Priority Sectors */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority Sectors
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Healthcare",
                    "Manufacturing",
                    "Education",
                    "Community Facilities",
                    "Retail",
                    "Mixed-Use",
                    "Childcare",
                    "Workforce",
                  ].map((sector) => (
                    <button
                      key={sector}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        criteria?.prioritySectors.includes(sector)
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Impact Requirements
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Minimum jobs per $1M QEI
                    </span>
                    <input
                      type="number"
                      defaultValue={28}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      BIPOC ownership preferred
                    </span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">MBE spending required</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Tract Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tract Preferences
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      Severely Distressed required
                    </span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">QCT required</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Minimum poverty rate</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={20}
                        className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-100 text-right"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCriteriaEditor(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!organizationId || !criteria) return;
                  try {
                    const res = await fetch(`/api/cdes/${organizationId}`, {
                      method: "PATCH",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        target_sectors: criteria.prioritySectors,
                        min_deal_size: criteria.dealSize.minQEI,
                        max_deal_size: criteria.dealSize.maxQEI,
                        require_severely_distressed:
                          criteria.tractPreferences.severelyDistressedRequired,
                        require_qct: criteria.tractPreferences.qctRequired,
                      }),
                    });
                    if (!res.ok) throw new Error("Failed to save");
                    setShowCriteriaEditor(false);
                  } catch (err) {
                    console.error("Failed to save criteria:", err);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium"
              >
                Save Criteria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Allocation Modal */}
      {showAddAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowAddAllocation(false)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-lg mx-4 border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-6">
              Add Allocation Source
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source Type
                </label>
                <select
                  value={newAllocType}
                  onChange={(e) =>
                    setNewAllocType(e.target.value as "federal" | "state")
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                >
                  <option value="federal">Federal NMTC</option>
                  <option value="state">State NMTC Program</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Round / Year
                </label>
                <input
                  type="text"
                  value={newAllocYear}
                  onChange={(e) => setNewAllocYear(e.target.value)}
                  placeholder="e.g., 2025"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Allocation Amount
                </label>
                <input
                  type="number"
                  value={newAllocAmount}
                  onChange={(e) => setNewAllocAmount(e.target.value)}
                  placeholder="50000000"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deployment Deadline
                </label>
                <input
                  type="date"
                  value={newAllocDeadline}
                  onChange={(e) => setNewAllocDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAllocation(false)}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!organizationId || !newAllocYear || !newAllocAmount)
                    return;
                  try {
                    const res = await fetch(
                      `/api/cdes/${organizationId}/allocations`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: newAllocType,
                          year: newAllocYear,
                          awarded_amount: parseInt(newAllocAmount) || 0,
                          available_on_platform: parseInt(newAllocAmount) || 0,
                          deployment_deadline: newAllocDeadline || null,
                        }),
                      },
                    );
                    if (!res.ok) throw new Error("Failed to add allocation");
                    setShowAddAllocation(false);
                    setNewAllocType("federal");
                    setNewAllocYear("");
                    setNewAllocAmount("");
                    setNewAllocDeadline("");
                    // Reload allocations
                    const updated = await fetchCDEAllocations(organizationId);
                    if (updated.length > 0) {
                      setAllocations(
                        updated.map((alloc) => ({
                          id: alloc.id,
                          name: `${alloc.type === "federal" ? "Federal" : alloc.stateCode || "State"} ${alloc.year}`,
                          source: alloc.type,
                          roundYear: alloc.year,
                          stateProgram: alloc.stateCode
                            ? `${alloc.stateCode} NMTC`
                            : undefined,
                          totalAmount: alloc.awardedAmount,
                          deployedAmount: alloc.deployedAmount,
                          availableAmount: alloc.availableOnPlatform,
                          deploymentDeadline: alloc.deploymentDeadline || "",
                          status: getDeadlineStatus(
                            alloc.deploymentDeadline,
                            alloc.availableOnPlatform,
                          ),
                          commitments: {
                            nonMetroMinPercent: 20,
                            nonMetroCurrentPercent: 0,
                            ruralCDEStatus: false,
                            severelyDistressedTarget: 50,
                          },
                        })),
                      );
                    }
                  } catch (err) {
                    console.error("Failed to add allocation:", err);
                  }
                }}
                disabled={!newAllocYear || !newAllocAmount}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium disabled:bg-gray-700 disabled:text-gray-500"
              >
                Add Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
