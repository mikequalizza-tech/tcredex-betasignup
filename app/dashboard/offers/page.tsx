"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/lib/auth";
import { fetchApi } from "@/lib/api/fetch-utils";
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Filter,
  DollarSign,
} from "lucide-react";

interface LOI {
  id: string;
  deal_id: string;
  cde_id: string;
  dealName: string;
  senderName: string;
  allocation_amount: number;
  qlici_rate?: number;
  leverage_structure?: string;
  term_years?: number;
  special_terms?: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface Commitment {
  id: string;
  deal_id: string;
  investor_id: string;
  cde_id?: string;
  dealName: string;
  senderName: string;
  investment_amount: number;
  credit_type?: string;
  credit_rate?: number;
  pricing_cents_per_credit?: number;
  target_closing_date?: string;
  special_terms?: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface IncomingOffersData {
  lois: LOI[];
  commitments: Commitment[];
  totalPending: number;
  summary: {
    totalLois: number;
    pendingLois: number;
    totalCommitments: number;
    pendingCommitments: number;
  };
}

type FilterTab = "all" | "pending" | "lois" | "commitments";

export default function OffersPage() {
  return (
    <ProtectedRoute allowedOrgTypes={["sponsor", "admin"]}>
      <OffersContent />
    </ProtectedRoute>
  );
}

function OffersContent() {
  const { organizationId } = useCurrentUser();
  const [data, setData] = useState<IncomingOffersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Check for filter query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (filter === "pending") setActiveTab("pending");
  }, []);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    async function loadOffers() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchApi<IncomingOffersData>(
          `/api/sponsor/incoming-offers?orgId=${organizationId}`,
        );
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load offers");
        }
      } catch {
        setError("Failed to load incoming offers");
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [organizationId]);

  const allOffers = useMemo(() => {
    if (!data) return [];
    return [
      ...(data.lois || []).map((l) => ({
        ...l,
        type: "loi" as const,
        amount: l.allocation_amount,
      })),
      ...(data.commitments || []).map((c) => ({
        ...c,
        type: "commitment" as const,
        amount: c.investment_amount,
      })),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [data]);

  const filteredOffers = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return allOffers.filter((o) =>
          ["pending", "draft", "pending_sponsor", "issued"].includes(o.status),
        );
      case "lois":
        return allOffers.filter((o) => o.type === "loi");
      case "commitments":
        return allOffers.filter((o) => o.type === "commitment");
      default:
        return allOffers;
    }
  }, [allOffers, activeTab]);

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "sponsor_accepted":
      case "accepted":
      case "all_accepted":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bg: "bg-green-900/50 text-green-300",
          label: "Accepted",
        };
      case "sponsor_rejected":
      case "rejected":
      case "declined":
        return {
          icon: XCircle,
          color: "text-red-400",
          bg: "bg-red-900/50 text-red-300",
          label: "Declined",
        };
      case "expired":
        return {
          icon: Clock,
          color: "text-gray-400",
          bg: "bg-gray-800 text-gray-400",
          label: "Expired",
        };
      case "withdrawn":
        return {
          icon: XCircle,
          color: "text-gray-400",
          bg: "bg-gray-800 text-gray-400",
          label: "Withdrawn",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-amber-400",
          bg: "bg-amber-900/50 text-amber-300",
          label: "Pending",
        };
    }
  };

  const isPending = (status: string) =>
    ["pending", "draft", "pending_sponsor", "issued"].includes(status);

  return (
    <div className="p-6 bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Incoming Offers</h1>
          <p className="text-sm text-gray-400">
            LOIs from CDEs and Commitments from Investors for your deals
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-400">Total LOIs</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.summary.totalLois}
            </p>
          </div>
          <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">Pending LOIs</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {data.summary.pendingLois}
            </p>
          </div>
          <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Total Commitments</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {data.summary.totalCommitments}
            </p>
          </div>
          <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">Pending Commitments</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {data.summary.pendingCommitments}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-500" />
        {(["all", "pending", "lois", "commitments"] as FilterTab[]).map(
          (tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors capitalize ${
                activeTab === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab === "lois"
                ? "LOIs Only"
                : tab === "commitments"
                  ? "Commitments Only"
                  : tab}
              {tab === "pending" && data?.totalPending
                ? ` (${data.totalPending})`
                : ""}
            </button>
          ),
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300">{error}</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {activeTab === "pending" ? "No Pending Offers" : "No Offers Yet"}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {activeTab === "pending"
              ? "All offers have been reviewed. Check back later for new offers."
              : "When CDEs send LOIs or Investors send Commitments for your deals, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => {
            const statusConfig = getStatusConfig(offer.status);
            const StatusIcon = statusConfig.icon;
            const pending = isPending(offer.status);

            return (
              <Link
                key={offer.id}
                href={`/deals/${offer.deal_id}?tab=${offer.type === "loi" ? "lois" : "commitments"}&id=${offer.id}`}
                className={`block bg-gray-900/80 rounded-xl border transition-all hover:border-indigo-500/50 ${
                  pending ? "border-amber-500/30" : "border-gray-800"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Type + Status badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            offer.type === "loi"
                              ? "bg-emerald-900/50 text-emerald-300"
                              : "bg-purple-900/50 text-purple-300"
                          }`}
                        >
                          {offer.type === "loi"
                            ? "Letter of Intent"
                            : "Commitment"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusConfig.bg}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        {pending && (
                          <span className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded font-medium animate-pulse">
                            Action Required
                          </span>
                        )}
                      </div>

                      {/* Sender + Deal */}
                      <h3 className="text-base font-semibold text-white mb-1">
                        {offer.senderName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        For:{" "}
                        <span className="text-gray-300">{offer.dealName}</span>
                      </p>

                      {/* Details row */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(offer.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Received {formatDate(offer.created_at)}
                        </span>
                        {offer.expires_at && (
                          <span
                            className={`flex items-center gap-1 ${
                              new Date(offer.expires_at) < new Date()
                                ? "text-red-400"
                                : ""
                            }`}
                          >
                            Expires {formatDate(offer.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount highlight */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(offer.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {offer.type === "loi" ? "Allocation" : "Investment"}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
