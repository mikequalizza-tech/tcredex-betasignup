/**
 * tCredex Ledger Hash Chain
 * Cryptographic functions for tamper-evident logging
 */

import { createHash } from 'crypto';
import type { LedgerEvent, ChainIssue } from './types';

/**
 * Build canonical string representation of a ledger event for hashing
 * Order and format must be consistent for verification
 */
export function buildCanonicalString(
  eventId: number | string,
  timestamp: string,
  actorType: string,
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  payloadJson: Record<string, unknown>,
  modelVersion: string | null | undefined,
  reasonCodes: Record<string, unknown> | null | undefined,
  prevHash: string | null | undefined
): string {
  // Canonical JSON encoding (keys sorted, no whitespace)
  const canonicalPayload = JSON.stringify(payloadJson, Object.keys(payloadJson).sort());
  const canonicalReasonCodes = reasonCodes 
    ? JSON.stringify(reasonCodes, Object.keys(reasonCodes).sort()) 
    : '';
  
  // Build canonical string with pipe delimiter
  const parts = [
    String(eventId),
    timestamp,
    actorType,
    actorId,
    entityType,
    entityId,
    action,
    canonicalPayload,
    modelVersion || '',
    canonicalReasonCodes,
    prevHash || ''
  ];
  
  return parts.join('|');
}

/**
 * Compute SHA-256 hash of canonical string
 */
export function computeHash(canonicalString: string): string {
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Compute hash for a ledger event
 */
export function computeEventHash(
  event: {
    id: number | string;
    event_timestamp: string;
    actor_type: string;
    actor_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    payload_json: Record<string, unknown>;
    model_version?: string | null;
    reason_codes?: Record<string, unknown> | null;
    prev_hash?: string | null;
  }
): string {
  const canonical = buildCanonicalString(
    event.id,
    event.event_timestamp,
    event.actor_type,
    event.actor_id,
    event.entity_type,
    event.entity_id,
    event.action,
    event.payload_json,
    event.model_version,
    event.reason_codes,
    event.prev_hash
  );
  return computeHash(canonical);
}

/**
 * Verify the hash chain for a sequence of events
 * Returns issues found (empty array if valid)
 */
export function verifyHashChain(events: LedgerEvent[]): ChainIssue[] {
  const issues: ChainIssue[] = [];
  
  if (events.length === 0) {
    return issues;
  }
  
  // Sort by ID to ensure correct order
  const sortedEvents = [...events].sort((a, b) => a.id - b.id);
  
  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    
    // Verify event's own hash
    const computedHash = computeEventHash(event);
    if (computedHash !== event.hash) {
      issues.push({
        event_id: event.id,
        issue_type: 'hash_mismatch',
        expected: computedHash,
        actual: event.hash,
        message: `Event ${event.id}: computed hash does not match stored hash`
      });
    }
    
    // Verify prev_hash chain (skip first event)
    if (i > 0) {
      const prevEvent = sortedEvents[i - 1];
      if (event.prev_hash !== prevEvent.hash) {
        issues.push({
          event_id: event.id,
          issue_type: 'prev_hash_mismatch',
          expected: prevEvent.hash,
          actual: event.prev_hash,
          message: `Event ${event.id}: prev_hash does not match previous event's hash`
        });
      }
    }
  }
  
  return issues;
}

/**
 * Get hash chain summary for a range of events
 */
export function getChainSummary(events: LedgerEvent[]): {
  firstEventId: number;
  lastEventId: number;
  firstHash: string;
  lastHash: string;
  eventCount: number;
} | null {
  if (events.length === 0) {
    return null;
  }
  
  const sorted = [...events].sort((a, b) => a.id - b.id);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  return {
    firstEventId: first.id,
    lastEventId: last.id,
    firstHash: first.hash,
    lastHash: last.hash,
    eventCount: events.length
  };
}

/**
 * Compute hash for file/document content (for document hashing)
 */
export function computeFileHash(content: Buffer | string): string {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate a verification report
 */
export function generateVerificationReport(
  events: LedgerEvent[],
  requestedBy: string
): {
  valid: boolean;
  events_checked: number;
  chain_valid: boolean;
  issues: ChainIssue[];
  summary: ReturnType<typeof getChainSummary>;
  verification_timestamp: string;
  requested_by: string;
} {
  const issues = verifyHashChain(events);
  const summary = getChainSummary(events);
  
  return {
    valid: issues.length === 0,
    events_checked: events.length,
    chain_valid: issues.length === 0,
    issues,
    summary,
    verification_timestamp: new Date().toISOString(),
    requested_by: requestedBy
  };
}
