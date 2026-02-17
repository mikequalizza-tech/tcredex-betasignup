/**
 * GET /api/discord/channels/[channelId]/messages?limit=50&cursor=xxx
 * Returns messages for a Discord channel
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ channelId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = getSupabaseAdmin();
    const { channelId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const cursor = searchParams.get("cursor");

    let query = supabase
      .from("discord_messages")
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
      .eq("channel_id", channelId)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Discord messages query error:", error);
      return NextResponse.json({
        success: true,
        data: { messages: [], nextCursor: null },
      });
    }

    // Transform to match frontend interface
    interface DiscordMessageRow {
      id: string;
      content: string;
      file_url: string | null;
      file_name: string | null;
      file_type: string | null;
      deleted: boolean | null;
      edited: boolean | null;
      member_id: string;
      channel_id: string;
      created_at: string | null;
      updated_at: string | null;
      discord_members: {
        id: string;
        user_id: string;
        role: string;
        server_id: string;
      } | null;
    }
    const formatted = (messages || []).map((m: DiscordMessageRow) => ({
      id: m.id,
      content: m.content,
      fileUrl: m.file_url,
      fileName: m.file_name,
      fileType: m.file_type,
      deleted: m.deleted,
      edited: m.edited,
      memberId: m.member_id,
      channelId: m.channel_id,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      member: m.discord_members
        ? {
            id: m.discord_members.id,
            userId: m.discord_members.user_id,
            role: m.discord_members.role,
            serverId: m.discord_members.server_id,
          }
        : undefined,
    }));

    const nextCursor =
      formatted.length === limit
        ? formatted[formatted.length - 1]?.createdAt
        : null;

    return NextResponse.json({
      success: true,
      data: { messages: formatted, nextCursor },
    });
  } catch (error) {
    console.error("Discord channel messages API error:", error);
    return NextResponse.json({
      success: true,
      data: { messages: [], nextCursor: null },
    });
  }
}
