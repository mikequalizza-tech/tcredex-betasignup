/**
 * tCredex Ledger Service
 * Core service for tamper-evident event logging
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { computeEventHash, verifyHashChain } from "./hash-chain";
import type {
  LedgerEvent,
  LedgerEventInput,
  LedgerAnchor,
  VerificationResult,
  LedgerExtract,
} from "./types";

// Singleton instance
let ledgerService: LedgerService | null = null;

export class LedgerService {
  private supabase: SupabaseClient;
  private lastHash: string | null = null;
  private lastEventId: number | null = null;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    // Use service role key for ledger operations (bypasses RLS for INSERT)
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Initialize the service by loading the last event hash
   */
  async initialize(): Promise<void> {
    const { data, error } = await this.supabase
      .from("ledger_events")
      .select("id, hash")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      this.lastHash = data.hash;
      this.lastEventId = data.id;
    }
  }

  /**
   * Log a new event to the ledger
   */
  async logEvent(input: LedgerEventInput): Promise<LedgerEvent> {
    // Ensure we have the latest hash
    if (this.lastHash === null) {
      await this.initialize();
    }

    const timestamp = new Date().toISOString();

    // Create event object for hashing (without ID - we'll get that from DB)
    // We use a placeholder ID for initial hash, then update after insert
    const tempId = (this.lastEventId || 0) + 1;

    const eventForHashing = {
      id: tempId,
      event_timestamp: timestamp,
      actor_type: input.actor_type,
      actor_id: input.actor_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      payload_json: input.payload_json,
      model_version: input.model_version || null,
      reason_codes: input.reason_codes || null,
      prev_hash: this.lastHash,
    };

    const hash = computeEventHash(eventForHashing);

    // Insert the event
    const { data, error } = await this.supabase
      .from("ledger_events")
      .insert({
        event_timestamp: timestamp,
        actor_type: input.actor_type,
        actor_id: input.actor_id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        action: input.action,
        payload_json: input.payload_json,
        model_version: input.model_version,
        reason_codes: input.reason_codes,
        prev_hash: this.lastHash,
        hash: hash,
      })
      .select()
      .single();

    if (error) {
      console.error("[Ledger] Error inserting event:", error);
      throw new Error(`Failed to log ledger event: ${error.message}`);
    }

    // Update local state
    this.lastHash = data.hash;
    this.lastEventId = data.id;

    console.log(
      `[Ledger] Event logged: ${input.action} on ${input.entity_type}:${input.entity_id}`,
    );

    return data as LedgerEvent;
  }

  /**
   * Query ledger events with filters
   */
  async queryEvents(
    options: {
      entityType?: string;
      entityId?: string;
      actorId?: string;
      action?: string;
      startTime?: string;
      endTime?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<LedgerEvent[]> {
    let query = this.supabase
      .from("ledger_events")
      .select("*")
      .order("id", { ascending: true });

    if (options.entityType) {
      query = query.eq("entity_type", options.entityType);
    }
    if (options.entityId) {
      query = query.eq("entity_id", options.entityId);
    }
    if (options.actorId) {
      query = query.eq("actor_id", options.actorId);
    }
    if (options.action) {
      query = query.eq("action", options.action);
    }
    if (options.startTime) {
      query = query.gte("event_timestamp", options.startTime);
    }
    if (options.endTime) {
      query = query.lte("event_timestamp", options.endTime);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 100) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Ledger] Error querying events:", error);
      throw new Error(`Failed to query ledger events: ${error.message}`);
    }

    return (data || []) as LedgerEvent[];
  }

  /**
   * Get events for a specific entity
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
  ): Promise<LedgerEvent[]> {
    return this.queryEvents({ entityType, entityId });
  }

  /**
   * Verify the hash chain for a range of events
   */
  async verifyChain(options: {
    startEventId?: number;
    endEventId?: number;
    requestedBy: string;
  }): Promise<VerificationResult> {
    let query = this.supabase
      .from("ledger_events")
      .select("*")
      .order("id", { ascending: true });

    if (options.startEventId) {
      query = query.gte("id", options.startEventId);
    }
    if (options.endEventId) {
      query = query.lte("id", options.endEventId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch events for verification: ${error.message}`,
      );
    }

    const events = (data || []) as LedgerEvent[];
    const issues = verifyHashChain(events);

    const result: VerificationResult = {
      valid: issues.length === 0,
      events_checked: events.length,
      chain_valid: issues.length === 0,
      issues,
      start_event_id: events[0]?.id || 0,
      end_event_id: events[events.length - 1]?.id || 0,
      final_hash: events[events.length - 1]?.hash || "",
      verification_timestamp: new Date().toISOString(),
    };

    // Log the verification
    await this.supabase.from("ledger_verifications").insert({
      start_event_id: result.start_event_id,
      end_event_id: result.end_event_id,
      events_checked: result.events_checked,
      chain_valid: result.chain_valid,
      issues: issues.length > 0 ? issues : null,
      requested_by: options.requestedBy,
      completed_at: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Generate a ledger extract for audit purposes
   */
  async generateExtract(options: {
    startTime?: string;
    endTime?: string;
    entityType?: string;
    entityId?: string;
    extractedBy: string;
  }): Promise<LedgerExtract> {
    const events = await this.queryEvents({
      startTime: options.startTime,
      endTime: options.endTime,
      entityType: options.entityType,
      entityId: options.entityId,
    });

    if (events.length === 0) {
      throw new Error("No events found for extract criteria");
    }

    return {
      events,
      start_timestamp: events[0].event_timestamp,
      end_timestamp: events[events.length - 1].event_timestamp,
      event_count: events.length,
      first_hash: events[0].hash,
      final_hash: events[events.length - 1].hash,
      extracted_at: new Date().toISOString(),
      extracted_by: options.extractedBy,
    };
  }

  /**
   * Get the latest hash for external anchoring
   */
  async getLatestHash(): Promise<{
    eventId: number;
    hash: string;
    timestamp: string;
  } | null> {
    const { data, error } = await this.supabase
      .from("ledger_events")
      .select("id, hash, event_timestamp")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      eventId: data.id,
      hash: data.hash,
      timestamp: data.event_timestamp,
    };
  }

  /**
   * Record an external anchor
   */
  async recordAnchor(
    ledgerEventId: number,
    anchoredHash: string,
    anchorType: "github_gist" | "blockchain" | "escrow_email",
    externalReference?: string,
    metadata?: Record<string, unknown>,
  ): Promise<LedgerAnchor> {
    const { data, error } = await this.supabase
      .from("ledger_anchors")
      .insert({
        ledger_event_id: ledgerEventId,
        anchored_hash: anchoredHash,
        anchor_type: anchorType,
        external_reference: externalReference,
        metadata,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record anchor: ${error.message}`);
    }

    return data as LedgerAnchor;
  }

  /**
   * Get recent anchors
   */
  async getAnchors(limit: number = 10): Promise<LedgerAnchor[]> {
    const { data, error } = await this.supabase
      .from("ledger_anchors")
      .select("*")
      .order("anchored_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get anchors: ${error.message}`);
    }

    return (data || []) as LedgerAnchor[];
  }
}

/**
 * Get or create the singleton ledger service instance
 */
export function getLedgerService(): LedgerService {
  if (!ledgerService) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured for ledger service");
    }

    ledgerService = new LedgerService(supabaseUrl, supabaseServiceKey);
  }

  return ledgerService;
}

/**
 * Helper function to log an event (convenience wrapper)
 */
export async function logLedgerEvent(
  input: LedgerEventInput,
): Promise<LedgerEvent> {
  const service = getLedgerService();
  return service.logEvent(input);
}
