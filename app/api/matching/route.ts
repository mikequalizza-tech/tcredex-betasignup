/**
 * tCredex Matching API - AutoMatch AI
 *
 * POST /api/matching - Find CDE matches for a deal
 * GET /api/matching - Get existing matches for a deal
 *
 * This route proxies to the NestJS backend AutoMatch service
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getApiBaseUrl } from "@/lib/api/config";

const API_BASE = getApiBaseUrl();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dealId, minScore, maxResults, notifyMatches } = body || {};

    if (!dealId) {
      return NextResponse.json({ error: "dealId required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend AutoMatch service
    const resp = await fetch(`${API_BASE}/automatch/run/${dealId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ minScore, maxResults, notifyMatches }),
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json(data || { error: "Failed to run automatch" }, {
        status: resp.status,
      });
    }

    // Transform response to match legacy format expected by some components
    return NextResponse.json({
      dealId: data.dealId,
      projectName: data.projectName,
      timestamp: data.timestamp,
      totalMatchesFound: data.matches?.length || 0,
      matches: (data.matches || [])
        .slice(0, 3)
        .map((m: Record<string, unknown>) => ({
          cdeId: m.cdeId,
          cdeName: m.cdeName,
          matchScore: m.totalScore,
          matchStrength: m.matchStrength,
          breakdown: m.breakdown,
          reasons: m.reasons,
        })),
      rule: "3-deal rule applied - showing top 3 matches only",
    });
  } catch (error) {
    console.error("[Matching POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/matching - Get existing matches for a deal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend AutoMatch service
    const resp = await fetch(`${API_BASE}/automatch/matches/${dealId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json(data || { error: "Failed to fetch matches" }, {
        status: resp.status,
      });
    }

    // Transform response to match legacy format
    return NextResponse.json({
      dealId,
      matches: (data.matches || data.data || []).slice(0, 3),
      totalMatchesFound: data.matches?.length || data.data?.length || 0,
    });
  } catch (error) {
    console.error("[Matching GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
