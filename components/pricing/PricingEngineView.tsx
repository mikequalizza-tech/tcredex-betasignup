'use client';

import { useState } from 'react';
import { computePricing, PricingInputs, PricingTier } from '@/lib/pricing/engine';
import PricingTierCard from './PricingTierCard';

interface PricingEngineViewProps {
  dealId?: string;
  initialInputs?: Partial<PricingInputs>;
}

export default function PricingEngineView({ dealId, initialInputs }: PricingEngineViewProps) {
  const [tiers, setTiers] = useState<PricingTier[] | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Demo inputs - in production these come from the deal
  const demoInputs: PricingInputs = {
    deal: { id: dealId || 'demo', total_project_cost: 15000000 },
    impact: {
      distress_score: 85,
      impact_score: 78,
      tract: { anchor_type: 'hospital' }
    },
    risk: {
      construction_risk: 0.3,
      sponsor_track_record: 0.85,
      backstop_strength: 0.9,
      coverage_ratio: 1.15
    },
    market: {
      recent_prints: [
        { price: 0.78 },
        { price: 0.80 },
        { price: 0.79 },
        { price: 0.81 }
      ]
    },
    investor_persona: {
      cra_pressure: 0.8,
      yield_target: 0.055,
      optics_weight: 0.7
    },
    ...initialInputs
  };

  const handleCompute = () => {
    const result = computePricing(demoInputs);
    setTiers(result);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Pricing Coach</h2>
        <button
          onClick={handleCompute}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
        >
          Generate Pricing
        </button>
      </div>

      {tiers && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <PricingTierCard
              key={tier.tier}
              tier={tier}
              isRecommended={tier.tier === 'Better'}
              onSelect={() => setSelectedTier(tier.tier)}
            />
          ))}
        </div>
      )}

      {selectedTier && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-300">
            ✓ Selected: <strong>{selectedTier}</strong> tier pricing
          </p>
        </div>
      )}
    </div>
  );
}
