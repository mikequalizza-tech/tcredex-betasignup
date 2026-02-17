"use client";

import Link from "next/link";

export default function NoRiskSection() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-16">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 mb-4">
              <span className="text-green-400 text-sm font-medium">
                🛡️ Zero Risk
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              You Don&apos;t Close, We Don&apos;t Get Paid
            </h2>
            <p className="text-lg text-indigo-200/70">
              tCredex is a no-risk platform. Our success-based fee model ensures
              our interests are 100% aligned with yours.
            </p>
          </div>

          {/* Fee Structure Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Base Fee */}
            <div className="relative bg-gray-900/50 rounded-2xl border border-gray-800 p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Up to $10M Basis
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-green-400">1.8</span>
                  <span className="text-2xl text-gray-400">%</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Calculated on basis, not QLICI — so it fits all deal types.
                  Simple and transparent.
                </p>
              </div>
            </div>

            {/* Reduced Fee */}
            <div className="relative bg-gray-900/50 rounded-2xl border border-gray-800 p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Over $10M Basis
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-indigo-400">
                    1.5
                  </span>
                  <span className="text-2xl text-gray-400">%</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Volume discount for larger transactions. The bigger the deal,
                  the more you save.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Points */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-400"
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
              <h3 className="text-white font-medium mb-1">No Upfront Costs</h3>
              <p className="text-gray-400 text-sm">
                Start finding matches without paying a dime
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Aligned Interests</h3>
              <p className="text-gray-400 text-sm">
                We only succeed when you do
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">
                Transparent Pricing
              </h3>
              <p className="text-gray-400 text-sm">
                Basic transaction, basic fee structure
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
            >
              Start Free — Pay Only on Success
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
          </div>
        </div>
      </div>
    </section>
  );
}
