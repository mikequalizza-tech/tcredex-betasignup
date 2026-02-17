"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DealCard from "@/components/DealCard";
import { Deal } from "@/lib/data/deals";
import { fetchMarketplaceDeals } from "@/lib/supabase/queries";

type CreditType = "all" | "nmtc" | "htc" | "lihtc";

export default function MatchingPage() {
  const router = useRouter();
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditFilter, setCreditFilter] = useState<CreditType>("all");
  const [shovelReadyOnly, setShovelReadyOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memoRequested, setMemoRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadDeals() {
      setLoading(true);
      try {
        const deals = await fetchMarketplaceDeals();
        setAllDeals(deals);
      } catch (error) {
        console.error("Failed to load deals:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const filteredDeals = allDeals.filter((deal) => {
    if (creditFilter === "nmtc" && deal.programType !== "NMTC") return false;
    if (creditFilter === "htc" && deal.programType !== "HTC") return false;
    if (creditFilter === "lihtc" && deal.programType !== "LIHTC") return false;
    if (shovelReadyOnly && deal.status !== "available") return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        deal.projectName.toLowerCase().includes(query) ||
        deal.city.toLowerCase().includes(query) ||
        deal.state.toLowerCase().includes(query) ||
        (deal.sponsorName?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  });

  const handleExpressInterest = async (dealId: string) => {
    setMemoRequested((prev) => new Set(prev).add(dealId));
    router.push(`/deals/${dealId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-100">Deal Matching</h1>
          <p className="mt-2 text-gray-400">
            Browse pre-qualified NMTC, LIHTC, and HTC opportunities matched to
            your allocation criteria.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Search by name, location, or census tract..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "nmtc", "htc", "lihtc"] as CreditType[]).map((type) => (
              <button
                key={type}
                onClick={() => setCreditFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  creditFilter === type
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {type === "all" ? "All" : type.toUpperCase()}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shovelReadyOnly}
              onChange={(e) => setShovelReadyOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-300">Shovel Ready Only</span>
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-400">
              Showing {filteredDeals.length} of {allDeals.length} deals
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDeals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onRequestMemo={handleExpressInterest}
                  memoRequested={memoRequested.has(deal.id)}
                />
              ))}
            </div>

            {filteredDeals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No deals match your filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
