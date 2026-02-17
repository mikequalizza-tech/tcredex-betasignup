/**
 * GET /api/discord/servers?userId=xxx
 * Returns Discord servers the user belongs to, with channels and members
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Find servers the user is a member of
    const { data: memberRows, error: memberError } = await supabase
      .from("discord_members")
      .select("server_id")
      .eq("user_id", userId);

    if (memberError) {
      // Table might not exist yet — return empty with setup hint
      const tablesMissing =
        memberError.message?.includes("schema cache") ||
        memberError.message?.includes("does not exist");
      if (tablesMissing) {
        console.warn(
          "[Discord] Tables not found in Supabase. Run scripts/create-discord-tables.sql",
        );
      } else {
        console.error("Discord members query error:", memberError);
      }
      return NextResponse.json({ success: true, data: [], tablesMissing });
    }

    if (!memberRows || memberRows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const serverIds = memberRows.map((m: { server_id: string }) => m.server_id);

    // Fetch servers with channels and members
    const { data: servers, error: serverError } = await supabase
      .from("discord_servers")
      .select(
        `
        id,
        name,
        image_url,
        invite_code,
        owner_id,
        organization_id,
        deal_id,
        server_type,
        created_at,
        discord_channels (
          id,
          name,
          type,
          server_id,
          description,
          is_private,
          created_at
        ),
        discord_members (
          id,
          user_id,
          server_id,
          role,
          created_at
        )
      `,
      )
      .in("id", serverIds);

    if (serverError) {
      console.error("Discord servers query error:", serverError);
      return NextResponse.json({ success: true, data: [] });
    }

    // Transform to match frontend interface
    interface ServerRow {
      id: string;
      name: string;
      image_url: string | null;
      invite_code: string | null;
      owner_id: string;
      organization_id: string | null;
      deal_id: string | null;
      server_type: string | null;
      created_at: string | null;
      discord_channels?: Array<{
        id: string;
        name: string;
        type: string;
        server_id: string;
        description: string | null;
        is_private: boolean | null;
        created_at: string | null;
      }>;
      discord_members?: Array<{
        id: string;
        user_id: string;
        server_id: string;
        role: string;
        created_at: string | null;
      }>;
    }
    const formatted = (servers || []).map((s: ServerRow) => ({
      id: s.id,
      name: s.name,
      imageUrl: s.image_url,
      inviteCode: s.invite_code,
      ownerId: s.owner_id,
      organizationId: s.organization_id,
      dealId: s.deal_id,
      serverType: s.server_type,
      createdAt: s.created_at,
      channels: (s.discord_channels || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        serverId: c.server_id,
        description: c.description,
        isPrivate: c.is_private,
        createdAt: c.created_at,
      })),
      members: (s.discord_members || []).map((m) => ({
        id: m.id,
        userId: m.user_id,
        serverId: m.server_id,
        role: m.role,
        createdAt: m.created_at,
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Discord servers API error:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}
