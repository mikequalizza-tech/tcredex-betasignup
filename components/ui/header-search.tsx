"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";

interface SearchResult {
  type: "page" | "blog" | "deal" | "help" | "cde";
  title: string;
  href: string;
  description?: string;
  roles?: Array<"sponsor" | "cde" | "investor" | "all">;
}

// Base pages available to all users
const basePages: SearchResult[] = [
  {
    type: "page",
    title: "Home",
    href: "/",
    description: "tCredex homepage",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Map",
    href: "/map",
    description: "Interactive deal map with census tract data",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Marketplace",
    href: "/deals",
    description: "Browse tax credit opportunities",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Dashboard",
    href: "/dashboard",
    description: "Your dashboard",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Messages",
    href: "/messages",
    description: "View and send messages",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Documents",
    href: "/dashboard/documents",
    description: "Your documents and files",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Organization",
    href: "/dashboard/teams",
    description: "Manage organization and team",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Settings",
    href: "/dashboard/settings",
    description: "Account settings",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Closing Room",
    href: "/closing-room",
    description: "Deal closing management",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Blog",
    href: "/blog",
    description: "Tax credit insights and news",
    roles: ["all"],
  },
  {
    type: "page",
    title: "Help Center",
    href: "/help",
    description: "Get help with tCredex platform",
    roles: ["all"],
  },
];

// Role-specific pages
const rolePages: SearchResult[] = [
  // Sponsor-specific
  {
    type: "page",
    title: "Submit New Deal",
    href: "/deals/new",
    description: "Submit a new project to the marketplace",
    roles: ["sponsor"],
  },
  {
    type: "page",
    title: "My Projects",
    href: "/dashboard/projects",
    description: "View and manage your submitted projects",
    roles: ["sponsor"],
  },
  {
    type: "page",
    title: "Pipeline",
    href: "/dashboard/pipeline",
    description: "Track your deal progress",
    roles: ["sponsor"],
  },

  // CDE-specific
  {
    type: "page",
    title: "Pipeline",
    href: "/dashboard/pipeline",
    description: "Review incoming deals",
    roles: ["cde"],
  },
  {
    type: "page",
    title: "Allocations",
    href: "/dashboard/allocations",
    description: "Manage your NMTC allocations",
    roles: ["cde"],
  },
  {
    type: "page",
    title: "AutoMatch AI",
    href: "/dashboard/automatch",
    description: "AI-powered deal matching",
    roles: ["cde"],
  },

  // Investor-specific
  {
    type: "page",
    title: "Portfolio",
    href: "/dashboard/portfolio",
    description: "View your investment portfolio",
    roles: ["investor"],
  },
  {
    type: "page",
    title: "AutoMatch AI",
    href: "/dashboard/automatch",
    description: "AI-powered investment matching",
    roles: ["investor"],
  },
  {
    type: "page",
    title: "Pipeline",
    href: "/dashboard/pipeline",
    description: "Track investment opportunities",
    roles: ["investor"],
  },
];

// Blog posts
const blogPosts: SearchResult[] = [
  {
    type: "blog",
    title: "NMTC Overview",
    href: "/blog/tcredex-five-tax-credit-platform",
    description: "The first platform for all five tax-credit programs",
    roles: ["all"],
  },
  {
    type: "blog",
    title: "Blended Capital Stacks",
    href: "/blog/blended-capital-stacks-how-to-combine-tax-credits",
    description: "How to combine NMTC, LIHTC, HTC, and OZ",
    roles: ["all"],
  },
  {
    type: "blog",
    title: "QALICB Qualification",
    href: "/blog/qalicb-qualification-technical-rules-nmtc-practitioners",
    description: "Technical rules every NMTC practitioner must master",
    roles: ["cde", "sponsor"],
  },
  {
    type: "blog",
    title: "HTC/NMTC Master Lease",
    href: "/blog/htc-nmtc-master-lease-structures-how-they-work",
    description: "How master lease structures work",
    roles: ["all"],
  },
  {
    type: "blog",
    title: "Opportunity Zones",
    href: "/blog/opportunity-zones-what-developers-investors-need-to-know",
    description: "What developers and investors need to know",
    roles: ["sponsor", "investor"],
  },
  {
    type: "blog",
    title: "State Tax Credits",
    href: "/blog/state-tax-credits-missing-layer-modern-capital-stacks",
    description: "The missing layer in modern capital stacks",
    roles: ["all"],
  },
  {
    type: "blog",
    title: "Compliance Pitfalls",
    href: "/blog/compliance-pitfalls-in-tax-credit-deals",
    description: "Common pitfalls and how to avoid them",
    roles: ["cde", "sponsor"],
  },
];

// Help articles
const helpArticles: SearchResult[] = [
  {
    type: "help",
    title: "Getting Started",
    href: "/help/getting-started",
    description: "New to tCredex? Start here",
    roles: ["all"],
  },
  {
    type: "help",
    title: "Account Setup",
    href: "/help/account-setup",
    description: "Set up your organization profile",
    roles: ["all"],
  },
  {
    type: "help",
    title: "Submitting Deals",
    href: "/help/submitting-deals",
    description: "How to submit projects to the marketplace",
    roles: ["sponsor"],
  },
  {
    type: "help",
    title: "Reviewing Deals",
    href: "/help/reviewing-deals",
    description: "How to review and score deals",
    roles: ["cde"],
  },
  {
    type: "help",
    title: "Investing",
    href: "/help/investing",
    description: "How to invest in tax credit deals",
    roles: ["investor"],
  },
];

export default function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [dealResults, setDealResults] = useState<SearchResult[]>([]);
  const [cdeResults, setCdeResults] = useState<SearchResult[]>([]);
  const [investorResults, setInvestorResults] = useState<SearchResult[]>([]);
  const [blogResults, setBlogResults] = useState<SearchResult[]>([]);
  const [isSearchingDeals, setIsSearchingDeals] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { orgType, isAuthenticated } = useCurrentUser();

  // Build role-filtered static pages
  const staticPages = useMemo(() => {
    const userRole = orgType || "sponsor";

    const filterByRole = (items: SearchResult[]) =>
      items.filter((item) => {
        if (!item.roles || item.roles.includes("all")) return true;
        return item.roles.includes(userRole as "sponsor" | "cde" | "investor");
      });

    return [
      ...filterByRole(basePages),
      ...filterByRole(rolePages),
      ...filterByRole(blogPosts),
      ...filterByRole(helpArticles),
    ];
  }, [orgType]);

  // Role-specific quick links
  const quickLinks = useMemo(() => {
    const userRole = orgType || "sponsor";

    switch (userRole) {
      case "sponsor":
        return [
          { name: "Submit Deal", href: "/deals/new" },
          { name: "My Projects", href: "/dashboard/pipeline" },
          { name: "Map", href: "/map" },
          { name: "Help", href: "/help" },
        ];
      case "cde":
        return [
          { name: "Pipeline", href: "/dashboard/pipeline" },
          { name: "Allocations", href: "/dashboard/allocations" },
          { name: "Map", href: "/map" },
          { name: "AutoMatch", href: "/dashboard/automatch" },
        ];
      case "investor":
        return [
          { name: "Portfolio", href: "/dashboard/portfolio" },
          { name: "Marketplace", href: "/deals" },
          { name: "Map", href: "/map" },
          { name: "AutoMatch", href: "/dashboard/automatch" },
        ];
      default:
        return [
          { name: "Map", href: "/map" },
          { name: "Marketplace", href: "/deals" },
          { name: "Blog", href: "/blog" },
          { name: "Help", href: "/help" },
        ];
    }
  }, [orgType]);

  // Search deals + CDEs from API when query is long enough
  useEffect(() => {
    if (!query.trim() || query.length < 2 || !isAuthenticated) {
      setDealResults([]);
      setCdeResults([]);
      setInvestorResults([]);
      setBlogResults([]);
      return;
    }

    const searchAll = async () => {
      setIsSearchingDeals(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=5`,
          {
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          const deals: SearchResult[] = (data.deals || []).map(
            (d: Record<string, unknown>) => ({
              type: "deal" as const,
              title: (d.project_name as string) || (d.name as string),
              href: `/deals/${d.id}`,
              description:
                `${(d.city as string) || ""}, ${(d.state as string) || ""} ${(d.programs as string[] | undefined)?.[0] ? `\u2022 ${(d.programs as string[])[0]}` : ""}`.trim(),
            }),
          );
          const cdes: SearchResult[] = (data.cdes || []).map(
            (c: Record<string, unknown>) => ({
              type: "cde" as const,
              title: c.name as string,
              href: `/deals?cde=${c.id}`,
              description:
                `${(c.service_area as string) || "National"} ${c.total_allocation ? `\u2022 $${((c.total_allocation as number) / 1000000).toFixed(1)}M allocation` : ""}`.trim(),
            }),
          );
          const investors: SearchResult[] = (data.investors || []).map(
            (inv: Record<string, unknown>) => ({
              type: "page" as const,
              title: inv.organization_name as string,
              href: `/deals?investor=${(inv.organization_id as string) || (inv.id as string)}`,
              description:
                `${(inv.investor_type as string) || "Investor"} ${inv.city && inv.state ? `\u2022 ${inv.city}, ${inv.state}` : ""}`.trim(),
              roles: ["all" as const],
            }),
          );
          const blogPosts: SearchResult[] = (data.blog || []).map(
            (b: Record<string, unknown>) => ({
              type: "blog" as const,
              title: b.title as string,
              href: `/blog/${b.slug}`,
              description:
                (b.summary as string) || (b.category as string) || "",
            }),
          );
          setDealResults(deals);
          setCdeResults(cdes);
          setInvestorResults(investors);
          setBlogResults(blogPosts);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearchingDeals(false);
      }
    };

    const debounce = setTimeout(searchAll, 300);
    return () => clearTimeout(debounce);
  }, [query, isAuthenticated]);

  // Handle static search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = staticPages
      .filter(
        (page) =>
          page.title.toLowerCase().includes(q) ||
          page.description?.toLowerCase().includes(q),
      )
      .slice(0, 6);

    setResults(filtered);
  }, [query, staticPages]);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blog":
        return "📝";
      case "deal":
        return "💼";
      case "cde":
        return "🏛️";
      case "investor":
        return "🏦";
      case "help":
        return "❓";
      default:
        return "📄";
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Search trigger button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors"
      >
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-500 bg-gray-900 rounded border border-gray-700">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Search modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <svg
                className="w-5 h-5 text-gray-400"
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
              <input
                ref={inputRef}
                type="text"
                placeholder="Search deals, CDEs, investors, blog..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 outline-none"
                autoComplete="off"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                }}
                className="text-xs text-gray-500 hover:text-gray-400 px-2 py-1 rounded border border-gray-700"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ||
              dealResults.length > 0 ||
              cdeResults.length > 0 ||
              investorResults.length > 0 ||
              blogResults.length > 0 ? (
                <div className="py-2">
                  {/* Deal Results */}
                  {dealResults.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider">
                        Deals
                      </p>
                      <ul>
                        {dealResults.map((result, index) => (
                          <li key={`deal-${index}`}>
                            <button
                              onClick={() => handleSelect(result.href)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-left"
                            >
                              <span className="text-lg">
                                {getTypeIcon(result.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-indigo-400 uppercase">
                                Deal
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CDE Results */}
                  {cdeResults.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider mt-2">
                        CDEs
                      </p>
                      <ul>
                        {cdeResults.map((result, index) => (
                          <li key={`cde-${index}`}>
                            <button
                              onClick={() => handleSelect(result.href)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-left"
                            >
                              <span className="text-lg">
                                {getTypeIcon(result.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-emerald-400 uppercase">
                                CDE
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Investor Results */}
                  {investorResults.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider mt-2">
                        Investors
                      </p>
                      <ul>
                        {investorResults.map((result, index) => (
                          <li key={`inv-${index}`}>
                            <button
                              onClick={() => handleSelect(result.href)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-left"
                            >
                              <span className="text-lg">
                                {getTypeIcon("investor")}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-amber-400 uppercase">
                                Investor
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Blog Results (from DB search) */}
                  {blogResults.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider mt-2">
                        Blog
                      </p>
                      <ul>
                        {blogResults.map((result, index) => (
                          <li key={`blog-${index}`}>
                            <button
                              onClick={() => handleSelect(result.href)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-left"
                            >
                              <span className="text-lg">
                                {getTypeIcon("blog")}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-purple-400 uppercase">
                                Blog
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Static Results */}
                  {results.length > 0 && (
                    <div>
                      {(dealResults.length > 0 ||
                        cdeResults.length > 0 ||
                        investorResults.length > 0 ||
                        blogResults.length > 0) && (
                        <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider mt-2">
                          Pages & Articles
                        </p>
                      )}
                      <ul>
                        {results.map((result, index) => (
                          <li key={`page-${index}`}>
                            <button
                              onClick={() => handleSelect(result.href)}
                              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition-colors text-left"
                            >
                              <span className="text-lg">
                                {getTypeIcon(result.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-600 uppercase">
                                {result.type}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Searching indicator */}
                  {isSearchingDeals && (
                    <div className="px-4 py-2 flex items-center gap-2 text-gray-500 text-sm">
                      <div className="w-3 h-3 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </div>
                  )}
                </div>
              ) : query ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {isSearchingDeals ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </div>
                  ) : (
                    <p>No results found for "{query}"</p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Quick Links
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickLinks.map((link) => (
                      <button
                        key={link.href}
                        onClick={() => handleSelect(link.href)}
                        className="px-3 py-2 text-sm text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {link.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
