"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import InternalHeader from "./InternalHeader";
import InternalFooter from "./InternalFooter";
import Logo from "@/components/ui/logo";
import { BreadcrumbProvider } from "@/lib/context/BreadcrumbContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  orgTypes?: Array<"cde" | "sponsor" | "investor" | "admin">;
  adminOnly?: boolean;
  badge?: string | number;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

// Icon components
const HomeIcon = () => (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const MapIcon = () => (
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
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    />
  </svg>
);

const DealsIcon = () => (
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
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

const AutoMatchIcon = () => (
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
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const _ProjectsIcon = () => (
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
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const PortfolioIcon = () => (
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
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
    />
  </svg>
);

const SettingsIcon = () => (
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
);

const UsersIcon = () => (
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
);

const PipelineIcon = () => (
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
      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
    />
  </svg>
);

const DocumentsIcon = () => (
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
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    />
  </svg>
);

const ClosingRoomIcon = () => (
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
);

const _MessagesIcon = () => (
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
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const AdminIcon = () => (
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
);

const BlogIcon = () => (
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
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);

// Navigation items with organization type-based access
const SubmitDealIcon = () => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const AllocationsIcon = () => (
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
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const navItems: NavItem[] = [
  // === CORE WORKFLOW (Top-Down Order) ===
  { name: "Dashboard", href: "/dashboard", icon: <HomeIcon /> },
  {
    name: "Submit Deal",
    href: "/deals/new",
    icon: <SubmitDealIcon />,
    orgTypes: ["sponsor"],
  }, // Only sponsors submit deals
  { name: "Pipeline", href: "/dashboard/pipeline", icon: <PipelineIcon /> }, // All roles see pipeline (scoped to their deals)
  { name: "Map", href: "/map", icon: <MapIcon /> },

  // === ROLE-SPECIFIC TOOLS ===
  {
    name: "Allocations",
    href: "/dashboard/allocations",
    icon: <AllocationsIcon />,
    orgTypes: ["cde", "sponsor"],
  },
  {
    name: "AutoMatch AI",
    href: "/dashboard/automatch",
    icon: <AutoMatchIcon />,
    orgTypes: ["cde", "investor"],
  },
  { name: "Marketplace", href: "/deals", icon: <DealsIcon /> },
  {
    name: "Portfolio",
    href: "/dashboard/portfolio",
    icon: <PortfolioIcon />,
    orgTypes: ["investor"],
  },

  // === DEAL EXECUTION ===
  { name: "Documents", href: "/dashboard/documents", icon: <DocumentsIcon /> },
  { name: "Closing Room", href: "/closing-room", icon: <ClosingRoomIcon /> },

  // === SETTINGS ===
  { name: "Organization", href: "/dashboard/teams", icon: <UsersIcon /> },
  { name: "Settings", href: "/dashboard/settings", icon: <SettingsIcon /> },
  {
    name: "Blog",
    href: "/dashboard/blog",
    icon: <BlogIcon />,
    adminOnly: true,
  },
  { name: "Admin", href: "/admin", icon: <AdminIcon />, adminOnly: true },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  // Pre-collapse sidebar on /map for maximum map view
  const [sidebarOpen, setSidebarOpen] = useState(!pathname?.startsWith("/map"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user info from auth context
  const {
    user: _user,
    isLoading,
    orgType,
    orgName,
    orgLogo,
    userName,
    userEmail,
    currentDemoRole,
  } = useCurrentUser();

  // OPTIMIZATION: Memoize filtered nav items to avoid recalculating on every render
  // NOTE: This must be called BEFORE any early returns to maintain hook order
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      // Admin-only items
      if (item.adminOnly) {
        return currentDemoRole === "admin";
      }
      // No role restriction
      if (!item.orgTypes) return true;
      // Check org type
      return orgType && item.orgTypes.includes(orgType);
    });
  }, [currentDemoRole, orgType]);

  // Show loading state (after all hooks are called)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const orgTypeLabels: Record<string, string> = {
    sponsor: "Project Sponsor",
    cde: "CDE",
    investor: "Investor",
  };

  const orgTypeColors: Record<string, string> = {
    sponsor: "bg-green-600",
    cde: "bg-purple-600",
    investor: "bg-blue-600",
  };

  // Map org type to UserRole for InternalHeader
  const userRole =
    currentDemoRole === "admin"
      ? ("admin" as const)
      : ((orgType || "sponsor") as "sponsor" | "cde" | "investor");

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href !== "/dashboard" && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen bg-gray-950 flex">
        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? "w-56" : "w-16"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 flex-shrink-0
        `}
        >
          {/* Logo & Toggle */}
          <div
            className={`h-14 flex items-center justify-between ${sidebarOpen ? "px-3" : "px-2"} border-b border-gray-800`}
          >
            {sidebarOpen ? (
              <Logo size="sm" />
            ) : (
              <Logo variant="icon" size="sm" />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white p-1 hidden lg:block"
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
                  d={
                    sidebarOpen
                      ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      : "M13 5l7 7-7 7M5 5l7 7-7 7"
                  }
                />
              </svg>
            </button>
            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white p-1 lg:hidden"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Org Info */}
          {sidebarOpen && (
            <div className="px-3 py-2.5 border-b border-gray-800">
              <div className="flex items-center gap-2">
                {orgLogo ? (
                  <Image
                    src={orgLogo}
                    alt={orgName}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm">
                    {orgName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {orgName}
                  </p>
                  {currentDemoRole === "admin" ? (
                    <span className="inline-block px-1.5 py-0.5 text-[10px] rounded-full bg-red-600 text-white">
                      Admin
                    </span>
                  ) : (
                    orgType && (
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] rounded-full ${orgTypeColors[orgType]} text-white`}
                      >
                        {orgTypeLabels[orgType]}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav
            className={`flex-1 ${sidebarOpen ? "p-3" : "p-2"} space-y-1 overflow-y-auto`}
          >
            {filteredNavItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center ${sidebarOpen ? "gap-3 px-3" : "justify-center px-2"} py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  {item.icon}
                  {sidebarOpen && (
                    <span className="text-sm font-medium flex-1">
                      {item.href === "/dashboard/allocations" &&
                      orgType === "sponsor"
                        ? "Deals Capital Stack"
                        : item.name}
                    </span>
                  )}
                  {sidebarOpen && item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Links */}
          {sidebarOpen && (
            <div className="px-3 py-2 border-t border-gray-800">
              <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider">
                Quick Links
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/programs"
                  className="block text-xs text-gray-400 hover:text-white transition-colors py-0.5"
                >
                  Tax Credit Programs
                </Link>
                <Link
                  href="/"
                  className="block text-xs text-gray-400 hover:text-white transition-colors py-0.5"
                >
                  tCredex Home
                </Link>
              </div>
            </div>
          )}

          {/* User Info */}
          <div
            className={`${sidebarOpen ? "px-3 py-2" : "p-2"} border-t border-gray-800`}
          >
            <div
              className={`flex items-center ${sidebarOpen ? "gap-2" : "justify-center"}`}
            >
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                {userName.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">
                    {userName}
                  </p>
                  <Link
                    href="/signout"
                    className="text-[10px] text-gray-500 hover:text-gray-400"
                  >
                    Sign out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Internal Header - Hide on intake page (IntakeShell has its own header) */}
          {!pathname?.startsWith("/intake") && (
            <InternalHeader
              userRole={userRole}
              userName={userName}
              userEmail={userEmail}
              orgName={orgName}
              onMenuToggle={() => setMobileMenuOpen(true)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1">{children}</div>
            <InternalFooter />
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
