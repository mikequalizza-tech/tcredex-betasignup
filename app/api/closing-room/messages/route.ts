import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

const MESSAGES_BATCH = 10;

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { content, fileUrl, roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    if (!content?.trim() && !fileUrl) {
      return NextResponse.json(
        { error: "content or fileUrl required" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const dealId = await getDealIdFromRoomId(supabaseAdmin, roomId);
    await verifyDealAccess(request, user, dealId, "view");

    // Get user info from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabaseAdmin as any)
      .from("users")
      .select("id, name, email, organization_id, role_type, organization_type")
      .eq("id", user.id)
      .single();

    const userName = userData?.name || user.email.split("@")[0] || "User";

    // Get org name based on role_type (with fallback to organization_type)
    const effectiveRoleType =
      userData?.role_type || userData?.organization_type;
    let orgName = "Unknown Org";
    if (userData?.organization_id && effectiveRoleType) {
      const roleTable =
        effectiveRoleType === "sponsor"
          ? "sponsors"
          : effectiveRoleType === "cde"
            ? "cdes"
            : "investors";

      const { data: org } = await supabaseAdmin
        .from(roleTable)
        .select("primary_contact_name")
        .eq("id", userData.organization_id)
        .single();

      orgName = org?.primary_contact_name || "Organization";
    }

    // Insert message - Supabase Realtime will broadcast it
    const { data: message, error } = await supabaseAdmin
      .from("closing_room_messages")
      .insert({
        room_id: roomId,
        sender_id: user.id,
        sender_name: userName,
        sender_org_name: orgName,
        content: content?.trim() || "",
        file_url: fileUrl || null,
        deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[Messages] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    return handleAuthError(error);
  }
}

// GET - Fetch messages for a closing room channel
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const cursor = searchParams.get("cursor");

    if (!roomId) {
      return NextResponse.json({ error: "roomId required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const dealId = await getDealIdFromRoomId(supabaseAdmin, roomId);
    await verifyDealAccess(request, user, dealId, "view");

    let query = supabaseAdmin
      .from("closing_room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(MESSAGES_BATCH);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("[Messages] Query error:", error);
      // Return empty if table doesn't exist yet
      return NextResponse.json({
        items: [],
        nextCursor: null,
      });
    }

    let nextCursor = null;
    if (messages && messages.length === MESSAGES_BATCH) {
      nextCursor = (messages[messages.length - 1] as { created_at: string })
        .created_at;
    }

    return NextResponse.json({
      items: messages?.reverse() || [],
      nextCursor,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getDealIdFromRoomId(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  roomId: string,
): Promise<string> {
  const { data: channel, error } = await supabaseAdmin
    .from("closing_room_channels")
    .select("deal_id")
    .eq("id", roomId)
    .single();

  if (error || !channel) {
    throw new Error("Closing room channel not found");
  }

  return (channel as { deal_id: string }).deal_id;
}
