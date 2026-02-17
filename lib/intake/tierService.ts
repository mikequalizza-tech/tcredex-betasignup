/**
 * tCredex Intake Tier Service
 *
 * Manages tier state, advancement, and field unlocking
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  IntakeTier,
  TIER_NAMES,
  TIER_TRIGGERS,
  getFieldsForTier,
  getNewFieldsAtTier,
} from "@/types/intakeTiers";
import {
  validateTier,
  determineTier,
  getDealTierStatus,
  canAdvanceToTier,
  DealTierStatus,
  TierValidationResult,
  TierAdvanceResult,
} from "./tierValidation";

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class IntakeTierService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  // ===========================================================================
  // GET DEAL STATUS
  // ===========================================================================

  async getDealTierStatus(
    dealId: string,
  ): Promise<DealTierStatus & { deal_id: string }> {
    // Fetch deal data
    const { data: deal, error } = await this.supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      throw new Error("Deal not found");
    }

    const status = getDealTierStatus(deal);

    return {
      deal_id: dealId,
      ...status,
    };
  }

  // ===========================================================================
  // VALIDATE TIER
  // ===========================================================================

  async validateDealForTier(
    dealId: string,
    targetTier: IntakeTier,
  ): Promise<TierValidationResult> {
    const { data: deal, error } = await this.supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      throw new Error("Deal not found");
    }

    return validateTier(deal, targetTier);
  }

  // ===========================================================================
  // CHECK ADVANCEMENT
  // ===========================================================================

  async canAdvance(
    dealId: string,
    targetTier: IntakeTier,
  ): Promise<TierAdvanceResult> {
    const { data: deal, error } = await this.supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      throw new Error("Deal not found");
    }

    // Get transaction state
    const [loiData, commitmentData, closingData] = await Promise.all([
      this.supabase
        .from("letters_of_intent")
        .select("status")
        .eq("deal_id", dealId)
        .in("status", ["issued", "pending_sponsor", "sponsor_accepted"]),
      this.supabase
        .from("commitments")
        .select("status")
        .eq("deal_id", dealId)
        .in("status", [
          "issued",
          "pending_sponsor",
          "pending_cde",
          "all_accepted",
        ]),
      this.supabase
        .from("closing_rooms")
        .select("status")
        .eq("deal_id", dealId)
        .eq("status", "active"),
    ]);

    const hasActiveLOI = (loiData.data?.length || 0) > 0;
    const hasAcceptedLOI =
      loiData.data?.some((l) => l.status === "sponsor_accepted") || false;
    const hasActiveCommitment = (commitmentData.data?.length || 0) > 0;
    const hasAcceptedCommitment =
      commitmentData.data?.some((c) => c.status === "all_accepted") || false;
    const closingRoomOpen = (closingData.data?.length || 0) > 0;

    return canAdvanceToTier(deal, targetTier, {
      has_active_loi: hasActiveLOI,
      has_accepted_loi: hasAcceptedLOI,
      has_active_commitment: hasActiveCommitment,
      has_accepted_commitment: hasAcceptedCommitment,
      closing_room_open: closingRoomOpen,
    });
  }

  // ===========================================================================
  // ADVANCE TIER
  // ===========================================================================

  async advanceTier(
    dealId: string,
    targetTier: IntakeTier,
    userId: string,
  ): Promise<{
    success: boolean;
    new_tier: IntakeTier;
    unlocked_fields: string[];
  }> {
    // Check if can advance
    const advanceResult = await this.canAdvance(dealId, targetTier);

    if (!advanceResult.can_advance) {
      throw new Error(
        `Cannot advance to ${TIER_NAMES[targetTier]}: ` +
          advanceResult.blockers.map((b) => b.label).join(", "),
      );
    }

    // Update deal tier
    const { error } = await this.supabase
      .from("deals")
      .update({
        intake_tier: targetTier,
        tier_advanced_at: new Date().toISOString(),
        tier_advanced_by: userId,
      })
      .eq("id", dealId);

    if (error) throw error;

    // Get newly unlocked fields
    const newFields = getNewFieldsAtTier(targetTier);

    // Log to ledger
    await this.logTierAdvance(
      dealId,
      advanceResult.from_tier,
      targetTier,
      userId,
    );

    return {
      success: true,
      new_tier: targetTier,
      unlocked_fields: newFields.map((f) => f.key),
    };
  }

  // ===========================================================================
  // AUTO-ADVANCE ON TRANSACTION EVENT
  // ===========================================================================

  async checkAndAutoAdvance(
    dealId: string,
    event:
      | "loi_issued"
      | "loi_accepted"
      | "commitment_issued"
      | "commitment_accepted"
      | "closing_opened",
  ): Promise<{ advanced: boolean; new_tier?: IntakeTier }> {
    // Determine target tier based on event
    let targetTier: IntakeTier;
    switch (event) {
      case "loi_issued":
        targetTier = 2;
        break;
      case "commitment_issued":
      case "loi_accepted":
        targetTier = 3;
        break;
      case "commitment_accepted":
      case "closing_opened":
        targetTier = 4;
        break;
      default:
        return { advanced: false };
    }

    // Check if can advance
    const advanceResult = await this.canAdvance(dealId, targetTier);

    if (advanceResult.can_advance && advanceResult.from_tier < targetTier) {
      await this.advanceTier(dealId, targetTier, "system");
      return { advanced: true, new_tier: targetTier };
    }

    return { advanced: false };
  }

  // ===========================================================================
  // GET FORM CONFIGURATION
  // ===========================================================================

  async getFormConfig(dealId: string): Promise<{
    current_tier: IntakeTier;
    visible_fields: ReturnType<typeof getFieldsForTier>;
    field_values: Record<string, unknown>;
    validation: TierValidationResult;
  }> {
    const { data: deal, error } = await this.supabase
      .from("deals")
      .select("*")
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      throw new Error("Deal not found");
    }

    const currentTier = (deal.intake_tier as IntakeTier) || determineTier(deal);
    const visibleFields = getFieldsForTier(currentTier);
    const validation = validateTier(deal, currentTier);

    return {
      current_tier: currentTier,
      visible_fields: visibleFields,
      field_values: deal,
      validation,
    };
  }

  // ===========================================================================
  // SAVE PARTIAL DATA
  // ===========================================================================

  async savePartialData(
    dealId: string,
    data: Record<string, unknown>,
    userId: string,
  ): Promise<{ success: boolean; validation: TierValidationResult }> {
    // Get current tier
    const { data: deal } = await this.supabase
      .from("deals")
      .select("intake_tier")
      .eq("id", dealId)
      .single();

    const currentTier = (deal?.intake_tier as IntakeTier) || 1;

    // Validate the data
    const validation = validateTier(data, currentTier);

    // Save regardless of validation (allow partial saves)
    const { error } = await this.supabase
      .from("deals")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", dealId);

    if (error) throw error;

    return { success: true, validation };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private async logTierAdvance(
    dealId: string,
    fromTier: IntakeTier,
    toTier: IntakeTier,
    userId: string,
  ): Promise<void> {
    try {
      await this.supabase.from("ledger_events").insert({
        actor_type: userId === "system" ? "system" : "user",
        actor_id: userId,
        entity_type: "deal",
        entity_id: dealId,
        action: "intake_tier_advanced",
        payload_json: {
          from_tier: fromTier,
          to_tier: toTier,
          tier_name: TIER_NAMES[toTier],
          trigger: TIER_TRIGGERS[toTier],
        },
      });
    } catch (error) {
      console.error("Failed to log tier advance:", error);
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let tierService: IntakeTierService | null = null;

export function getIntakeTierService(): IntakeTierService {
  if (!tierService) {
    tierService = new IntakeTierService();
  }
  return tierService;
}

export default IntakeTierService;
