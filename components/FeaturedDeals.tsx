"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Deal } from "@/lib/data/deals";
import { fetchMarketplaceDeals } from "@/lib/supabase/queries";
import DealCard from "@/components/DealCard";

export default function FeaturedDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeals() {
      try {
        const allDeals = await fetchMarketplaceDeals();
        console.log(
          "All marketplace deals:",
          allDeals.map((d) => ({
            name: d.projectName,
            program: d.programType,
            visible: d.visible,
          })),
        );

        // Ensure we always include LIHTC deals if available
        const lihtcDeals = allDeals.filter(
          (deal) => deal.programType === "LIHTC",
        );
        const otherDeals = allDeals.filter(
          (deal) => deal.programType !== "LIHTC",
        );

        console.log("LIHTC deals found:", lihtcDeals.length);
        console.log("Other deals found:", otherDeals.length);

        // Shuffle other deals for variety
        const shuffledOthers = [...otherDeals].sort(() => Math.random() - 0.5);

        // Combine: prioritize LIHTC deals, then fill with others
        const featured = [
          ...lihtcDeals.slice(0, 2), // Show up to 2 LIHTC deals
          ...shuffledOthers.slice(0, 4 - Math.min(lihtcDeals.length, 2)), // Fill remaining slots
        ].slice(0, 4);

        console.log(
          "Featured deals:",
          featured.map((d) => ({
            name: d.projectName,
            program: d.programType,
          })),
        );
        setDeals(featured);
      } catch (error) {
        console.error("Failed to load featured deals:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();

    // Removed 30-second interval to improve performance
    // Deals will refresh on page navigation
  }, []);

  if (loading) {
    return (
      <section className="relative py-16 md:py-24 bg-gray-950">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 md:py-24 bg-gray-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Marketplace
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Featured Projects
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Explore tax credit deals from qualified sponsors. Each project has
            been vetted for program eligibility.
          </p>
        </div>

        {/* Deal Cards Grid - Using DealCard component for consistency */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              visibilityTier="expanded"
              compact={false}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/signin?redirect=/deals"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
          >
            Sign In to Browse Projects
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            25+ active deals across NMTC, HTC, LIHTC, and Opportunity Zones
          </p>
        </div>
      </div>
    </section>
  );
}
