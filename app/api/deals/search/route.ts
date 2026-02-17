/**
 * Deal Search API
 * PostgreSQL full-text search via Supabase RPC with role-based filtering
 * Used by HeaderSearch (Cmd+K) for deal-specific results
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function enrichDealsWithSponsorNames(
  supabase: ReturnType<typeof createServerClient>,
  deals: Array<Record<string, unknown>>,
) {
  if (!Array.isArray(deals) || deals.length === 0) return [];

  const sponsorById = new Map<string, Record<string, unknown>>();
  const sponsorByOrgId = new Map<string, Record<string, unknown>>();

  const sponsorIds = Array.from(
    new Set(
      deals
        .map((deal) => deal.sponsor_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  );
  if (sponsorIds.length > 0) {
    const { data: sponsorsById } = await supabase
      .from("sponsors")
      .select("id, organization_id, organization_name")
      .in("id", sponsorIds);
    for (const sponsor of (sponsorsById || []) as Array<
      Record<string, unknown>
    >) {
      if (typeof sponsor.id === "string") sponsorById.set(sponsor.id, sponsor);
      if (typeof sponsor.organization_id === "string")
        sponsorByOrgId.set(sponsor.organization_id, sponsor);
    }
  }

  const sponsorOrgIds = Array.from(
    new Set(
      deals
        .map((deal) => deal.sponsor_organization_id)
        .filter(
          (value): value is string =>
            typeof value === "string" && !sponsorByOrgId.has(value),
        ),
    ),
  );
  if (sponsorOrgIds.length > 0) {
    const { data: sponsorsByOrg } = await supabase
      .from("sponsors")
      .select("id, organization_id, organization_name")
      .in("organization_id", sponsorOrgIds);
    for (const sponsor of (sponsorsByOrg || []) as Array<
      Record<string, unknown>
    >) {
      if (typeof sponsor.id === "string") sponsorById.set(sponsor.id, sponsor);
      if (typeof sponsor.organization_id === "string")
        sponsorByOrgId.set(sponsor.organization_id, sponsor);
    }
  }

  return deals.map((deal) => {
    const sponsor =
      (typeof deal.sponsor_id === "string"
        ? sponsorById.get(deal.sponsor_id)
        : undefined) ||
      (typeof deal.sponsor_organization_id === "string"
        ? sponsorByOrgId.get(deal.sponsor_organization_id)
        : undefined);
    const sponsorName =
      sponsor?.organization_name ||
      deal.sponsor_organization_name ||
      deal.sponsor_name ||
      deal.sponsorName ||
      "Unknown Sponsor";

    return {
      ...deal,
      sponsor_organization_name: sponsorName,
      sponsorName,
    };
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ deals: [] });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // Read-only for GET
      },
    },
  );

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ deals: [] });
  }

  // Get user's organization info for role-based filtering
  const { data: userRecord } = await supabase
    .from("users")
    .select("organization_id, role_type")
    .eq("id", user.id)
    .single();

  const orgType = userRecord?.role_type;
  const orgId = userRecord?.organization_id;

  // PostgreSQL full-text search via RPC (role filtering built into SQL function)
  // Custom RPC function (supabase-fts-migration.sql) — not in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deals, error } = (await (supabase as any).rpc("search_deals", {
    search_query: query,
    result_limit: limit,
    user_org_type: orgType || null,
    user_org_id: orgId || null,
  })) as {
    data: Record<string, unknown>[] | null;
    error: { message: string } | null;
  };

  if (error) {
    console.error("[Search] RPC error:", error);
    return NextResponse.json(
      { deals: [], error: error.message },
      { status: 500 },
    );
  }

  const enrichedDeals = await enrichDealsWithSponsorNames(
    supabase,
    (deals || []) as Array<Record<string, unknown>>,
  );

  return NextResponse.json({
    deals: enrichedDeals,
    source: "supabase-fts",
  });
}
