"use client";

import { useEffect, useMemo, useState } from "react";
import DealMap from "@/components/maps/DealMap";
import DealCard from "@/components/DealCard";
import { Deal } from "@/lib/data/deals";
import { fetchDeals } from "@/lib/supabase/queries";
import { mapDealToCard } from "@/lib/utils/dealCardMapper";
import { VisibilityTier } from "@/lib/roles/config";

type FilterView = "sponsor" | "cde" | "investor";

// Map view mode to visibility tier
function getVisibilityTierForView(view: FilterView): VisibilityTier {
  switch (view) {
    case "cde":
    case "investor":
      return "expanded"; // CDEs and Investors see more details
    default:
      return "public";
  }
}

export default function DealMapView() {
  const [activeView, setActiveView] = useState<FilterView>("sponsor");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    creditType: "all",
    shovelReady: false,
    minProjectCost: 0,
    maxProjectCost: 100000000,
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      try {
        const fetched = await fetchDeals();
        const mapped = fetched.map(mapDealToCard);
        setDeals(mapped);
      } catch (error) {
        console.error(
          "[DealMapView] Failed to load deals from Supabase:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !deal.projectName.toLowerCase().includes(query) &&
          !deal.city.toLowerCase().includes(query) &&
          !deal.state.toLowerCase().includes(query) &&
          !(deal.sponsorName || "").toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (filters.shovelReady && !deal.shovelReady) return false;
      const projectCost = deal.projectCost || deal.allocation || 0;
      if (projectCost < filters.minProjectCost) return false;
      if (projectCost > filters.maxProjectCost) return false;
      if (filters.creditType !== "all") {
        if (filters.creditType === "nmtc" && deal.programType !== "NMTC")
          return false;
        if (filters.creditType === "htc" && deal.programType !== "HTC")
          return false;
        if (filters.creditType === "lihtc" && deal.programType !== "LIHTC")
          return false;
        if (filters.creditType === "oz" && deal.programType !== "OZ")
          return false;
      }
      return true;
    });
  }, [deals, filters, searchQuery]);

  // Stats
  const totalDeals = filteredDeals.length;
  const _totalProjectCost = filteredDeals.reduce(
    (sum, d) => sum + (d.projectCost || d.allocation || 0),
    0,
  );

  const handleRequestMemo = (dealId: string) => {
    console.log("Requesting memo for:", dealId);
    // TODO: Open modal or navigate to deal detail
  };

  return (
    <main className="relative min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-indigo-300">tCredex</h1>
            <span className="text-sm text-gray-400">Marketplace</span>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            {(["sponsor", "cde", "investor"] as FilterView[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeView === view
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {view === "sponsor"
                  ? "Sponsor View"
                  : view === "cde"
                    ? "CDE View"
                    : "Investor View"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-green-400">● {totalDeals} deals</span>
            <a
              href="/signin"
              className="text-sm text-gray-400 hover:text-white"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Left-side map */}
      <div className="fixed left-0 top-14 bottom-0 w-2/3 z-0">
        <DealMap
          center={{ latitude: 39.8283, longitude: -98.5795 }}
          zoom={4}
          height="100%"
        />

        {/* Map Stats Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 rounded-lg p-3 border border-gray-700">
          <p className="text-sm text-gray-400">
            Total Deals:{" "}
            <span className="text-green-400 font-semibold">{totalDeals}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">Deal Density</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-gray-500">Low</span>
            <div className="flex gap-0.5">
              {[
                "bg-slate-700",
                "bg-slate-600",
                "bg-blue-700",
                "bg-blue-500",
                "bg-blue-400",
              ].map((color, i) => (
                <div key={i} className={`w-4 h-3 ${color}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </div>

      {/* Right-side filter + card feed */}
      <div className="fixed top-14 right-0 w-1/3 h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950 shadow-lg z-10 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="p-4 border-b border-gray-800 flex flex-wrap gap-2">
          <button className="px-3 py-1 text-xs rounded-full bg-green-900/50 text-green-300 border border-green-700">
            ● Feasible (15)
          </button>
          <button className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700">
            ♥ Liked
          </button>
          <button className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-400 border border-gray-700">
            🔓 Unlocked
          </button>
          <button className="px-3 py-1 text-xs rounded-full bg-orange-900/50 text-orange-300 border border-orange-700">
            ● Off-market (124)
          </button>
        </div>

        {/* View-specific filters */}
        <div className="p-4 border-b border-gray-800">
          {activeView === "sponsor" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Sponsor Filters
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={filters.shovelReady}
                  onChange={(e) =>
                    setFilters({ ...filters, shovelReady: e.target.checked })
                  }
                  className="rounded border-gray-600 bg-gray-800 text-indigo-600"
                />
                Shovel Ready Only
              </label>
            </div>
          )}
          {activeView === "cde" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                CDE Filters
              </p>
              <p className="text-sm text-indigo-300">
                AutoMatch AI: Top 3 deals shown
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 text-xs bg-indigo-900/50 text-indigo-300 rounded">
                  Geographic Match
                </span>
                <span className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded">
                  Impact Aligned
                </span>
              </div>
            </div>
          )}
          {activeView === "investor" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase">
                Investor Filters
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded">
                  CRA Eligible
                </span>
                <span className="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded">
                  High Impact
                </span>
                <span className="px-2 py-1 text-xs bg-amber-900/50 text-amber-300 rounded">
                  Historic
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Deal Cards */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-semibold mb-4">
            Active Tax Credit Deals
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filteredDeals.length})
            </span>
          </h2>
          <div className="space-y-4">
            {loading && (
              <div className="text-center text-gray-500 py-8">
                Loading deals...
              </div>
            )}
            {!loading &&
              filteredDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onRequestMemo={handleRequestMemo}
                  visibilityTier={getVisibilityTierForView(activeView)}
                />
              ))}
            {!loading && filteredDeals.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No deals match your filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
