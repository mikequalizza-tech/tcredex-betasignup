/**
 * tCredex Deal Search API
 * Full-text search for deals powered by PostgreSQL FTS via Supabase RPC
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json({ deals: [], total: 0 });
    }

    const supabase = getSupabaseAdmin();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("search_deals", {
      search_query: query,
      result_limit: limit,
      user_org_type: user.organizationType || null,
      user_org_id: user.organizationId || null,
    });

    if (error) {
      console.error("[Search/Deals] RPC error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    return NextResponse.json(
      { deals: data || [], total: (data || []).length },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (error) {
    console.error("[Search/Deals] Error:", error);
    return handleAuthError(error);
  }
}
