/**
 * tCredex API - Notifications
 * GET /api/notifications - Get user notifications
 * POST /api/notifications/read-all - Mark all as read
 *
 * CRITICAL: All endpoints require authentication and org filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Use requireAuth instead of supabase.auth.getUser()
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    const { data: notificationsData, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    type NotificationRow = {
      id: string;
      type: string | null;
      title: string;
      body: string;
      deal_id: string | null;
      read: boolean | null;
      created_at: string;
    };
    const notifications = notificationsData as NotificationRow[] | null;

    if (error) {
      console.error("Notifications query error:", error);
      // Return empty array if table doesn't exist yet
      return NextResponse.json({
        notifications: [],
        organizationId: user.organizationId,
      });
    }

    // Transform to mobile-friendly format
    const formatted = (notifications || []).map((n) => ({
      id: n.id,
      type: n.type || "status",
      title: n.title,
      body: n.body,
      dealId: n.deal_id,
      read: n.read || false,
      createdAt: n.created_at,
    }));

    return NextResponse.json({
      notifications: formatted,
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Use requireAuth instead of supabase.auth.getUser()
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Mark all as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true } as never)
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error("Mark all read error:", error);
    }

    return NextResponse.json({
      success: true,
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
