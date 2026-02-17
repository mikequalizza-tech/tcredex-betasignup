/**
 * tCredex Commitment Service
 *
 * Handles all Commitment operations with state machine validation
 * Triggers Closing Room when all parties accept
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Commitment,
  CommitmentStatus,
  CreateCommitmentInput,
  UpdateCommitmentInput,
  CommitmentCondition,
  CommitmentHistoryEntry,
} from "@/types/loi";
import {
  canTransitionCommitment,
  resolveCommitmentStatus,
  isCommitmentActive,
} from "./stateMachine";

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class CommitmentService {
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

  async create(
    input: CreateCommitmentInput,
    issuedBy: string,
  ): Promise<Commitment> {
    // Get deal and sponsor
    const { data: deal } = await this.supabase
      .from("deals")
      .select("id, sponsor_id, project_name")
      .eq("id", input.deal_id)
      .single();

    if (!deal) {
      throw new Error("Deal not found");
    }

    // For NMTC, verify LOI is accepted
    if (input.credit_type === "NMTC" && input.loi_id) {
      const { data: loi } = await this.supabase
        .from("letters_of_intent")
        .select("status, cde_id")
        .eq("id", input.loi_id)
        .single();

      if (!loi || loi.status !== "sponsor_accepted") {
        throw new Error("NMTC commitment requires an accepted LOI");
      }

      // Auto-fill CDE from LOI if not provided
      if (!input.cde_id) {
        input.cde_id = loi.cde_id;
      }
    }

    // Check for existing active commitment from same investor
    const { data: existing } = await this.supabase
      .from("commitments")
      .select("id")
      .eq("deal_id", input.deal_id)
      .eq("investor_id", input.investor_id)
      .in("status", [
        "issued",
        "pending_sponsor",
        "pending_cde",
        "all_accepted",
      ])
      .single();

    if (existing) {
      throw new Error(
        "Active commitment already exists from this investor for this deal",
      );
    }

    // Calculate expected credits
    const expectedCredits = input.credit_rate
      ? input.investment_amount * input.credit_rate
      : undefined;

    // Calculate net benefit
    const netBenefit =
      input.pricing_cents_per_credit && expectedCredits
        ? expectedCredits * input.pricing_cents_per_credit
        : undefined;

    // Prepare conditions with IDs
    const conditions: CommitmentCondition[] = (input.conditions || []).map(
      (c, i) => ({
        id: `cond-${Date.now()}-${i}`,
        description: c.description,
        status: c.status || "pending",
        responsible_party: c.responsible_party,
        due_date: c.due_date,
      }),
    );

    // Calculate default expiration (45 days)
    const expiresAt =
      input.expires_at ||
      new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();

    // Determine if CDE acceptance required
    const _requiresCDE = input.credit_type === "NMTC" && !!input.cde_id;

    // Insert Commitment
    const { data: commitment, error } = await this.supabase
      .from("commitments")
      .insert({
        deal_id: input.deal_id,
        loi_id: input.loi_id,
        investor_id: input.investor_id,
        cde_id: input.cde_id,
        sponsor_id: deal.sponsor_id,
        status: "draft",
        investment_amount: input.investment_amount,
        credit_type: input.credit_type,
        credit_rate: input.credit_rate,
        expected_credits: expectedCredits,
        pricing_cents_per_credit: input.pricing_cents_per_credit,
        net_benefit_to_project: netBenefit,
        expires_at: expiresAt,
        target_closing_date: input.target_closing_date,
        conditions,
        special_terms: input.special_terms,
        investor_requirements: input.investor_requirements || {},
        cra_eligible: input.cra_eligible || false,
        issued_by: issuedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to ledger
    await this.logToLedger(commitment.id, "commitment_created", issuedBy, {
      deal_id: input.deal_id,
      investor_id: input.investor_id,
      investment_amount: input.investment_amount,
      credit_type: input.credit_type,
    });

    return commitment;
  }

  // ===========================================================================
  // READ
  // ===========================================================================

  async getById(id: string): Promise<Commitment | null> {
    const { data, error } = await this.supabase
      .from("commitments")
      .select(
        `
        *,
        deal:deals(project_name),
        investor:investors(name),
        cde:cdes(name),
        loi:letters_of_intent(loi_number, allocation_amount)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async getByDeal(dealId: string): Promise<Commitment[]> {
    const { data, error } = await this.supabase
      .from("commitments")
      .select(
        `
        *,
        investor:investors(name),
        cde:cdes(name)
      `,
      )
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByInvestor(
    investorId: string,
    status?: CommitmentStatus[],
  ): Promise<Commitment[]> {
    let query = this.supabase
      .from("commitments")
      .select(
        `
        *,
        deal:deals(project_name, state),
        cde:cdes(name)
      `,
      )
      .eq("investor_id", investorId);

    if (status && status.length > 0) {
      query = query.in("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  }

  async getByCDE(
    cdeId: string,
    status?: CommitmentStatus[],
  ): Promise<Commitment[]> {
    let query = this.supabase
      .from("commitments")
      .select(
        `
        *,
        deal:deals(project_name),
        investor:investors(name)
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

  async getBySponsor(
    sponsorId: string,
    status?: CommitmentStatus[],
  ): Promise<Commitment[]> {
    let query = this.supabase
      .from("commitments")
      .select(
        `
        *,
        deal:deals(project_name),
        investor:investors(name),
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

  async getHistory(commitmentId: string): Promise<CommitmentHistoryEntry[]> {
    const { data, error } = await this.supabase
      .from("commitment_history")
      .select("*")
      .eq("commitment_id", commitmentId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================

  async update(
    id: string,
    input: UpdateCommitmentInput,
    userId: string,
  ): Promise<Commitment> {
    const commitment = await this.getById(id);
    if (!commitment) throw new Error("Commitment not found");

    if (!isCommitmentActive(commitment.status)) {
      throw new Error(
        `Cannot update commitment in status: ${commitment.status}`,
      );
    }

    // Recalculate derived values if needed
    const updates: Record<string, unknown> = { ...input };

    if (input.credit_rate || input.investment_amount) {
      const amount = input.investment_amount || commitment.investment_amount;
      const rate = input.credit_rate || commitment.credit_rate;
      if (rate) {
        updates.expected_credits = amount * rate;
      }
    }

    if (input.pricing_cents_per_credit && updates.expected_credits) {
      updates.net_benefit_to_project =
        (updates.expected_credits as number) * input.pricing_cents_per_credit;
    }

    const { data, error } = await this.supabase
      .from("commitments")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await this.logToLedger(id, "commitment_updated", userId, {
      changes: Object.keys(input),
    });

    return data;
  }

  // ===========================================================================
  // STATUS TRANSITIONS
  // ===========================================================================

  async issue(id: string, userId: string): Promise<Commitment> {
    return this.transition(id, "issued", userId, {
      issued_at: new Date().toISOString(),
      issued_by: userId,
    });
  }

  async sendForAcceptance(id: string, userId: string): Promise<Commitment> {
    const commitment = await this.getById(id);
    if (!commitment) throw new Error("Commitment not found");

    // Determine who needs to accept
    const _requiresCDE =
      commitment.credit_type === "NMTC" && !!commitment.cde_id;

    // Calculate response deadline (21 days default)
    const responseDeadline = new Date(
      Date.now() + 21 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Start with sponsor
    return this.transition(id, "pending_sponsor", userId, {
      response_deadline: responseDeadline,
    });
  }

  async sponsorAccept(
    id: string,
    sponsorId: string,
    _notes?: string,
  ): Promise<Commitment> {
    const commitment = await this.getById(id);
    if (!commitment) throw new Error("Commitment not found");

    if (commitment.sponsor_id !== sponsorId) {
      throw new Error("Only the sponsor can accept this commitment");
    }

    const now = new Date().toISOString();
    const requiresCDE =
      commitment.credit_type === "NMTC" && !!commitment.cde_id;
    const cdeAlreadyAccepted = !!commitment.cde_accepted_at;

    // Determine new status
    const newStatus = resolveCommitmentStatus({
      sponsor_accepted: true,
      cde_accepted: cdeAlreadyAccepted,
      requires_cde: requiresCDE,
    });

    const updates: Record<string, unknown> = {
      sponsor_accepted_at: now,
      sponsor_accepted_by: sponsorId,
    };

    if (newStatus === "all_accepted") {
      updates.all_accepted_at = now;
    }

    const updated = await this.transition(id, newStatus, sponsorId, updates);

    // If fully accepted, trigger closing room
    if (newStatus === "all_accepted") {
      await this.triggerClosingRoom(updated);
    }

    return updated;
  }

  async cdeAccept(
    id: string,
    cdeUserId: string,
    _notes?: string,
  ): Promise<Commitment> {
    const commitment = await this.getById(id);
    if (!commitment) throw new Error("Commitment not found");

    // Verify user belongs to CDE (would need to check in real implementation)

    const now = new Date().toISOString();
    const sponsorAlreadyAccepted = !!commitment.sponsor_accepted_at;

    // Determine new status
    const newStatus = resolveCommitmentStatus({
      sponsor_accepted: sponsorAlreadyAccepted,
      cde_accepted: true,
      requires_cde: true,
    });

    const updates: Record<string, unknown> = {
      cde_accepted_at: now,
      cde_accepted_by: cdeUserId,
    };

    if (newStatus === "all_accepted") {
      updates.all_accepted_at = now;
    }

    const updated = await this.transition(id, newStatus, cdeUserId, updates);

    // If fully accepted, trigger closing room
    if (newStatus === "all_accepted") {
      await this.triggerClosingRoom(updated);
    }

    return updated;
  }

  async reject(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Commitment> {
    return this.transition(id, "rejected", userId, {
      rejection_reason: reason,
      rejected_by: userId,
      rejected_at: new Date().toISOString(),
    });
  }

  async withdraw(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Commitment> {
    const commitment = await this.getById(id);
    if (!commitment) throw new Error("Commitment not found");

    if (!isCommitmentActive(commitment.status)) {
      throw new Error(
        `Cannot withdraw commitment in status: ${commitment.status}`,
      );
    }

    return this.transition(id, "withdrawn", userId, {
      withdrawn_by: userId,
      withdrawn_at: new Date().toISOString(),
      withdrawn_reason: reason,
    });
  }

  async expire(id: string): Promise<Commitment> {
    return this.transition(id, "expired", "system", {});
  }

  // ===========================================================================
  // CLOSING ROOM TRIGGER
  // ===========================================================================

  private async triggerClosingRoom(commitment: Commitment): Promise<void> {
    const now = new Date().toISOString();

    // Update deal status to 'closing'
    await this.supabase
      .from("deals")
      .update({
        deal_status: "closing",
        closing_started_at: now,
      })
      .eq("id", commitment.deal_id);

    // Create closing room record if not exists
    const { data: existingRoom } = await this.supabase
      .from("closing_rooms")
      .select("id")
      .eq("deal_id", commitment.deal_id)
      .single();

    if (!existingRoom) {
      await this.supabase.from("closing_rooms").insert({
        deal_id: commitment.deal_id,
        commitment_id: commitment.id,
        loi_id: commitment.loi_id,
        status: "active",
        target_close_date: commitment.target_closing_date,
        opened_at: now,
      });
    }

    // Log milestone
    await this.logToLedger(commitment.id, "closing_room_triggered", "system", {
      deal_id: commitment.deal_id,
      commitment_id: commitment.id,
    });
  }

  // ===========================================================================
  // CONDITIONS
  // ===========================================================================

  async updateCondition(
    commitmentId: string,
    conditionId: string,
    status: "pending" | "satisfied" | "waived",
    userId: string,
    notes?: string,
  ): Promise<Commitment> {
    const commitment = await this.getById(commitmentId);
    if (!commitment) throw new Error("Commitment not found");

    const conditions = [...(commitment.conditions || [])];
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
      .from("commitments")
      .update({ conditions })
      .eq("id", commitmentId)
      .select()
      .single();

    if (error) throw error;

    await this.logToLedger(
      commitmentId,
      "commitment_condition_updated",
      userId,
      {
        condition_id: conditionId,
        new_status: status,
      },
    );

    return data;
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  async expireStale(): Promise<number> {
    const { data, error } = await this.supabase
      .from("commitments")
      .update({ status: "expired" })
      .in("status", ["issued", "pending_sponsor", "pending_cde"])
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) throw error;

    for (const c of data || []) {
      await this.logToLedger(c.id, "commitment_expired", "system", {});
    }

    return data?.length || 0;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async transition(
    id: string,
    newStatus: CommitmentStatus,
    userId: string,
    additionalUpdates: Record<string, unknown> = {},
  ): Promise<Commitment> {
    const commitment = await this.getById(id);
    if (!commitment) throw new Error("Commitment not found");

    if (!canTransitionCommitment(commitment.status, newStatus)) {
      throw new Error(
        `Invalid transition: ${commitment.status} → ${newStatus}`,
      );
    }

    const { data, error } = await this.supabase
      .from("commitments")
      .update({
        status: newStatus,
        ...additionalUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await this.logToLedger(id, `commitment_status_${newStatus}`, userId, {
      from_status: commitment.status,
      to_status: newStatus,
    });

    return data;
  }

  private async logToLedger(
    commitmentId: string,
    action: string,
    actorId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.supabase.from("ledger_events").insert({
        actor_type: actorId === "system" ? "system" : "user",
        actor_id: actorId,
        entity_type: "commitment",
        entity_id: commitmentId,
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

let commitmentService: CommitmentService | null = null;

export function getCommitmentService(): CommitmentService {
  if (!commitmentService) {
    commitmentService = new CommitmentService();
  }
  return commitmentService;
}

export default CommitmentService;
