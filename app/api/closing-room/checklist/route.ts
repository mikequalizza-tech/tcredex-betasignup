import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// GET /api/closing-room/checklist?dealId=xxx
// GET /api/closing-room/checklist?programType=NMTC (templates only)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const programType = searchParams.get("programType");

    // If dealId provided, get deal-specific checklist with status
    if (dealId) {
      await verifyDealAccess(request, user, dealId, "view");

      // First get the deal to know the program type(s)
      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .select("id, project_name, programs")
        .eq("id", dealId)
        .single();

      type DealRow = { id: string; project_name: string; programs?: string[] };
      const deal = dealData as DealRow | null;

      if (dealError || !deal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }

      // Determine best-fit program for checklist templates
      const programList = (deal.programs || []).map((p) => p.toUpperCase());
      let templateProgram = (programList[0] || "NMTC").toUpperCase();

      // If stacked NMTC + HTC, use the stacked template
      if (programList.includes("NMTC") && programList.includes("HTC")) {
        templateProgram = "NMTC_HTC_STATE";
      }

      // Get checklist templates for this program
      let { data: templatesData, error: templateError } = await supabase
        .from("closing_checklist_templates")
        .select("*")
        .eq("program_type", templateProgram)
        .order("sort_order", { ascending: true });

      // Fallback to first deal program if stacked template not found
      const primaryProgram = (deal.programs?.[0] || "").toUpperCase();
      if (
        (templatesData?.length ?? 0) === 0 &&
        primaryProgram &&
        templateProgram !== primaryProgram
      ) {
        const fallback = await supabase
          .from("closing_checklist_templates")
          .select("*")
          .eq("program_type", primaryProgram)
          .order("sort_order", { ascending: true });
        templatesData = fallback.data;
        templateError = templateError || fallback.error;
      }

      type TemplateRow = {
        id: string;
        program_type: string;
        category: string;
        item_name: string;
        description: string | null;
        required: boolean;
        sort_order: number;
      };
      const templates = templatesData as TemplateRow[] | null;

      if (templateError) {
        console.error("Template fetch error:", templateError);
        return NextResponse.json(
          { error: "Failed to fetch templates" },
          { status: 500 },
        );
      }

      // Get deal-specific checklist status
      const { data: dealChecklistData, error: checklistError } = await supabase
        .from("deal_checklists")
        .select("*")
        .eq("deal_id", dealId);

      type ChecklistItem = {
        template_id: string;
        status: string;
        document_id: string | null;
        notes: string | null;
        due_date: string | null;
        completed_at: string | null;
      };
      const dealChecklist = dealChecklistData as ChecklistItem[] | null;

      if (checklistError) {
        console.error("Checklist fetch error:", checklistError);
      }

      // Merge templates with deal status
      const checklistMap = new Map(
        dealChecklist?.map((item) => [item.template_id, item]) || [],
      );

      const checklistWithStatus = templates?.map((template) => ({
        ...template,
        status: checklistMap.get(template.id)?.status || "pending",
        document_id: checklistMap.get(template.id)?.document_id || null,
        notes: checklistMap.get(template.id)?.notes || null,
        due_date: checklistMap.get(template.id)?.due_date || null,
        completed_at: checklistMap.get(template.id)?.completed_at || null,
      }));

      // Group by category
      const grouped = checklistWithStatus?.reduce(
        (acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, typeof checklistWithStatus>,
      );

      // Calculate progress
      const total = templates?.length || 0;
      const completed =
        checklistWithStatus?.filter((item) =>
          ["uploaded", "approved"].includes(item.status),
        ).length || 0;

      return NextResponse.json({
        deal,
        checklist: grouped,
        progress: {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      });
    }

    // If programType provided, get template checklist (no deal context)
    if (programType) {
      const { data: templatesData2, error } = await supabase
        .from("closing_checklist_templates")
        .select("*")
        .eq("program_type", programType.toUpperCase())
        .order("sort_order", { ascending: true });

      type TemplateRow2 = {
        id: string;
        program_type: string;
        category: string;
        item_name: string;
        description: string | null;
        required: boolean;
        sort_order: number;
      };
      const templates2 = templatesData2 as TemplateRow2[] | null;

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch templates" },
          { status: 500 },
        );
      }

      // Group by category
      const grouped = templates2?.reduce(
        (acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, typeof templates2>,
      );

      return NextResponse.json({
        programType,
        checklist: grouped,
        totalItems: templates2?.length || 0,
      });
    }

    // No params - return all program types summary
    const { data: summaryData, error } = await supabase
      .from("closing_checklist_templates")
      .select("program_type");

    type SummaryRow = { program_type: string };
    const summary = summaryData as SummaryRow[] | null;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch summary" },
        { status: 500 },
      );
    }

    const programCounts = summary?.reduce(
      (acc, item) => {
        acc[item.program_type] = (acc[item.program_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      programs: Object.entries(programCounts || {}).map(([type, count]) => ({
        programType: type,
        itemCount: count,
      })),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/closing-room/checklist - Initialize checklist for a deal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { dealId } = body;

    if (!dealId) {
      return NextResponse.json({ error: "dealId required" }, { status: 400 });
    }
    await verifyDealAccess(request, user, dealId, "edit");

    // Get deal info
    const { data: dealData3, error: dealError } = await supabase
      .from("deals")
      .select("id, programs")
      .eq("id", dealId)
      .single();

    type DealRow3 = { id: string; programs?: string[] };
    const deal = dealData3 as DealRow3 | null;

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const programList = (deal.programs || []).map((p) => p.toUpperCase());
    const primaryProgram = (programList[0] || "NMTC").toUpperCase();
    let templateProgram = primaryProgram;

    if (programList.includes("NMTC") && programList.includes("HTC")) {
      templateProgram = "NMTC_HTC_STATE";
    }

    // Get all template items for this program
    let { data: templatesData3, error: templateError } = await supabase
      .from("closing_checklist_templates")
      .select("id")
      .eq("program_type", templateProgram);

    // Fallback to primary program if stacked template does not exist
    if (
      (templatesData3?.length ?? 0) === 0 &&
      templateProgram !== primaryProgram
    ) {
      const fallback = await supabase
        .from("closing_checklist_templates")
        .select("id")
        .eq("program_type", primaryProgram);
      templatesData3 = fallback.data;
      templateError = templateError || fallback.error;
    }

    type TemplateRow3 = { id: string };
    const templates = templatesData3 as TemplateRow3[] | null;

    if (templateError) {
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 },
      );
    }

    // Create deal_checklist entries for each template item
    const checklistItems = templates?.map((template) => ({
      deal_id: dealId,
      template_id: template.id,
      status: "pending",
    }));

    if (checklistItems && checklistItems.length > 0) {
      const { error: insertError } = await supabase
        .from("deal_checklists")
        .upsert(checklistItems as never[], {
          onConflict: "deal_id,template_id",
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error("Checklist init error:", insertError);
        return NextResponse.json(
          { error: "Failed to initialize checklist" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      dealId,
      itemsCreated: checklistItems?.length || 0,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/closing-room/checklist - Update checklist item status
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { dealId, templateId, status, documentId, notes, dueDate } = body;

    if (!dealId || !templateId) {
      return NextResponse.json(
        { error: "dealId and templateId required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (documentId !== undefined) updateData.document_id = documentId;
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate !== undefined) updateData.due_date = dueDate;

    // Set completed_at if status is uploaded or approved
    if (status === "uploaded" || status === "approved") {
      updateData.completed_at = new Date().toISOString();
    }

    // Upsert - create if doesn't exist, update if does
    const { data, error } = await supabase
      .from("deal_checklists")
      .upsert(
        {
          deal_id: dealId,
          template_id: templateId,
          ...updateData,
        } as never,
        {
          onConflict: "deal_id,template_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Checklist update error:", error);
      return NextResponse.json(
        { error: "Failed to update checklist item" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    return handleAuthError(error);
  }
}
