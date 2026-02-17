import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Fetch conversations
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
  const category = searchParams.get("category") || "team";
  const organizationId = searchParams.get("organizationId");
  const userId = searchParams.get("userId") || authUser.id;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Build query — filter by organization_id if available, otherwise by user_id
    let query = supabaseAdmin
      .from("conversations")
      .select(
        `
        id,
        type,
        category,
        name,
        deal_id,
        deal_name,
        last_message,
        last_message_at,
        created_at,
        conversation_participants!inner (
          organization_id,
          user_id,
          user_name,
          organization_name,
          role,
          unread_count
        )
      `,
      )
      .eq("category", category)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (organizationId) {
      query = query.eq(
        "conversation_participants.organization_id",
        organizationId,
      );
    } else {
      query = query.eq("conversation_participants.user_id", userId);
    }

    const { data: conversations, error } = await query;

    if (error) throw error;

    // Format the response
    interface ConversationRow {
      id: string;
      type: string;
      name: string | null;
      deal_id: string | null;
      deal_name: string | null;
      last_message: string | null;
      last_message_at: string | null;
      conversation_participants: Array<{
        organization_id: string | null;
        user_id: string | null;
        user_name: string | null;
        organization_name: string | null;
        role: string | null;
        unread_count: number | null;
      }>;
    }
    const formattedConversations = (conversations || []).map(
      (conv: ConversationRow) => {
        const myParticipant = conv.conversation_participants.find((p) =>
          organizationId
            ? p.organization_id === organizationId
            : p.user_id === userId,
        );
        return {
          id: conv.id,
          type: conv.type,
          name: conv.name,
          deal_id: conv.deal_id,
          deal_name: conv.deal_name,
          last_message: conv.last_message,
          last_message_at: conv.last_message_at,
          unread_count: myParticipant?.unread_count || 0,
          participants: conv.conversation_participants.map((p) => ({
            user_id: p.user_id,
            name: p.user_name,
            organization: p.organization_name,
            role: p.role,
          })),
        };
      },
    );

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("[Conversations] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

// POST - Create a new conversation
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
    const body = await request.json();
    const {
      type,
      category,
      participantIds,
      organizationId,
      creatorId,
      creatorName,
      creatorOrg,
      dealId,
      dealName,
    } = body;

    if (!type || !participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: "type and participantIds required" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create conversation
    const orgLabel = creatorOrg || "User";
    const { data: conversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .insert({
        type,
        category: category || type,
        name: `${orgLabel} - ${type.charAt(0).toUpperCase() + type.slice(1)} Chat`,
        deal_id: dealId || null,
        deal_name: dealName || null,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add creator as participant
    const participants = [
      {
        conversation_id: (conversation as { id: string }).id,
        user_id: creatorId || authUser.id,
        organization_id: organizationId || null,
        user_name: creatorName || "User",
        organization_name: creatorOrg || "tCredex",
        role: "owner",
        unread_count: 0,
      },
    ];

    // Add other participants
    for (const participant of participantIds) {
      const participantData =
        typeof participant === "object" ? participant : { id: participant };
      participants.push({
        conversation_id: (conversation as { id: string }).id,
        user_id: participantData.userId || participantData.id,
        organization_id: participantData.organizationId || participantData.id,
        user_name: participantData.name || "Participant",
        organization_name: participantData.organization || "Organization",
        role: "member",
        unread_count: 0,
      });
    }

    const { error: partError } = await supabaseAdmin
      .from("conversation_participants")
      .insert(participants);

    if (partError) throw partError;

    return NextResponse.json({
      conversation: {
        id: (conversation as { id: string }).id,
        type: (conversation as { type: string }).type,
        name: (conversation as { name: string }).name,
        deal_id: (conversation as { deal_id: string | null }).deal_id,
        deal_name: (conversation as { deal_name: string | null }).deal_name,
        unread_count: 0,
        participants: participants.map((p) => ({
          user_id: p.user_id,
          name: p.user_name,
          organization: p.organization_name,
          role: p.role,
        })),
      },
    });
  } catch (error) {
    console.error("[Conversations] Error creating:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
