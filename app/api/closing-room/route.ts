import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";

/** Untyped Supabase client for tables not yet in the generated Database type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedSupabaseClient = SupabaseClient<any, any, any>;

// Actual closing_rooms table columns:
// id, deal_id, status, target_close_date, opened_at, created_at, commitment_id, loi_id, actual_close_date, notes
// NOTE: sponsor_id, cde_id, investor_id, credit_type, created_by do NOT exist on this table

interface ClosingRoomSummaryRow {
  id: string;
  deal_id: string;
  project_name: string;
  status: string;
  target_close_date: string | null;
  checklist_pct: number;
  has_open_issues: boolean;
  issue_count: number;
  allocation_amount: number;
  investment_amount: number;
  credit_type: string;
  opened_at: string | null;
  days_to_close: number | null;
  participant_count: number;
}

// GET /api/closing-room - List all closing rooms for user
// GET /api/closing-room?status=active - Filter by status
// GET /api/closing-room?dealId=xxx - Get specific closing room by deal
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dealId = searchParams.get("dealId");

    // If specific deal requested
    if (dealId) {
      const { data, error } = await supabase
        .from("closing_rooms")
        .select(
          `
          id,
          deal_id,
          status,
          target_close_date,
          opened_at,
          created_at,
          commitment_id,
          loi_id,
          actual_close_date,
          notes,
          deals (
            id,
            project_name,
            programs,
            sponsor_name,
            total_project_cost,
            nmtc_financing_requested
          )
        `,
        )
        .eq("deal_id", dealId)
        .single();

      if (error) {
        console.error("Closing room fetch error:", error);
        return NextResponse.json(
          { error: "Closing room not found" },
          { status: 404 },
        );
      }

      // Fetch related data separately (tables may lack FK to closing_rooms)
      const roomId = (data as Record<string, unknown>).id;
      let participants: Record<string, unknown>[] = [];
      let milestones: Record<string, unknown>[] = [];
      let issues: Record<string, unknown>[] = [];

      const untypedSupabase = supabase as unknown as UntypedSupabaseClient;

      try {
        // Table 'closing_room_participants' not yet in DB schema
        const { data: pData } = await untypedSupabase
          .from("closing_room_participants")
          .select("id, user_id, role, organization_name, permissions")
          .eq("closing_room_id", roomId);
        if (pData) participants = pData;
      } catch {
        /* table may not exist */
      }

      try {
        // Table 'closing_room_milestones' not yet in DB schema
        const { data: mData } = await untypedSupabase
          .from("closing_room_milestones")
          .select("id, milestone_name, target_date, completed_at, sort_order")
          .eq("closing_room_id", roomId)
          .order("sort_order", { ascending: true });
        if (mData) milestones = mData;
      } catch {
        /* table may not exist */
      }

      try {
        // Table 'closing_room_issues' not yet in DB schema
        const { data: iData } = await untypedSupabase
          .from("closing_room_issues")
          .select("id, title, priority, status, assigned_to")
          .eq("closing_room_id", roomId);
        if (iData) issues = iData;
      } catch {
        /* table may not exist */
      }

      return NextResponse.json({
        closingRoom: {
          ...(data as Record<string, unknown>),
          closing_room_participants: participants,
          closing_room_milestones: milestones,
          closing_room_issues: issues,
        },
      });
    }

    // =========================================================================
    // Fetch closing rooms (deals that have entered closing pipeline)
    // =========================================================================
    let closingRoomQuery = supabase
      .from("closing_rooms")
      .select(
        `
        id,
        deal_id,
        status,
        target_close_date,
        opened_at,
        created_at,
        deals (
          id,
          project_name,
          sponsor_name,
          sponsor_id,
          programs,
          nmtc_financing_requested,
          total_project_cost
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (status) {
      closingRoomQuery = closingRoomQuery.eq("status", status);
    }

    const { data: closingRoomData, error: crError } = await closingRoomQuery;
    if (crError) {
      console.error("Closing rooms fetch error:", crError);
    }

    // =========================================================================
    // ALSO fetch the user's deals directly from deals table
    // This ensures sponsors see their deals even if no closing room exists yet
    // =========================================================================
    let userDeals: Record<string, unknown>[] = [];

    if (user.organizationType === "sponsor") {
      // Get sponsor IDs for this organization
      const { data: sponsors } = await supabase
        .from("sponsors")
        .select("id")
        .eq("organization_id", user.organizationId);
      const sponsorIds = (sponsors || []).map(
        (s: Record<string, unknown>) => s.id as string,
      );

      if (sponsorIds.length > 0) {
        const { data: deals, error: dealsError } = await supabase
          .from("deals")
          .select(
            "id, project_name, sponsor_name, sponsor_id, programs, status, nmtc_financing_requested, total_project_cost, created_at",
          )
          .in("sponsor_id", sponsorIds)
          .order("created_at", { ascending: false });

        if (dealsError) {
          console.error("Deals fetch error:", dealsError);
        } else {
          userDeals = deals || [];
        }
      }
    } else if (user.organizationType === "cde") {
      // CDEs see deals assigned to them
      const cdeId = await getCdeIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (cdeId) {
        const { data: deals, error: dealsError } = await supabase
          .from("deals")
          .select(
            "id, project_name, sponsor_name, sponsor_id, programs, status, nmtc_financing_requested, total_project_cost, created_at",
          )
          .eq("assigned_cde_id", cdeId)
          .order("created_at", { ascending: false });

        if (!dealsError && deals) {
          userDeals = deals;
        }
      }
    } else if (user.organizationType === "investor") {
      const investorId = await getInvestorIdForOrganization(
        supabase,
        user.organizationId,
      );
      if (investorId) {
        const { data: directDeals, error: dealsError } = await supabase
          .from("deals")
          .select(
            "id, project_name, sponsor_name, sponsor_id, programs, status, nmtc_financing_requested, total_project_cost, created_at",
          )
          .eq("investor_id", investorId)
          .order("created_at", { ascending: false });

        if (!dealsError && directDeals) {
          userDeals = directDeals;
        }
      }
    } else if (user.organizationType === "admin") {
      // Admin sees all deals
      const { data: deals, error: dealsError } = await supabase
        .from("deals")
        .select(
          "id, project_name, sponsor_name, sponsor_id, programs, status, nmtc_financing_requested, total_project_cost, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (!dealsError && deals) {
        userDeals = deals;
      }
    }

    // =========================================================================
    // Merge: closing rooms + deals (avoiding duplicates)
    // =========================================================================
    const closingRoomsByDealId = new Map<string, Record<string, unknown>>();
    for (const row of closingRoomData || []) {
      closingRoomsByDealId.set(
        (row as Record<string, unknown>).deal_id as string,
        row as Record<string, unknown>,
      );
    }

    const now = new Date();

    // Map deal status to closing room display status
    function dealStatusToClosingStatus(dealStatus: string): string {
      switch (dealStatus) {
        case "draft":
          return "pending";
        case "submitted":
          return "pending";
        case "under_review":
          return "pending";
        case "available":
          return "active";
        case "seeking_capital":
          return "active";
        case "matched":
          return "active";
        case "closing":
          return "closing";
        case "closed":
          return "closed";
        case "withdrawn":
          return "terminated";
        default:
          return "pending";
      }
    }

    // Build unified list from deals (with closing room data merged in)
    const allDealIds = new Set<string>();
    const closingRooms: ClosingRoomSummaryRow[] = [];

    // First: add all user deals
    for (const deal of userDeals) {
      allDealIds.add(deal.id as string);
      const cr = closingRoomsByDealId.get(deal.id as string);

      closingRooms.push({
        id: (cr ? cr.id : deal.id) as string,
        deal_id: deal.id as string,
        project_name: (deal.project_name || "Untitled Project") as string,
        status: (cr
          ? cr.status
          : dealStatusToClosingStatus(deal.status as string)) as string,
        credit_type: ((deal.programs as string[])?.[0] || "NMTC") as string,
        allocation_amount: Number(deal.nmtc_financing_requested) || 0,
        investment_amount: Number(deal.total_project_cost) || 0,
        target_close_date: (cr?.target_close_date || null) as string | null,
        opened_at: (cr?.opened_at || deal.created_at) as string | null,
        checklist_pct: 0,
        has_open_issues: false,
        issue_count: 0,
        participant_count: 0,
        days_to_close: null,
      });
    }

    // Second: add closing rooms that aren't already in the list (shouldn't happen but be safe)
    for (const row of (closingRoomData || []) as Record<string, unknown>[]) {
      if (!allDealIds.has(row.deal_id as string)) {
        const deal = (row.deals || {}) as Record<string, unknown>;
        closingRooms.push({
          id: row.id as string,
          deal_id: row.deal_id as string,
          project_name: (deal.project_name || "Untitled Project") as string,
          status: row.status as string,
          credit_type: ((deal.programs as string[])?.[0] || "NMTC") as string,
          allocation_amount: Number(deal.nmtc_financing_requested) || 0,
          investment_amount: Number(deal.total_project_cost) || 0,
          target_close_date: row.target_close_date as string | null,
          opened_at: row.opened_at as string | null,
          checklist_pct: 0,
          has_open_issues: false,
          issue_count: 0,
          participant_count: 0,
          days_to_close: null,
        });
      }
    }

    // =========================================================================
    // Enrich with checklist, participant, and issue data
    // =========================================================================
    const dealIds = closingRooms.map((r) => r.deal_id).filter(Boolean);
    const checklistMap = new Map<
      string,
      { total: number; completed: number }
    >();
    if (dealIds.length > 0) {
      try {
        const { data: checklistData } = await supabase
          .from("deal_checklists")
          .select("deal_id, status")
          .in("deal_id", dealIds);

        if (checklistData) {
          for (const item of checklistData) {
            const entry = checklistMap.get(item.deal_id) || {
              total: 0,
              completed: 0,
            };
            entry.total++;
            if (item.status && ["uploaded", "approved"].includes(item.status))
              entry.completed++;
            checklistMap.set(item.deal_id, entry);
          }
        }
      } catch {
        /* table may not exist */
      }
    }

    const roomIds = closingRooms.map((r) => r.id).filter(Boolean);
    const participantMap = new Map<string, number>();
    const issueMap = new Map<string, number>();

    if (roomIds.length > 0) {
      const untypedSupabase = supabase as unknown as UntypedSupabaseClient;

      try {
        // Table 'closing_room_participants' not yet in DB schema
        const { data: pData } = await untypedSupabase
          .from("closing_room_participants")
          .select("closing_room_id")
          .in("closing_room_id", roomIds);
        if (pData) {
          for (const p of pData as Record<string, unknown>[]) {
            participantMap.set(
              p.closing_room_id as string,
              (participantMap.get(p.closing_room_id as string) || 0) + 1,
            );
          }
        }
      } catch {
        /* table may not exist */
      }

      try {
        // Table 'closing_room_issues' not yet in DB schema
        const { data: iData } = await untypedSupabase
          .from("closing_room_issues")
          .select("closing_room_id, status")
          .in("closing_room_id", roomIds)
          .eq("status", "open");
        if (iData) {
          for (const i of iData as Record<string, unknown>[]) {
            issueMap.set(
              i.closing_room_id as string,
              (issueMap.get(i.closing_room_id as string) || 0) + 1,
            );
          }
        }
      } catch {
        /* table may not exist */
      }
    }

    // Apply enrichment
    for (const room of closingRooms) {
      const cl = checklistMap.get(room.deal_id);
      if (cl && cl.total > 0) {
        room.checklist_pct = Math.round((cl.completed / cl.total) * 100);
      }
      const issueCount = issueMap.get(room.id) || 0;
      room.issue_count = issueCount;
      room.has_open_issues = issueCount > 0;
      room.participant_count = participantMap.get(room.id) || 0;

      if (room.target_close_date) {
        const target = new Date(room.target_close_date);
        room.days_to_close = Math.ceil(
          (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      }
    }

    // Calculate stats
    const stats = {
      total: closingRooms.length,
      active: closingRooms.filter((r) => r.status === "active").length,
      pending: closingRooms.filter((r) => r.status === "pending").length,
      closing: closingRooms.filter((r) => r.status === "closing").length,
      onHold: closingRooms.filter((r) => r.status === "on_hold").length,
      totalAllocation: closingRooms.reduce(
        (sum, r) => sum + (r.allocation_amount || 0),
        0,
      ),
      totalInvestment: closingRooms.reduce(
        (sum, r) => sum + (r.investment_amount || 0),
        0,
      ),
    };

    return NextResponse.json({ closingRooms, stats });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/closing-room - Create closing room for a deal
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { dealId, commitmentId, loiId, targetCloseDate } = body;

    if (!dealId) {
      return NextResponse.json({ error: "dealId required" }, { status: 400 });
    }

    // Check if closing room already exists for this deal
    const { data: existingData } = await supabase
      .from("closing_rooms")
      .select("id")
      .eq("deal_id", dealId)
      .single();

    if (existingData) {
      return NextResponse.json(
        {
          error: "Closing room already exists for this deal",
          closingRoomId: (existingData as { id: string }).id,
        },
        { status: 409 },
      );
    }

    // Only columns that actually exist on closing_rooms:
    // id, deal_id, status, target_close_date, opened_at, created_at, commitment_id, loi_id, actual_close_date, notes
    const insertData: Record<string, unknown> = {
      deal_id: dealId,
      status: "pending",
      opened_at: new Date().toISOString(),
    };
    if (commitmentId) insertData.commitment_id = commitmentId;
    if (loiId) insertData.loi_id = loiId;
    if (targetCloseDate) insertData.target_close_date = targetCloseDate;

    const { data: closingRoom, error: createError } = await supabase
      .from("closing_rooms")
      .insert(insertData as never)
      .select()
      .single();

    if (createError) {
      console.error("Closing room create error:", createError);
      return NextResponse.json(
        { error: "Failed to create closing room" },
        { status: 500 },
      );
    }

    // Initialize checklist items for this deal
    let checklistItemsCreated = 0;
    try {
      checklistItemsCreated = await initializeChecklistForDeal(
        supabase,
        dealId,
      );
    } catch (checklistError) {
      console.error(
        "Checklist init failed during room create:",
        checklistError,
      );
    }

    // Try to log activity (table may not exist)
    try {
      const roomData = closingRoom as { id: string };
      // Table 'closing_room_activity' not yet in DB schema
      await (supabase as unknown as UntypedSupabaseClient)
        .from("closing_room_activity")
        .insert({
          closing_room_id: roomData.id,
          activity_type: "room_created",
          description: "Closing room created",
        } as never);
    } catch {
      /* activity table may not exist */
    }

    return NextResponse.json({
      success: true,
      closingRoom,
      checklistItemsCreated,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/closing-room - Update closing room status/fields
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const {
      closingRoomId,
      status: newStatus,
      targetCloseDate,
      notes,
      actualCloseDate,
    } = body;

    if (!closingRoomId) {
      return NextResponse.json(
        { error: "closingRoomId required" },
        { status: 400 },
      );
    }

    // Only update columns that exist on closing_rooms
    const updateData: Record<string, unknown> = {};

    if (newStatus) {
      updateData.status = newStatus;
      if (newStatus === "closed") {
        updateData.actual_close_date =
          actualCloseDate || new Date().toISOString().split("T")[0];
      }
    }
    if (targetCloseDate !== undefined)
      updateData.target_close_date = targetCloseDate;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("closing_rooms")
      .update(updateData as never)
      .eq("id", closingRoomId)
      .select()
      .single();

    if (error) {
      console.error("Closing room update error:", error);
      return NextResponse.json(
        { error: "Failed to update closing room" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, closingRoom: data });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getCdeIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data: cdeData } = await supabase
    .from("cdes")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  if (cdeData) {
    return (cdeData as { id: string }).id;
  }

  const { data: mergedData } = await supabase
    .from("cdes_merged")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1)
    .single();

  return (mergedData as { id: string } | null)?.id || null;
}

async function getInvestorIdForOrganization(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data: investorData } = await supabase
    .from("investors")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  return (investorData as { id: string } | null)?.id || null;
}

async function initializeChecklistForDeal(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  dealId: string,
): Promise<number> {
  const { data: dealData, error: dealError } = await supabase
    .from("deals")
    .select("id, programs")
    .eq("id", dealId)
    .single();

  if (dealError || !dealData) {
    return 0;
  }

  const deal = dealData as { id: string; programs?: string[] };
  const programList = (deal.programs || []).map((p) => p.toUpperCase());
  const primaryProgram = (programList[0] || "NMTC").toUpperCase();
  let templateProgram = primaryProgram;

  // Use stacked template when both programs are present.
  if (programList.includes("NMTC") && programList.includes("HTC")) {
    templateProgram = "NMTC_HTC_STATE";
  }

  let { data: templatesData } = await supabase
    .from("closing_checklist_templates")
    .select("id")
    .eq("program_type", templateProgram);

  if (
    (templatesData?.length ?? 0) === 0 &&
    templateProgram !== primaryProgram
  ) {
    const fallback = await supabase
      .from("closing_checklist_templates")
      .select("id")
      .eq("program_type", primaryProgram);
    templatesData = fallback.data;
  }

  const templates = (templatesData as { id: string }[] | null) || [];
  if (templates.length === 0) {
    return 0;
  }

  const checklistItems = templates.map((template) => ({
    deal_id: dealId,
    template_id: template.id,
    status: "pending",
  }));

  const { error: insertError } = await supabase
    .from("deal_checklists")
    .upsert(checklistItems as never[], {
      onConflict: "deal_id,template_id",
      ignoreDuplicates: true,
    });

  if (insertError) {
    throw insertError;
  }

  return checklistItems.length;
}
