import type { Metadata } from "next";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";

export const metadata: Metadata = {
  title: "Features - tCredex",
  description:
    "Explore tCredex platform features: AI-powered matching, 5 tax credit programs, automated compliance, and closing room management.",
};

const taxCreditPrograms = [
  {
    name: "LIHTC",
    fullName: "Low-Income Housing Tax Credit",
    purpose: "Expand affordable rental housing",
    established: "1986 (Tax Reform Act)",
    creditAmount: "9% (competitive) or 4% (bond-financed) of eligible costs",
    claimPeriod: "10 years (credits claimed annually)",
    eligibleProjects: "Affordable rental housing",
    impact: "~3.7 million affordable units built",
    bestUseCase: "Cornerstone financing for affordable housing developments",
  },
  {
    name: "NMTC",
    fullName: "New Markets Tax Credit",
    purpose: "Spur private investment in low-income and distressed communities",
    established: "2000 (Community Renewal Tax Relief Act)",
    creditAmount: "39% of QEI over 7 years (5% for 3 years, 6% for 4 years)",
    claimPeriod: "7 years",
    eligibleProjects: "Community facilities, businesses, mixed-use real estate",
    impact: "7,100+ projects, $8 leveraged per $1 federal credit",
    bestUseCase: "Healthcare, schools, manufacturing in distressed areas",
  },
  {
    name: "HTC",
    fullName: "Historic Tax Credit",
    purpose: "Preserve and rehabilitate historic buildings",
    established: "1976 (IRC Section 47)",
    creditAmount: "20% of Qualified Rehabilitation Expenditures",
    claimPeriod: "5 years (4% annually)",
    eligibleProjects: "Certified historic buildings for income-producing use",
    impact: "50,000+ properties preserved, $127B private investment",
    bestUseCase: "Adaptive reuse of historic structures",
  },
  {
    name: "OZ",
    fullName: "Opportunity Zone",
    purpose: "Encourage long-term investment in distressed communities",
    established: "2017 (Tax Cuts and Jobs Act)",
    creditAmount:
      "Deferral + step-up in basis (10% at 5yr, 15% at 7yr) + exclusion at 10yr",
    claimPeriod: "Varies (tied to holding periods)",
    eligibleProjects: "Real estate, business investments, infrastructure",
    impact: "Significant tax benefits for long-term investments",
    bestUseCase: "Long-term capital deployment in designated zones",
  },
  {
    name: "Brownfield",
    fullName: "Brownfield Tax Credit",
    purpose: "Incentivize cleanup of contaminated properties",
    established: "Varies by state/local jurisdiction",
    creditAmount: "Percentage of eligible remediation costs",
    claimPeriod: "Varies",
    eligibleProjects: "Properties requiring environmental cleanup",
    impact: "Environmental and economic revitalization",
    bestUseCase: "Redeveloping contaminated or underutilized sites",
  },
];

const platformFeatures = [
  {
    title: "AutoMatch AI",
    description:
      "3-Deal Rule matching connects sponsors with optimal CDEs based on geography, project type, and impact alignment.",
    icon: "🤖",
  },
  {
    title: "Census Tract Lookup",
    description:
      "Instant verification for NMTC, OZ, and place-based incentive eligibility.",
    icon: "🗺️",
  },
  {
    title: "Dynamic Deal Intake",
    description:
      "tCredex Deal Intake Form adapts based on your deal's tax credit type and capital stack — NMTC, LIHTC, HTC, OZ, or Brownfield.",
    icon: "📝",
  },
  {
    title: "Compliance Engine",
    description:
      "Automated QALICB checks, debarment screening, QEI timeline estimation.",
    icon: "✅",
  },
  {
    title: "Closing Room",
    description: "Document management, checklist tracking, fee calculation.",
    icon: "📁",
  },
  {
    title: "Role-Based Marketplace",
    description:
      "Two marketplace formats with AI AutoMatch built in — Map View or Row View — with results filtered by your role.",
    icon: "🏪",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageIllustration multiple />
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="mx-auto max-w-3xl pb-12 text-center">
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                Platform Features
              </h1>
              <p className="text-lg text-indigo-200/65">
                tCredex combines powerful technology with deep tax credit
                expertise.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
              {platformFeatures.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-6 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-gray-400">{f.description}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-gray-100 text-center mb-8">
              5 Tax Credit Programs
            </h2>

            <div className="space-y-6">
              {taxCreditPrograms.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    <div className="lg:w-1/4">
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 mb-2">
                        {p.name}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-100">
                        {p.fullName}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {p.established}
                      </p>
                    </div>
                    <div className="lg:w-3/4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500">Purpose</p>
                        <p className="text-gray-300">{p.purpose}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Credit Amount</p>
                        <p className="text-gray-300">{p.creditAmount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Eligible Projects
                        </p>
                        <p className="text-gray-300">{p.eligibleProjects}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Impact</p>
                        <p className="text-gray-300">{p.impact}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Best Use Case</p>
                        <p className="text-indigo-300">{p.bestUseCase}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-2xl border border-indigo-500/30 bg-indigo-900/20 p-8">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                Strategic Layering
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold text-indigo-300 mb-2">
                    LIHTC + HTC
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Affordable housing in historic buildings (mill-to-housing
                    conversions)
                  </p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold text-indigo-300 mb-2">
                    LIHTC + NMTC
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Housing as part of larger community development (mixed-use
                    with clinics)
                  </p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold text-indigo-300 mb-2">
                    NMTC + HTC
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Historic commercial/community facilities in distressed areas
                  </p>
                </div>
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <h4 className="font-semibold text-indigo-300 mb-2">
                    NMTC + OZ + Brownfield
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Triple-layer for contaminated sites in opportunity zones
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FooterSeparator />
    </>
  );
}
