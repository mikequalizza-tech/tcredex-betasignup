"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchInvestorBySlug, InvestorDetail } from "@/lib/supabase/investors";
import { useCurrentUser } from "@/lib/auth";

// Investor type labels
const INVESTOR_TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  insurance: "Insurance Company",
  corporate: "Corporate",
  foundation: "Foundation",
  fund: "Investment Fund",
  institutional: "Institutional Investor",
  family_office: "Family Office",
};

// Program colors
const PROGRAM_COLORS: Record<string, string> = {
  NMTC: "bg-emerald-900/30 text-emerald-300",
  HTC: "bg-blue-900/30 text-blue-300",
  LIHTC: "bg-purple-900/30 text-purple-300",
  OZ: "bg-amber-900/30 text-amber-300",
  Brownfield: "bg-teal-900/30 text-teal-300",
};

interface InvestorPageProps {
  params: Promise<{ slug: string }>;
}

export default function InvestorDetailPage({ params }: InvestorPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [investor, setInvestor] = useState<InvestorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading, orgType } = useCurrentUser();

  useEffect(() => {
    async function loadInvestor() {
      setLoading(true);
      try {
        const fetchedInvestor = await fetchInvestorBySlug(slug);
        setInvestor(fetchedInvestor);
      } catch (error) {
        console.error("Failed to load investor:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInvestor();
  }, [slug]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signin?redirect=/investor/${slug}`);
    }
  }, [isLoading, isAuthenticated, router, slug]);

  if (isLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading investor profile...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Investor Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            This investor profile is not available.
          </p>
          <Link
            href="/deals"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-950">
      {/* Page Header - Dark themed */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Marketplace
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-900/50 text-blue-300 border border-blue-500/30 rounded-full text-sm font-bold">
                  {INVESTOR_TYPE_LABELS[investor.investorType] ||
                    investor.investorType}
                </span>
                {investor.activelyInvesting ? (
                  <span className="px-3 py-1 bg-green-900/30 text-green-300 border border-green-500/30 rounded-full text-sm">
                    Actively Investing
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded-full text-sm">
                    Not Currently Active
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {investor.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {investor.programs.map((p) => (
                  <span
                    key={p}
                    className={`px-3 py-1 rounded-full text-sm ${PROGRAM_COLORS[p] || "bg-gray-700 text-gray-300"}`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {(orgType === "sponsor" || orgType === "cde") &&
              investor.activelyInvesting && (
                <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500">
                  Submit Opportunity
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <p className="text-gray-300 leading-relaxed">
                {investor.description || "No description available."}
              </p>
            </section>

            {investor.projectPreferences.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Investment Preferences
                </h2>
                <div className="flex flex-wrap gap-2">
                  {investor.projectPreferences.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {investor.geographicFocus.length > 0 && (
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Geographic Focus
                </h2>
                <p className="text-gray-400 text-sm mb-3">
                  {investor.focusType}
                </p>
                <div className="flex flex-wrap gap-2">
                  {investor.geographicFocus.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Investment Structure
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">CDE Partnership</p>
                  <p className="text-white font-medium">
                    {investor.requiresCDE ? "Required" : "Optional"}
                  </p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">
                    Direct Investment
                  </p>
                  <p className="text-white font-medium">
                    {investor.directInvestment ? "Available" : "Not Available"}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Track Record
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white">
                    {investor.dealsCompleted}
                  </p>
                  <p className="text-sm text-gray-400">Deals Completed</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-green-400">
                    ${(investor.totalInvested / 1000000).toFixed(0)}M
                  </p>
                  <p className="text-sm text-gray-400">Total Invested</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-white">
                    ${(investor.avgDealSize / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-400">Avg Deal Size</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Investment Summary
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Available Capital</span>
                  <span className="text-2xl font-bold text-blue-400">
                    ${(investor.availableCapital / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Total Capital</span>
                  <span className="text-xl font-bold text-white">
                    ${(investor.totalCapital / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Deal Range</span>
                  <span className="text-white">
                    ${(investor.minInvestment / 1000000).toFixed(0)}M - $
                    {(investor.maxInvestment / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-800">
                  <span className="text-gray-400">Target Return</span>
                  <span className="text-white">{investor.targetReturn}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Response Time</span>
                  <span className="text-white capitalize">
                    {investor.responseTime}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {(orgType === "sponsor" || orgType === "cde") &&
                  investor.activelyInvesting && (
                    <button className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg">
                      Submit Opportunity
                    </button>
                  )}
                {investor.website && (
                  <a
                    href={
                      investor.website.startsWith("http")
                        ? investor.website
                        : `https://${investor.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center rounded-lg"
                  >
                    Visit Website
                  </a>
                )}
              </div>

              {(investor.primaryContact || investor.contactEmail) && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">
                    Contact
                  </h4>
                  {investor.primaryContact && (
                    <p className="text-white font-medium">
                      {investor.primaryContact}
                    </p>
                  )}
                  {investor.contactEmail && (
                    <p className="text-gray-400 text-sm">
                      {investor.contactEmail}
                    </p>
                  )}
                  {investor.contactPhone && (
                    <p className="text-gray-400 text-sm">
                      {investor.contactPhone}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
