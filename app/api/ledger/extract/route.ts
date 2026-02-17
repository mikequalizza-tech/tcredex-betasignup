/**
 * tCredex Ledger Extract API
 * Generate audit-ready ledger extracts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLedgerService } from '@/lib/ledger/service';

// POST /api/ledger/extract - Generate ledger extract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.extracted_by) {
      return NextResponse.json(
        { error: 'extracted_by is required for audit trail' },
        { status: 400 }
      );
    }

    const service = getLedgerService();
    
    const extract = await service.generateExtract({
      startTime: body.start_time,
      endTime: body.end_time,
      entityType: body.entity_type,
      entityId: body.entity_id,
      extractedBy: body.extracted_by
    });

    // Log that an extract was generated (meta-logging)
    await service.logEvent({
      actor_type: 'human',
      actor_id: body.extracted_by,
      entity_type: 'application',
      entity_id: 'ledger_extract',
      action: 'compliance_check_performed',
      payload_json: {
        extract_type: 'ledger_extract',
        event_count: extract.event_count,
        start_timestamp: extract.start_timestamp,
        end_timestamp: extract.end_timestamp,
        first_hash: extract.first_hash,
        final_hash: extract.final_hash
      }
    });

    return NextResponse.json({
      success: true,
      extract: {
        event_count: extract.event_count,
        start_timestamp: extract.start_timestamp,
        end_timestamp: extract.end_timestamp,
        first_hash: extract.first_hash,
        final_hash: extract.final_hash,
        extracted_at: extract.extracted_at,
        extracted_by: extract.extracted_by,
        events: extract.events
      }
    });

  } catch (error) {
    console.error('[API] Ledger extract error:', error);
    return NextResponse.json(
      { error: 'Extract generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
