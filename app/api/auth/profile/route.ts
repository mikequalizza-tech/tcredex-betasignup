/**
 * tCredex API - Profile
 * GET /api/auth/profile
 *
 * SIMPLIFIED: Uses users table directly
 * No organizations FK chain - organization_id + organization_type tells you which entity table
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: error?.message || "Not authenticated" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  });
}
