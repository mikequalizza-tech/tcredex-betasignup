/**
 * CDE Lookup API - Public (no auth required)
 * GET /api/cdes/lookup?org={organization_id}
 *
 * Used by the signup page to pre-fill CDE org name when they click
 * the "Claim Your Seat" magic link from an allocation request email.
 * Only returns non-sensitive public info (name, contact name/email).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org");

  if (!orgId) {
    return NextResponse.json(
      { error: "org parameter required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Look up CDE by organization_id in cdes_merged (most recent year row)
  const { data, error } = await supabase
    .from("cdes_merged")
    .select("name, contact_name, contact_email, organization_id")
    .eq("organization_id", orgId)
    .order("year", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Also try the cdes table (for CDEs that registered directly)
    const { data: cdeData } = await supabase
      .from("cdes")
      .select(
        "organization_name, primary_contact_name, primary_contact_email, organization_id",
      )
      .eq("organization_id", orgId)
      .limit(1)
      .single();

    if (cdeData) {
      const typed = cdeData as {
        organization_name?: string;
        primary_contact_name?: string;
        primary_contact_email?: string;
      };
      return NextResponse.json({
        name: typed.organization_name || "",
        contactName: typed.primary_contact_name || "",
        contactEmail: typed.primary_contact_email || "",
      });
    }

    return NextResponse.json({ error: "CDE not found" }, { status: 404 });
  }

  const typed = data as {
    name?: string;
    contact_name?: string;
    contact_email?: string;
  };
  return NextResponse.json({
    name: typed.name || "",
    contactName: typed.contact_name || "",
    contactEmail: typed.contact_email || "",
  });
}
