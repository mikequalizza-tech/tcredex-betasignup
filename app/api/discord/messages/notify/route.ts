/**
 * POST /api/discord/messages/notify
 * Creates notifications for other members in a channel's server.
 * Called after Socket.IO message send succeeds (since that path bypasses REST).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { channelId, senderUserId, content } = await request.json();

    if (!channelId || !senderUserId || !content) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    // Get sender name
    const { data: senderData } = await supabase
      .from("users")
      .select("name")
      .eq("id", senderUserId)
      .single();
    const senderName =
      (senderData as { name?: string } | null)?.name || "Someone";

    // Get the channel's server
    const { data: channelData } = await supabase
      .from("discord_channels")
      .select("server_id")
      .eq("id", channelId)
      .single();

    if (!channelData) {
      return NextResponse.json({ success: true });
    }

    // Get ALL other members in this server
    const { data: otherMembers } = await supabase
      .from("discord_members")
      .select("user_id")
      .eq("server_id", (channelData as { server_id: string }).server_id)
      .neq("user_id", senderUserId);

    if (otherMembers && otherMembers.length > 0) {
      const notifInserts = otherMembers.map((m: { user_id: string }) => ({
        user_id: m.user_id,
        type: "message",
        event: "new_message_received",
        title: `New message from ${senderName}`,
        body: content.length > 100 ? content.substring(0, 97) + "..." : content,
        priority: "normal",
        read: false,
        created_at: new Date().toISOString(),
      }));

      await supabase.from("notifications").insert(notifInserts as never[]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Discord Notify] Error:", error);
    return NextResponse.json({ success: true }); // Best-effort
  }
}
