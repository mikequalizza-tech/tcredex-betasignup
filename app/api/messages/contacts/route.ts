/**
 * Contacts API
 * SIMPLIFIED: Uses *_simplified and cdes_merged tables - no organization FK joins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET - Fetch contacts based on category
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

  try {
    const supabaseAdmin = getSupabaseAdmin();
    let contacts: Record<string, unknown>[] = [];

    if (category === "team") {
      // Fetch team members from same organization
      // If organizationId is set, filter by it; otherwise show all platform users
      if (organizationId) {
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("id, name, email, role")
          .eq("organization_id", organizationId)
          .neq("id", authUser.id);

        if (error) throw error;

        contacts = (data || []).map((user: Record<string, unknown>) => ({
          id: user.id,
          name: (user.name || user.email) as string,
          organization: "Your Team",
          role: (user.role || "Member") as string,
          org_type: "team",
        }));
      } else {
        // No organization set — show other platform users as potential contacts
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("id, name, email, role, organization_name, role_type")
          .neq("id", authUser.id)
          .limit(50);

        if (error) throw error;

        contacts = (data || []).map((user: Record<string, unknown>) => ({
          id: user.id,
          name: (user.name || user.email) as string,
          organization: (user.organization_name || "tCredex User") as string,
          role: (user.role_type || user.role || "Member") as string,
          org_type: "team",
        }));
      }
    } else if (category === "cde") {
      // Fetch CDEs from cdes_merged (SOT) — deduplicate by organization_id
      // Note: cdes_merged uses contact_name/contact_email (not primary_contact_*)
      const { data, error } = await supabaseAdmin
        .from("cdes_merged")
        .select("id, organization_id, name, contact_name, contact_email")
        .order("year", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Deduplicate by organization_id — keep latest year per CDE
      const seenOrgs = new Set<string>();
      const deduped: Record<string, unknown>[] = [];
      for (const cde of data || []) {
        const orgId = ((cde as Record<string, unknown>).organization_id ||
          (cde as Record<string, unknown>).id) as string;
        if (seenOrgs.has(orgId)) continue;
        seenOrgs.add(orgId);
        deduped.push(cde as Record<string, unknown>);
      }

      contacts = deduped.slice(0, 50).map((cde: Record<string, unknown>) => ({
        id: (cde.organization_id || cde.id) as string,
        name: (cde.contact_name || cde.contact_email || cde.name) as string,
        organization: (cde.name || "CDE") as string,
        role: "CDE",
        org_type: "cde",
      }));
    } else if (category === "investor") {
      // Fetch Investors — use organization_id as contact id so conversation participants
      // can be resolved to real auth users via users.organization_id
      const { data, error } = await supabaseAdmin
        .from("investors")
        .select(
          "id, organization_id, organization_name, primary_contact_name, primary_contact_email",
        )
        .limit(50);

      if (error) throw error;

      contacts = (data || []).map((investor: Record<string, unknown>) => ({
        id: (investor.organization_id || investor.id) as string,
        name: (investor.primary_contact_name ||
          investor.primary_contact_email) as string,
        organization: (investor.organization_name || "Investor") as string,
        role: "Investor",
        org_type: "investor",
      }));
    } else if (category === "sponsor") {
      // Fetch Sponsors — use organization_id as contact id so conversation participants
      // can be resolved to real auth users via users.organization_id
      let sponsorQuery = supabaseAdmin
        .from("sponsors")
        .select(
          "id, organization_id, organization_name, primary_contact_name, primary_contact_email",
        )
        .limit(50);
      if (organizationId) {
        sponsorQuery = sponsorQuery.neq("organization_id", organizationId);
      }
      const { data, error } = await sponsorQuery;

      if (error) throw error;

      contacts = (data || []).map((sponsor: Record<string, unknown>) => ({
        id: (sponsor.organization_id || sponsor.id) as string,
        name: (sponsor.primary_contact_name ||
          sponsor.primary_contact_email) as string,
        organization: (sponsor.organization_name || "Sponsor") as string,
        role: "Sponsor",
        org_type: "sponsor",
      }));
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("[Contacts] Error fetching:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 },
    );
  }
}
