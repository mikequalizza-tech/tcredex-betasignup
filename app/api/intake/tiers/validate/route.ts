/**
 * tCredex Intake Tier Validation API
 *
 * POST /api/intake/tiers/validate - Validate deal for specific tier
 */

import { NextRequest, NextResponse } from "next/server";
import { getIntakeTierService } from "@/lib/intake";
import { IntakeTier } from "@/types/intakeTiers";

export async function POST(request: NextRequest) {
  try {
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

    if (![1, 2, 3, 4].includes(target_tier)) {
      return NextResponse.json(
        { success: false, error: "target_tier must be 1, 2, 3, or 4" },
        { status: 400 },
      );
    }

    const service = getIntakeTierService();
    const validation = await service.validateDealForTier(deal_id, target_tier);

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("Tier validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
