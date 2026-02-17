// tCredex v1.6 - Investor Types

export interface Investor {
  id: string;
  name: string;
  type: InvestorType;
  assessment_areas: string[]; // CRA geographies
  cra_pressure: number; // 0-1 scale
  yield_target: number; // e.g., 0.05 = 5%
  optics_weight: number; // 0-1 scale
  min_investment?: number;
  max_investment?: number;
  created_at: string;
}

export type InvestorType = "bank" | "insurance" | "corporate" | "fund";

export interface InvestorPersona {
  cra_pressure: number;
  yield_target: number;
  optics_weight: number;
}

export interface InvestorCommitment {
  id: string;
  investor_id: string;
  deal_id: string;
  amount: number;
  status: CommitmentStatus;
  committed_at?: string;
  created_at: string;
}

export type CommitmentStatus = "pending" | "committed" | "withdrawn" | "closed";
