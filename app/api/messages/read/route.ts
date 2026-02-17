import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireAuth } from "@/lib/api/auth-middleware";

// POST - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: participant, error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "Not authorized for this conversation" },
        { status: 403 },
      );
    }

    // Reset unread count for this participant
    const { error: partError } = await supabaseAdmin
      .from("conversation_participants")
      .update({
        unread_count: 0,
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    if (partError) {
      console.error("[Messages] Error resetting unread:", partError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
