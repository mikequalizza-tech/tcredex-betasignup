import type { Metadata } from "next";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";

export const metadata: Metadata = {
  title: "How it works - tCredex",
  description:
    "See how tCredex works for Sponsors, CDEs, and Investors — role-based dashboards, AI AutoMatch, interactive maps, and closing rooms.",
};

interface NavPage {
  name: string;
  description: string;
}

const sponsorPages: NavPage[] = [
  {
    name: "Dashboard",
    description: "Overview of your deals, pipeline status, and notifications.",
  },
  {
    name: "Submit Deal",
    description:
      "Dynamic intake form that adapts to your deal's tax credit programs and capital stack.",
  },
  {
    name: "Pipeline",
    description:
      "Track your deals from Draft through Submitted, Under Review, Matched, and into Closing.",
  },
  {
    name: "Map",
    description:
      "85,000+ census tracts with NMTC, LIHTC, HTC, OZ, and Brownfield eligibility — find where your project qualifies.",
  },
  {
    name: "Allocations",
    description:
      "View your deal's capital stack, financing structure, and credit amounts.",
  },
  {
    name: "Marketplace",
    description:
      "Browse CDEs and investors with AI AutoMatch scores in Map View or Row View.",
  },
  {
    name: "Documents",
    description:
      "Upload and manage deal documents organized by category and status.",
  },
  {
    name: "Closing Room",
    description:
      "Secure document vault with checklists, party management, and real-time status tracking.",
  },
  {
    name: "Organization",
    description: "Manage your team members, roles, and permissions.",
  },
  {
    name: "Settings",
    description: "Account preferences and notification settings.",
  },
];

const cdePages: NavPage[] = [
  {
    name: "Dashboard",
    description:
      "Overview of matched deals, allocation tracking, and incoming requests.",
  },
  {
    name: "Pipeline",
    description:
      "Review incoming deals and track status through matching, LOIs, and closing.",
  },
  {
    name: "Map",
    description:
      "Geographic visualization of deal locations overlaid with your service areas and eligibility data.",
  },
  {
    name: "Allocations",
    description:
      "Track NMTC allocation usage, deployment by year, and remaining capacity.",
  },
  {
    name: "AutoMatch AI",
    description:
      "AI-powered 15-criteria matching finds the best-fit deals for your allocation and preferences.",
  },
  {
    name: "Marketplace",
    description:
      "Browse available deals with real-time AutoMatch scores — Map View or Row View.",
  },
  {
    name: "Documents",
    description:
      "Manage closing documents, compliance files, and due diligence materials.",
  },
  {
    name: "Closing Room",
    description:
      "Coordinate closing with sponsors and investors — checklists, documents, and party tracking.",
  },
  {
    name: "Organization",
    description: "Manage your CDE team, invite members, and assign roles.",
  },
  {
    name: "Settings",
    description: "Account preferences and notification settings.",
  },
];

const investorPages: NavPage[] = [
  {
    name: "Dashboard",
    description:
      "Portfolio overview, active commitments, and CRA compliance metrics.",
  },
  {
    name: "Pipeline",
    description:
      "Track deals from initial interest through commitment and closing.",
  },
  {
    name: "Map",
    description:
      "View deal locations, CRA-eligible tracts, and geographic diversification.",
  },
  {
    name: "AutoMatch AI",
    description:
      "AI-powered matching finds deals aligned with your investment criteria and CRA goals.",
  },
  {
    name: "Marketplace",
    description:
      "Browse available deals with AutoMatch scores tailored to your preferences.",
  },
  {
    name: "Portfolio",
    description:
      "Track active investments, commitment amounts, and deal performance.",
  },
  {
    name: "Documents",
    description:
      "Access investment documents, compliance files, and closing materials.",
  },
  {
    name: "Closing Room",
    description:
      "Review closing documents, track checklist progress, and coordinate with deal parties.",
  },
  {
    name: "Organization",
    description: "Manage your team, invite members, and assign roles.",
  },
  {
    name: "Settings",
    description: "Account preferences and notification settings.",
  },
];

const roles = [
  {
    name: "Sponsor",
    subtitle: "Project developers seeking tax credit allocation",
    color: "indigo",
    pages: sponsorPages,
    borderClass: "border-indigo-500/30",
    bgClass: "bg-indigo-900/20",
    badgeClass: "bg-indigo-900/50 text-indigo-300 border-indigo-500/30",
    dotClass: "bg-indigo-400",
  },
  {
    name: "CDE",
    subtitle: "Community Development Entities with federal allocation",
    color: "emerald",
    pages: cdePages,
    borderClass: "border-emerald-500/30",
    bgClass: "bg-emerald-900/20",
    badgeClass: "bg-emerald-900/50 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  {
    name: "Investor",
    subtitle: "Banks and institutions providing capital",
    color: "amber",
    pages: investorPages,
    borderClass: "border-amber-500/30",
    bgClass: "bg-amber-900/20",
    badgeClass: "bg-amber-900/50 text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
];

export default function HowItWorks() {
  return (
    <>
      <PageIllustration multiple />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            <div className="pb-12 text-center">
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                How tCredex Works
              </h1>
              <p className="mx-auto max-w-3xl text-xl text-indigo-200/65">
                One platform, three roles. Every user gets a tailored workspace
                with the tools they need — from deal intake to closing.
              </p>
            </div>

            {/* Role-based walkthrough */}
            <div className="grid gap-8 lg:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role.name}
                  className={`rounded-2xl border ${role.borderClass} ${role.bgClass} p-6`}
                >
                  <div className="mb-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${role.badgeClass} border mb-2`}
                    >
                      {role.name}
                    </span>
                    <p className="text-sm text-gray-400">{role.subtitle}</p>
                  </div>

                  <div className="space-y-4">
                    {role.pages.map((page) => (
                      <div key={page.name} className="flex gap-3">
                        <div className="mt-2 flex-shrink-0">
                          <div
                            className={`w-2 h-2 rounded-full ${role.dotClass}`}
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-200">
                            {page.name}
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {page.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Shared capabilities */}
            <div className="mt-12 rounded-2xl border border-gray-700/50 bg-gray-900/50 p-8">
              <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
                Shared Across All Roles
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl mb-3">🗺️</div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">
                    Interactive Map
                  </h3>
                  <p className="text-sm text-gray-400">
                    85,000+ census tracts with 5 tax credit program eligibility
                    layers and deal markers.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">
                    AI AutoMatch
                  </h3>
                  <p className="text-sm text-gray-400">
                    Binary scoring across 15 criteria — geography, sector,
                    distress, and more. No subjective weighting.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📁</div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">
                    Closing Room
                  </h3>
                  <p className="text-sm text-gray-400">
                    Secure document vault with checklists, party management, and
                    real-time status tracking.
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
