/**
 * tCredex Deal Checklist API
 * PATCH: Update checklist item completion status
 * GET: Get current checklist status
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/deals/[id]/checklist - Get checklist status
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    await verifyDealAccess(request, user, id, "view");

    const { data, error } = await supabase
      .from("deals")
      .select("id, draft_data")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      throw error;
    }

    const draftData = (data.draft_data as Record<string, unknown>) || {};
    const checklistCompleted = (draftData.checklistCompleted as number[]) || [];
    const documentStatuses = (draftData.documentStatuses as unknown[]) || [];

    return NextResponse.json({
      dealId: id,
      checklistCompleted,
      documentStatuses,
      updatedAt: draftData.checklistUpdatedAt || null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PATCH /api/deals/[id]/checklist - Update checklist item
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id } = await params;
    const body = await request.json();
    await verifyDealAccess(request, user, id, "edit");

    const { itemId, completed } = body;

    if (typeof itemId !== "number") {
      return NextResponse.json(
        { error: "itemId must be a number" },
        { status: 400 },
      );
    }

    // Get current deal data
    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("id, draft_data")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      throw fetchError;
    }

    // Update checklist in draft_data
    const draftData = (deal.draft_data as Record<string, unknown>) || {};
    let checklistCompleted = (draftData.checklistCompleted as number[]) || [];

    if (completed) {
      // Add item if not already in list
      if (!checklistCompleted.includes(itemId)) {
        checklistCompleted = [...checklistCompleted, itemId];
      }
    } else {
      // Remove item from list
      checklistCompleted = checklistCompleted.filter(
        (i: number) => i !== itemId,
      );
    }

    const updatedDraftData = {
      ...draftData,
      checklistCompleted,
      checklistUpdatedAt: new Date().toISOString(),
    };

    // Update the deal
    const { data: _data, error } = await supabase
      .from("deals")
      .update({ draft_data: updatedDraftData } as never)
      .eq("id", id)
      .select("id, draft_data")
      .single();

    if (error) {
      throw error;
    }

    // Log to ledger
    await supabase.from("ledger_events").insert({
      actor_type: "human",
      actor_id: user.id,
      entity_type: "application",
      entity_id: id,
      action: "checklist_updated",
      payload_json: { itemId, completed, checklistCompleted },
      hash: generateHash({ id, itemId, completed }),
    } as never);

    return NextResponse.json({
      success: true,
      checklistCompleted,
      updatedAt: updatedDraftData.checklistUpdatedAt,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}
