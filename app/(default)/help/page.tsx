"use client";

import Link from "next/link";
import { CalendlyButton } from "@/components/integrations/CalendlyEmbed";

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const quickLinks: QuickLink[] = [
  {
    title: "Getting Started",
    description: "New to tCredex? Start here to learn the basics.",
    href: "/help/get-started",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "What is tCredex?",
    description: "Learn about the platform and how it can help you.",
    href: "/help/what-is-tcredex",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Sponsor Guide",
    description: "Complete guide for project sponsors and developers.",
    href: "/help/sponsor-account-guide",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    title: "CDE Guide",
    description: "Learn how CDEs use tCredex to find and manage deals.",
    href: "/help/cde-account-guide",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    title: "Investor Guide",
    description: "How investors discover and commit to tax credit deals.",
    href: "/help/investor-account-guide",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "FAQ",
    description: "Answers to commonly asked questions.",
    href: "/help/frequently-asked-questions",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
];

interface FeatureSection {
  title: string;
  description: string;
  articles: { title: string; href: string }[];
}

const featureSections: FeatureSection[] = [
  {
    title: "Platform Features",
    description: "Learn how to use the core features of tCredex.",
    articles: [
      { title: "Intake Form Guide", href: "/help/tCredex_Intake_Form" },
      {
        title: "How Intake Drives the System",
        href: "/help/how-intake-drives-system",
      },
      { title: "AutoMatch Explained", href: "/help/automatch-explained" },
      { title: "The Map", href: "/help/map-source-of-truth" },
      { title: "Closing Room Guide", href: "/help/closing-room-guide" },
      { title: "ChatTC", href: "/help/how-chatTC-works" },
    ],
  },
  {
    title: "Plans & Billing",
    description: "Information about subscriptions and payments.",
    articles: [
      { title: "tCredex Plans", href: "/help/tcredex-plans" },
      { title: "Payments FAQ", href: "/help/payments-faqs" },
    ],
  },
];

export default function DocsIndexPage() {
  return (
    <div className="py-12 md:py-16 lg:py-20">
      {/* Hero Section */}
      <div className="mb-12 md:mb-16">
        <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl lg:text-5xl">
          Documentation
        </h1>
        <p className="text-lg text-indigo-200/65 max-w-2xl">
          Everything you need to know about using tCredex to navigate tax credit
          financing. From getting started to advanced features, we&apos;ve got
          you covered.
        </p>
      </div>

      {/* Quick Links Grid */}
      <div className="mb-16">
        <h2 className="text-lg font-semibold text-gray-200 mb-6">
          Popular Topics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-xl bg-gray-800/40 border border-gray-700/50 p-5 transition hover:bg-gray-800/60 hover:border-indigo-500/50"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600/30 transition">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-200 group-hover:text-indigo-400 transition mb-1">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {link.description}
                  </p>
                </div>
              </div>
              <svg
                className="absolute top-5 right-5 w-4 h-4 text-gray-600 group-hover:text-indigo-500 transition"
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
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Sections */}
      {featureSections.map((section) => (
        <div key={section.title} className="mb-12">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              {section.title}
            </h2>
            <p className="text-sm text-gray-400">{section.description}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {section.articles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="group flex items-center gap-3 rounded-lg bg-gray-800/20 border border-gray-800 px-4 py-3 transition hover:bg-gray-800/40 hover:border-gray-700"
              >
                <svg
                  className="w-4 h-4 text-gray-600 group-hover:text-indigo-500 transition flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-gray-300 group-hover:text-gray-200 transition">
                  {article.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Help Banner */}
      <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">
              Need more help?
            </h2>
            <p className="text-gray-400">
              Can&apos;t find what you&apos;re looking for? Our support team is
              here to help.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CalendlyButton
              url="https://calendly.com/tcredex-com/30min"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Book a Support Session
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </CalendlyButton>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-700/50 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
            >
              Contact Support
            </Link>
            <Link
              href="/help/frequently-asked-questions"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-700/50 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
