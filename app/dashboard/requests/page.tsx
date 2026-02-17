"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/lib/auth";
import { fetchApi } from "@/lib/api/fetch-utils";
import type { MatchTargetType } from "@/lib/types/match-request";
import {
  Building2,
  Wallet,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  ChevronRight,
} from "lucide-react";

// Raw API response uses snake_case from Supabase
interface RawMatchRequest {
  id: string;
  sponsor_id: string;
  deal_id: string;
  target_type: MatchTargetType;
  target_id: string;
  target_org_id: string;
  status: string;
  message?: string;
  response_message?: string;
  requested_at?: string;
  expires_at?: string;
  cooldown_ends_at?: string;
  created_at: string;
  // Joined relations from Supabase
  deals?: { id: string; project_name: string };
  sponsors?: { id: string; organization_id: string; organization_name: string };
}

interface SlotsData {
  cde: {
    used: number;
    max: number;
    available: number;
    requests: RawMatchRequest[];
  };
  investor: {
    used: number;
    max: number;
    available: number;
    requests: RawMatchRequest[];
  };
}

type FilterTab = "all" | "cde" | "investor" | "pending";

export default function RequestsPage() {
  return (
    <ProtectedRoute allowedOrgTypes={["sponsor", "admin"]}>
      <RequestsContent />
    </ProtectedRoute>
  );
}

function RequestsContent() {
  const { organizationId } = useCurrentUser();
  const [requests, setRequests] = useState<RawMatchRequest[]>([]);
  const [slots, setSlots] = useState<SlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchApi<{
          data: RawMatchRequest[];
          slots: SlotsData | null;
        }>(`/api/match-requests?includeSlots=true`);

        if (result.success && result.data) {
          setRequests(result.data.data || []);
          setSlots(result.data.slots || null);
        } else {
          setError(result.error || "Failed to load requests");
        }
      } catch {
        setError("Failed to load match requests");
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [organizationId]);

  const filteredRequests = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return requests.filter((r) => r.status === "pending");
      case "cde":
        return requests.filter((r) => r.target_type === "cde");
      case "investor":
        return requests.filter((r) => r.target_type === "investor");
      default:
        return requests;
    }
  }, [requests, activeTab]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bg: "bg-green-900/50 text-green-300",
          label: "Accepted",
        };
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
          icon: Clock,
          color: "text-amber-400",
          bg: "bg-amber-900/50 text-amber-300",
          label: "Pending",
        };
    }
  };

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
          <h1 className="text-xl font-bold text-white">Match Requests</h1>
          <p className="text-sm text-gray-400">
            Track your allocation requests to CDEs and investment requests to
            Investors
          </p>
        </div>
      </div>

      {/* Slot Overview */}
      {slots && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SlotOverview
            type="cde"
            label="CDE Allocation Requests"
            icon={Building2}
            slots={slots.cde}
            color="purple"
          />
          <SlotOverview
            type="investor"
            label="Investor Commitment Requests"
            icon={Wallet}
            slots={slots.investor}
            color="emerald"
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-500" />
        {(["all", "pending", "cde", "investor"] as FilterTab[]).map((tab) => (
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
            {tab === "cde"
              ? "CDE Requests"
              : tab === "investor"
                ? "Investor Requests"
                : tab}
          </button>
        ))}
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
      ) : filteredRequests.length === 0 ? (
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No Match Requests
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            When you request allocation from CDEs or investment from Investors
            via AutoMatch, they will appear here. You can have up to 3 active
            CDE requests and 3 active Investor requests.
          </p>
          <Link
            href="/deals"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Browse Marketplace <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const dealName =
              request.deals?.project_name ||
              `Request #${request.id.slice(0, 8)}`;

            return (
              <div
                key={request.id}
                className={`bg-gray-900/80 rounded-xl border transition-all ${
                  request.status === "pending"
                    ? "border-amber-500/30"
                    : "border-gray-800"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {request.target_type === "cde" ? (
                          <Building2 className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Wallet className="w-4 h-4 text-emerald-400" />
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            request.target_type === "cde"
                              ? "bg-purple-900/50 text-purple-300"
                              : "bg-emerald-900/50 text-emerald-300"
                          }`}
                        >
                          {request.target_type === "cde"
                            ? "CDE Request"
                            : "Investor Request"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusConfig.bg}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-white mb-1">
                        {dealName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        To:{" "}
                        <span className="text-gray-300">
                          {request.target_type === "cde" ? "CDE" : "Investor"} #
                          {request.target_id.slice(0, 8)}
                        </span>
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sent{" "}
                          {formatDate(
                            request.requested_at || request.created_at,
                          )}
                        </span>
                        {request.expires_at && (
                          <span
                            className={`flex items-center gap-1 ${
                              new Date(request.expires_at) < new Date()
                                ? "text-red-400"
                                : ""
                            }`}
                          >
                            Expires {formatDate(request.expires_at)}
                          </span>
                        )}
                        {request.message && (
                          <span className="text-gray-400 italic truncate max-w-xs">
                            &ldquo;{request.message}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SlotOverviewProps {
  type: MatchTargetType;
  label: string;
  icon: React.ElementType;
  slots: {
    used: number;
    max: number;
    available: number;
  };
  color: "purple" | "emerald";
}

function SlotOverview({
  type: _type,
  label,
  icon: Icon,
  slots,
  color,
}: SlotOverviewProps) {
  const colorClasses = {
    purple: {
      bg: "bg-purple-900/20",
      border: "border-purple-500/30",
      text: "text-purple-400",
      fill: "bg-purple-500",
    },
    emerald: {
      bg: "bg-emerald-900/20",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      fill: "bg-emerald-500",
    },
  };

  const classes = colorClasses[color];
  const usagePercent = (slots.used / slots.max) * 100;

  return (
    <div className={`rounded-xl p-5 ${classes.bg} border ${classes.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${classes.text}`} />
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <span className={`text-sm font-bold ${classes.text}`}>
          {slots.available} / {slots.max} available
        </span>
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${classes.fill} rounded-full transition-all duration-500`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {slots.available === 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          All {slots.max} slots used. Decline or withdraw a request to free up a
          slot.
        </div>
      )}
    </div>
  );
}
