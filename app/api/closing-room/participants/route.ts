import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// GET - Fetch participants for a deal's closing room
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");

    if (!dealId) {
      return NextResponse.json({ error: "dealId required" }, { status: 400 });
    }

    await verifyDealAccess(request, user, dealId, "view");
    const supabaseAdmin = getSupabaseAdmin();

    // Get deal to find sponsor org (via sponsor_id join)
    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("sponsor_id, assigned_cde_id, sponsors!inner(organization_id)")
      .eq("id", dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const typedDeal = deal as {
      sponsor_id: string;
      assigned_cde_id: string | null;
      sponsors: { organization_id: string } | null;
    };

    const sponsorOrgId = typedDeal.sponsors?.organization_id;
    if (!sponsorOrgId) {
      return NextResponse.json(
        { error: "Deal sponsor not found" },
        { status: 404 },
      );
    }

    const participants: {
      id: string;
      name: string;
      organization: string;
      role: string;
      online?: boolean;
    }[] = [];

    // Get sponsor org users
    const { data: sponsorUsers } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("organization_id", sponsorOrgId);

    // Get sponsor org name
    const { data: sponsorOrg } = await supabaseAdmin
      .from("sponsors")
      .select("primary_contact_name")
      .eq("organization_id", sponsorOrgId)
      .single();

    if (sponsorUsers) {
      for (const user of sponsorUsers) {
        const typedUser = user as {
          id: string;
          name: string;
          email: string;
        };
        participants.push({
          id: typedUser.id,
          name: typedUser.name || typedUser.email,
          organization: sponsorOrg?.primary_contact_name || "Sponsor",
          role: "Sponsor",
          online: false,
        });
      }
    }

    // Get CDE org users if assigned
    if (typedDeal.assigned_cde_id) {
      const { data: cde } = await supabaseAdmin
        .from("cdes")
        .select("id, primary_contact_name")
        .eq("id", typedDeal.assigned_cde_id)
        .single();

      if (cde) {
        const { data: cdeUsers } = await supabaseAdmin
          .from("users")
          .select("id, name, email")
          .eq("organization_id", cde.id);

        if (cdeUsers) {
          for (const user of cdeUsers) {
            const typedUser = user as {
              id: string;
              name: string;
              email: string;
            };
            participants.push({
              id: typedUser.id,
              name: typedUser.name || typedUser.email,
              organization: cde.primary_contact_name || "CDE",
              role: "CDE",
              online: false,
            });
          }
        }
      }
    }

    // Get investors with commitments to this deal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: commitments } = await (supabaseAdmin as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Table 'investor_commitments' not yet in DB schema
      .from("investor_commitments" as any)
      .select("investor_id")
      .eq("deal_id", dealId);

    if (commitments) {
      const investorIds = new Set<string>(
        (commitments as { investor_id: string | null }[])
          .map((c) => c.investor_id)
          .filter((id): id is string => Boolean(id)),
      );

      for (const investorId of investorIds) {
        const { data: investor } = await supabaseAdmin
          .from("investors")
          .select("id, primary_contact_name")
          .eq("id", investorId)
          .single();

        if (investor) {
          const { data: investorUsers } = await supabaseAdmin
            .from("users")
            .select("id, name, email")
            .eq("organization_id", investor.id);

          if (investorUsers) {
            for (const user of investorUsers) {
              const typedUser = user as {
                id: string;
                name: string;
                email: string;
              };
              participants.push({
                id: typedUser.id,
                name: typedUser.name || typedUser.email,
                organization: investor.primary_contact_name || "Investor",
                role: "Investor",
                online: false,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ participants });
  } catch (error) {
    return handleAuthError(error);
  }
}
