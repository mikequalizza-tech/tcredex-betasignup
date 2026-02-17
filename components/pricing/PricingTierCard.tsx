'use client';

import { PricingTier } from '@/lib/pricing/engine';

interface PricingTierCardProps {
  tier: PricingTier;
  isRecommended?: boolean;
  onSelect?: () => void;
}

export default function PricingTierCard({ tier, isRecommended, onSelect }: PricingTierCardProps) {
  const tierColors = {
    Good: 'border-gray-600 bg-gray-800/50',
    Better: 'border-indigo-500 bg-indigo-900/30',
    Best: 'border-green-500 bg-green-900/30',
  };

  return (
    <div 
      className={`rounded-2xl p-6 shadow-lg border-2 ${tierColors[tier.tier]} ${
        isRecommended ? 'ring-2 ring-indigo-400' : ''
      }`}
    >
      {isRecommended && (
        <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-900 rounded-full mb-4">
          Recommended
        </span>
      )}
      
      <h2 className="text-xl font-semibold text-gray-100 mb-2">{tier.tier} Tier</h2>
      
      <div className="text-4xl font-bold text-white mb-4">
        ${tier.price.toFixed(2)}
        <span className="text-sm font-normal text-gray-400">/credit</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Investor IRR</span>
          <span className="text-gray-200">{(tier.irr * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">CRA Score</span>
          <span className="text-gray-200">{tier.craScore}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Close Probability</span>
          <span className={`font-medium ${
            tier.probabilityClose >= 0.8 ? 'text-green-400' : 
            tier.probabilityClose >= 0.6 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {(tier.probabilityClose * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">Pricing Rationale</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          {tier.rationale.map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      </div>
      
      {onSelect && (
        <button
          onClick={onSelect}
          className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
        >
          Select {tier.tier}
        </button>
      )}
    </div>
  );
}
