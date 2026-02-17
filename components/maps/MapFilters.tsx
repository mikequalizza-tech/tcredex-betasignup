'use client';

import { CreditFilter } from '@/lib/map/types';

interface MapFiltersProps {
  creditFilter: CreditFilter;
  setCreditFilter: (filter: CreditFilter) => void;
  shovelReadyOnly: boolean;
  setShovelReadyOnly: (value: boolean) => void;
}

const creditTypes: { value: CreditFilter; label: string; count?: number }[] = [
  { value: 'all', label: 'All' },
  { value: 'nmtc', label: 'NMTC' },
  { value: 'htc', label: 'HTC' },
  { value: 'lihtc', label: 'LIHTC' },
  { value: 'oz', label: 'OZ' },
  { value: 'brownfield', label: 'Brownfield' },
];

export default function MapFilters({
  creditFilter,
  setCreditFilter,
  shovelReadyOnly,
  setShovelReadyOnly,
}: MapFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Credit Type Filters */}
      <div className="flex flex-wrap gap-2">
        {creditTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setCreditFilter(type.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              creditFilter === type.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Additional Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShovelReadyOnly(!shovelReadyOnly)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
            shovelReadyOnly
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${shovelReadyOnly ? 'bg-white' : 'bg-green-500'}`}></span>
          Shovel Ready
        </button>
        
        <button
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Liked
        </button>
        
        <button
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          Unlocked
        </button>
      </div>
    </div>
  );
}
