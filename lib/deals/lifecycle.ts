/**
 * tCredex Deal Lifecycle Service
 *
 * Handles deal status transitions with validation,
 * database updates, timeline logging, and notifications
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
const supabaseAdmin = getSupabaseAdmin();
import { notify } from "@/lib/notifications";
import { email } from "@/lib/email";
import {
  DealStatus,
  canTransition,
  getStatusLabel,
  getTransitionAction,
} from "./status";

export interface TransitionResult {
  success: boolean;
  newStatus?: DealStatus;
  error?: string;
}

export interface DealContext {
  id: string;
  projectName: string;
  sponsorUserId: string;
  sponsorEmail: string;
  sponsorName: string;
  currentStatus: DealStatus;
}

export async function transitionDeal(
  dealId: string,
  newStatus: DealStatus,
  userId: string,
  userRole: "sponsor" | "cde" | "admin",
  note?: string,
): Promise<TransitionResult> {
  // Get current deal state — no profiles FK, query deal directly
  const { data: rawDeal, error: fetchError } = await (
    supabaseAdmin as SupabaseClient
  )
    .from("deals")
    .select("id, project_name, status, user_id")
    .eq("id", dealId)
    .single();

  type DealWithProfile = {
    id: string;
    project_name: string;
    status: string;
    user_id: string;
    profiles:
      | { id: string; email: string; full_name: string }
      | { id: string; email: string; full_name: string }[]
      | null;
  };
  const deal = rawDeal as DealWithProfile | null;

  if (fetchError || !deal) {
    return { success: false, error: "Deal not found" };
  }

  const currentStatus = deal.status as DealStatus;

  if (!canTransition(currentStatus, newStatus, userRole)) {
    return {
      success: false,
      error: `Cannot transition from ${getStatusLabel(currentStatus)} to ${getStatusLabel(newStatus)}`,
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("deals")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", dealId);

  if (updateError) {
    return { success: false, error: "Failed to update deal status" };
  }

  await (supabaseAdmin as SupabaseClient).from("deal_timeline").insert({
    deal_id: dealId,
    milestone: getTransitionAction(currentStatus, newStatus),
    completed: true,
    completed_at: new Date().toISOString(),
    notes: note,
  });

  // Handle profiles - could be object, array, or null
  let sponsorEmail = "";
  let sponsorName = "Sponsor";
  if (deal.profiles) {
    const profileData = Array.isArray(deal.profiles)
      ? deal.profiles[0]
      : deal.profiles;
    if (profileData && typeof profileData === "object") {
      sponsorEmail =
        ((profileData as Record<string, unknown>).email as string) || "";
      sponsorName =
        ((profileData as Record<string, unknown>).full_name as string) ||
        "Sponsor";
    }
  }

  const context: DealContext = {
    id: dealId,
    projectName: deal.project_name,
    sponsorUserId: deal.user_id,
    sponsorEmail,
    sponsorName,
    currentStatus: newStatus,
  };

  await triggerTransitionNotifications(currentStatus, newStatus, context);

  return { success: true, newStatus };
}

async function triggerTransitionNotifications(
  from: DealStatus,
  to: DealStatus,
  context: DealContext,
): Promise<void> {
  const { id, projectName, sponsorEmail, sponsorName } = context;

  try {
    switch (to as string) {
      case "under_review":
        await notify.statusChanged(id, projectName, "Under Review");
        break;
      case "needs_info":
        await notify.statusChanged(id, projectName, "Needs Information");
        break;
      case "approved":
        await notify.dealApproved(id, projectName);
        if (sponsorEmail) {
          await email.dealApproved(sponsorEmail, sponsorName, projectName, id);
        }
        break;
      case "available":
        await notify.statusChanged(id, projectName, "Live on Marketplace");
        break;
      case "in_discussions":
        await notify.statusChanged(id, projectName, "In Discussions");
        break;
      case "term_sheet":
        await notify.closingMilestone(id, projectName, "Term Sheet", "Issued");
        break;
      case "closing":
        await notify.closingMilestone(
          id,
          projectName,
          "Closing",
          "In Progress",
        );
        break;
      case "funded":
        await notify.closingMilestone(id, projectName, "Funding", "Complete");
        break;
      case "declined":
        await notify.statusChanged(id, projectName, "Declined");
        break;
      case "expired":
        await notify.statusChanged(id, projectName, "Expired");
        break;
    }
  } catch (error) {
    console.error("Notification error during transition:", error);
  }
}

export async function bulkApproveDeal(
  dealIds: string[],
  adminUserId: string,
): Promise<{ approved: string[]; failed: string[] }> {
  const approved: string[] = [];
  const failed: string[] = [];

  for (const dealId of dealIds) {
    const result = await transitionDeal(
      dealId,
      "available",
      adminUserId,
      "admin",
    );
    if (result.success) {
      approved.push(dealId);
    } else {
      failed.push(dealId);
    }
  }

  return { approved, failed };
}

export async function getDealsRequiringAction(): Promise<{
  pendingReview: number;
  needsInfo: number;
  expiringOffers: number;
}> {
  const reviewResult = await supabaseAdmin
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("status", "submitted");

  return {
    pendingReview: reviewResult.count || 0,
    needsInfo: 0,
    expiringOffers: 0,
  };
}

export async function expireStaleDeals(
  daysInactive: number = 180,
): Promise<{ expired: string[] }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  const { data: rawStaleDeals } = await supabaseAdmin
    .from("deals")
    .select("id")
    .eq("status", "available")
    .lt("updated_at", cutoffDate.toISOString());

  type DealIdRow = { id: string };
  const staleDeals = rawStaleDeals as DealIdRow[] | null;

  const expired: string[] = [];

  for (const deal of staleDeals || []) {
    const { error } = await supabaseAdmin
      .from("deals")
      .update({
        status: "withdrawn",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", deal.id);

    if (!error) {
      expired.push(deal.id);
    }
  }

  return { expired };
}

export async function getDealActivitySummary(userId?: string): Promise<{
  total: number;
  byStatus: Record<DealStatus, number>;
  recentActivity: Array<{
    dealId: string;
    projectName: string;
    action: string;
    timestamp: string;
  }>;
}> {
  let query = supabaseAdmin.from("deals").select("id, status");
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: rawDeals } = await query;

  type DealStatusRow = { id: string; status: string };
  const deals = rawDeals as DealStatusRow[] | null;

  const byStatus = {} as Record<DealStatus, number>;
  for (const deal of deals || []) {
    const status = deal.status as DealStatus;
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  const { data: rawTimeline } = await (supabaseAdmin as SupabaseClient)
    .from("deal_timeline")
    .select("deal_id, milestone, completed_at, deals(project_name)")
    .order("completed_at", { ascending: false })
    .limit(10);

  type TimelineRow = {
    deal_id: string;
    milestone: string;
    completed_at: string;
    deals: { project_name: string } | { project_name: string }[] | null;
  };
  const timeline = rawTimeline as TimelineRow[] | null;

  const recentActivity = (timeline || []).map((t) => {
    // Handle deals - could be object, array, or null
    let projectName = "Unknown";
    if (t.deals) {
      const dealData = Array.isArray(t.deals) ? t.deals[0] : t.deals;
      if (dealData && typeof dealData === "object") {
        projectName = dealData.project_name || "Unknown";
      }
    }
    return {
      dealId: t.deal_id,
      projectName,
      action: t.milestone,
      timestamp: t.completed_at,
    };
  });

  return {
    total: deals?.length || 0,
    byStatus,
    recentActivity,
  };
}
