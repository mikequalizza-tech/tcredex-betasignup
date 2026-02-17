/**
 * POST /api/discord/setup
 * Auto-create a Discord server for the user's organization if none exists.
 * Creates a default server with #general and #deals text channels.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Get user info for org context
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, organization_id, organization_name, role_type")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userData as {
      id: string;
      organization_id: string | null;
      organization_name: string | null;
      role_type: string | null;
    };

    // Check if user's org already has an ORGANIZATION-type server
    // (Don't skip setup if user only has deal/closing_room memberships from outreach)
    const { data: existingOrgServer } = await supabase
      .from("discord_servers")
      .select("id")
      .eq("organization_id", user.organization_id as string)
      .eq("server_type", "organization")
      .limit(1)
      .maybeSingle();

    if (existingOrgServer) {
      // Org server exists — make sure this user is a member of it
      const orgServerId = (existingOrgServer as { id: string }).id;
      await supabase.from("discord_members").upsert(
        {
          user_id: userId,
          server_id: orgServerId,
          role: "ADMIN",
        } as never,
        { onConflict: "user_id,server_id" },
      );

      return NextResponse.json({
        success: true,
        message: "Server already exists",
        alreadySetup: true,
      });
    }

    // Create a server for the organization
    const serverName = user.organization_name || "My Organization";
    const { data: server, error: serverError } = await supabase
      .from("discord_servers")
      .insert({
        name: serverName,
        owner_id: userId,
        organization_id: user.organization_id,
        server_type: "organization",
        invite_code: Math.random().toString(36).substring(2, 10),
      } as never)
      .select()
      .single();

    if (serverError) {
      console.error("Create server error:", serverError);
      return NextResponse.json(
        { error: "Failed to create server" },
        { status: 500 },
      );
    }

    const serverId = (server as { id: string }).id;

    // Create default channels
    const channels = [
      { name: "general", type: "TEXT", description: "General discussion" },
      { name: "deals", type: "TEXT", description: "Deal discussions" },
      {
        name: "announcements",
        type: "TEXT",
        description: "Team announcements",
      },
    ];

    for (const ch of channels) {
      await supabase.from("discord_channels").insert({
        name: ch.name,
        type: ch.type,
        server_id: serverId,
        created_by: userId,
        description: ch.description,
        is_private: false,
      } as never);
    }

    // Add the user as an ADMIN member
    await supabase.from("discord_members").insert({
      user_id: userId,
      server_id: serverId,
      role: "ADMIN",
    } as never);

    return NextResponse.json({
      success: true,
      message: "Server created",
      serverId,
      serverName,
    });
  } catch (error) {
    console.error("Discord setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
