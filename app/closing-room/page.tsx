"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";

type ClosingStatus =
  | "pending"
  | "active"
  | "on_hold"
  | "closing"
  | "closed"
  | "terminated";
type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ" | "BROWNFIELD";

interface ClosingRoom {
  id: string;
  deal_id: string;
  project_name: string;
  status: ClosingStatus;
  allocation_amount: number;
  investment_amount: number;
  credit_type: ProgramType;
  checklist_pct: number;
  target_close_date: string | null;
  has_open_issues: boolean;
  issue_count: number;
  participant_count: number;
  days_to_close: number | null;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  closing: number;
  onHold: number;
  totalAllocation: number;
  totalInvestment: number;
}

const statusConfig: Record<
  ClosingStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-gray-400", bg: "bg-gray-700" },
  active: { label: "Active", color: "text-blue-400", bg: "bg-blue-900/50" },
  on_hold: { label: "On Hold", color: "text-amber-400", bg: "bg-amber-900/50" },
  closing: { label: "Closing", color: "text-green-400", bg: "bg-green-900/50" },
  closed: { label: "Closed", color: "text-gray-400", bg: "bg-gray-700" },
  terminated: {
    label: "Terminated",
    color: "text-red-400",
    bg: "bg-red-900/50",
  },
};

const programColors: Record<ProgramType, string> = {
  NMTC: "text-purple-400",
  HTC: "text-amber-400",
  LIHTC: "text-green-400",
  OZ: "text-blue-400",
  BROWNFIELD: "text-orange-400",
};

export default function ClosingRoomIndexPage() {
  const { orgType } = useCurrentUser();
  const [filter, setFilter] = useState<ClosingStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [closingRooms, setClosingRooms] = useState<ClosingRoom[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    pending: 0,
    closing: 0,
    onHold: 0,
    totalAllocation: 0,
    totalInvestment: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClosingRooms() {
      try {
        const response = await fetch("/api/closing-room", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setClosingRooms(data.closingRooms || []);
          setStats((prev) => data.stats || prev);
        }
      } catch (error) {
        console.error("Failed to fetch closing rooms:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClosingRooms();
  }, []);

  const filteredDeals = closingRooms.filter((room) => {
    const matchesFilter = filter === "all" || room.status === filter;
    const matchesSearch = room.project_name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Role-specific page title and description
  const pageConfig = {
    cde: {
      title: "Closing Room",
      desc: "Manage all deals in the closing pipeline",
    },
    investor: {
      title: "My Investments",
      desc: "Track your investments through closing",
    },
    sponsor: { title: "My Deals", desc: "Track your projects through closing" },
    admin: {
      title: "Closing Room",
      desc: "Manage all deals in the closing pipeline",
    },
  };

  const config =
    pageConfig[orgType as keyof typeof pageConfig] || pageConfig.sponsor;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{config.title}</h1>
            <p className="text-gray-400 mt-1">{config.desc}</p>
          </div>
          {/* Only CDEs can add new deals to closing room */}
          {orgType === "cde" && (
            <Link
              href="/dashboard/pipeline"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              + Add from Pipeline
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Total Deals</p>
            <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">On Hold</p>
            <p className="text-2xl font-bold text-amber-400">{stats.onHold}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Closing</p>
            <p className="text-2xl font-bold text-green-400">{stats.closing}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-500">Total Pipeline</p>
            <p className="text-2xl font-bold text-indigo-400">
              ${(stats.totalAllocation / 1_000_000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "pending", "closing", "on_hold"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {status === "all" ? "All" : statusConfig[status].label}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {filteredDeals.map((room) => (
            <Link
              key={room.id}
              href={`/closing-room/${room.deal_id}`}
              className="block bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Deal Info */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {room.project_name}
                      </h3>
                      <span
                        className={`text-sm font-medium ${programColors[room.credit_type] || "text-gray-400"}`}
                      >
                        {room.credit_type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[room.status]?.bg || "bg-gray-700"} ${statusConfig[room.status]?.color || "text-gray-400"}`}
                      >
                        {statusConfig[room.status]?.label || room.status}
                      </span>
                      {room.has_open_issues && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-400">
                          {room.issue_count} Issues
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-sm text-gray-500">Allocation</p>
                      <p className="text-lg font-semibold text-gray-100">
                        $
                        {((room.allocation_amount || 0) / 1_000_000).toFixed(1)}
                        M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Investment</p>
                      <p className="text-lg font-semibold text-green-400">
                        $
                        {((room.investment_amount || 0) / 1_000_000).toFixed(1)}
                        M
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Target Close</p>
                      <p className="text-lg font-semibold text-gray-100">
                        {room.target_close_date
                          ? new Date(
                              room.target_close_date,
                            ).toLocaleDateString()
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Checklist Progress</span>
                    <span className="text-gray-400">
                      {Math.round(room.checklist_pct || 0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        (room.checklist_pct || 0) >= 90
                          ? "bg-green-500"
                          : (room.checklist_pct || 0) >= 50
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${room.checklist_pct || 0}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>👥 {room.participant_count || 0} participants</span>
                  {room.days_to_close !== null && room.days_to_close > 0 && (
                    <span
                      className={
                        room.days_to_close <= 14 ? "text-amber-400" : ""
                      }
                    >
                      📅 {room.days_to_close} days to close
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredDeals.length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
            <p className="text-gray-400 text-lg mb-2">No deals found</p>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search"
                : "Add deals from the marketplace to start closing"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
