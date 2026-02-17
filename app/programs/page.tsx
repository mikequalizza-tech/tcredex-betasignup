export const metadata = {
  title: "Tax Credit Programs - tCredex",
  description:
    "Compare LIHTC, NMTC, HTC, Opportunity Zone, and Brownfield Tax Credits. Understand eligibility, credit amounts, and best use cases.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const programs = [
  {
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
    color: "indigo",
  },
  {
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
    color: "green",
  },
  {
    id: "htc",
    name: "HTC",
    fullName: "Historic Tax Credit",
    purpose: "Preserve and rehabilitate historic, income-producing buildings",
    established: "1976 (IRC Section 47)",
    administeredBy:
      "National Park Service, IRS, State Historic Preservation Offices",
    creditAmount: "20% of Qualified Rehabilitation Expenditures",
    claimPeriod: "5 years (4% annually)",
    eligibleProjects:
      "Certified historic buildings used for income-producing purposes",
    targetBeneficiaries: "Communities with historic assets",
    compliance: "Must meet preservation standards; 5-year recapture risk",
    impact: "50,000+ historic properties preserved, $127B private investment",
    bestUseCase:
      "Adaptive reuse of historic structures, often combined with affordable housing",
    color: "amber",
  },
  {
    id: "oz",
    name: "Opportunity Zone",
    fullName: "Opportunity Zone",
    purpose:
      "Encourage long-term private investment in low-income and distressed communities",
    established: "2017 (Tax Cuts and Jobs Act)",
    administeredBy: "U.S. Treasury",
    creditAmount:
      "Deferral of capital gains taxes by reinvesting into QOFs; step-up in basis of 10% after 5 years, 15% after 7 years; exclusion of gains on QOF investments held for 10+ years",
    claimPeriod: "Varies (deferment and exclusion tied to holding periods)",
    eligibleProjects:
      "Real estate development, business investments, infrastructure",
    targetBeneficiaries:
      "Census tracts nominated by states and certified by Treasury",
    compliance: "Investments must be in designated Opportunity Zones",
    impact: "Significant tax benefits for long-term investments",
    bestUseCase:
      "Long-term investments in underserved communities with significant tax benefits",
    color: "purple",
  },
  {
    id: "brownfield",
    name: "Brownfield",
    fullName: "Brownfield Tax Credit",
    purpose: "Incentivize cleanup and redevelopment of contaminated properties",
    established: "Varies by state/local jurisdiction",
    administeredBy: "State and local governments",
    creditAmount:
      "Typically a percentage of eligible remediation and redevelopment costs",
    claimPeriod: "Varies",
    eligibleProjects:
      "Properties with environmental contamination requiring cleanup",
    targetBeneficiaries:
      "Developers and investors undertaking brownfield redevelopment",
    compliance: "Must meet environmental cleanup standards",
    impact:
      "Supports environmental cleanup and economic revitalization of contaminated sites",
    bestUseCase: "Redeveloping contaminated or underutilized properties",
    color: "teal",
  },
];

const colorClasses: Record<
  string,
  { bg: string; border: string; text: string; badge: string }
> = {
  indigo: {
    bg: "bg-indigo-900/30",
    border: "border-indigo-500/50",
    text: "text-indigo-400",
    badge: "bg-indigo-600",
  },
  green: {
    bg: "bg-green-900/30",
    border: "border-green-500/50",
    text: "text-green-400",
    badge: "bg-green-600",
  },
  amber: {
    bg: "bg-amber-900/30",
    border: "border-amber-500/50",
    text: "text-amber-400",
    badge: "bg-amber-600",
  },
  purple: {
    bg: "bg-purple-900/30",
    border: "border-purple-500/50",
    text: "text-purple-400",
    badge: "bg-purple-600",
  },
  teal: {
    bg: "bg-teal-900/30",
    border: "border-teal-500/50",
    text: "text-teal-400",
    badge: "bg-teal-600",
  },
};

export default function ProgramsPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center pb-12">
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                Tax Credit Program Comparison
              </h1>
              <p className="text-lg text-indigo-200/65 max-w-3xl mx-auto">
                Compare five key tax credit programs used in real estate finance
                and community development. Each program offers unique benefits
                for different project types.
              </p>
            </div>

            {/* Quick Compare Table */}
            <div className="overflow-x-auto mb-16">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-4 px-4 text-left text-gray-400 font-medium">
                      Feature
                    </th>
                    {programs.map((p) => (
                      <th
                        key={p.id}
                        className={`py-4 px-4 text-left font-medium ${colorClasses[p.color].text}`}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4 text-gray-400">Purpose</td>
                    {programs.map((p) => (
                      <td
                        key={p.id}
                        className="py-3 px-4 text-gray-300 text-xs"
                      >
                        {p.purpose}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4 text-gray-400">Credit Amount</td>
                    {programs.map((p) => (
                      <td
                        key={p.id}
                        className="py-3 px-4 text-gray-300 text-xs"
                      >
                        {p.creditAmount.split(" ")[0]}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4 text-gray-400">Claim Period</td>
                    {programs.map((p) => (
                      <td
                        key={p.id}
                        className="py-3 px-4 text-gray-300 text-xs"
                      >
                        {p.claimPeriod}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4 text-gray-400">Best Use</td>
                    {programs.map((p) => (
                      <td
                        key={p.id}
                        className="py-3 px-4 text-gray-300 text-xs"
                      >
                        {p.bestUseCase.split(" ").slice(0, 4).join(" ")}...
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Program Cards */}
            <div className="space-y-8">
              {programs.map((program) => {
                const colors = colorClasses[program.color];
                return (
                  <div
                    key={program.id}
                    className={`${colors.bg} border ${colors.border} rounded-2xl p-6 md:p-8`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                      <div>
                        <span
                          className={`${colors.badge} text-white text-xs font-medium px-3 py-1 rounded-full`}
                        >
                          {program.name}
                        </span>
                        <h2 className="text-2xl font-bold text-white mt-3">
                          {program.fullName}
                        </h2>
                        <p className="text-gray-400 mt-1">{program.purpose}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Established</p>
                        <p className={`${colors.text} font-medium`}>
                          {program.established}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Administered By
                        </p>
                        <p className="text-gray-300 text-sm">
                          {program.administeredBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Credit Amount
                        </p>
                        <p className="text-gray-300 text-sm">
                          {program.creditAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Claim Period
                        </p>
                        <p className="text-gray-300 text-sm">
                          {program.claimPeriod}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Eligible Projects
                        </p>
                        <p className="text-gray-300 text-sm">
                          {program.eligibleProjects}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Target Beneficiaries
                        </p>
                        <p className="text-gray-300 text-sm">
                          {program.targetBeneficiaries}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Compliance
                        </p>
                        <p className="text-gray-300 text-sm">
                          {program.compliance}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-700/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Impact
                        </p>
                        <p className={`${colors.text} font-medium`}>
                          {program.impact}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          href={`/map?credit=${program.id}`}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View Deals
                        </Link>
                        <Link
                          href="/signup"
                          className={`px-4 py-2 ${colors.badge} hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity`}
                        >
                          Get Started
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Strategic Layering Section */}
            <div className="mt-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Strategic Layering
              </h2>
              <p className="text-gray-400 mb-6">
                Tax credits can be strategically combined to maximize financing
                potential while respecting program compliance rules.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                    <div>
                      <p className="text-white font-medium">LIHTC + HTC</p>
                      <p className="text-gray-400 text-sm">
                        Common for affordable housing in historic buildings
                        (e.g., mill-to-housing conversions)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                    <div>
                      <p className="text-white font-medium">LIHTC + NMTC</p>
                      <p className="text-gray-400 text-sm">
                        Used when housing is part of larger community
                        development projects (e.g., mixed-use with clinics)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
                    <div>
                      <p className="text-white font-medium">NMTC + HTC</p>
                      <p className="text-gray-400 text-sm">
                        Effective for redeveloping historic commercial or
                        community facilities in distressed areas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
                    <div>
                      <p className="text-white font-medium">OZ + Brownfield</p>
                      <p className="text-gray-400 text-sm">
                        Can be layered with other credits to attract capital
                        with deferred and excluded gains while addressing
                        cleanup costs
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Find the Right Credits for Your Project?
              </h3>
              <p className="text-gray-400 mb-6">
                Use our AI-powered eligibility checker to instantly determine
                which tax credits your project qualifies for.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/map"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                >
                  Check Eligibility on Map
                </Link>
                <Link
                  href="/automatch"
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Try AutoMatch AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
