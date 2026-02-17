import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    await verifyDealAccess(request, user, id, "view");

    const supabase = getSupabaseAdmin();
    const { data: userProfile } = await supabase
      .from("users")
      .select("name, organization_name")
      .eq("id", user.id)
      .single();

    const messageContent =
      typeof body.message === "string" && body.message.trim().length > 0
        ? body.message.trim()
        : "Requesting more information about this deal";

    // Create request info record in messages/requests table.
    // Sender identity is derived from auth context, not request body.
    // NOTE: messages table doesn't have deal_id/status — this insert needs a proper info_requests table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("messages")
      .insert({
        deal_id: id,
        sender_org_id: user.organizationId,
        sender_name: userProfile?.name || user.email,
        sender_org: userProfile?.organization_name || null,
        message_type: "info_request",
        content: messageContent,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
