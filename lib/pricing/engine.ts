/**
 * tCredex Pricing Engine
 *
 * Generates Good/Better/Best pricing tiers for NMTC credit pricing.
 * Uses deal impact, risk, market data, and investor preferences.
 *
 * TODO: Full implementation — currently stubs for build.
 */

export interface PricingInputs {
  deal: { id: string; total_project_cost: number };
  impact: {
    distress_score: number;
    impact_score: number;
    tract?: { anchor_type?: string };
  };
  risk: {
    construction_risk: number;
    sponsor_track_record: number;
    backstop_strength: number;
    coverage_ratio: number;
  };
  market: {
    recent_prints: { price: number }[];
  };
  investor_persona: {
    cra_pressure: number;
    yield_target: number;
    optics_weight: number;
  };
}

export interface PricingTier {
  tier: 'Good' | 'Better' | 'Best';
  price: number;
  irr: number;
  craScore: string;
  probabilityClose: number;
  rationale: string[];
}

/**
 * Compute Good/Better/Best pricing tiers from deal inputs.
 */
export function computePricing(inputs: PricingInputs): PricingTier[] {
  const avgPrint = inputs.market.recent_prints.length > 0
    ? inputs.market.recent_prints.reduce((sum, p) => sum + p.price, 0) / inputs.market.recent_prints.length
    : 0.78;

  const riskAdj = (1 - inputs.risk.construction_risk) * inputs.risk.sponsor_track_record;
  const impactAdj = inputs.impact.distress_score / 100;

  return [
    {
      tier: 'Good',
      price: +(avgPrint * 0.95 * riskAdj).toFixed(4),
      irr: 0.045 + (1 - riskAdj) * 0.02,
      craScore: impactAdj > 0.8 ? 'Outstanding' : 'Satisfactory',
      probabilityClose: 0.85,
      rationale: [
        'Conservative pricing based on recent market prints',
        `Risk-adjusted for ${(inputs.risk.construction_risk * 100).toFixed(0)}% construction risk`,
        'Higher close probability at lower price point',
      ],
    },
    {
      tier: 'Better',
      price: +(avgPrint * riskAdj).toFixed(4),
      irr: 0.055 + (1 - riskAdj) * 0.015,
      craScore: impactAdj > 0.7 ? 'Outstanding' : 'Satisfactory',
      probabilityClose: 0.72,
      rationale: [
        'Market-rate pricing aligned with recent comps',
        `Sponsor track record: ${(inputs.risk.sponsor_track_record * 100).toFixed(0)}%`,
        'Balanced risk-return profile',
      ],
    },
    {
      tier: 'Best',
      price: +(avgPrint * 1.05 * riskAdj).toFixed(4),
      irr: 0.065 + (1 - riskAdj) * 0.01,
      craScore: impactAdj > 0.6 ? 'Outstanding' : 'Satisfactory',
      probabilityClose: 0.58,
      rationale: [
        'Premium pricing for high-impact deal',
        `Impact score: ${inputs.impact.impact_score}/100`,
        'Requires strong investor CRA motivation',
      ],
    },
  ];
}
