"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCDEBySlug, CDEDetail } from "@/lib/supabase/queries";
import { useCurrentUser } from "@/lib/auth";
import { useBreadcrumbs } from "@/lib/context/BreadcrumbContext";

// Mission focus labels
const MISSION_LABELS: Record<string, string> = {
  healthcare: "Healthcare",
  education: "Education",
  community_facility: "Community Facilities",
  manufacturing: "Manufacturing",
  retail: "Retail",
  mixed_use: "Mixed Use",
  affordable_housing: "Affordable Housing",
  food_access: "Food Access",
  childcare: "Childcare",
  workforce: "Workforce Development",
};

// Format currency
const formatCurrency = (amount: number | undefined) => {
  if (!amount) return "N/A";
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

interface CDEPageProps {
  params: Promise<{ slug: string }>;
}

export default function CDEDetailPage({ params }: CDEPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [cde, setCDE] = useState<CDEDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    isAuthenticated,
    isLoading,
    orgType,
    organizationId,
    userName,
    orgName,
  } = useCurrentUser();
  const { setBreadcrumbs } = useBreadcrumbs();

  // Deal picker modal state (for Request Allocation)
  const [showDealPicker, setShowDealPicker] = useState(false);
  const [sponsorDeals, setSponsorDeals] = useState<
    Array<{
      id: string;
      project_name?: string;
      projectName?: string;
      city?: string;
      state?: string;
      programs?: string[];
      intake_data?: { city?: string; state?: string };
    }>
  >([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Email preview state
  const [previewStep, setPreviewStep] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewContactEmail, setPreviewContactEmail] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const allocations = (cde?.allocations ||
    (cde as unknown as Record<string, unknown>)?.cde_allocations ||
    []) as Array<{
    year?: string;
    type?: string;
    stateCode?: string;
    awardedAmount?: number;
    availableOnPlatform?: number;
    deployedAmount?: number;
    amount_remaining?: number;
    awarded_amount?: number;
    remaining?: number;
  }>;

  useEffect(() => {
    async function loadCDE() {
      setLoading(true);
      try {
        const fetchedCDE = await fetchCDEBySlug(slug);
        setCDE(fetchedCDE);
      } catch (error) {
        console.error("Failed to load CDE:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCDE();
  }, [slug]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signin?redirect=/cde/${slug}`);
    }
  }, [isLoading, isAuthenticated, router, slug]);

  // Set breadcrumbs with CDE name (instead of UUID slug)
  useEffect(() => {
    if (cde?.name) {
      setBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Marketplace", href: "/deals" },
        { label: cde.name },
      ]);
    }
    return () => setBreadcrumbs(null);
  }, [cde?.name, setBreadcrumbs]);

  // Open deal picker: fetch sponsor's deals (always refetch for fresh data)
  const handleRequestAllocation = useCallback(async () => {
    setShowDealPicker(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    setPreviewStep(false);
    setPreviewHtml("");
    setSelectedDeal(null);

    setDealsLoading(true);
    try {
      const res = await fetch("/api/deals/mine");
      if (res.ok) {
        const data = await res.json();
        setSponsorDeals(data.deals || data || []);
      }
    } catch {
      setSubmitError("Failed to load your deals");
    } finally {
      setDealsLoading(false);
    }
  }, []);

  // Preview email for selected deal (step between selection and sending)
  const handlePreviewDeal = useCallback(
    async (dealId: string, dealName: string) => {
      if (!cde || !organizationId) return;
      setSelectedDeal({ id: dealId, name: dealName });
      setPreviewStep(true);
      setPreviewLoading(true);
      setPreviewHtml("");
      setPreviewSubject("");
      setSubmitError(null);

      try {
        const res = await fetch(`/api/deals/${dealId}/outreach/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientOrgId: cde.organizationId || cde.id,
            senderOrgId: organizationId,
            senderName: userName,
            senderOrg: orgName,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error || "Failed to generate preview");
          setPreviewLoading(false);
          return;
        }

        setPreviewHtml(data.html);
        setPreviewSubject(data.subject);
        setPreviewContactEmail(data.contactEmail || "");
      } catch {
        setSubmitError("Failed to load preview");
      } finally {
        setPreviewLoading(false);
      }
    },
    [cde, organizationId, userName, orgName],
  );

  // Write preview HTML into the iframe once loaded
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    }
  }, [previewHtml]);

  // Submit outreach for selected deal (after preview confirmation)
  const handleSubmitDeal = useCallback(async () => {
    if (!cde || !organizationId || !selectedDeal) return;
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/deals/${selectedDeal.id}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: [cde.organizationId || cde.id],
          recipientType: "cde",
          message: `Requesting allocation from ${cde.name} for ${selectedDeal.name}.`,
          senderId: organizationId,
          senderOrgId: organizationId,
          senderName: userName,
          senderOrg: orgName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false || data.sent === 0) {
        setSubmitError(data.error || "Failed to submit");
      } else {
        setSubmitSuccess(true);
      }
    } catch {
      setSubmitError("Network error — please try again");
    } finally {
      setSubmitLoading(false);
    }
  }, [cde, organizationId, selectedDeal, userName, orgName]);

  if (isLoading || loading || !isAuthenticated) {
    return (
      <main className="grow flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-200/65">Loading CDE profile...</p>
        </div>
      </main>
    );
  }

  if (!cde) {
    return (
      <main className="grow flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="font-nacelle text-3xl font-semibold text-gray-200 mb-4">
            CDE Not Found
          </h1>
          <p className="text-indigo-200/65 mb-6">
            This CDE profile is not available.
          </p>
          <Link
            href="/deals"
            className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
          >
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 bg-gray-950">
        {/* Page Header - Dark themed */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
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
                  <span className="px-3 py-1 bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded-full text-sm font-bold">
                    CDE
                  </span>
                  <span className="px-3 py-1 bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 rounded-full text-sm font-medium">
                    {cde.allocationType}
                  </span>
                  {cde.acceptingApplications ? (
                    <span className="px-3 py-1 bg-green-900/30 text-green-300 border border-green-500/30 rounded-full text-sm">
                      Accepting Projects
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-800 text-gray-400 border border-gray-700 rounded-full text-sm">
                      Applications Closed
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {cde.name}
                </h1>
                <p className="text-gray-400">
                  {cde.headquartersCity}, {cde.headquartersState}
                </p>
                {cde.controllingEntity && (
                  <p className="text-sm text-gray-500 mt-1">
                    Controlled by: {cde.controllingEntity}
                  </p>
                )}
              </div>

              {orgType === "sponsor" && cde.acceptingApplications && (
                <button
                  onClick={handleRequestAllocation}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Request Allocation
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About / Mission Statement */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                <p className="text-gray-300 leading-relaxed">
                  {cde.description || "No description available."}
                </p>
              </section>

              {/* Geographic Focus */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Geographic Focus
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Service Area Type
                    </p>
                    <p className="text-white font-medium">
                      {cde.serviceAreaType}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Non-Metro Commitment
                    </p>
                    <p className="text-white font-medium">
                      {cde.nonMetroCommitment > 0
                        ? `${cde.nonMetroCommitment}%`
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                {cde.serviceArea?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">States Served</p>
                    <div className="flex flex-wrap gap-2">
                      {cde.serviceArea.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-indigo-900/30 text-indigo-300 rounded text-sm"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mt-4">
                  {cde.ruralFocus && (
                    <span className="px-3 py-1.5 bg-green-900/30 text-green-300 rounded-lg text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Rural Focus
                    </span>
                  )}
                  {cde.urbanFocus && (
                    <span className="px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-lg text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Urban Focus
                    </span>
                  )}
                  {cde.utsFocus && (
                    <span className="px-3 py-1.5 bg-amber-900/30 text-amber-300 rounded-lg text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Underserved Target States
                    </span>
                  )}
                </div>
              </section>

              {/* Investment Criteria */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Investment Criteria
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Deal Size Range
                    </p>
                    <p className="text-white font-medium">
                      {formatCurrency(cde.minDealSize)} -{" "}
                      {formatCurrency(cde.maxDealSize)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Predominant Financing
                    </p>
                    <p className="text-white font-medium">
                      {cde.predominantFinancing || "Not specified"}
                    </p>
                  </div>
                </div>
                {cde.predominantMarket && (
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-400 mb-1">
                      Predominant Market
                    </p>
                    <p className="text-gray-300">{cde.predominantMarket}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {cde.smallDealFund && (
                    <span className="px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-lg text-sm">
                      Small Deal Fund (&lt;$5M)
                    </span>
                  )}
                  {cde.requireSeverelyDistressed && (
                    <span className="px-3 py-1.5 bg-red-900/30 text-red-300 rounded-lg text-sm">
                      Requires Severely Distressed
                    </span>
                  )}
                  {cde.minDistressPercentile > 0 && (
                    <span className="px-3 py-1.5 bg-orange-900/30 text-orange-300 rounded-lg text-sm">
                      Min Distress: {cde.minDistressPercentile}th percentile
                    </span>
                  )}
                </div>
              </section>

              {/* Allocations by Year */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Allocations
                  </h2>
                  <span className="text-xs text-gray-400">
                    Per-year capacity
                  </span>
                </div>
                {allocations.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No allocation data available.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-2 text-left">Year</th>
                          <th className="px-4 py-2 text-left">Program</th>
                          <th className="px-4 py-2 text-left">Awarded</th>
                          <th className="px-4 py-2 text-left">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-100">
                        {allocations.map((a, idx) => {
                          const awarded = Number(
                            a.awardedAmount ??
                              a.awarded_amount ??
                              a.availableOnPlatform ??
                              0,
                          );
                          const remaining = Number(
                            a.availableOnPlatform ??
                              a.amount_remaining ??
                              a.remaining ??
                              awarded,
                          );
                          return (
                            <tr key={idx} className="hover:bg-gray-800/40">
                              <td className="px-4 py-2">{a.year || "—"}</td>
                              <td className="px-4 py-2 uppercase">
                                {a.type || "NMTC"}
                              </td>
                              <td className="px-4 py-2">
                                {formatCurrency(awarded)}
                              </td>
                              <td className="px-4 py-2 text-emerald-300">
                                {formatCurrency(remaining)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Deal Requirements */}
              {(cde.minJobsCreated ||
                cde.maxTimeToClose ||
                cde.relatedPartyPolicy !== "case-by-case" ||
                cde.qctRequired ||
                cde.stackedDealsPreferred) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Deal Requirements
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {cde.minJobsCreated && cde.minJobsCreated > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">
                          Min Jobs Required
                        </p>
                        <p className="text-white font-medium">
                          {cde.minJobsCreated} FTE
                        </p>
                      </div>
                    )}
                    {cde.maxTimeToClose && cde.maxTimeToClose > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-1">
                          Max Time to Close
                        </p>
                        <p className="text-white font-medium">
                          {cde.maxTimeToClose} months
                        </p>
                      </div>
                    )}
                    {cde.relatedPartyPolicy &&
                      cde.relatedPartyPolicy !== "case-by-case" && (
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-1">
                            Related Party Policy
                          </p>
                          <p className="text-white font-medium capitalize">
                            {cde.relatedPartyPolicy.replace("-", " ")}
                          </p>
                        </div>
                      )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {cde.qctRequired && (
                      <span className="px-3 py-1.5 bg-orange-900/30 text-orange-300 rounded-lg text-sm flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        QCT Required
                      </span>
                    )}
                    {cde.stackedDealsPreferred && (
                      <span className="px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-lg text-sm flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Stacked Deals Preferred
                      </span>
                    )}
                  </div>
                </section>
              )}

              {/* Target Regions & Excluded States */}
              {(cde.targetRegions?.length > 0 ||
                cde.excludedStates?.length > 0) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Regional Preferences
                  </h2>
                  {cde.targetRegions?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">
                        Target Regions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cde.targetRegions.map((region) => (
                          <span
                            key={region}
                            className="px-3 py-1 bg-emerald-900/30 text-emerald-300 rounded text-sm"
                          >
                            {region}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {cde.excludedStates?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        Excluded States
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cde.excludedStates.map((state) => (
                          <span
                            key={state}
                            className="px-3 py-1 bg-red-900/30 text-red-300 rounded text-sm"
                          >
                            {state}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Entity Preferences */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Entity Preferences
                </h2>
                <div className="flex flex-wrap gap-3">
                  {cde.nonprofitPreferred && (
                    <span className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 rounded-lg text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Non-Profit Preferred
                    </span>
                  )}
                  {cde.forprofitAccepted && (
                    <span className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-lg text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      For-Profit Accepted
                    </span>
                  )}
                  {cde.minorityFocus && (
                    <span className="px-3 py-1.5 bg-cyan-900/30 text-cyan-300 rounded-lg text-sm flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Minority Focus
                    </span>
                  )}
                </div>
              </section>

              {/* Mission Focus / Target Sectors */}
              {(cde.missionFocus?.length > 0 ||
                cde.projectTypes?.length > 0) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Mission Focus & Target Sectors
                  </h2>
                  {cde.missionFocus?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">
                        Impact Priorities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cde.missionFocus.map((m) => (
                          <span
                            key={m}
                            className="px-3 py-1.5 bg-indigo-900/30 text-indigo-300 rounded-lg text-sm"
                          >
                            {MISSION_LABELS[m] || m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {cde.projectTypes?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        Project Types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cde.projectTypes.map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Innovative Activities */}
              {cde.innovativeActivities && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Innovative Activities & Special Programs
                  </h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {cde.innovativeActivities}
                  </p>
                </section>
              )}

              {/* Program Experience */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Program Experience
                </h2>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 rounded-lg text-sm font-medium flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    NMTC
                  </span>
                  {cde.htcExperience && (
                    <span className="px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-lg text-sm font-medium flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      HTC Experience
                    </span>
                  )}
                  {cde.lihtcExperience && (
                    <span className="px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-lg text-sm font-medium flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      LIHTC Experience
                    </span>
                  )}
                  {cde.ozExperience && (
                    <span className="px-3 py-1.5 bg-amber-900/30 text-amber-300 rounded-lg text-sm font-medium flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      OZ Experience
                    </span>
                  )}
                </div>
              </section>

              {/* Track Record */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Track Record
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-3xl font-bold text-white">
                      {cde.projectsClosed}
                    </p>
                    <p className="text-sm text-gray-400">Projects Closed</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-400">
                      {formatCurrency(cde.totalDeployed)}
                    </p>
                    <p className="text-sm text-gray-400">Total Deployed</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(cde.avgDealSize)}
                    </p>
                    <p className="text-sm text-gray-400">Avg Deal Size</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Allocation Summary Card */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Allocation Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Available</span>
                    <span className="text-2xl font-bold text-green-400">
                      {formatCurrency(cde.availableAllocation)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Total Allocation</span>
                    <span className="text-xl font-bold text-white">
                      {formatCurrency(cde.totalAllocation)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Allocation Type</span>
                    <span className="text-white font-medium">
                      {cde.allocationType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Allocation Year</span>
                    <span className="text-white">{cde.allocationYear}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Deal Range</span>
                    <span className="text-white">
                      {formatCurrency(cde.minDealSize)} -{" "}
                      {formatCurrency(cde.maxDealSize)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Response Time</span>
                    <span className="text-white">{cde.responseTime}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {orgType === "sponsor" && cde.acceptingApplications && (
                    <button
                      onClick={handleRequestAllocation}
                      className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
                    >
                      Request Allocation
                    </button>
                  )}
                  {cde.website && (
                    <a
                      href={
                        cde.website.startsWith("http")
                          ? cde.website
                          : `https://${cde.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center rounded-lg"
                    >
                      Visit Website
                    </a>
                  )}
                </div>

                {/* Contact Information */}
                {(cde.primaryContact ||
                  cde.contactEmail ||
                  cde.contactPhone) && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      {cde.primaryContact && (
                        <div className="flex items-center gap-2">
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-white">
                            {cde.primaryContact}
                          </span>
                        </div>
                      )}
                      {cde.contactEmail && (
                        <div className="flex items-center gap-2">
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
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <a
                            href={`mailto:${cde.contactEmail}`}
                            className="text-indigo-400 hover:text-indigo-300 text-sm"
                          >
                            {cde.contactEmail}
                          </a>
                        </div>
                      )}
                      {cde.contactPhone && (
                        <div className="flex items-center gap-2">
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
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-gray-300 text-sm">
                            {cde.contactPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Deal Picker Modal — two-step: select deal → preview email → send */}
      {showDealPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowDealPicker(false);
            setPreviewStep(false);
            setSelectedDeal(null);
          }}
        >
          <div
            className={`bg-gray-900 border border-gray-700 rounded-xl mx-4 max-h-[90vh] overflow-hidden transition-all ${previewStep ? "w-full max-w-3xl" : "w-full max-w-lg"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-800">
              {!previewStep ? (
                <>
                  <h3 className="text-lg font-bold text-white">
                    Select a Deal to Submit
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Choose which project to submit to {cde.name}
                  </p>
                </>
              ) : submitSuccess ? (
                <>
                  <h3 className="text-lg font-bold text-green-400">
                    Request Sent!
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Your allocation request has been delivered
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white">
                    Preview Email to {cde.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Review the allocation request email before sending
                  </p>
                </>
              )}
            </div>

            {/* Body */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              {!previewStep ? (
                /* Step 1: Deal Selection */
                <div className="p-4">
                  {dealsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : sponsorDeals.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-3">
                        You don&apos;t have any deals yet.
                      </p>
                      <Link
                        href="/deals/new"
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Submit a Deal First
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sponsorDeals.map((deal) => (
                        <button
                          key={deal.id}
                          onClick={() =>
                            handlePreviewDeal(
                              deal.id,
                              deal.project_name ||
                                deal.projectName ||
                                "Untitled",
                            )
                          }
                          className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-colors"
                        >
                          <p className="font-semibold text-white">
                            {deal.project_name || deal.projectName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {deal.city || deal.intake_data?.city}
                            {deal.state || deal.intake_data?.state
                              ? `, ${deal.state || deal.intake_data?.state}`
                              : ""}
                            {deal.programs?.[0] ? ` · ${deal.programs[0]}` : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : submitSuccess ? (
                /* Success state */
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-900/30 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Allocation Request Sent!
                  </h3>
                  <p className="text-gray-400 mb-1">
                    Your email has been delivered to{" "}
                    <span className="text-white font-medium">{cde.name}</span>
                  </p>
                  {previewContactEmail && (
                    <p className="text-sm text-gray-500">
                      Sent to: {previewContactEmail}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-4">
                    The email includes your Deal Card and Project Profile
                    attachment. You&apos;ll be notified when they respond.
                  </p>
                </div>
              ) : (
                /* Step 2: Email Preview */
                <div className="p-4">
                  {previewLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-gray-400 text-sm">
                        Generating email preview...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Email meta */}
                      <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-1">
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 w-12 shrink-0">
                            To:
                          </span>
                          <span className="text-gray-300">
                            {previewContactEmail || "CDE Contact"}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 w-12 shrink-0">
                            Subject:
                          </span>
                          <span className="text-white font-medium">
                            {previewSubject}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 w-12 shrink-0">
                            Attach:
                          </span>
                          <span className="text-indigo-400">
                            {selectedDeal?.name
                              .replace(/[^a-zA-Z0-9 ]/g, "")
                              .replace(/\s+/g, "_")}
                            _Project_Profile.html
                          </span>
                        </div>
                      </div>

                      {/* Email preview iframe */}
                      <div className="border border-gray-700 rounded-lg overflow-hidden bg-white">
                        <iframe
                          ref={iframeRef}
                          title="Email Preview"
                          className="w-full"
                          style={{ height: "500px", border: "none" }}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </>
                  )}

                  {submitError && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-between gap-3">
              {previewStep && !submitSuccess && !previewLoading && (
                <button
                  onClick={() => {
                    setPreviewStep(false);
                    setSelectedDeal(null);
                    setPreviewHtml("");
                    setSubmitError(null);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
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
                  Pick different deal
                </button>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => {
                    setShowDealPicker(false);
                    setPreviewStep(false);
                    setSelectedDeal(null);
                    setPreviewHtml("");
                    setSubmitSuccess(false);
                    setSubmitError(null);
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  {submitSuccess ? "Done" : "Cancel"}
                </button>
                {previewStep &&
                  !submitSuccess &&
                  !previewLoading &&
                  previewHtml && (
                    <button
                      onClick={handleSubmitDeal}
                      disabled={submitLoading}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
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
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                          Send Allocation Request
                        </>
                      )}
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
