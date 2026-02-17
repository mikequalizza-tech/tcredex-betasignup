/**
 * tCredex Admin API - Single Deal Management
 * GET /api/admin/deals/[id] - Get deal details
 * PATCH /api/admin/deals/[id] - Update deal fields/status
 * DELETE /api/admin/deals/[id] - Delete or withdraw deal
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireSystemAdmin } from "@/lib/api/auth-middleware";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireSystemAdmin(request);
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await context.params;

    const { data: deal, error } = await supabaseAdmin
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const [
      documentsResult,
      relationshipsResult,
      loisResult,
      commitmentsResult,
      closingRoomResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("documents")
        .select("id, name, category, status, created_at")
        .eq("deal_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("deal_relationships")
        .select("*")
        .eq("deal_id", id)
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("letters_of_intent")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("commitments")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("closing_rooms")
        .select("*")
        .eq("deal_id", id)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      ...deal,
      documents: documentsResult.data || [],
      relationships: relationshipsResult.data || [],
      letters_of_intent: loisResult.data || [],
      commitments: commitmentsResult.data || [],
      closing_room: closingRoomResult.data || null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminUser = await requireSystemAdmin(request);
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const { action, note } = body;

    if (action) {
      const statusMap: Record<string, string> = {
        approve: "available",
        decline: "withdrawn",
        request_info: "under_review",
        start_review: "under_review",
        make_available: "available",
        mark_funded: "closed",
      };

      const newStatus = statusMap[action];
      if (!newStatus) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("deals")
        .update({
          status: newStatus as never,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update deal status" },
          { status: 500 },
        );
      }

      await supabaseAdmin.from("ledger_events").insert({
        actor_type: "human",
        actor_id: adminUser.id,
        entity_type: "deal",
        entity_id: id,
        action: "application_status_changed",
        payload_json: { new_status: newStatus, note: note || null },
        hash: Math.random().toString(16).slice(2).padEnd(16, "0"),
      } as never);

      return NextResponse.json({
        success: true,
        newStatus,
        message: `Deal action "${action}" applied`,
      });
    }

    const allowedFields = [
      "project_name",
      "sponsor_name",
      "programs",
      "nmtc_financing_requested",
      "project_description",
      "project_type",
      "city",
      "state",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 },
      );
    }

    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("deals")
      .update(updates as never)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update deal" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireSystemAdmin(request);
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get("hard") === "true";

    if (hard) {
      const { error } = await supabaseAdmin.from("deals").delete().eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to delete deal" },
          { status: 500 },
        );
      }
    } else {
      const { error } = await supabaseAdmin
        .from("deals")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to withdraw deal" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    return handleAuthError(error);
  }
}
