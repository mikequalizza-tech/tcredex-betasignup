export const metadata = {
  title: "LIHTC - Low-Income Housing Tax Credit | tCredex",
  description:
    "Learn about the Low-Income Housing Tax Credit program. LIHTC provides 9% or 4% credits for affordable housing development.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const program = {
  id: "lihtc",
  name: "LIHTC",
  fullName: "Low-Income Housing Tax Credit",
  purpose: "Expand affordable rental housing",
  established: "1986 (Tax Reform Act)",
  administeredBy: "IRS and State Housing Finance Agencies",
  creditAmount: "9% (competitive) or 4% (bond-financed) of eligible costs",
  claimPeriod: "10 years (credits claimed annually)",
  eligibleProjects: "Affordable rental housing",
  targetBeneficiaries: "Households at or below 60% AMI",
  compliance: "15-year compliance period (often extended to 30+ years)",
  impact: "~3.7 million affordable units built",
  bestUseCase: "Cornerstone financing for affordable housing developments",
};

export default function LIHTCPage() {
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
              <span className="bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {program.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
                {program.fullName}
              </h1>
              <p className="text-xl text-gray-400">{program.purpose}</p>
            </div>

            {/* Key Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Credit Rates
                </p>
                <p className="text-2xl font-bold text-indigo-400">9% / 4%</p>
                <p className="text-sm text-gray-400 mt-1">Competitive / Bond</p>
              </div>
              <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Units Built
                </p>
                <p className="text-2xl font-bold text-indigo-400">3.7M+</p>
                <p className="text-sm text-gray-400 mt-1">Since 1986</p>
              </div>
              <div className="bg-indigo-900/30 border border-indigo-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Credit Period
                </p>
                <p className="text-2xl font-bold text-indigo-400">10 Years</p>
                <p className="text-sm text-gray-400 mt-1">Annual claims</p>
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

            {/* 9% vs 4% Comparison */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                9% vs 4% Credits
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-indigo-400 mb-4">
                    9% Credit (Competitive)
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Approximately 9% of eligible costs annually for 10 years
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Highly competitive allocation process
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Best for new construction
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Limited annual allocation per state
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-300 mb-4">
                    4% Credit (As-of-Right)
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      Approximately 4% of eligible costs annually for 10 years
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      Non-competitive, paired with tax-exempt bonds
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      Often used for acquisition/rehab
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      Unlimited if bonds are available
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Explore LIHTC for Your Project?
              </h3>
              <p className="text-gray-400 mb-6">
                Check your project&apos;s eligibility and connect with housing
                finance agencies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/map?credit=lihtc"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                >
                  Check Eligibility
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
