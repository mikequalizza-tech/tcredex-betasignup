/**
 * Closing Room Activity Feed API
 * GET: Fetch recent activity for a closing room
 * POST: Log a new activity
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "view");

    // Get activities from ledger_events for this deal
    const {
      data: activities,
      error,
      count,
    } = await supabase
      .from("ledger_events")
      .select("*", { count: "exact" })
      .eq("entity_id", dealId)
      .in("action", [
        "document_uploaded",
        "document_deleted",
        "checklist_updated",
        "closing_room_status_changed",
        "participant_invited",
        "participant_joined",
        "issue_created",
        "issue_resolved",
        "milestone_completed",
        "comment_added",
      ])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Activity fetch error:", error);
      // If ledger_events doesn't exist or has issues, return empty
      return NextResponse.json({
        activities: [],
        total: 0,
        hasMore: false,
      });
    }

    // Format activities for display
    const formattedActivities = (activities || []).map((activity) => {
      const payload = (activity.payload_json || {}) as Record<string, unknown>;

      return {
        id: activity.id,
        type: activity.action,
        actor: activity.actor_id,
        actorType: activity.actor_type,
        timestamp: activity.created_at,
        message: formatActivityMessage(activity.action, payload),
        details: payload,
      };
    });

    return NextResponse.json({
      activities: formattedActivities,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { dealId, action, payload } = body;

    if (!dealId || !action) {
      return NextResponse.json(
        { error: "dealId and action are required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");

    const { data, error } = await supabase
      .from("ledger_events")
      .insert({
        actor_type: "human",
        actor_id: user.id,
        entity_type: "closing_room",
        entity_id: dealId,
        action,
        payload_json: payload || {},
        hash: generateHash({ dealId, action, payload }),
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Activity insert error:", error);
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        activity: {
          id: String(data.id),
          type: data.action,
          actor: data.actor_id,
          timestamp: data.created_at,
          message: formatActivityMessage(
            data.action,
            (data.payload_json || {}) as Record<string, unknown>,
          ),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

function formatActivityMessage(
  action: string,
  payload: Record<string, unknown>,
): string {
  switch (action) {
    case "document_uploaded":
      return `Uploaded document: ${payload.file_name || "Unknown file"}`;
    case "document_deleted":
      return `Removed document: ${payload.file_name || "Unknown file"}`;
    case "checklist_updated":
      return payload.completed
        ? `Completed checklist item #${payload.itemId}`
        : `Unchecked checklist item #${payload.itemId}`;
    case "closing_room_status_changed":
      return `Status changed to ${payload.new_status || "unknown"}`;
    case "participant_invited":
      return `Invited ${payload.organization_name || "a participant"}`;
    case "participant_joined":
      return `${payload.organization_name || "A participant"} joined`;
    case "issue_created":
      return `Reported issue: ${payload.title || "Unknown issue"}`;
    case "issue_resolved":
      return `Resolved issue: ${payload.title || "Unknown issue"}`;
    case "milestone_completed":
      return `Completed milestone: ${payload.milestone_name || "Unknown"}`;
    case "comment_added":
      return `Added a comment`;
    default:
      return action.replace(/_/g, " ");
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
