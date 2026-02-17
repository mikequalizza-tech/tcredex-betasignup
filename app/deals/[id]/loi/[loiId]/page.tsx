"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";
import { LOI, LOI_STATUS_LABELS, LOI_STATUS_COLORS } from "@/types/loi";
import AppLayout from "@/components/layout/AppLayout";

interface CounterTerms {
  allocation_amount?: number;
  qlici_rate?: number;
  term_years?: number;
  expected_closing_date?: string;
  additional_conditions?: string[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getStatusBadgeClass = (status: string) => {
  const color =
    LOI_STATUS_COLORS[status as keyof typeof LOI_STATUS_COLORS] || "gray";
  const colorMap: Record<string, string> = {
    gray: "bg-gray-600/20 text-gray-400 border-gray-600/30",
    blue: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    yellow: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
    green: "bg-green-600/20 text-green-400 border-green-600/30",
    red: "bg-red-600/20 text-red-400 border-red-600/30",
    orange: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  };
  return colorMap[color] || colorMap.gray;
};

export default function LOIReviewPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LOIReviewPage />
    </Suspense>
  );
}

function LOIReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    organizationId,
    orgType,
    isAuthenticated: _isAuthenticated,
    isLoading: authLoading,
  } = useCurrentUser();

  const dealId = params.id as string;
  const loiId = params.loiId as string;
  const initialAction = searchParams.get("action") as
    | "accept"
    | "counter"
    | "reject"
    | null;

  const [loi, setLOI] = useState<LOI | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Response form state
  const [responseAction, setResponseAction] = useState<
    "accept" | "counter" | "reject" | null
  >(initialAction);
  const [notes, setNotes] = useState("");
  const [counterTerms, setCounterTerms] = useState<CounterTerms>({});
  const [newCondition, setNewCondition] = useState("");

  // Fetch LOI data
  useEffect(() => {
    async function fetchLOI() {
      if (!loiId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/loi/${loiId}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setLOI(data.loi);

          // Pre-populate counter terms with current values
          if (data.loi) {
            setCounterTerms({
              allocation_amount: data.loi.allocation_amount,
              qlici_rate: data.loi.qlici_rate,
              term_years: data.loi.term_years,
              expected_closing_date:
                data.loi.expected_closing_date?.split("T")[0],
            });
          }
        } else {
          setError("Failed to load LOI details");
        }
      } catch (err) {
        setError("Error loading LOI");
        console.error("Error fetching LOI:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLOI();
  }, [loiId]);

  const handleSubmitResponse = async () => {
    if (!responseAction || !organizationId) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        action: responseAction,
        sponsor_id: organizationId,
        notes: notes || undefined,
      };

      if (responseAction === "counter") {
        payload.counter_terms = counterTerms;
      }

      const response = await fetch(`/api/loi/${loiId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message);
        setLOI(data.loi);

        // Redirect after success
        setTimeout(() => {
          router.push(`/deals/${dealId}`);
        }, 2000);
      } else {
        setError(data.error || "Failed to submit response");
      }
    } catch (err) {
      setError("Error submitting response");
      console.error("Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setCounterTerms((prev) => ({
        ...prev,
        additional_conditions: [
          ...(prev.additional_conditions || []),
          newCondition.trim(),
        ],
      }));
      setNewCondition("");
    }
  };

  const removeCondition = (index: number) => {
    setCounterTerms((prev) => ({
      ...prev,
      additional_conditions: prev.additional_conditions?.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const canRespond =
    loi?.status === "pending_sponsor" &&
    orgType === "sponsor" &&
    loi.sponsor_id === organizationId;

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!loi) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              LOI Not Found
            </h1>
            <Link
              href={`/deals/${dealId}`}
              className="text-indigo-400 hover:text-indigo-300"
            >
              Return to Deal
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const daysUntilExpiry = loi.expires_at
    ? Math.ceil(
        (new Date(loi.expires_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/deals/${dealId}`}
            className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
          >
            ← Back to Deal
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                Letter of Intent
              </h1>
              <p className="text-gray-400">
                LOI #{loi.loi_number} for{" "}
                {loi.deal?.project_name || "Unknown Project"}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusBadgeClass(loi.status)}`}
            >
              {LOI_STATUS_LABELS[loi.status] || loi.status}
            </span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-600/30 rounded-xl text-green-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* LOI Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Details */}
          <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">LOI Terms</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Financial Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 rounded-xl p-4 border border-emerald-800/30">
                  <p className="text-sm text-emerald-400/80 mb-1">
                    Allocation Amount
                  </p>
                  <p className="text-2xl font-bold text-emerald-300">
                    {formatCurrency(loi.allocation_amount)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">QLICI Rate</p>
                  <p className="text-2xl font-bold text-gray-200">
                    {loi.qlici_rate || "TBD"}%
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Term</p>
                  <p className="text-2xl font-bold text-gray-200">
                    {loi.term_years || 7} years
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">
                    Leverage Structure
                  </p>
                  <p className="text-lg font-semibold text-gray-200 capitalize">
                    {loi.leverage_structure || "Standard"}
                  </p>
                </div>
              </div>

              {/* CDE Info */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Issued By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {loi.cde?.name?.charAt(0) || "C"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-100">
                      {loi.cde?.name || "Unknown CDE"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Community Development Entity
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Terms */}
              {loi.special_terms && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Special Terms</p>
                  <div className="bg-gray-800/50 rounded-xl p-4 text-gray-300 text-sm">
                    {loi.special_terms}
                  </div>
                </div>
              )}

              {/* Conditions */}
              {loi.conditions && loi.conditions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-3">Conditions</p>
                  <div className="space-y-2">
                    {loi.conditions.map((condition, idx) => (
                      <div
                        key={condition.id || idx}
                        className="flex items-start gap-3 bg-gray-800/30 rounded-lg p-3"
                      >
                        <span
                          className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            condition.status === "satisfied"
                              ? "bg-green-500"
                              : condition.status === "waived"
                                ? "bg-gray-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">
                            {condition.description}
                          </p>
                          {condition.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {formatDate(condition.due_date)}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            condition.status === "satisfied"
                              ? "bg-green-900/50 text-green-400"
                              : condition.status === "waived"
                                ? "bg-gray-700 text-gray-400"
                                : "bg-yellow-900/50 text-yellow-400"
                          }`}
                        >
                          {condition.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Key Dates
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Issued</p>
                  <p className="text-sm text-gray-200">
                    {formatDate(loi.issued_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expires</p>
                  <p
                    className={`text-sm font-medium ${daysUntilExpiry && daysUntilExpiry < 7 ? "text-amber-400" : "text-gray-200"}`}
                  >
                    {formatDate(loi.expires_at)}
                    {daysUntilExpiry !== null && (
                      <span className="ml-2 text-xs">
                        ({daysUntilExpiry} days)
                      </span>
                    )}
                  </p>
                </div>
                {loi.expected_closing_date && (
                  <div>
                    <p className="text-xs text-gray-500">Expected Closing</p>
                    <p className="text-sm text-gray-200">
                      {formatDate(loi.expected_closing_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Download */}
            {loi.document_url && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Document
                </h3>
                <a
                  href={loi.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">
                      LOI Document
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to download PDF
                    </p>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Response Section - Only for sponsors who can respond */}
        {canRespond && (
          <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-6">
              Your Response
            </h2>

            {/* Action Selection */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setResponseAction("accept")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  responseAction === "accept"
                    ? "border-green-500 bg-green-900/30"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="text-2xl mb-2">&#10004;</div>
                <p className="font-semibold text-gray-100">Accept</p>
                <p className="text-xs text-gray-400 mt-1">
                  Agree to terms as presented
                </p>
              </button>
              <button
                onClick={() => setResponseAction("counter")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  responseAction === "counter"
                    ? "border-amber-500 bg-amber-900/30"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="text-2xl mb-2">&#8644;</div>
                <p className="font-semibold text-gray-100">Counter</p>
                <p className="text-xs text-gray-400 mt-1">
                  Propose modified terms
                </p>
              </button>
              <button
                onClick={() => setResponseAction("reject")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  responseAction === "reject"
                    ? "border-red-500 bg-red-900/30"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="text-2xl mb-2">&#10006;</div>
                <p className="font-semibold text-gray-100">Decline</p>
                <p className="text-xs text-gray-400 mt-1">Reject this offer</p>
              </button>
            </div>

            {/* Counter Terms Form */}
            {responseAction === "counter" && (
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 space-y-4">
                <h3 className="font-semibold text-gray-200 mb-4">
                  Proposed Counter Terms
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Allocation Amount ($)
                    </label>
                    <input
                      type="number"
                      value={counterTerms.allocation_amount || ""}
                      onChange={(e) =>
                        setCounterTerms((prev) => ({
                          ...prev,
                          allocation_amount: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      QLICI Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={counterTerms.qlici_rate || ""}
                      onChange={(e) =>
                        setCounterTerms((prev) => ({
                          ...prev,
                          qlici_rate: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Term (Years)
                    </label>
                    <input
                      type="number"
                      value={counterTerms.term_years || ""}
                      onChange={(e) =>
                        setCounterTerms((prev) => ({
                          ...prev,
                          term_years: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Expected Closing Date
                    </label>
                    <input
                      type="date"
                      value={counterTerms.expected_closing_date || ""}
                      onChange={(e) =>
                        setCounterTerms((prev) => ({
                          ...prev,
                          expected_closing_date: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Additional Conditions */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Additional Conditions
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Add a condition..."
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                      onKeyPress={(e) => e.key === "Enter" && addCondition()}
                    />
                    <button
                      onClick={addCondition}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  {counterTerms.additional_conditions &&
                    counterTerms.additional_conditions.length > 0 && (
                      <div className="space-y-2">
                        {counterTerms.additional_conditions.map(
                          (condition, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2"
                            >
                              <span className="flex-1 text-sm text-gray-300">
                                {condition}
                              </span>
                              <button
                                onClick={() => removeCondition(idx)}
                                className="text-gray-500 hover:text-red-400"
                              >
                                &#10006;
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Notes{" "}
                {responseAction === "reject" &&
                  "(Optional - Reason for declining)"}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={
                  responseAction === "reject"
                    ? "Explain your reason for declining..."
                    : "Any additional notes..."
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitResponse}
              disabled={!responseAction || submitting}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                !responseAction || submitting
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : responseAction === "accept"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500"
                    : responseAction === "counter"
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500"
                      : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : responseAction === "accept" ? (
                "Accept LOI"
              ) : responseAction === "counter" ? (
                "Submit Counter Proposal"
              ) : responseAction === "reject" ? (
                "Decline LOI"
              ) : (
                "Select a Response"
              )}
            </button>
          </div>
        )}

        {/* Read-only status for non-pending LOIs */}
        {!canRespond && loi.status !== "pending_sponsor" && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <p className="text-gray-400">
              This LOI has been{" "}
              {LOI_STATUS_LABELS[loi.status]?.toLowerCase() || "processed"}.
            </p>
            {loi.sponsor_response_notes && (
              <div className="mt-4 text-left bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Response Notes:</p>
                <p className="text-gray-300">{loi.sponsor_response_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
