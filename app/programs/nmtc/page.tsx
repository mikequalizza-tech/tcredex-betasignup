export const metadata = {
  title: "NMTC - New Markets Tax Credit | tCredex",
  description:
    "Learn about the New Markets Tax Credit program. NMTC provides 39% credit over 7 years for investments in low-income communities.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const program = {
  id: "nmtc",
  name: "NMTC",
  fullName: "New Markets Tax Credit",
  purpose: "Spur private investment in low-income and distressed communities",
  established: "2000 (Community Renewal Tax Relief Act)",
  administeredBy: "U.S. Treasury's CDFI Fund",
  creditAmount:
    "39% of Qualified Equity Investment over 7 years (5% for first 3 years, 6% for last 4 years)",
  claimPeriod: "7 years",
  eligibleProjects:
    "Community facilities, businesses, mixed-use real estate in low-income census tracts",
  targetBeneficiaries: "Residents of low-income census tracts",
  compliance: "At least 85% of funds invested in qualified projects",
  impact:
    "7,100+ projects financed, leveraging $8 private investment per $1 federal credit",
  bestUseCase:
    "Financing community-serving projects like healthcare, schools, manufacturing",
};

export default function NMTCPage() {
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
              <span className="bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {program.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
                {program.fullName}
              </h1>
              <p className="text-xl text-gray-400">{program.purpose}</p>
            </div>

            {/* Key Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Credit Amount
                </p>
                <p className="text-2xl font-bold text-green-400">39%</p>
                <p className="text-sm text-gray-400 mt-1">Over 7 years</p>
              </div>
              <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Projects Financed
                </p>
                <p className="text-2xl font-bold text-green-400">7,100+</p>
                <p className="text-sm text-gray-400 mt-1">Since 2000</p>
              </div>
              <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Leverage Ratio
                </p>
                <p className="text-2xl font-bold text-green-400">8:1</p>
                <p className="text-sm text-gray-400 mt-1">Private to Federal</p>
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
                    Credit Structure
                  </h3>
                  <p className="text-gray-300">{program.creditAmount}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Claim Period
                  </h3>
                  <p className="text-gray-300">{program.claimPeriod}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Eligible Projects
                  </h3>
                  <p className="text-gray-300">{program.eligibleProjects}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Target Beneficiaries
                  </h3>
                  <p className="text-gray-300">{program.targetBeneficiaries}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                    Compliance Requirements
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

            {/* How It Works */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                How NMTC Works
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      CDE Receives Allocation
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Community Development Entities (CDEs) compete for and
                      receive NMTC allocation from the CDFI Fund.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Investor Makes QEI
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Investors make Qualified Equity Investments (QEI) into
                      CDEs, receiving tax credits of 39% over 7 years.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      CDE Deploys Capital
                    </h3>
                    <p className="text-gray-400 text-sm">
                      CDEs use the capital to make Qualified Low-Income
                      Community Investments (QLICIs) in eligible projects.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Project Receives Financing
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Qualified businesses receive below-market financing,
                      typically with significant forgiveness after the 7-year
                      compliance period.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Explore NMTC for Your Project?
              </h3>
              <p className="text-gray-400 mb-6">
                Check your project&apos;s eligibility and get matched with CDEs
                that have available allocation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/map?credit=nmtc"
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                >
                  Check Eligibility
                </Link>
                <Link
                  href="/automatch"
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Find CDE Matches
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
