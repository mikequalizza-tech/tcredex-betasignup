'use client';

import { useState, useEffect } from 'react';
import DealCard from '@/components/DealCard';
import { Deal } from '@/lib/data/deals';
import { fetchDeals } from '@/lib/supabase/queries';

type DealStatus = 'all' | 'active' | 'pending' | 'closed';

export default function AdminDealsPage() {
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [statusFilter, setStatusFilter] = useState<DealStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadDeals() {
      setIsLoading(true);
      try {
        const deals = await fetchDeals();
        setAllDeals(deals);
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDeals();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const filteredDeals = allDeals.filter((deal) => {
    // Apply status filter
    if (statusFilter !== 'all') {
      const statusMap: Record<DealStatus, string[]> = {
        all: [],
        active: ['available', 'seeking_capital', 'matched', 'under_review'],
        pending: ['draft', 'submitted'],
        closed: ['closed', 'withdrawn'],
      };
      if (!statusMap[statusFilter]?.includes(deal.status)) return false;
    }
    // Apply search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      deal.projectName.toLowerCase().includes(query) ||
      deal.id.toLowerCase().includes(query) ||
      deal.city.toLowerCase().includes(query) ||
      deal.state.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Deal Management</h1>
                <p className="text-sm text-gray-400">Admin panel for managing all deals</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
                + New Deal
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'closed'] as DealStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Deal ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Project Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Allocation</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredDeals.map((deal) => (
                  <tr 
                    key={deal.id} 
                    className={`hover:bg-gray-900/50 cursor-pointer ${selectedDeal?.id === deal.id ? 'bg-gray-900' : ''}`}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-400">{deal.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-100">{deal.projectName}</div>
                      <div className="text-xs text-gray-500">{deal.sponsorName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{deal.city}, {deal.state}</td>
                    <td className="px-6 py-4 text-sm text-indigo-400 font-medium">{formatCurrency(deal.allocation)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        deal.status === 'available' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {deal.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                        <button className="text-xs text-gray-400 hover:text-gray-300">Archive</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      {selectedDeal && (
        <div className="w-[400px] border-l border-gray-800 bg-gray-900 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Deal Preview</h2>
            <button 
              onClick={() => setSelectedDeal(null)}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <DealCard deal={selectedDeal} />
          <div className="mt-4 space-y-2">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
              Edit Deal
            </button>
            <button className="w-full px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
