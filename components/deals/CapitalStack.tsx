'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CapitalSource {
  id: string;
  type: 'loi' | 'commitment' | 'other';
  sourceType: 'cde' | 'investor' | 'equity' | 'debt' | 'grant';
  sourceName: string;
  sourceId: string;
  amount: number;
  status: string;
  statusLabel: string;
  creditType?: string;
  issuedAt?: string;
  expiresAt?: string;
  acceptedAt?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}

interface CapitalStackData {
  dealId: string;
  projectName: string;
  allocationNeeded: number;
  sources: CapitalSource[];
  summary: {
    totalCommitted: number;
    totalPending: number;
    totalExpired: number;
    fundingGap: number;
    readyForClosing: boolean;
  };
}

interface CapitalStackProps {
  dealId: string;
  isOwner: boolean;
  onRunAutoMatch?: () => void;
  autoMatchLoading?: boolean;
}

export default function CapitalStack({
  dealId,
  isOwner,
  onRunAutoMatch,
  autoMatchLoading,
}: CapitalStackProps) {
  const [data, setData] = useState<CapitalStackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  useEffect(() => {
    loadCapitalStack();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadCapitalStack only depends on dealId which is already in deps
  }, [dealId]);

  async function loadCapitalStack() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${dealId}/capital-stack`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load capital stack');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const getStatusColor = (status: string) => {
    if (['all_accepted', 'sponsor_accepted'].includes(status)) {
      return 'bg-green-900/50 text-green-400 border-green-500/30';
    }
    if (['issued', 'pending_sponsor', 'pending_cde'].includes(status)) {
      return 'bg-amber-900/50 text-amber-400 border-amber-500/30';
    }
    if (['sponsor_countered'].includes(status)) {
      return 'bg-blue-900/50 text-blue-400 border-blue-500/30';
    }
    if (['expired', 'rejected', 'withdrawn', 'sponsor_rejected'].includes(status)) {
      return 'bg-gray-800/50 text-gray-400 border-gray-600/30';
    }
    return 'bg-gray-800/50 text-gray-400 border-gray-600/30';
  };

  const getStatusIcon = (status: string) => {
    if (['all_accepted', 'sponsor_accepted'].includes(status)) {
      return (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (['issued', 'pending_sponsor', 'pending_cde'].includes(status)) {
      return (
        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (['expired', 'rejected', 'withdrawn', 'sponsor_rejected'].includes(status)) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return null;
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'cde': return 'CDE';
      case 'investor': return 'Investor';
      case 'equity': return 'Equity';
      case 'debt': return 'Debt';
      case 'grant': return 'Grant';
      default: return sourceType;
    }
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'cde': return 'bg-emerald-900/50 text-emerald-300';
      case 'investor': return 'bg-purple-900/50 text-purple-300';
      case 'equity': return 'bg-blue-900/50 text-blue-300';
      case 'debt': return 'bg-amber-900/50 text-amber-300';
      case 'grant': return 'bg-pink-900/50 text-pink-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="text-center py-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadCapitalStack}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, sources, allocationNeeded } = data;
  const activeSources = sources.filter(s => !['expired', 'rejected', 'withdrawn', 'sponsor_rejected'].includes(s.status));
  const inactiveSources = sources.filter(s => ['expired', 'rejected', 'withdrawn', 'sponsor_rejected'].includes(s.status));
  const progressPercent = allocationNeeded > 0
    ? Math.min(100, ((summary.totalCommitted + summary.totalPending) / allocationNeeded) * 100)
    : 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Capital Stack</h2>
          <p className="text-gray-400 text-sm mt-1">Track your funding sources</p>
        </div>
        {summary.readyForClosing && (
          <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
            Ready for Closing
          </span>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Needed</p>
          <p className="text-lg font-bold text-white">{formatCurrency(allocationNeeded)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Committed</p>
          <p className="text-lg font-bold text-green-400">{formatCurrency(summary.totalCommitted)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Pending</p>
          <p className="text-lg font-bold text-amber-400">{formatCurrency(summary.totalPending)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Gap</p>
          <p className={`text-lg font-bold ${summary.fundingGap > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {summary.fundingGap > 0 ? formatCurrency(summary.fundingGap) : '$0'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Funding Progress</span>
          <span>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full flex">
            {/* Committed portion (green) */}
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${allocationNeeded > 0 ? (summary.totalCommitted / allocationNeeded) * 100 : 0}%` }}
            />
            {/* Pending portion (amber) */}
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${allocationNeeded > 0 ? (summary.totalPending / allocationNeeded) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">Committed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-400">Pending</span>
          </span>
        </div>
      </div>

      {/* Active Sources */}
      {activeSources.length > 0 ? (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Active Sources</h3>
          {activeSources.map((source) => (
            <div
              key={source.id}
              className={`rounded-lg border p-4 transition-colors ${getStatusColor(source.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(source.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{source.sourceName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getSourceTypeColor(source.sourceType)}`}>
                        {getSourceTypeLabel(source.sourceType)}
                      </span>
                      {source.type === 'loi' && (
                        <span className="px-1.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded text-xs">
                          LOI
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{source.statusLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{formatCurrency(source.amount)}</p>
                  {source.expiresAt && !['all_accepted', 'sponsor_accepted'].includes(source.status) && (
                    <p className="text-xs text-gray-500">
                      Expires {new Date(source.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Expandable details */}
              {expandedSource === source.id && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {source.creditType && (
                      <div>
                        <span className="text-gray-500">Credit Type</span>
                        <p className="text-gray-200">{source.creditType}</p>
                      </div>
                    )}
                    {source.issuedAt && (
                      <div>
                        <span className="text-gray-500">Issued</span>
                        <p className="text-gray-200">{new Date(source.issuedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {source.contactName && (
                      <div>
                        <span className="text-gray-500">Contact</span>
                        <p className="text-gray-200">{source.contactName}</p>
                      </div>
                    )}
                    {source.contactEmail && (
                      <div>
                        <span className="text-gray-500">Email</span>
                        <p className="text-gray-200">{source.contactEmail}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions based on status */}
                  {isOwner && ['issued', 'pending_sponsor'].includes(source.status) && source.type === 'loi' && (
                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/deals/${data.dealId}/loi/${source.id}`}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-center text-sm font-medium rounded-lg transition-colors"
                      >
                        Review & Respond
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setExpandedSource(expandedSource === source.id ? null : source.id)}
                className="mt-2 text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                {expandedSource === source.id ? 'Hide details' : 'View details'}
                <svg
                  className={`w-3 h-3 transition-transform ${expandedSource === source.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/30 rounded-lg p-6 text-center mb-6">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 mb-2">No funding sources yet</p>
          <p className="text-gray-500 text-sm">Run AutoMatch to find CDEs or wait for LOIs</p>
        </div>
      )}

      {/* Inactive Sources (collapsed) */}
      {inactiveSources.length > 0 && (
        <details className="mb-6">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
            {inactiveSources.length} expired/declined source{inactiveSources.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-3 space-y-2">
            {inactiveSources.map((source) => (
              <div key={source.id} className="bg-gray-800/30 rounded-lg p-3 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{source.sourceName}</span>
                    <span className="text-xs text-gray-500">({source.statusLabel})</span>
                  </div>
                  <span className="text-gray-500">{formatCurrency(source.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-3">
          {onRunAutoMatch && (
            <button
              onClick={onRunAutoMatch}
              disabled={autoMatchLoading}
              className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-wait text-white text-center font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {autoMatchLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finding CDEs...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find CDE Matches
                </>
              )}
            </button>
          )}
          {summary.readyForClosing && (
            <Link
              href={`/closing-room?dealId=${data.dealId}`}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-center font-medium rounded-lg transition-colors"
            >
              Request Closing
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
