/**
 * POST /api/discord/messages
 * Send a message to a Discord channel
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { content, channelId, memberId, fileUrl, fileName, fileType } = body;

    if (!content || !channelId || !memberId) {
      return NextResponse.json(
        { error: "content, channelId, and memberId are required" },
        { status: 400 },
      );
    }

    const insertData: Record<string, unknown> = {
      content,
      channel_id: channelId,
      member_id: memberId,
      deleted: false,
      edited: false,
    };

    if (fileUrl) insertData.file_url = fileUrl;
    if (fileName) insertData.file_name = fileName;
    if (fileType) insertData.file_type = fileType;

    const { data: message, error } = await supabase
      .from("discord_messages")
      .insert(insertData as never)
      .select(
        `
        id,
        content,
        file_url,
        file_name,
        file_type,
        deleted,
        edited,
        member_id,
        channel_id,
        created_at,
        updated_at,
        discord_members (
          id,
          user_id,
          role,
          server_id
        )
      `,
      )
      .single();

    if (error) {
      console.error("Discord send message error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    interface DiscordMessageRow {
      id: string;
      content: string;
      file_url: string | null;
      file_name: string | null;
      file_type: string | null;
      deleted: boolean;
      edited: boolean;
      member_id: string;
      channel_id: string;
      created_at: string;
      updated_at: string;
      discord_members?: {
        id: string;
        user_id: string;
        role: string;
        server_id: string;
      } | null;
    }
    const msg = message as DiscordMessageRow;
    const senderUserId = msg.discord_members?.user_id;
    const formatted = {
      id: msg.id,
      content: msg.content,
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      fileType: msg.file_type,
      deleted: msg.deleted,
      edited: msg.edited,
      memberId: msg.member_id,
      channelId: msg.channel_id,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      member: msg.discord_members
        ? {
            id: msg.discord_members.id,
            userId: msg.discord_members.user_id,
            role: msg.discord_members.role,
            serverId: msg.discord_members.server_id,
          }
        : undefined,
    };

    // Create notifications for OTHER members in the channel's server
    if (senderUserId) {
      try {
        // Get sender name
        const { data: senderData } = await supabase
          .from("users")
          .select("name")
          .eq("id", senderUserId)
          .single();
        const senderName =
          (senderData as { name?: string } | null)?.name || "Someone";

        // Get the channel's server to find other members
        const { data: channelData } = await supabase
          .from("discord_channels")
          .select("server_id")
          .eq("id", channelId)
          .single();

        if (channelData) {
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
              body:
                content.length > 100
                  ? content.substring(0, 97) + "..."
                  : content,
              priority: "normal",
              read: false,
              created_at: new Date().toISOString(),
            }));

            await supabase
              .from("notifications")
              .insert(notifInserts as never[]);
          }
        }
      } catch (notifErr) {
        // Best-effort — don't fail the message send
        console.error("[Discord] Notification creation error:", notifErr);
      }
    }

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Discord messages API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
