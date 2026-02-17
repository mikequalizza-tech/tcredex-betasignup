/**
 * Messages API
 * SIMPLIFIED: Uses users - no organization FK joins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { messageCreateSchema } from "@/lib/api/schemas";

// GET - Fetch messages for a conversation
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId required" },
      { status: 400 },
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Verify user is a participant in this conversation
    const { data: participant } = await supabaseAdmin
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", authUser.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("[Messages] Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseBody(request, messageCreateSchema);
    if (isValidationError(body)) return body;
    const { conversationId, content, senderId, senderName, senderOrg } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Insert message
    const { data: message, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId || authUser.id,
        sender_name: senderName || "User",
        sender_org: senderOrg || "Organization",
        sender_org_id: body.senderOrgId || null,
        content,
        message_type: "text",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update conversation's last_message
    await supabaseAdmin
      .from("conversations")
      .update({
        last_message: content.substring(0, 100),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // Create notifications for OTHER participants
    // NOTE: conversation_participants.user_id may store org/entity IDs (not auth user IDs)
    // when conversations are created with cross-org contacts (CDE, Sponsor, Investor).
    // Use organization_id to find real auth users in the target org.
    try {
      const { data: participants } = await supabaseAdmin
        .from("conversation_participants")
        .select("user_id, organization_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", senderId || authUser.id);

      if (participants && participants.length > 0) {
        const { data: conversation } = await supabaseAdmin
          .from("conversations")
          .select("name, deal_id")
          .eq("id", conversationId)
          .single();

        const senderUserId = senderId || authUser.id;
        const realUserIds = new Set<string>();

        for (const p of participants as {
          user_id: string;
          organization_id: string | null;
        }[]) {
          // Look up real auth users in the participant's organization
          if (p.organization_id) {
            const { data: orgUsers } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("organization_id", p.organization_id);
            for (const u of (orgUsers || []) as { id: string }[]) {
              if (u.id !== senderUserId) realUserIds.add(u.id);
            }
          }
          // Also try user_id directly (works for team/direct conversations)
          if (p.user_id && p.user_id !== senderUserId) {
            const { data: directUser } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("id", p.user_id)
              .maybeSingle();
            if (directUser) realUserIds.add((directUser as { id: string }).id);
          }
        }

        if (realUserIds.size > 0) {
          const notificationInserts = Array.from(realUserIds).map((uid) => ({
            user_id: uid,
            deal_id:
              (conversation as { deal_id?: string } | null)?.deal_id || null,
            type: "message",
            event: "new_message_received",
            title: `New message from ${senderName || "Someone"}`,
            body:
              content.length > 100 ? content.substring(0, 97) + "..." : content,
            priority: "normal",
            read: false,
            created_at: new Date().toISOString(),
          }));

          await supabaseAdmin
            .from("notifications")
            .insert(notificationInserts as never[]);
          console.log(
            `[Messages] Notifications created for ${realUserIds.size} user(s)`,
          );
        }
      }
    } catch (notifError) {
      console.error("[Messages] Notification creation error:", notifError);
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[Messages] Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
