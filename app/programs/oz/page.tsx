export const metadata = {
  title: "Opportunity Zones | tCredex",
  description:
    "Learn about Opportunity Zone investments. Defer and potentially eliminate capital gains taxes through qualified investments in designated zones.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const program = {
  id: "oz",
  name: "OZ",
  fullName: "Opportunity Zone",
  purpose:
    "Encourage long-term private investment in low-income and distressed communities",
  established: "2017 (Tax Cuts and Jobs Act)",
  administeredBy: "U.S. Treasury",
  creditAmount: "Deferral + potential exclusion of capital gains",
  claimPeriod: "Varies by holding period",
  eligibleProjects:
    "Real estate development, business investments, infrastructure",
  targetBeneficiaries:
    "Census tracts nominated by states and certified by Treasury",
  compliance: "Investments must be in designated Opportunity Zones via QOFs",
  impact: "Significant tax benefits for long-term investments",
  bestUseCase:
    "Long-term investments in underserved communities with significant tax benefits",
};

export default function OZPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link
                href="/programs"
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                ← All Programs
              </Link>
            </div>

            {/* Header */}
            <div className="mb-12">
              <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Opportunity Zone
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
                {program.fullName}
              </h1>
              <p className="text-xl text-gray-400">{program.purpose}</p>
            </div>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  5 Years
                </p>
                <p className="text-2xl font-bold text-purple-400">10%</p>
                <p className="text-sm text-gray-400 mt-1">Step-up in basis</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  7 Years
                </p>
                <p className="text-2xl font-bold text-purple-400">15%</p>
                <p className="text-sm text-gray-400 mt-1">Step-up in basis</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  10+ Years
                </p>
                <p className="text-2xl font-bold text-purple-400">0%</p>
                <p className="text-sm text-gray-400 mt-1">Tax on OZ gains</p>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                How Opportunity Zones Work
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Realize Capital Gain
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Sell an appreciated asset (stocks, real estate, business)
                      and realize a capital gain.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Invest Within 180 Days
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Reinvest the gain into a Qualified Opportunity Fund (QOF)
                      within 180 days of the sale.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Defer Original Gain
                    </h3>
                    <p className="text-gray-400 text-sm">
                      The original capital gain is deferred until the earlier of
                      when the OZ investment is sold or December 31, 2026.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Exclude New Gains
                    </h3>
                    <p className="text-gray-400 text-sm">
                      If held for 10+ years, pay zero capital gains tax on the
                      appreciation of the OZ investment itself.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Program Details
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Established
                  </h3>
                  <p className="text-gray-300">{program.established}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Administered By
                  </h3>
                  <p className="text-gray-300">{program.administeredBy}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Eligible Projects
                  </h3>
                  <p className="text-gray-300">{program.eligibleProjects}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Target Areas
                  </h3>
                  <p className="text-gray-300">{program.targetBeneficiaries}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Compliance
                  </h3>
                  <p className="text-gray-300">{program.compliance}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Best Use Case
                  </h3>
                  <p className="text-gray-300">{program.bestUseCase}</p>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">
                ⚠️ Important Timeline
              </h2>
              <p className="text-gray-300 mb-4">
                The original capital gain deferral ends on{" "}
                <strong className="text-purple-400">December 31, 2026</strong>.
                After this date, the deferred gain becomes taxable regardless of
                whether you sell your OZ investment.
              </p>
              <p className="text-gray-400 text-sm">
                Note: The 10% and 15% step-up in basis benefits were only
                available for investments made by December 31, 2019 and 2021
                respectively. New investments can still benefit from the 10-year
                gain exclusion.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Have Capital Gains to Invest?
              </h3>
              <p className="text-gray-400 mb-6">
                Find Opportunity Zone projects and QOFs to maximize your tax
                benefits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/map?credit=oz"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                >
                  View OZ Map
                </Link>
                <Link
                  href="/programs"
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Compare Programs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
