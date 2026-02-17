/**
 * tCredex Ledger Verification API
 * Verify hash chain integrity
 */

import { NextRequest, NextResponse } from "next/server";
import { getLedgerService } from "@/lib/ledger/service";

// POST /api/ledger/verify - Verify hash chain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const service = getLedgerService();

    const result = await service.verifyChain({
      startEventId: body.start_event_id,
      endEventId: body.end_event_id,
      requestedBy: body.requested_by || "api_request",
    });

    return NextResponse.json({
      success: true,
      verification: result,
    });
  } catch (error) {
    console.error("[API] Ledger verify error:", error);
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/ledger/verify - Get latest hash for anchoring
export async function GET() {
  try {
    const service = getLedgerService();
    const latest = await service.getLatestHash();

    if (!latest) {
      return NextResponse.json({
        success: true,
        message: "No ledger events found",
        latest: null,
      });
    }

    return NextResponse.json({
      success: true,
      latest,
    });
  } catch (error) {
    console.error("[API] Ledger verify GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to get latest hash",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
