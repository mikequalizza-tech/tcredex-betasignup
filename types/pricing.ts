// tCredex v1.6 - Pricing Types

import type { InvestorPersona } from "./investor";

export interface PricingInputs {
  deal: DealPricingData;
  impact: ImpactData;
  risk: RiskData;
  market: MarketData;
  investor_persona: InvestorPersona;
}

export interface DealPricingData {
  total_project_cost: number;
  allocation_request: number;
  programs: string[];
}

export interface ImpactData {
  distress_score: number;
  impact_score: number;
  tract: {
    anchor_type: "hospital" | "university" | "government" | "none";
    severely_distressed: boolean;
  };
}

export interface RiskData {
  construction_risk: number; // 0-1
  sponsor_track_record: number; // 0-1
  backstop_strength: number; // 0-1
  coverage_ratio: number; // e.g., 1.25
}

export interface MarketData {
  recent_prints: { price: number; date: string }[];
}

export interface PricingTier {
  tier: "Good" | "Better" | "Best";
  price: number;
  irr: number;
  craScore: number;
  probabilityClose: number;
  rationale: string[];
}

export interface PricingResult {
  tiers: PricingTier[];
  computed_at: string;
}
