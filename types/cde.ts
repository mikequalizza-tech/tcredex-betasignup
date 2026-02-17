// tCredex v1.6 - CDE Types

import type { CreditProgram } from "./deal";

export interface CDE {
  id: string;
  name: string;
  focus_states: string[];
  programs: CreditProgram[];
  preferred_types: string[];
  allocation_remaining: number;
  allocation_total: number;
  contact_name?: string;
  contact_email?: string;
  created_at: string;
}

export interface CDEMatch {
  id: string;
  deal_id: string;
  cde_id: string;
  match_score: number;
  status: MatchStatus;
  created_at: string;
}

export type MatchStatus = "pending" | "accepted" | "declined" | "expired";

export interface CDEProfile {
  focus_state: string;
  programs: CreditProgram[];
  preferred_type: string;
  min_deal_size?: number;
  max_deal_size?: number;
}
