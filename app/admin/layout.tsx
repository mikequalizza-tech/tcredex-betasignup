'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { AuthProvider, useCurrentUser } from '@/lib/auth';

// SVG Icons for Admin Navigation (MOSAIC-inspired)
const icons = {
  dashboard: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M5.936.278A7.983 7.983 0 0 1 8 0a8 8 0 1 1-8 8c0-.722.104-1.413.278-2.064a1 1 0 1 1 1.932.516A5.99 5.99 0 0 0 2 8a6 6 0 1 0 6-6c-.53 0-1.045.076-1.548.21A1 1 0 1 1 5.936.278Z" />
      <path d="M6.068 7.482A2.003 2.003 0 0 0 8 10a2 2 0 1 0-.518-3.932L3.707 2.293a1 1 0 0 0-1.414 1.414l3.775 3.775Z" />
    </svg>
  ),
  deals: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M6 0a6 6 0 0 0-6 6c0 1.077.304 2.062.78 2.912a1 1 0 1 0 1.745-.976A3.945 3.945 0 0 1 2 6a4 4 0 0 1 4-4c.693 0 1.33.18 1.892.476a1 1 0 1 0 .94-1.767A5.95 5.95 0 0 0 6 0Z" />
      <path d="M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
      <path d="M9 7a1 1 0 0 1 2 0v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1H8a1 1 0 1 1 0-2h1V7Z" />
    </svg>
  ),
  users: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M13 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 16a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4H2Z" />
    </svg>
  ),
  cdes: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M7 0a1 1 0 0 1 2 0v2h6a1 1 0 1 1 0 2H1a1 1 0 0 1 0-2h6V0ZM3 6h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm3 2a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1Z" />
    </svg>
  ),
  investors: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12Z" />
      <path d="M8 4a1 1 0 0 0-1 1v1H6a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0V8h1a1 1 0 1 0 0-2H9V5a1 1 0 0 0-1-1Z" />
      <path d="M5 11a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H5Z" />
    </svg>
  ),
  reports: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M15 4a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4ZM3 5h10v6H3V5Z" />
      <path d="M4 7h2v2H4V7Zm3 0h2v2H7V7Zm3 0h2v2h-2V7Z" />
    </svg>
  ),
  settings: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M6.28 1.372a.989.989 0 0 1 .98-.172l.016.007a.989.989 0 0 1 .638.64.984.984 0 0 0 1.153.681.986.986 0 0 1 1.076.37l.01.014a.989.989 0 0 1-.012 1.135.984.984 0 0 0 .035 1.312.989.989 0 0 1 .275 1.1l-.005.015a.989.989 0 0 1-.886.633.984.984 0 0 0-.921.855.989.989 0 0 1-.705.827l-.017.005a.989.989 0 0 1-1.058-.37.984.984 0 0 0-1.305-.148.989.989 0 0 1-1.13.091l-.014-.01a.989.989 0 0 1-.356-1.096.984.984 0 0 0-.459-1.209.989.989 0 0 1-.4-1.058l.006-.017a.989.989 0 0 1 .852-.69.984.984 0 0 0 .855-.921.989.989 0 0 1 .57-.852ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  ),
  logout: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M11.293 7.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414-1.414L10.586 8 8.293 5.707a1 1 0 0 1 1.414-1.414l3 3ZM6 2a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V4h4v8H7v-1a1 1 0 1 0-2 0v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H6Z" />
    </svg>
  ),
  home: (
    <svg className="shrink-0 fill-current" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 .293 1.146 7.146a.5.5 0 0 0 .708.708L2 7.707V14a1 1 0 0 0 1 1h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a1 1 0 0 0 1-1V7.707l.146.147a.5.5 0 0 0 .708-.708L8 .293Z" />
    </svg>
  ),
};

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
  { name: 'Deals', href: '/admin/deals', icon: 'deals' },
  { name: 'Users', href: '/admin/users', icon: 'users' },
  { name: 'CDEs', href: '/admin/cdes', icon: 'cdes' },
  { name: 'Investors', href: '/admin/investors', icon: 'investors' },
  { name: 'Reports', href: '/admin/reports', icon: 'reports' },
  { name: 'Settings', href: '/admin/settings', icon: 'settings' },
] as const;

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // System Admin Check - only users with organization.type === 'admin' can access
  const isSystemAdmin = user.organization?.type === 'admin';

  if (!isSystemAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This area is restricted to system administrators only.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700/60 flex flex-col
        transform lg:transform-none transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700/60">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/tcredex_transparent_512x128.png"
              alt="tCredex"
              width={120}
              height={30}
              className="h-7 w-auto dark:brightness-200"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded">
              Admin
            </span>
          </Link>
          {/* Close button (mobile) */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold mb-3 px-3">
            Management
          </h3>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              const IconComponent = icons[item.icon as keyof typeof icons];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className={isActive ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'}>
                      {IconComponent}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Quick Actions */}
          <h3 className="text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold mt-8 mb-3 px-3">
            Quick Actions
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-gray-400 dark:text-gray-500">{icons.home}</span>
                <span>Back to App</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Panel */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <span className="text-gray-400">{icons.logout}</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/60 flex items-center justify-between px-4 lg:px-6 shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search (placeholder) */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-gray-600"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Header right side */}
          <div className="flex items-center gap-3">
            {/* Notifications placeholder */}
            <button className="relative p-2 text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User avatar (mobile) */}
            <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {/* System Admin only - requires organizationType='admin' */}
      <AdminContent>{children}</AdminContent>
    </AuthProvider>
  );
}
