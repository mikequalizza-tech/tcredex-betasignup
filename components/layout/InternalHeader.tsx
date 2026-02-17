"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumbs } from "@/lib/context/BreadcrumbContext";

export type UserRole = "sponsor" | "cde" | "investor" | "admin";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface InternalHeaderProps {
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  orgName?: string;
  breadcrumbs?: Breadcrumb[];
  showSearch?: boolean;
  onMenuToggle?: () => void;
}

// Route metadata for breadcrumb generation
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/projects": "My Projects",
  "/dashboard/pipeline": "Pipeline",
  "/dashboard/portfolio": "Portfolio",
  "/dashboard/automatch": "AutoMatch AI",
  "/dashboard/documents": "Documents",
  "/dashboard/teams": "Organization",
  "/dashboard/settings": "Settings",
  "/map": "Marketplace Map",
  "/deals": "Marketplace",
  "/closing-room": "Closing Room",
  "/automatch": "AutoMatch",
  "/matching": "Matching",
  "/admin": "Admin",
  "/cde": "CDE Portal",
  "/investor": "Investor Portal",
};

export default function InternalHeader({
  userRole,
  userName = "User",
  userEmail = "user@example.com",
  orgName = "Organization",
  breadcrumbs,
  showSearch = true,
  onMenuToggle,
}: InternalHeaderProps) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { type: string; title: string; href: string }[]
  >([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [searchLoading, setSearchLoading] = useState(false);

  // Role-aware search - combines static pages with Supabase FTS results
  // GUARDRAILS: Role-based filtering applied by PostgreSQL RPC functions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Static navigation items everyone can search
    const baseSearchItems = [
      { type: "page", title: "Marketplace Map", href: "/map" },
      { type: "page", title: "Marketplace", href: "/deals" },
      { type: "page", title: "Dashboard", href: "/dashboard" },
      { type: "page", title: "Documents", href: "/dashboard/documents" },
      { type: "page", title: "Settings", href: "/dashboard/settings" },
    ];

    // Role-specific navigation items
    let roleSearchItems: { type: string; title: string; href: string }[] = [];

    if (userRole === "sponsor") {
      roleSearchItems = [
        { type: "page", title: "Submit New Deal", href: "/intake" },
        { type: "page", title: "My Projects", href: "/dashboard/projects" },
        { type: "page", title: "AutoMatch AI", href: "/dashboard/automatch" },
        { type: "page", title: "Find CDEs", href: "/deals" },
      ];
    } else if (userRole === "cde") {
      roleSearchItems = [
        { type: "page", title: "Pipeline", href: "/dashboard/pipeline" },
        { type: "page", title: "Allocations", href: "/dashboard/allocations" },
        { type: "page", title: "Closing Room", href: "/closing-room" },
        { type: "page", title: "Find Deals", href: "/deals" },
      ];
    } else if (userRole === "investor") {
      roleSearchItems = [
        { type: "page", title: "Portfolio", href: "/dashboard/portfolio" },
        { type: "page", title: "Find Deals", href: "/deals" },
        { type: "page", title: "Closing Room", href: "/closing-room" },
      ];
    } else if (userRole === "admin") {
      roleSearchItems = [
        { type: "page", title: "Admin Console", href: "/admin" },
        { type: "page", title: "User Management", href: "/admin/users" },
        { type: "page", title: "Deal Approvals", href: "/admin/deals" },
        { type: "page", title: "CDE Management", href: "/admin/cdes" },
        { type: "page", title: "Reports", href: "/admin/reports" },
      ];
    }

    const allStaticItems = [...baseSearchItems, ...roleSearchItems];

    // Filter static items matching query
    const filteredStatic = allStaticItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query),
    );

    // Start with static results immediately
    setSearchResults(filteredStatic.slice(0, 5));
    setShowSearchResults(filteredStatic.length > 0);

    // Then fetch real search results with debounce
    const debounceTimer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            credentials: "include",
          },
        );

        if (response.ok) {
          const data = await response.json();
          const apiResults: { type: string; title: string; href: string }[] =
            [];

          // Map deal results (Supabase FTS)
          if (data.deals?.length) {
            for (const deal of data.deals.slice(0, 3)) {
              apiResults.push({
                type: "deal",
                title: deal.project_name || "Untitled Deal",
                href: `/deals/${deal.id}`,
              });
            }
          }

          // Map CDE results
          if (data.cdes?.length) {
            for (const cde of data.cdes.slice(0, 2)) {
              apiResults.push({
                type: "cde",
                title: cde.name || "CDE",
                href: `/deals?cde=${cde.id}`,
              });
            }
          }

          // Map investor results
          if (data.investors?.length) {
            for (const inv of data.investors.slice(0, 2)) {
              apiResults.push({
                type: "investor",
                title: inv.organization_name || "Investor",
                href: `/deals?investor=${inv.organization_id || inv.id}`,
              });
            }
          }

          // Map blog results
          if (data.blog?.length) {
            for (const post of data.blog.slice(0, 2)) {
              apiResults.push({
                type: "blog",
                title: post.title || "Blog Post",
                href: `/blog/${post.slug}`,
              });
            }
          }

          // Combine static and API results, deduplicated
          const combinedResults = [...apiResults, ...filteredStatic];
          const uniqueResults = combinedResults.reduce(
            (acc, item) => {
              if (!acc.find((x) => x.href === item.href)) {
                acc.push(item);
              }
              return acc;
            },
            [] as typeof combinedResults,
          );

          setSearchResults(uniqueResults.slice(0, 6));
          setShowSearchResults(uniqueResults.length > 0);
        }
      } catch (_error) {
        // Search API unavailable - keep static results
        console.debug("[Search] API unavailable, using static results");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, userRole]);

  // Get breadcrumbs from context (pages can set custom breadcrumbs)
  const { breadcrumbs: contextBreadcrumbs } = useBreadcrumbs();

  // Auto-generate breadcrumbs from pathname if not provided
  const autoBreadcrumbs = (): Breadcrumb[] => {
    // Priority: props > context > auto-generated
    if (breadcrumbs) return breadcrumbs;
    if (contextBreadcrumbs) return contextBreadcrumbs;

    const segments = pathname?.split("/").filter(Boolean) || [];
    const crumbs: Breadcrumb[] = [{ label: "Home", href: "/dashboard" }];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const title =
        ROUTE_TITLES[currentPath] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

      // Don't make the last segment a link
      if (index === segments.length - 1) {
        crumbs.push({ label: title });
      } else {
        crumbs.push({ label: title, href: currentPath });
      }
    });

    return crumbs;
  };

  const crumbs = autoBreadcrumbs();

  const roleLabels: Record<UserRole, string> = {
    sponsor: "Sponsor",
    cde: "CDE",
    investor: "Investor",
    admin: "Admin",
  };

  const roleColors: Record<UserRole, string> = {
    sponsor: "bg-green-600",
    cde: "bg-purple-600",
    investor: "bg-blue-600",
    admin: "bg-red-600",
  };

  // Real notifications from database
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      unread: boolean;
      href?: string;
    }>
  >([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Fetch real notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch(
          "/api/notifications?limit=5&unread_first=true",
          {
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = (data.notifications || []).map((n: any) => ({
            id: n.id,
            title: n.title || "Notification",
            message: n.body || n.message || "",
            time: formatTimeAgo(n.created_at),
            unread: !n.read,
            href:
              n.type === "message"
                ? "/messages"
                : n.deal_id
                  ? `/deals/${n.deal_id}`
                  : "/dashboard/notifications",
          }));
          setNotifications(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  // Format time ago helper
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Role-specific quick action buttons
  const quickActionButtons = () => {
    switch (userRole) {
      case "sponsor":
        return [
          { href: "/map?view=cdes", icon: "building", title: "Browse CDEs" },
          {
            href: "/map?view=investors",
            icon: "users",
            title: "Browse Investors",
          },
          { href: "/intake", icon: "plus", title: "New Project" },
        ];
      case "cde":
        return [
          { href: "/map?view=deals", icon: "briefcase", title: "Browse Deals" },
          {
            href: "/dashboard/allocations",
            icon: "chart",
            title: "Allocations",
          },
          { href: "/dashboard/pipeline", icon: "flow", title: "Pipeline" },
        ];
      case "investor":
        return [
          { href: "/map?view=deals", icon: "briefcase", title: "Browse Deals" },
          { href: "/map?view=cdes", icon: "building", title: "Browse CDEs" },
          { href: "/dashboard/portfolio", icon: "folder", title: "Portfolio" },
        ];
      default:
        return [
          { href: "/intake", icon: "plus", title: "New Project" },
          {
            href: "/dashboard/documents?upload=true",
            icon: "upload",
            title: "Upload",
          },
        ];
    }
  };

  const getQuickActionIcon = (icon: string) => {
    switch (icon) {
      case "building":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        );
      case "users":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        );
      case "briefcase":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        );
      case "chart":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        );
      case "flow":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 5l7 7-7 7M5 5l7 7-7 7"
          />
        );
      case "folder":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        );
      case "upload":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        );
      case "plus":
      default:
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        );
    }
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button - for sidebar toggle on mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {crumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-600 mx-2"
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
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-200 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Center: Search (optional) */}
      {showSearch && (
        <div className="hidden md:flex flex-1 max-w-md mx-8" ref={searchRef}>
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
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
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.length >= 2 && setShowSearchResults(true)
              }
              placeholder="Search deals, CDEs, investors..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex px-2 py-0.5 text-xs text-gray-500 bg-gray-700 rounded">
              ⌘K
            </kbd>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                {searchLoading && (
                  <div className="flex items-center gap-2 px-4 py-2 text-gray-500 text-sm border-b border-gray-700">
                    <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                )}
                {searchResults.map((result, index) => (
                  <Link
                    key={index}
                    href={result.href}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors"
                  >
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        result.type === "deal"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : result.type === "cde"
                            ? "bg-purple-900/50 text-purple-400"
                            : result.type === "investor"
                              ? "bg-amber-900/50 text-amber-400"
                              : result.type === "blog"
                                ? "bg-indigo-900/50 text-indigo-400"
                                : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {result.type}
                    </span>
                    <span className="text-sm text-gray-200">
                      {result.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right: Actions & User */}
      <div className="flex items-center gap-4">
        {/* Quick Actions - Role Specific */}
        <div className="hidden sm:flex items-center gap-2">
          {quickActionButtons().map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={action.title}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {getQuickActionIcon(action.icon)}
              </svg>
            </Link>
          ))}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-100">Notifications</h3>
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/notifications/mark-all-read", {
                        method: "POST",
                        credentials: "include",
                      });
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, unread: false })),
                      );
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsLoading ? (
                  <div className="p-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.href || "/dashboard/notifications"}
                      onClick={() => setNotificationsOpen(false)}
                      className={`block p-4 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        notification.unread ? "bg-gray-700/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notification.unread && (
                          <span className="w-2 h-2 mt-2 bg-indigo-500 rounded-full flex-shrink-0" />
                        )}
                        <div className={notification.unread ? "" : "ml-5"}>
                          <p className="text-sm font-medium text-gray-200">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link
                href="/dashboard/notifications"
                className="block p-3 text-center text-sm text-indigo-400 hover:text-indigo-300 hover:bg-gray-700/50 transition-colors"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-700" />

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-200 leading-tight">
                {userName}
              </p>
              <p className="text-xs text-gray-500 leading-tight">{orgName}</p>
            </div>
            <svg
              className="w-4 h-4 text-gray-500 hidden sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {userName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-100 truncate">
                      {userName}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {userEmail}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${roleColors[userRole]} text-white`}
                    >
                      {roleLabels[userRole]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Your Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </Link>
                <Link
                  href="/dashboard/teams"
                  className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  Organization
                </Link>
                {userRole === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Admin Console
                  </Link>
                )}
              </div>

              <div className="p-2 border-t border-gray-700">
                <Link
                  href="/signout"
                  className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
