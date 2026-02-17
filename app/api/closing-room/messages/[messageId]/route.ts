import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// PATCH - Update a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { messageId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("closing_room_messages")
      .select("sender_id, room_id")
      .eq("id", messageId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const dealId = await getDealIdFromRoomId(
      supabaseAdmin,
      (existing as { room_id: string }).room_id,
    );
    await verifyDealAccess(request, user, dealId, "view");

    if ((existing as { sender_id: string }).sender_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update message - Supabase Realtime will broadcast it
    const { data: message, error } = await supabaseAdmin
      .from("closing_room_messages")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) {
      console.error("[Messages] Update error:", error);
      return NextResponse.json(
        { error: "Failed to update message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE - Soft delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { messageId } = await params;

    const supabaseAdmin = getSupabaseAdmin();

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("closing_room_messages")
      .select("sender_id, room_id")
      .eq("id", messageId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const dealId = await getDealIdFromRoomId(
      supabaseAdmin,
      (existing as { room_id: string }).room_id,
    );
    await verifyDealAccess(request, user, dealId, "view");

    if ((existing as { sender_id: string }).sender_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Soft delete - Supabase Realtime will broadcast the update
    const { error } = await supabaseAdmin
      .from("closing_room_messages")
      .update({
        content: "This message has been deleted",
        deleted: true,
        file_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      console.error("[Messages] Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
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
