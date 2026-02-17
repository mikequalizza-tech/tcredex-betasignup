export const metadata = {
  title: "Brownfield Tax Credits | tCredex",
  description: "Learn about Brownfield Tax Credits for cleanup and redevelopment of contaminated properties. Available through state and local programs.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const program = {
  id: 'brownfield',
  name: 'Brownfield',
  fullName: 'Brownfield Tax Credit',
  purpose: 'Incentivize cleanup and redevelopment of contaminated properties',
  established: 'Varies by state/local jurisdiction',
  administeredBy: 'State and local governments',
  creditAmount: 'Typically a percentage of eligible remediation and redevelopment costs',
  claimPeriod: 'Varies by jurisdiction',
  eligibleProjects: 'Properties with environmental contamination requiring cleanup',
  targetBeneficiaries: 'Developers and investors undertaking brownfield redevelopment',
  compliance: 'Must meet environmental cleanup standards',
  impact: 'Supports environmental cleanup and economic revitalization of contaminated sites',
  bestUseCase: 'Redeveloping contaminated or underutilized properties',
};

export default function BrownfieldPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/programs" className="text-indigo-400 hover:text-indigo-300 text-sm">
                ← All Programs
              </Link>
            </div>

            {/* Header */}
            <div className="mb-12">
              <span className="bg-teal-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                {program.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
                {program.fullName}
              </h1>
              <p className="text-xl text-gray-400">
                {program.purpose}
              </p>
            </div>

            {/* What is a Brownfield */}
            <div className="bg-teal-900/30 border border-teal-500/50 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">What is a Brownfield?</h2>
              <p className="text-gray-300 mb-4">
                The EPA defines a brownfield as &quot;a property, the expansion, redevelopment, or reuse of which may be complicated by the presence or potential presence of a hazardous substance, pollutant, or contaminant.&quot;
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-teal-400 font-semibold mb-1">450,000+</p>
                  <p className="text-sm text-gray-400">Estimated brownfields in the US</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-teal-400 font-semibold mb-1">Common Sites</p>
                  <p className="text-sm text-gray-400">Gas stations, dry cleaners, factories</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-teal-400 font-semibold mb-1">Opportunity</p>
                  <p className="text-sm text-gray-400">Often in prime urban locations</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Program Details</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Established</h3>
                  <p className="text-gray-300">{program.established}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Administered By</h3>
                  <p className="text-gray-300">{program.administeredBy}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Credit Structure</h3>
                  <p className="text-gray-300">{program.creditAmount}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Claim Period</h3>
                  <p className="text-gray-300">{program.claimPeriod}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Eligible Projects</h3>
                  <p className="text-gray-300">{program.eligibleProjects}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Compliance</h3>
                  <p className="text-gray-300">{program.compliance}</p>
                </div>
              </div>
            </div>

            {/* Types of Incentives */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Types of Brownfield Incentives</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-700 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-teal-400 mb-2">State Tax Credits</h3>
                  <p className="text-gray-400 text-sm">Many states offer tax credits for qualified cleanup costs, often ranging from 25-100% of eligible expenses.</p>
                </div>
                <div className="border border-gray-700 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-teal-400 mb-2">Federal Expensing</h3>
                  <p className="text-gray-400 text-sm">IRC Section 198 allows immediate deduction of environmental remediation costs for qualified contaminated sites.</p>
                </div>
                <div className="border border-gray-700 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-teal-400 mb-2">EPA Grants</h3>
                  <p className="text-gray-400 text-sm">Brownfields Assessment, Cleanup, and Revolving Loan Fund grants available through EPA programs.</p>
                </div>
                <div className="border border-gray-700 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-teal-400 mb-2">State VCP Programs</h3>
                  <p className="text-gray-400 text-sm">Voluntary Cleanup Programs provide liability protection and streamlined regulatory processes.</p>
                </div>
              </div>
            </div>

            {/* Stacking Note */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 mb-12">
              <h2 className="text-xl font-bold text-white mb-4">💡 Stacking Opportunity</h2>
              <p className="text-gray-300">
                Brownfield incentives can often be combined with other tax credit programs. A contaminated site in an 
                Opportunity Zone that also qualifies for NMTC can leverage multiple incentive layers to make 
                challenging redevelopment projects financially viable.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Have a Contaminated Site?</h3>
              <p className="text-gray-400 mb-6">
                Check what incentives are available and find development partners.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/map?credit=brownfield"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
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
