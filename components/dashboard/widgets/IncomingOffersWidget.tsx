'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Users, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api/fetch-utils';

interface LOI {
  id: string;
  deal_id: string;
  dealName: string;
  senderName: string;
  allocation_amount: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface Commitment {
  id: string;
  deal_id: string;
  dealName: string;
  senderName: string;
  investment_amount: number;
  status: string;
  created_at: string;
  expires_at?: string;
}

interface IncomingOffersData {
  lois: LOI[];
  commitments: Commitment[];
  totalPending: number;
  summary: {
    totalLois: number;
    pendingLois: number;
    totalCommitments: number;
    pendingCommitments: number;
  };
}

interface IncomingOffersWidgetProps {
  organizationId?: string;
}

export default function IncomingOffersWidget({ organizationId }: IncomingOffersWidgetProps) {
  const [data, setData] = useState<IncomingOffersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'lois' | 'commitments'>('all');

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    async function loadOffers() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchApi<IncomingOffersData>(
          `/api/sponsor/incoming-offers?orgId=${organizationId}`
        );

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load offers');
        }
      } catch (err) {
        setError('Failed to load incoming offers');
        console.error('IncomingOffersWidget error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [organizationId]);

  const formatCurrency = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-900/50 text-green-300';
      case 'rejected':
      case 'declined':
        return 'bg-red-900/50 text-red-300';
      case 'expired':
        return 'bg-gray-800 text-gray-400';
      default:
        return 'bg-amber-900/50 text-amber-300';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Combine and sort offers
  const allOffers = [
    ...(data?.lois || []).map(l => ({ ...l, type: 'loi' as const, amount: l.allocation_amount })),
    ...(data?.commitments || []).map(c => ({ ...c, type: 'commitment' as const, amount: c.investment_amount })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredOffers = activeTab === 'all'
    ? allOffers
    : activeTab === 'lois'
      ? allOffers.filter(o => o.type === 'loi')
      : allOffers.filter(o => o.type === 'commitment');

  const pendingOffers = filteredOffers.filter(o => o.status === 'pending' || o.status === 'draft');

  if (loading) {
    return (
      <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Incoming Offers
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Incoming Offers
          </h3>
        </div>
        <p className="text-gray-500 text-sm text-center py-4">
          {error || 'Unable to load offers'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Incoming Offers
          {data.totalPending > 0 && (
            <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
              {data.totalPending} new
            </span>
          )}
        </h3>
        <Link
          href="/dashboard/offers"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-emerald-900/30 rounded-lg p-2 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">LOIs</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {data.summary.totalLois}
            {data.summary.pendingLois > 0 && (
              <span className="text-xs text-emerald-400 ml-1">
                ({data.summary.pendingLois} pending)
              </span>
            )}
          </p>
        </div>
        <div className="bg-purple-900/30 rounded-lg p-2 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300">Commitments</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {data.summary.totalCommitments}
            {data.summary.pendingCommitments > 0 && (
              <span className="text-xs text-purple-400 ml-1">
                ({data.summary.pendingCommitments} pending)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(['all', 'lois', 'commitments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No offers yet</p>
          <p className="text-gray-600 text-xs mt-1">
            CDEs and Investors will send offers when interested
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredOffers.slice(0, 5).map(offer => (
            <Link
              key={offer.id}
              href={`/deals/${offer.deal_id}?tab=${offer.type === 'loi' ? 'lois' : 'commitments'}&id=${offer.id}`}
              className={`block p-3 rounded-lg border transition-colors ${
                offer.status === 'pending' || offer.status === 'draft'
                  ? 'bg-gray-800/80 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      offer.type === 'loi'
                        ? 'bg-emerald-900/50 text-emerald-300'
                        : 'bg-purple-900/50 text-purple-300'
                    }`}>
                      {offer.type === 'loi' ? 'LOI' : 'Commitment'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(offer.status)}`}>
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{offer.senderName}</p>
                  <p className="text-xs text-gray-400 truncate">{offer.dealName}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-bold text-white">{formatCurrency(offer.amount)}</p>
                  <p className="text-xs text-gray-500">{formatDate(offer.created_at)}</p>
                </div>
              </div>
            </Link>
          ))}

          {filteredOffers.length > 5 && (
            <Link
              href="/dashboard/offers"
              className="block text-center py-2 text-xs text-indigo-400 hover:text-indigo-300"
            >
              +{filteredOffers.length - 5} more offers
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions for Pending */}
      {pendingOffers.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {pendingOffers.length} offer{pendingOffers.length > 1 ? 's' : ''} awaiting your response
          </p>
          <Link
            href="/dashboard/offers?filter=pending"
            className="block w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg text-center transition-colors"
          >
            Review Pending Offers
          </Link>
        </div>
      )}
    </div>
  );
}
