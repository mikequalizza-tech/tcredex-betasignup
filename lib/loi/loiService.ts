/**
 * tCredex LOI Service
 *
 * Handles all LOI operations with state machine validation
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  LOI,
  LOIStatus,
  CreateLOIInput,
  UpdateLOIInput,
  LOISponsorResponse,
  LOICondition,
  LOIHistoryEntry,
} from "@/types/loi";
import { canTransitionLOI, isLOIActive } from "./stateMachine";

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class LOIService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  // ===========================================================================
  // CREATE
  // ===========================================================================

  async create(input: CreateLOIInput, issuedBy: string): Promise<LOI> {
    // Get sponsor from deal
    const { data: deal } = await this.supabase
      .from("deals")
      .select("sponsor_id, sponsor_name")
      .eq("id", input.deal_id)
      .single();

    if (!deal) {
      throw new Error("Deal not found");
    }

    // Check for existing active LOI from same CDE
    const { data: existing } = await this.supabase
      .from("letters_of_intent")
      .select("id")
      .eq("deal_id", input.deal_id)
      .eq("cde_id", input.cde_id)
      .in("status", ["issued", "pending_sponsor", "sponsor_accepted"])
      .single();

    if (existing) {
      throw new Error("Active LOI already exists from this CDE for this deal");
    }

    // Prepare conditions with IDs
    const conditions: LOICondition[] = (input.conditions || []).map((c, i) => ({
      id: `cond-${Date.now()}-${i}`,
      description: c.description,
      status: c.status || "pending",
      due_date: c.due_date,
    }));

    // Calculate default expiration (30 days)
    const expiresAt =
      input.expires_at ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Insert LOI
    const { data: loi, error } = await this.supabase
      .from("letters_of_intent")
      .insert({
        deal_id: input.deal_id,
        cde_id: input.cde_id,
        sponsor_id: deal.sponsor_id,
        status: "draft",
        allocation_amount: input.allocation_amount,
        qlici_rate: input.qlici_rate,
        leverage_structure: input.leverage_structure || "standard",
        term_years: input.term_years || 7,
        expires_at: expiresAt,
        expected_closing_date: input.expected_closing_date,
        conditions,
        special_terms: input.special_terms,
        cde_requirements: input.cde_requirements || {},
        issued_by: issuedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await this.logToLedger(loi.id, "loi_created", issuedBy, {
      deal_id: input.deal_id,
      cde_id: input.cde_id,
      allocation_amount: input.allocation_amount,
    });

    return loi;
  }

  // ===========================================================================
  // READ
  // ===========================================================================

  async getById(id: string): Promise<LOI | null> {
    const { data, error } = await this.supabase
      .from("letters_of_intent")
      .select(
        `
        *,
        deal:deals(project_name, sponsor_name),
        cde:cdes(name)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async getByDeal(dealId: string): Promise<LOI[]> {
    const { data, error } = await this.supabase
      .from("letters_of_intent")
      .select(
        `
        *,
        cde:cdes(name)
      `,
      )
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByCDE(cdeId: string, status?: LOIStatus[]): Promise<LOI[]> {
    let query = this.supabase
      .from("letters_of_intent")
      .select(
        `
        *,
        deal:deals(project_name, sponsor_name, state)
      `,
      )
      .eq("cde_id", cdeId);

    if (status && status.length > 0) {
      query = query.in("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  }

  async getBySponsor(sponsorId: string, status?: LOIStatus[]): Promise<LOI[]> {
    let query = this.supabase
      .from("letters_of_intent")
      .select(
        `
        *,
        deal:deals(project_name),
        cde:cdes(name)
      `,
      )
      .eq("sponsor_id", sponsorId);

    if (status && status.length > 0) {
      query = query.in("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  }

  async getHistory(loiId: string): Promise<LOIHistoryEntry[]> {
    const { data, error } = await this.supabase
      .from("loi_history")
      .select("*")
      .eq("loi_id", loiId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  async update(
    id: string,
    input: UpdateLOIInput,
    userId: string,
  ): Promise<LOI> {
    const loi = await this.getById(id);
    if (!loi) throw new Error("LOI not found");

    if (!isLOIActive(loi.status)) {
      throw new Error(`Cannot update LOI in status: ${loi.status}`);
    }

    const { data, error } = await this.supabase
      .from("letters_of_intent")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await this.logToLedger(id, "loi_updated", userId, {
      changes: Object.keys(input),
    });

    return data;
  }

  // ===========================================================================
  // STATUS TRANSITIONS
  // ===========================================================================

  async issue(id: string, userId: string): Promise<LOI> {
    return this.transition(id, "issued", userId, {
      issued_at: new Date().toISOString(),
      issued_by: userId,
    });
  }

  async sendToSponsor(id: string, userId: string): Promise<LOI> {
    const loi = await this.getById(id);
    if (!loi) throw new Error("LOI not found");

    // Calculate response deadline (14 days default)
    const responseDeadline = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    return this.transition(id, "pending_sponsor", userId, {
      sponsor_response_deadline: responseDeadline,
    });
  }

  async sponsorRespond(
    id: string,
    response: LOISponsorResponse,
    sponsorId: string,
  ): Promise<LOI> {
    const loi = await this.getById(id);
    if (!loi) throw new Error("LOI not found");

    if (loi.status !== "pending_sponsor") {
      throw new Error("LOI is not pending sponsor response");
    }

    if (loi.sponsor_id !== sponsorId) {
      throw new Error("Only the sponsor can respond to this LOI");
    }

    const now = new Date().toISOString();
    let newStatus: LOIStatus;
    const updates: Record<string, unknown> = {
      sponsor_response_at: now,
      sponsor_response_notes: response.notes,
    };

    switch (response.action) {
      case "accept":
        newStatus = "sponsor_accepted";
        break;
      case "reject":
        newStatus = "sponsor_rejected";
        break;
      case "counter":
        newStatus = "sponsor_countered";
        updates.counter_terms = response.counter_terms;
        break;
      default:
        throw new Error("Invalid response action");
    }

    const updated = await this.transition(id, newStatus, sponsorId, updates);

    // If accepted, update deal status
    if (newStatus === "sponsor_accepted") {
      await this.supabase
        .from("deals")
        .update({ deal_status: "seeking_capital" })
        .eq("id", loi.deal_id);
    }

    return updated;
  }

  async withdraw(id: string, userId: string, reason: string): Promise<LOI> {
    const loi = await this.getById(id);
    if (!loi) throw new Error("LOI not found");

    if (!isLOIActive(loi.status) && loi.status !== "sponsor_accepted") {
      throw new Error(`Cannot withdraw LOI in status: ${loi.status}`);
    }

    return this.transition(id, "withdrawn", userId, {
      withdrawn_by: userId,
      withdrawn_at: new Date().toISOString(),
      withdrawn_reason: reason,
    });
  }

  async expire(id: string): Promise<LOI> {
    return this.transition(id, "expired", "system", {});
  }

  async supersede(id: string, newLoiId: string, userId: string): Promise<LOI> {
    return this.transition(id, "superseded", userId, {
      superseded_by: newLoiId,
    });
  }

  // ===========================================================================
  // CONDITIONS
  // ===========================================================================

  async updateCondition(
    loiId: string,
    conditionId: string,
    status: "pending" | "satisfied" | "waived",
    userId: string,
    notes?: string,
  ): Promise<LOI> {
    const loi = await this.getById(loiId);
    if (!loi) throw new Error("LOI not found");

    const conditions = [...(loi.conditions || [])];
    const condIndex = conditions.findIndex((c) => c.id === conditionId);

    if (condIndex === -1) {
      throw new Error("Condition not found");
    }

    conditions[condIndex] = {
      ...conditions[condIndex],
      status,
      satisfied_at:
        status === "satisfied" ? new Date().toISOString() : undefined,
      notes,
    };

    const { data, error } = await this.supabase
      .from("letters_of_intent")
      .update({ conditions })
      .eq("id", loiId)
      .select()
      .single();

    if (error) throw error;

    await this.logToLedger(loiId, "loi_condition_updated", userId, {
      condition_id: conditionId,
      new_status: status,
    });

    return data;
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  async expireStale(): Promise<number> {
    const { data, error } = await this.supabase
      .from("letters_of_intent")
      .update({ status: "expired" })
      .in("status", ["issued", "pending_sponsor"])
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) throw error;

    // Log each expiration
    for (const loi of data || []) {
      await this.logToLedger(loi.id, "loi_expired", "system", {});
    }

    return data?.length || 0;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async transition(
    id: string,
    newStatus: LOIStatus,
    userId: string,
    additionalUpdates: Record<string, unknown> = {},
  ): Promise<LOI> {
    const loi = await this.getById(id);
    if (!loi) throw new Error("LOI not found");

    if (!canTransitionLOI(loi.status, newStatus)) {
      throw new Error(`Invalid transition: ${loi.status} → ${newStatus}`);
    }

    const { data, error } = await this.supabase
      .from("letters_of_intent")
      .update({
        status: newStatus,
        ...additionalUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await this.logToLedger(id, `loi_status_${newStatus}`, userId, {
      from_status: loi.status,
      to_status: newStatus,
    });

    return data;
  }

  private async logToLedger(
    loiId: string,
    action: string,
    actorId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.supabase.from("ledger_events").insert({
        actor_type: actorId === "system" ? "system" : "user",
        actor_id: actorId,
        entity_type: "loi",
        entity_id: loiId,
        action,
        payload_json: payload,
      });
    } catch (error) {
      console.error("Failed to log to ledger:", error);
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let loiService: LOIService | null = null;

export function getLOIService(): LOIService {
  if (!loiService) {
    loiService = new LOIService();
  }
  return loiService;
}

export default LOIService;
