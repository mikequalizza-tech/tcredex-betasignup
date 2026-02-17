import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// GET - Fetch channels for a deal's closing room
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");

    if (!dealId) {
      return NextResponse.json({ error: "dealId required" }, { status: 400 });
    }
    await verifyDealAccess(request, user, dealId, "view");

    const supabaseAdmin = getSupabaseAdmin();

    // Check if channels exist, if not create defaults
    const { data: existingChannels } = await supabaseAdmin
      .from("closing_room_channels")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (!existingChannels || existingChannels.length === 0) {
      // Create default channels for this deal
      const defaultChannels = [
        { deal_id: dealId, name: "general", type: "text" },
        { deal_id: dealId, name: "documents", type: "text" },
        { deal_id: dealId, name: "questions", type: "text" },
        { deal_id: dealId, name: "meeting-room", type: "video" },
        { deal_id: dealId, name: "voice-chat", type: "audio" },
      ];

      const { data: newChannels, error } = await supabaseAdmin
        .from("closing_room_channels")
        .insert(defaultChannels)
        .select();

      if (error) {
        console.error("[Channels] Error creating defaults:", error);
        // Return empty if table doesn't exist yet
        return NextResponse.json({ channels: [] });
      }

      return NextResponse.json({ channels: newChannels });
    }

    return NextResponse.json({ channels: existingChannels });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST - Create a new channel
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { dealId, name, type } = await request.json();

    if (!dealId || !name) {
      return NextResponse.json(
        { error: "dealId and name required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");

    const supabaseAdmin = getSupabaseAdmin();

    const { data: channel, error } = await supabaseAdmin
      .from("closing_room_channels")
      .insert({
        deal_id: dealId,
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: type || "text",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ channel });
  } catch (error) {
    return handleAuthError(error);
  }
}
