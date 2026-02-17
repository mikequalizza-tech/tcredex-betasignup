/**
 * tCredex Deal Pipeline API
 *
 * Returns unified view of all CDE/Investor relationships for a deal,
 * aggregating data from:
 * - deal_relationships (primary source when populated)
 * - outreach_requests (legacy/fallback)
 * - letters_of_intent (LOI stage details)
 * - commitments (commitment stage details)
 *
 * Pipeline Stages:
 * contacted → viewed → in_review → interested → verbal_approval →
 * loi_issued → loi_accepted → committed → closing → closed
 *                    ↓
 *                  denied
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Pipeline stage order for sorting
const STAGE_ORDER: Record<string, number> = {
  contacted: 1,
  viewed: 2,
  in_review: 3,
  interested: 4,
  verbal_approval: 5,
  loi_issued: 6,
  loi_accepted: 7,
  committed: 8,
  closing: 9,
  closed: 10,
  denied: -1,
  withdrawn: -2,
  expired: -3,
};

// Stage display config
const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  contacted: {
    label: "Contacted",
    color: "text-gray-400",
    bgColor: "bg-gray-700",
  },
  viewed: {
    label: "Viewed",
    color: "text-blue-400",
    bgColor: "bg-blue-900/50",
  },
  in_review: {
    label: "In Review",
    color: "text-blue-400",
    bgColor: "bg-blue-900/50",
  },
  interested: {
    label: "Interested",
    color: "text-indigo-400",
    bgColor: "bg-indigo-900/50",
  },
  verbal_approval: {
    label: "Verbal Approval",
    color: "text-purple-400",
    bgColor: "bg-purple-900/50",
  },
  loi_issued: {
    label: "LOI Issued",
    color: "text-amber-400",
    bgColor: "bg-amber-900/50",
  },
  loi_accepted: {
    label: "LOI Accepted",
    color: "text-orange-400",
    bgColor: "bg-orange-900/50",
  },
  committed: {
    label: "Committed",
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/50",
  },
  closing: {
    label: "Closing",
    color: "text-teal-400",
    bgColor: "bg-teal-900/50",
  },
  closed: {
    label: "Closed",
    color: "text-green-400",
    bgColor: "bg-green-900/50",
  },
  denied: { label: "Denied", color: "text-red-400", bgColor: "bg-red-900/50" },
  withdrawn: {
    label: "Withdrawn",
    color: "text-gray-500",
    bgColor: "bg-gray-800",
  },
  expired: { label: "Expired", color: "text-gray-500", bgColor: "bg-gray-800" },
};

export interface PipelineRelationship {
  id: string;
  targetId: string;
  targetType: "cde" | "investor";
  targetOrgId?: string;
  targetName: string;
  stage: string;
  stageLabel: string;
  stageColor: string;
  stageBgColor: string;
  matchScore?: number;
  matchStrength?: string;
  requestedAmount?: number;
  committedAmount?: number;
  lastActivity?: string;
  nextAction?: string;
  nextActionDue?: string;
  loiId?: string;
  loiStatus?: string;
  loiAmount?: number;
  commitmentId?: string;
  commitmentStatus?: string;
  contactedAt?: string;
  deniedAt?: string;
}

export interface PipelineSummary {
  total: number;
  cdeCount: number;
  investorCount: number;
  byStage: Record<string, number>;
  totalRequested: number;
  totalCommitted: number;
}

export interface PipelineResponse {
  dealId: string;
  relationships: PipelineRelationship[];
  summary: PipelineSummary;
  stageConfig: typeof STAGE_CONFIG;
}

// =============================================================================
// GET /api/deals/[id]/pipeline - Get unified pipeline view
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    await verifyDealAccess(request, user, dealId, "view");

    // Verify deal exists
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id, project_name")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Try to get data from deal_relationships first (new unified table)
    const { data: relationshipsData } = await supabase
      .from("deal_relationships")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    let relationships: PipelineRelationship[] = [];

    if (relationshipsData && relationshipsData.length > 0) {
      // Use new unified table
      relationships = relationshipsData.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        targetId: r.target_id as string,
        targetType: r.target_type as "cde" | "investor",
        targetOrgId: r.target_org_id as string | undefined,
        targetName: r.target_name as string,
        stage: r.status as string,
        stageLabel:
          STAGE_CONFIG[r.status as string]?.label || (r.status as string),
        stageColor: STAGE_CONFIG[r.status as string]?.color || "text-gray-400",
        stageBgColor:
          STAGE_CONFIG[r.status as string]?.bgColor || "bg-gray-700",
        matchScore: r.match_score as number | undefined,
        matchStrength: r.match_strength as string | undefined,
        requestedAmount: r.requested_amount
          ? Number(r.requested_amount)
          : undefined,
        committedAmount: r.committed_amount
          ? Number(r.committed_amount)
          : undefined,
        lastActivity: (r.last_contact_at || r.updated_at) as string | undefined,
        nextAction: r.next_action as string | undefined,
        nextActionDue: r.next_action_due as string | undefined,
        loiId: r.loi_id as string | undefined,
        commitmentId: r.commitment_id as string | undefined,
        contactedAt: r.contacted_at as string | undefined,
        deniedAt: r.denied_at as string | undefined,
      }));
    } else {
      // Fallback: aggregate from legacy tables
      relationships = await aggregateLegacyPipeline(supabase, dealId);
    }

    // Enrich with LOI and commitment details
    relationships = await enrichWithLoiAndCommitments(
      supabase,
      dealId,
      relationships,
    );

    // Sort by stage (active stages first, then by score)
    relationships.sort((a, b) => {
      const orderA = STAGE_ORDER[a.stage] || 0;
      const orderB = STAGE_ORDER[b.stage] || 0;
      if (orderA !== orderB) return orderB - orderA; // Higher stage first
      return (b.matchScore || 0) - (a.matchScore || 0); // Then by score
    });

    // Calculate summary
    const summary: PipelineSummary = {
      total: relationships.length,
      cdeCount: relationships.filter((r) => r.targetType === "cde").length,
      investorCount: relationships.filter((r) => r.targetType === "investor")
        .length,
      byStage: {},
      totalRequested: relationships.reduce(
        (sum, r) => sum + (r.requestedAmount || 0),
        0,
      ),
      totalCommitted: relationships.reduce(
        (sum, r) => sum + (r.committedAmount || 0),
        0,
      ),
    };

    // Count by stage
    for (const r of relationships) {
      summary.byStage[r.stage] = (summary.byStage[r.stage] || 0) + 1;
    }

    return NextResponse.json({
      dealId,
      relationships,
      summary,
      stageConfig: STAGE_CONFIG,
    } as PipelineResponse);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/deals/[id]/pipeline - Create or update relationship
// =============================================================================
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    await verifyDealAccess(request, user, dealId, "edit");
    const body = await request.json();

    const {
      targetId,
      targetType,
      targetOrgId,
      targetName,
      status,
      statusNote,
      matchScore,
      matchStrength,
      requestedAmount,
      nextAction,
      nextActionDue,
    } = body;

    if (!targetId || !targetType || !targetName) {
      return NextResponse.json(
        { error: "Missing required fields: targetId, targetType, targetName" },
        { status: 400 },
      );
    }

    // Get timestamp field based on status
    const timestampField = getTimestampField(status);
    const timestampUpdate = timestampField
      ? { [timestampField]: new Date().toISOString() }
      : {};

    // Upsert relationship
    const { data, error } = await supabase
      .from("deal_relationships")
      .upsert(
        {
          deal_id: dealId,
          target_id: targetId,
          target_type: targetType,
          target_org_id: targetOrgId,
          target_name: targetName,
          status: status || "contacted",
          status_note: statusNote,
          match_score: matchScore,
          match_strength: matchStrength,
          requested_amount: requestedAmount,
          next_action: nextAction,
          next_action_due: nextActionDue,
          last_contact_at: new Date().toISOString(),
          ...timestampUpdate,
        },
        {
          onConflict: "deal_id,target_type,target_id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to upsert relationship:", error);
      return NextResponse.json(
        { error: "Failed to save relationship" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      relationship: data,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PATCH /api/deals/[id]/pipeline - Update relationship status
// =============================================================================
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    await verifyDealAccess(request, user, dealId, "edit");
    const body = await request.json();

    const {
      relationshipId,
      status,
      statusNote,
      nextAction,
      nextActionDue,
      committedAmount,
    } = body;

    if (!relationshipId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: relationshipId, status" },
        { status: 400 },
      );
    }

    // Get timestamp field based on status
    const timestampField = getTimestampField(status);
    const timestampUpdate = timestampField
      ? { [timestampField]: new Date().toISOString() }
      : {};

    const { data, error } = await supabase
      .from("deal_relationships")
      .update({
        status,
        status_note: statusNote,
        next_action: nextAction,
        next_action_due: nextActionDue,
        committed_amount: committedAmount,
        ...timestampUpdate,
      })
      .eq("id", relationshipId)
      .eq("deal_id", dealId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update relationship:", error);
      return NextResponse.json(
        { error: "Failed to update relationship" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      relationship: data,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// Helpers
// =============================================================================

function getTimestampField(status: string): string | null {
  const mapping: Record<string, string> = {
    contacted: "contacted_at",
    interested: "interested_at",
    verbal_approval: "verbal_approval_at",
    loi_issued: "loi_issued_at",
    loi_accepted: "loi_accepted_at",
    committed: "committed_at",
    closed: "closed_at",
    denied: "denied_at",
  };
  return mapping[status] || null;
}

async function aggregateLegacyPipeline(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  dealId: string,
): Promise<PipelineRelationship[]> {
  const relationships: PipelineRelationship[] = [];

  // Get outreach requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Table 'outreach_requests' not yet in DB schema
  const { data: outreachData } = await (supabase as any)
    .from("outreach_requests")
    .select("*")
    .eq("deal_id", dealId);

  if (outreachData) {
    for (const o of outreachData as Array<{
      id: string;
      status: string;
      recipient_type: "cde" | "investor";
      recipient_id: string;
      responded_at?: string;
      viewed_at?: string;
      created_at?: string;
    }>) {
      // Map outreach status to pipeline stage
      let stage = "contacted";
      if (o.status === "viewed") stage = "viewed";
      else if (o.status === "interested") stage = "interested";
      else if (o.status === "verbal_approval") stage = "verbal_approval";
      else if (o.status === "declined") stage = "denied";
      else if (o.status === "expired") stage = "expired";

      // Try to get target name from CDEs or Investors table
      // Get target name directly from role table (no organizations table)
      let targetName = "Unknown";
      if (o.recipient_type === "cde") {
        const { data: cde } = await supabase
          .from("cdes")
          .select("organization_name")
          .eq("id", o.recipient_id)
          .single();
        targetName =
          ((cde as Record<string, unknown> | null)
            ?.organization_name as string) || "Unknown CDE";
      } else {
        const { data: inv } = await supabase
          .from("investors")
          .select("organization_name")
          .eq("id", o.recipient_id)
          .single();
        targetName =
          ((inv as Record<string, unknown> | null)
            ?.organization_name as string) || "Unknown Investor";
      }

      relationships.push({
        id: o.id,
        targetId: o.recipient_id,
        targetType: o.recipient_type,
        targetName,
        stage,
        stageLabel: STAGE_CONFIG[stage]?.label || stage,
        stageColor: STAGE_CONFIG[stage]?.color || "text-gray-400",
        stageBgColor: STAGE_CONFIG[stage]?.bgColor || "bg-gray-700",
        lastActivity: o.responded_at || o.viewed_at || o.created_at,
        contactedAt: o.created_at,
        deniedAt: o.status === "declined" ? o.responded_at : undefined,
      });
    }
  }

  // Get match requests (alternate system)
  const { data: matchData } = await supabase
    .from("match_requests")
    .select("*")
    .eq("deal_id", dealId);

  if (matchData) {
    for (const m of matchData as Array<{
      id: string;
      status: string;
      target_type: "cde" | "investor";
      target_id: string;
      target_org_id?: string;
      responded_at?: string;
      requested_at?: string;
    }>) {
      // Skip if already have this target from outreach
      if (
        relationships.some(
          (r) => r.targetId === m.target_id && r.targetType === m.target_type,
        )
      ) {
        continue;
      }

      let stage = "contacted";
      if (m.status === "accepted") stage = "interested";
      else if (m.status === "declined") stage = "denied";
      else if (m.status === "expired") stage = "expired";
      else if (m.status === "withdrawn") stage = "withdrawn";

      // Get target name directly from role table (no organizations table)
      let targetName = "Unknown";
      if (m.target_type === "cde") {
        const { data: cde } = await supabase
          .from("cdes")
          .select("organization_name")
          .eq("id", m.target_id)
          .single();
        targetName =
          ((cde as Record<string, unknown> | null)
            ?.organization_name as string) || "Unknown CDE";
      } else {
        const { data: inv } = await supabase
          .from("investors")
          .select("organization_name")
          .eq("id", m.target_id)
          .single();
        targetName =
          ((inv as Record<string, unknown> | null)
            ?.organization_name as string) || "Unknown Investor";
      }

      relationships.push({
        id: m.id,
        targetId: m.target_id,
        targetType: m.target_type,
        targetOrgId: m.target_org_id,
        targetName,
        stage,
        stageLabel: STAGE_CONFIG[stage]?.label || stage,
        stageColor: STAGE_CONFIG[stage]?.color || "text-gray-400",
        stageBgColor: STAGE_CONFIG[stage]?.bgColor || "bg-gray-700",
        lastActivity: m.responded_at || m.requested_at,
        contactedAt: m.requested_at,
      });
    }
  }

  return relationships;
}

async function enrichWithLoiAndCommitments(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  dealId: string,
  relationships: PipelineRelationship[],
): Promise<PipelineRelationship[]> {
  // Get LOIs for this deal
  const { data: loisRaw } = await supabase
    .from("letters_of_intent")
    .select("*")
    .eq("deal_id", dealId);
  const lois = loisRaw as Array<Record<string, unknown>> | null;

  // Get Commitments for this deal
  const { data: commitmentsRaw } = await supabase
    .from("commitments")
    .select("*")
    .eq("deal_id", dealId);
  const commitments = commitmentsRaw as Array<Record<string, unknown>> | null;

  // Enrich relationships with LOI/Commitment data
  for (const rel of relationships) {
    // Find matching LOI (by cde_id for CDEs)
    if (rel.targetType === "cde" && lois) {
      const loi = lois.find((l) => l.cde_id === rel.targetId);
      if (loi) {
        rel.loiId = loi.id as string;
        rel.loiStatus = loi.status as string;
        rel.loiAmount = loi.allocation_amount
          ? Number(loi.allocation_amount)
          : undefined;

        // Update stage based on LOI status
        const loiStatus = loi.status as string;
        if (loiStatus === "issued" || loiStatus === "pending_sponsor") {
          rel.stage = "loi_issued";
        } else if (loiStatus === "sponsor_accepted") {
          rel.stage = "loi_accepted";
        }
        rel.stageLabel = STAGE_CONFIG[rel.stage]?.label || rel.stage;
        rel.stageColor = STAGE_CONFIG[rel.stage]?.color || "text-gray-400";
        rel.stageBgColor = STAGE_CONFIG[rel.stage]?.bgColor || "bg-gray-700";
      }
    }

    // Find matching Commitment (by cde_id or investor_id)
    if (commitments) {
      const commitment = commitments.find(
        (c) =>
          (rel.targetType === "cde" && c.cde_id === rel.targetId) ||
          (rel.targetType === "investor" && c.investor_id === rel.targetId),
      );
      if (commitment) {
        rel.commitmentId = commitment.id as string;
        rel.commitmentStatus = commitment.status as string;
        rel.committedAmount = commitment.investment_amount
          ? Number(commitment.investment_amount)
          : undefined;

        // Update stage based on Commitment status
        const commitStatus = commitment.status as string;
        if (commitStatus === "all_accepted" || commitStatus === "issued") {
          rel.stage = "committed";
        } else if (commitStatus === "closing") {
          rel.stage = "closing";
        } else if (commitStatus === "closed") {
          rel.stage = "closed";
        }
        rel.stageLabel = STAGE_CONFIG[rel.stage]?.label || rel.stage;
        rel.stageColor = STAGE_CONFIG[rel.stage]?.color || "text-gray-400";
        rel.stageBgColor = STAGE_CONFIG[rel.stage]?.bgColor || "bg-gray-700";
      }
    }
  }

  return relationships;
}
