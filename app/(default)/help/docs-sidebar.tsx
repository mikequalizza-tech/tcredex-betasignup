"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  description?: string;
}

interface NavSection {
  section: string;
  icon?: React.ReactNode;
  items: NavItem[];
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const sections: NavSection[] = [
  {
    section: "Introduction",
    items: [
      { name: "What is tCredex?", href: "/help/what-is-tcredex" },
      { name: "System Overview", href: "/help/system-overview" },
      { name: "Getting Started", href: "/help/get-started" },
    ],
  },
  {
    section: "Accounts & Roles",
    items: [
      { name: "Create an Account", href: "/help/create-account" },
      { name: "Sponsor Guide", href: "/help/sponsor-account-guide" },
      { name: "CDE Guide", href: "/help/cde-account-guide" },
      { name: "Investor Guide", href: "/help/investor-account-guide" },
      { name: "Roles & Teams", href: "/help/roles-and-teams" },
    ],
  },
  {
    section: "Platform Features",
    items: [
      { name: "Intake Form", href: "/help/tCredex_Intake_Form" },
      {
        name: "How Intake Drives the System",
        href: "/help/how-intake-drives-system",
      },
      { name: "AutoMatch Explained", href: "/help/automatch-explained" },
      { name: "The Map", href: "/help/map-source-of-truth" },
      { name: "Closing Room", href: "/help/closing-room-guide" },
      { name: "ChatTC", href: "/help/how-chatTC-works" },
    ],
  },
  {
    section: "Guides by Role",
    items: [
      { name: "For CDEs", href: "/help/for-cdes" },
      { name: "For Investors", href: "/help/for-investors" },
    ],
  },
  {
    section: "Plans & Billing",
    items: [
      { name: "tCredex Plans", href: "/help/tcredex-plans" },
      { name: "Payments FAQ", href: "/help/payments-faqs" },
    ],
  },
  {
    section: "FAQ & Security",
    items: [
      { name: "General FAQ", href: "/help/frequently-asked-questions" },
      { name: "Data Security", href: "/help/data-security" },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    // Expand the section containing the current page by default
    const initial: Record<string, boolean> = {};
    sections.forEach((section) => {
      const isActive = section.items.some((item) => pathname === item.href);
      initial[section.section] = isActive || section.section === "Introduction";
    });
    return initial;
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  return (
    <aside className="hidden md:block w-64 shrink-0 pr-8 py-12">
      <div className="sticky top-24">
        {/* Logo/Title */}
        <Link href="/help" className="flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-200 group-hover:text-indigo-400 transition">
            Docs
          </span>
        </Link>

        {/* Search placeholder */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search docs..."
              className="w-full rounded-lg bg-gray-800/50 border border-gray-700 px-4 py-2 pl-10 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {sections.map((section) => (
            <div key={section.section} className="mb-4">
              {/* Section Header - Collapsible */}
              <button
                onClick={() => toggleSection(section.section)}
                className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-400 mb-2 py-1"
              >
                <span>{section.section}</span>
                <ChevronIcon expanded={expandedSections[section.section]} />
              </button>

              {/* Section Items */}
              {expandedSections[section.section] && (
                <ul className="space-y-0.5 ml-1 border-l border-gray-800">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block py-1.5 pl-4 -ml-px border-l text-sm transition ${
                            isActive
                              ? "border-indigo-500 text-indigo-400 font-medium"
                              : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
