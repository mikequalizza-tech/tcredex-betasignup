/**
 * tCredex Intake Tiers API
 *
 * GET /api/intake/tiers?deal_id=xxx - Get deal tier status
 * POST /api/intake/tiers - Advance tier
 */

import { NextRequest, NextResponse } from "next/server";
import { getIntakeTierService } from "@/lib/intake";
import { IntakeTier } from "@/types/intakeTiers";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// =============================================================================
// GET /api/intake/tiers - Get deal tier status
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("deal_id");

    if (!dealId) {
      return NextResponse.json(
        { success: false, error: "deal_id required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "view");

    const service = getIntakeTierService();
    const status = await service.getDealTierStatus(dealId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/intake/tiers - Advance tier
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { deal_id, target_tier } = body as {
      deal_id: string;
      target_tier: IntakeTier;
    };

    if (!deal_id || !target_tier) {
      return NextResponse.json(
        { success: false, error: "deal_id and target_tier required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, deal_id, "edit");

    if (![1, 2, 3, 4].includes(target_tier)) {
      return NextResponse.json(
        { success: false, error: "target_tier must be 1, 2, 3, or 4" },
        { status: 400 },
      );
    }

    const service = getIntakeTierService();
    const result = await service.advanceTier(deal_id, target_tier, user.id);

    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
