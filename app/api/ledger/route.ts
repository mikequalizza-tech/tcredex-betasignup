/**
 * tCredex Ledger API Route
 * Endpoints for ledger operations and verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLedgerService, logLedgerEvent } from '@/lib/ledger/service';
import type { LedgerEventInput } from '@/lib/ledger/types';

// POST /api/ledger - Log a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const required = ['actor_type', 'actor_id', 'entity_type', 'entity_id', 'action', 'payload_json'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const input: LedgerEventInput = {
      actor_type: body.actor_type,
      actor_id: body.actor_id,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action: body.action,
      payload_json: body.payload_json,
      model_version: body.model_version,
      reason_codes: body.reason_codes
    };

    const event = await logLedgerEvent(input);

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        hash: event.hash,
        timestamp: event.event_timestamp
      }
    });

  } catch (error) {
    console.error('[API] Ledger POST error:', error);
    return NextResponse.json(
      { error: 'Failed to log event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/ledger - Query events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const service = getLedgerService();
    
    const events = await service.queryEvents({
      entityType: searchParams.get('entity_type') || undefined,
      entityId: searchParams.get('entity_id') || undefined,
      actorId: searchParams.get('actor_id') || undefined,
      action: searchParams.get('action') || undefined,
      startTime: searchParams.get('start_time') || undefined,
      endTime: searchParams.get('end_time') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    });

    return NextResponse.json({
      success: true,
      count: events.length,
      events
    });

  } catch (error) {
    console.error('[API] Ledger GET error:', error);
    return NextResponse.json(
      { error: 'Failed to query events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
