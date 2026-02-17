"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/lib/auth";

interface PortfolioDealRow {
  id: string;
  status: string;
  updated_at?: string;
  created_at?: string;
  allocation?: number;
  qei_amount?: number;
  investment_amount?: number;
  projectName?: string;
  project_name?: string;
  cde_name?: string;
  cdeName?: string;
  city?: string;
  state?: string;
  programType?: string;
  program_type?: string;
}

interface Investment {
  id: string;
  dealId: string;
  projectName: string;
  cdeName: string;
  city: string;
  state: string;
  programType: string;
  investmentAmount: number;
  qeiAmount: number;
  creditsClaimed: number;
  creditsRemaining: number;
  closingDate: string;
  complianceYear: number;
  status: "active" | "compliance" | "exited";
  irr?: number;
}

export default function PortfolioPage() {
  return (
    <ProtectedRoute>
      <PortfolioContent />
    </ProtectedRoute>
  );
}

function PortfolioContent() {
  const { orgName, organizationId, orgType } = useCurrentUser();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "compliance" | "exited"
  >("all");

  const loadPortfolio = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load pipeline deals for this organization (closed/committed deals = portfolio)
      const response = await fetch(
        `/api/deals/by-organization?orgId=${organizationId}&orgType=${orgType || "investor"}`,
        { credentials: "include" },
      );

      if (response.ok) {
        const data = await response.json();
        const deals = data.deals || [];

        // Transform closing/closed/matched deals into portfolio investments
        const portfolioInvestments: Investment[] = deals
          .filter((d: PortfolioDealRow) =>
            ["closing", "closed", "matched"].includes(d.status),
          )
          .map((deal: PortfolioDealRow) => {
            const closingDate = deal.updated_at || deal.created_at;
            const closingYear = closingDate
              ? new Date(closingDate).getFullYear()
              : new Date().getFullYear();
            const currentYear = new Date().getFullYear();
            const yearsElapsed = currentYear - closingYear;

            // Determine compliance status based on deal status and age
            let status: "active" | "compliance" | "exited" = "active";
            if (deal.status === "closed" && yearsElapsed >= 7) {
              status = "exited";
            } else if (deal.status === "closed" && yearsElapsed >= 1) {
              status = "compliance";
            }

            const allocation =
              Number(deal.allocation) || Number(deal.qei_amount) || 0;
            // NMTC: 39% credit over 7 years (5% x 3 years + 6% x 4 years)
            const totalCredits = allocation * 0.39;
            const annualRates = [0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.06];
            let claimed = 0;
            for (let i = 0; i < Math.min(yearsElapsed, 7); i++) {
              claimed += allocation * annualRates[i];
            }

            return {
              id: deal.id,
              dealId: deal.id,
              projectName:
                deal.projectName || deal.project_name || "Untitled Project",
              cdeName: deal.cde_name || deal.cdeName || "TBD",
              city: deal.city || "",
              state: deal.state || "",
              programType: deal.programType || deal.program_type || "NMTC",
              investmentAmount:
                Number(deal.investment_amount) || allocation * 0.25,
              qeiAmount: allocation,
              creditsClaimed: Math.round(claimed),
              creditsRemaining: Math.round(Math.max(0, totalCredits - claimed)),
              closingDate: closingDate || new Date().toISOString(),
              complianceYear: Math.min(yearsElapsed, 7),
              status,
            };
          });

        setInvestments(portfolioInvestments);
      }
    } catch (error) {
      console.error("Failed to load portfolio:", error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, orgType]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  // Portfolio calculations
  const filteredInvestments =
    filterStatus === "all"
      ? investments
      : investments.filter((i) => i.status === filterStatus);

  const totalInvested = investments.reduce(
    (sum, i) => sum + i.investmentAmount,
    0,
  );
  const totalCredits = investments.reduce(
    (sum, i) => sum + i.creditsClaimed + i.creditsRemaining,
    0,
  );
  const creditsClaimed = investments.reduce(
    (sum, i) => sum + i.creditsClaimed,
    0,
  );
  const creditsRemaining = investments.reduce(
    (sum, i) => sum + i.creditsRemaining,
    0,
  );

  const activeCount = investments.filter((i) => i.status === "active").length;
  const complianceCount = investments.filter(
    (i) => i.status === "compliance",
  ).length;
  const exitedCount = investments.filter((i) => i.status === "exited").length;

  const getStatusBadge = (status: Investment["status"]) => {
    const styles = {
      active: "bg-green-900/50 text-green-400",
      compliance: "bg-yellow-900/50 text-yellow-400",
      exited: "bg-gray-800 text-gray-400",
    };
    const labels = {
      active: "Active",
      compliance: "In Compliance",
      exited: "Exited",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const hasData = investments.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Investment Portfolio
          </h1>
          <p className="text-gray-400 mt-1">{orgName || "Your Organization"}</p>
        </div>
        <Link
          href="/deals"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
        >
          Browse New Opportunities
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No portfolio investments yet
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Your portfolio will populate as deals progress through closing.
            Browse the marketplace to find opportunities.
          </p>
          <Link
            href="/deals"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="text-sm text-gray-400 mb-1">Total Invested</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalInvested)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="text-sm text-gray-400 mb-1">Total Credits</div>
              <div className="text-2xl font-bold text-indigo-400">
                {formatCurrency(totalCredits)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="text-sm text-gray-400 mb-1">Credits Claimed</div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(creditsClaimed)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="text-sm text-gray-400 mb-1">
                Credits Remaining
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatCurrency(creditsRemaining)}
              </div>
            </div>
          </div>

          {/* Credit Progress */}
          {totalCredits > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">
                  Credit Utilization
                </h2>
                <span className="text-sm text-gray-400">
                  {((creditsClaimed / totalCredits) * 100).toFixed(0)}% claimed
                </span>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${(creditsClaimed / totalCredits) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-emerald-400">
                  Claimed: {formatCurrency(creditsClaimed)}
                </span>
                <span className="text-amber-400">
                  Remaining: {formatCurrency(creditsRemaining)}
                </span>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              All ({investments.length})
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterStatus("compliance")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "compliance"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              In Compliance ({complianceCount})
            </button>
            <button
              onClick={() => setFilterStatus("exited")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === "exited"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Exited ({exitedCount})
            </button>
          </div>

          {/* Investments Table */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    CDE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Investment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredInvestments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No investments match this filter
                    </td>
                  </tr>
                ) : (
                  filteredInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-100">
                            {inv.projectName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {inv.city}, {inv.state}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-300 text-sm">
                        {inv.cdeName}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inv.programType === "NMTC"
                              ? "bg-indigo-900/50 text-indigo-400"
                              : inv.programType === "HTC"
                                ? "bg-amber-900/50 text-amber-400"
                                : inv.programType === "LIHTC"
                                  ? "bg-green-900/50 text-green-400"
                                  : inv.programType === "OZ"
                                    ? "bg-purple-900/50 text-purple-400"
                                    : "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {inv.programType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-100">
                          {formatCurrency(inv.investmentAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm text-emerald-400">
                            {formatCurrency(inv.creditsClaimed)} claimed
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(inv.creditsRemaining)} remaining
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        Year {inv.complianceYear}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setSelectedInvestment(inv)}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Investment Detail Modal */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedInvestment(null)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedInvestment.projectName}
                </h3>
                <p className="text-gray-400">
                  {selectedInvestment.cdeName}{" "}
                  {selectedInvestment.city && selectedInvestment.state
                    ? `\u2022 ${selectedInvestment.city}, ${selectedInvestment.state}`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvestment(null)}
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

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Investment</div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(selectedInvestment.investmentAmount)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Total Credits</div>
                <div className="text-xl font-bold text-indigo-400">
                  {formatCurrency(
                    selectedInvestment.creditsClaimed +
                      selectedInvestment.creditsRemaining,
                  )}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Program</div>
                <div className="text-xl font-bold text-purple-400">
                  {selectedInvestment.programType}
                </div>
              </div>
            </div>

            {/* Credit Schedule */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Credit Claim Schedule
              </h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((year) => {
                  const yearCredits =
                    (selectedInvestment.creditsClaimed +
                      selectedInvestment.creditsRemaining) /
                    7;
                  const isClaimed = year <= selectedInvestment.complianceYear;
                  return (
                    <div key={year} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isClaimed
                            ? "bg-emerald-900/50 text-emerald-400"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {year}
                      </div>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isClaimed ? "bg-emerald-500" : "bg-gray-700"}`}
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div
                        className={`text-sm ${isClaimed ? "text-emerald-400" : "text-gray-500"}`}
                      >
                        {formatCurrency(yearCredits)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Closing Date</span>
                <p className="text-gray-200">
                  {new Date(
                    selectedInvestment.closingDate,
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Compliance Year</span>
                <p className="text-gray-200">
                  Year {selectedInvestment.complianceYear} of 7
                </p>
              </div>
              <div>
                <span className="text-gray-500">QEI Amount</span>
                <p className="text-gray-200">
                  {formatCurrency(selectedInvestment.qeiAmount)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Status</span>
                <p className="mt-1">
                  {getStatusBadge(selectedInvestment.status)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Link
                href={`/deals/${selectedInvestment.dealId}`}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-center"
              >
                View Deal
              </Link>
              <Link
                href={`/deals/${selectedInvestment.dealId}/dd-vault`}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-center"
              >
                DD Vault
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
