'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminStats {
  overview: {
    totalDeals: number;
    totalUsers: number;
    totalOrganizations: number;
    totalAllocation: number;
    recentSignups: number;
  };
  actionRequired: {
    pendingReview: number;
    needsInfo: number;
    expiringOffers: number;
  };
  dealsByStatus: Record<string, number>;
  dealsByProgram: Record<string, number>;
  recentActivity: Array<{
    dealId: string;
    action: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch admin stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(0)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
    return `$${amount}`;
  };

  // Calculate active deals (available, seeking_capital, matched, closing)
  const activeDeals = (stats.dealsByStatus.available || 0) +
                      (stats.dealsByStatus.seeking_capital || 0) +
                      (stats.dealsByStatus.matched || 0) +
                      (stats.dealsByStatus.closing || 0);

  const dashboardStats = [
    {
      label: 'Total Deals',
      value: stats.overview.totalDeals.toString(),
      change: `+${stats.overview.recentSignups || 0} this week`,
      positive: true,
      icon: (
        <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      label: 'Active Projects',
      value: activeDeals.toString(),
      change: `${Math.round((activeDeals / stats.overview.totalDeals) * 100)}% of total`,
      positive: true,
      icon: (
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Total Allocation',
      value: formatCurrency(stats.overview.totalAllocation),
      change: 'NMTC requested',
      positive: true,
      icon: (
        <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Pending Reviews',
      value: stats.actionRequired.pendingReview.toString(),
      change: `${stats.actionRequired.needsInfo} need info`,
      positive: false,
      icon: (
        <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  // Map status to pipeline stages
  const pipelineStages = [
    {
      stage: 'Draft',
      count: stats.dealsByStatus.draft || 0,
      color: 'bg-gray-500',
      textColor: 'text-gray-600 dark:text-gray-400'
    },
    {
      stage: 'Submitted',
      count: stats.dealsByStatus.submitted || 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400'
    },
    {
      stage: 'Available',
      count: stats.dealsByStatus.available || 0,
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      stage: 'Closing',
      count: stats.dealsByStatus.closing || 0,
      color: 'bg-violet-500',
      textColor: 'text-violet-600 dark:text-violet-400'
    },
    {
      stage: 'Closed',
      count: stats.dealsByStatus.closed || 0,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
  ];

  // Format recent activity
  const recentActivity = stats.recentActivity.slice(0, 5).map((activity, idx) => {
    const action = activity.action.replace('Status: ', '');
    const time = new Date(activity.timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    let timeStr = 'just now';
    if (diffHours >= 24) {
      timeStr = `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }

    let type = 'new';
    if (action.includes('match')) type = 'match';
    if (action.includes('approved') || action.includes('available')) type = 'approved';
    if (action.includes('closing')) type = 'commit';

    return {
      id: idx + 1,
      action: `Deal ${action}`,
      deal: activity.dealId.substring(0, 8),
      time: timeStr,
      type,
    };
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new':
        return (
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'match':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        );
      case 'request':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'approved':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'commit':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Overview of your tCredex marketplace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-700/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                  <span className={`text-sm font-medium px-1.5 rounded-full ${
                    stat.positive
                      ? 'text-green-700 bg-green-500/20'
                      : 'text-red-700 bg-red-500/20'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="px-5 py-4 flex items-center gap-3">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{activity.action}</p>
                  <p className="text-sm text-violet-600 dark:text-violet-400 truncate">{activity.deal}</p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
            <Link href="/admin/activity" className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300">
              View all activity →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            <Link
              href="/admin/deals"
              className="flex items-center gap-3 w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Review Pending Deals
            </Link>
            <Link
              href="/deals/new"
              className="flex items-center gap-3 w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit New Deal
            </Link>
            <Link
              href="/matching"
              className="flex items-center gap-3 w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              View CDE Matches
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Deal Pipeline */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Deal Pipeline</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {pipelineStages.map((stage) => (
              <div key={stage.stage} className="text-center">
                <div className={`${stage.color} rounded-xl py-6 mb-3 shadow-sm`}>
                  <p className="text-3xl font-bold text-white">{stage.count}</p>
                </div>
                <p className={`text-sm font-medium ${stage.textColor}`}>{stage.stage}</p>
              </div>
            ))}
          </div>

          {/* Pipeline Progress Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pipeline Progress</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stats.overview.totalDeals} Deals</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              {pipelineStages.map((stage) => {
                const percentage = stats.overview.totalDeals > 0
                  ? Math.round((stage.count / stats.overview.totalDeals) * 100)
                  : 0;
                return (
                  <div
                    key={stage.stage}
                    className={stage.color}
                    style={{ width: `${percentage}%` }}
                    title={`${stage.stage}: ${stage.count}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
              {pipelineStages.map((stage) => (
                <span key={stage.stage}>{stage.stage}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Platform Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">System Status</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">All systems operational</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">API</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Database</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Search</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Platform Users</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total registered</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Users</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">{stats.overview.totalUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Organizations</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">{stats.overview.totalOrganizations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">This Week</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{stats.overview.recentSignups}</span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Platform Neutrality</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">No violations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Audit Score</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">100%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Flags</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Reviews</span>
              <span className="text-gray-800 dark:text-gray-100 font-medium">3 pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
