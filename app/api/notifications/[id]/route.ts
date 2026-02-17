/**
 * tCredex API - Single Notification
 * PATCH /api/notifications/[id] - Mark notification as read
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { error } = await supabase
      .from("notifications")
      .update({ read: body.read ?? true } as never)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Update notification error:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
