export const metadata = {
  title: "HTC - Historic Tax Credit | tCredex",
  description:
    "Learn about the Historic Tax Credit program. HTC provides 20% credit for rehabilitation of certified historic buildings.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const program = {
  id: "htc",
  name: "HTC",
  fullName: "Historic Tax Credit",
  purpose: "Preserve and rehabilitate historic, income-producing buildings",
  established: "1976 (IRC Section 47)",
  administeredBy:
    "National Park Service, IRS, State Historic Preservation Offices",
  creditAmount: "20% of Qualified Rehabilitation Expenditures",
  claimPeriod: "5 years (taken ratably at 4% annually)",
  eligibleProjects:
    "Certified historic buildings used for income-producing purposes",
  targetBeneficiaries: "Communities with historic assets",
  compliance: "Must meet preservation standards; 5-year recapture risk",
  impact: "50,000+ historic properties preserved, $127B private investment",
  bestUseCase:
    "Adaptive reuse of historic structures, often combined with affordable housing",
};

export default function HTCPage() {
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
              <span className="bg-amber-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {program.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
                {program.fullName}
              </h1>
              <p className="text-xl text-gray-400">{program.purpose}</p>
            </div>

            {/* Key Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Credit Amount
                </p>
                <p className="text-2xl font-bold text-amber-400">20%</p>
                <p className="text-sm text-gray-400 mt-1">Of QRE</p>
              </div>
              <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Properties Preserved
                </p>
                <p className="text-2xl font-bold text-amber-400">50,000+</p>
                <p className="text-sm text-gray-400 mt-1">Since 1976</p>
              </div>
              <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-6">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">
                  Private Investment
                </p>
                <p className="text-2xl font-bold text-amber-400">$127B+</p>
                <p className="text-sm text-gray-400 mt-1">Leveraged</p>
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

            {/* Certification Process */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">
                Three-Part Certification Process
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Part 1 - Historic Significance
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Certifies the building is listed on the National Register
                      of Historic Places or is a contributing building in a
                      registered historic district.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Part 2 - Rehabilitation Plans
                    </h3>
                    <p className="text-gray-400 text-sm">
                      NPS reviews proposed rehabilitation work to ensure it
                      meets the Secretary of the Interior&apos;s Standards for
                      Rehabilitation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Part 3 - Completed Work
                    </h3>
                    <p className="text-gray-400 text-sm">
                      After completion, NPS certifies the rehabilitation was
                      completed according to approved plans and standards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Have a Historic Building?
              </h3>
              <p className="text-gray-400 mb-6">
                Check if your property qualifies for Historic Tax Credits and
                find investors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/map?credit=htc"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
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
