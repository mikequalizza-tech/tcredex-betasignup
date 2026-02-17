/**
 * tCredex API - Register Push Token
 * POST /api/push/register
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, platform } = await request.json();

    if (!token || !platform) {
      return NextResponse.json(
        { error: "token and platform are required" },
        { status: 400 },
      );
    }

    // Upsert push token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Table 'push_tokens' not yet in DB schema
    const { error } = await (supabase as any).from("push_tokens").upsert(
      {
        user_id: user.id,
        token,
        platform,
        updated_at: new Date().toISOString(),
      } as never,
      {
        onConflict: "user_id,token",
      },
    );

    if (error) {
      console.error("Push token registration error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push token registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
