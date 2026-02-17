/**
 * Dashboard Interest API
 * Returns CDE and Investor interest data grouped by credit type
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ" | "BROWNFIELD" | "STATE";

interface InterestItem {
  id: string;
  name: string;
  organizationId: string;
  programs: ProgramType[];
  allocation?: number;
  availableAllocation?: number;
  matchScore?: number;
  dealId?: string;
  dealName?: string;
}

interface InterestByProgram {
  program: ProgramType;
  label: string;
  cdes: InterestItem[];
  investors: InterestItem[];
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Get sponsor_id if user is a sponsor
    let sponsorId: string | null = null;
    if (user.organizationType === "sponsor") {
      const { data: sponsorData } = await supabase
        .from("sponsors")
        .select("id")
        .eq("organization_id", user.organizationId)
        .single();
      sponsorId = sponsorData?.id || null;
    }

    if (!sponsorId) {
      return NextResponse.json({ interest: [] });
    }

    // Get all deals for this sponsor
    const { data: dealsData } = await supabase
      .from("deals")
      .select("id, project_name, programs, status")
      .eq("sponsor_id", sponsorId)
      .in("status", [
        "submitted",
        "available",
        "seeking_capital",
        "matched",
        "closing",
      ]);

    const dealIds = (dealsData || []).map((d) => d.id);

    if (dealIds.length === 0) {
      return NextResponse.json({ interest: [] });
    }

    // Get deal matches (CDE interest)
    // Note: Simplified query - may need adjustment based on actual schema
    const { data: matchesData } = await supabase
      .from("deal_matches")
      .select(
        `
        deal_id,
        cde_id,
        score,
        deals(id, project_name, programs)
      `,
      )
      .in("deal_id", dealIds)
      .order("score", { ascending: false })
      .limit(100);

    // Get CDE details separately
    const cdeIds = [
      ...new Set(
        (matchesData || []).map(
          (m: Record<string, unknown>) => m.cde_id as string,
        ),
      ),
    ];
    const cdeDetails: Record<string, Record<string, unknown>> = {};

    if (cdeIds.length > 0) {
      // Try to get CDE info from cdes_merged table
      const { data: cdesData } = await supabase
        .from("cdes_merged")
        .select("id, organization_id, name, amount_remaining")
        .in("id", cdeIds);

      (cdesData || []).forEach((cde: Record<string, unknown>) => {
        cdeDetails[cde.id as string] = cde;
      });
    }

    // Get investor interest (from commitments or outreach)
    const { data: commitmentsData } = await supabase
      .from("commitments")
      .select(
        `
        deal_id,
        investor_id,
        deals(id, project_name, programs)
      `,
      )
      .in("deal_id", dealIds)
      .in("status", [
        "issued",
        "pending_sponsor",
        "pending_cde",
        "all_accepted",
        "closing",
      ])
      .limit(100);

    // Get investor details separately
    const investorIds = [
      ...new Set(
        (commitmentsData || []).map(
          (c: Record<string, unknown>) => c.investor_id as string,
        ),
      ),
    ];
    const investorDetails: Record<string, Record<string, unknown>> = {};

    if (investorIds.length > 0) {
      const { data: investorsData } = await supabase
        .from("investors")
        .select("id, organization_id, organization_name, target_credit_types")
        .in("id", investorIds);

      (investorsData || []).forEach((inv: Record<string, unknown>) => {
        investorDetails[inv.id as string] = inv;
      });
    }

    // Group by program type
    const interestByProgram: Record<string, InterestByProgram> = {};

    // Process CDE matches
    (matchesData || []).forEach((match: Record<string, unknown>) => {
      const deal = match.deals as Record<string, unknown> | undefined;
      const cdeId = match.cde_id as string;
      const cde = cdeDetails[cdeId];
      const programs = (deal?.programs || ["NMTC"]) as ProgramType[];

      programs.forEach((program: ProgramType) => {
        if (!interestByProgram[program]) {
          interestByProgram[program] = {
            program,
            label: getProgramLabel(program),
            cdes: [],
            investors: [],
          };
        }

        // Check if CDE already added for this program
        const existing = interestByProgram[program].cdes.find(
          (c) => c.id === cdeId,
        );
        if (!existing && cde) {
          interestByProgram[program].cdes.push({
            id: cdeId,
            name: (cde.name || "Unknown CDE") as string,
            organizationId: (cde.organization_id || cdeId) as string,
            programs: [program],
            availableAllocation: Number(cde.amount_remaining) || 0,
            matchScore: match.score as number,
            dealId: deal?.id as string,
            dealName: deal?.project_name as string,
          });
        }
      });
    });

    // Process investor commitments
    (commitmentsData || []).forEach((commitment: Record<string, unknown>) => {
      const deal = commitment.deals as Record<string, unknown> | undefined;
      const investorId = commitment.investor_id as string;
      const investor = investorDetails[investorId];
      const programs = (deal?.programs || ["NMTC"]) as ProgramType[];

      programs.forEach((program: ProgramType) => {
        if (!interestByProgram[program]) {
          interestByProgram[program] = {
            program,
            label: getProgramLabel(program),
            cdes: [],
            investors: [],
          };
        }

        // Check if investor already added for this program
        const existing = interestByProgram[program].investors.find(
          (i) => i.id === investorId,
        );
        if (!existing && investor) {
          interestByProgram[program].investors.push({
            id: investorId,
            name: (investor.organization_name || "Unknown Investor") as string,
            organizationId: (investor.organization_id || investorId) as string,
            programs: (investor.target_credit_types || [
              program,
            ]) as ProgramType[],
            dealId: deal?.id as string,
            dealName: deal?.project_name as string,
          });
        }
      });
    });

    // Convert to array and sort by program priority
    const programOrder: ProgramType[] = [
      "NMTC",
      "HTC",
      "LIHTC",
      "OZ",
      "BROWNFIELD",
      "STATE",
    ];
    const interest = Object.values(interestByProgram).sort((a, b) => {
      const aIndex = programOrder.indexOf(a.program);
      const bIndex = programOrder.indexOf(b.program);
      return aIndex - bIndex;
    });

    return NextResponse.json(
      { interest },
      {
        headers: {
          "Cache-Control": "private, max-age=30", // Cache for 30 seconds
        },
      },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

function getProgramLabel(program: ProgramType): string {
  const labels: Record<ProgramType, string> = {
    NMTC: "New Markets Tax Credit",
    HTC: "Historic Tax Credit",
    LIHTC: "Low Income Housing Tax Credit",
    OZ: "Opportunity Zones",
    BROWNFIELD: "Brownfield Credits",
    STATE: "State Tax Credits",
  };
  return labels[program] || program;
}
