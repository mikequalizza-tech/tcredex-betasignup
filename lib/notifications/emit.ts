/**
 * tCredex Notification Emitter Service
 *
 * Fires notifications to:
 * - Database (in-app feed)
 * - Push (Expo/OneSignal)
 * - Email (Resend)
 * - Discord (Webhooks)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { email as emailService } from "@/lib/email";

// ============================================================================
// DEV MODE - Disable emails for testing
// Set DISABLE_EMAILS=true in .env.local to prevent sending real emails
// ============================================================================
const EMAILS_DISABLED =
  process.env.DISABLE_EMAILS === "true" ||
  process.env.NODE_ENV === "development";
import {
  NotificationEvent,
  NotificationPriority,
  RecipientRole,
  getNotificationRule,
  getNotificationType,
} from "./rules";

// =============================================================================
// DISCORD WEBHOOK CONFIGURATION
// =============================================================================

/**
 * Discord webhook URLs by channel type
 * Configure these in environment variables
 */
const DISCORD_WEBHOOKS = {
  deals: process.env.DISCORD_WEBHOOK_DEALS,
  loi: process.env.DISCORD_WEBHOOK_LOI,
  closing: process.env.DISCORD_WEBHOOK_CLOSING,
  alerts: process.env.DISCORD_WEBHOOK_ALERTS,
  general: process.env.DISCORD_WEBHOOK_GENERAL,
} as const;

type DiscordChannel = keyof typeof DISCORD_WEBHOOKS;

/**
 * Map notification events to Discord channels
 */
const EVENT_TO_DISCORD_CHANNEL: Record<NotificationEvent, DiscordChannel> = {
  cde_match_found: "deals",
  new_message_received: "general",
  document_uploaded: "deals",
  document_requested: "deals",
  status_changed: "deals",
  deal_approved: "deals",
  closing_milestone: "closing",
  offer_expiring: "alerts",
  loi_received: "loi",
  loi_accepted: "loi",
  loi_rejected: "loi",
  loi_countered: "loi",
  commitment_received: "loi",
  commitment_accepted: "closing",
  project_submission: "deals",
};

/**
 * Discord embed colors by priority
 */
const PRIORITY_COLORS: Record<NotificationPriority, number> = {
  urgent: 0xff0000, // Red
  normal: 0x00ff00, // Green
  low: 0x808080, // Gray
};

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationPayload {
  // Required
  event: NotificationEvent;
  dealId: string;

  // Variable substitutions
  project_name?: string;
  cde_name?: string;
  sender_name?: string;
  sender_org?: string;
  message_preview?: string;
  uploader_name?: string;
  filename?: string;
  requester_name?: string;
  document_type?: string;
  new_status?: string;
  milestone_name?: string;
  milestone_status?: string;
  hours_left?: number;

  // Additional data
  [key: string]: unknown;
}

export interface EmitOptions {
  // Override default recipients
  recipientUserIds?: string[];
  // Skip certain channels
  skipPush?: boolean;
  skipEmail?: boolean;
  skipInApp?: boolean;
  skipDiscord?: boolean;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

/**
 * Interpolate template variables in a string
 */
function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(vars[key] ?? `{{${key}}}`);
  });
}

/**
 * Get user info for recipients based on deal and roles
 */
async function getRecipientUsers(
  dealId: string,
  roles: RecipientRole[],
  supabase: typeof supabaseAdmin,
): Promise<UserInfo[]> {
  const users: UserInfo[] = [];
  const seenIds = new Set<string>();

  // Get deal owner (sponsor)
  if (roles.includes("sponsor")) {
    const { data: rawDeal } = await supabase
      .from("deals")
      .select("user_id, profiles(id, email, name)")
      .eq("id", dealId)
      .single();

    type DealWithProfile = {
      user_id: string;
      profiles:
        | { id: string; email: string; name: string }
        | { id: string; email: string; name: string }[]
        | null;
    };
    const deal = rawDeal as DealWithProfile | null;

    if (deal?.user_id && deal.profiles && !seenIds.has(deal.user_id)) {
      // Handle profiles - could be object or array
      const profileData = Array.isArray(deal.profiles)
        ? deal.profiles[0]
        : deal.profiles;

      if (profileData && typeof profileData === "object") {
        users.push({
          id: deal.user_id,
          email: profileData.email || "",
          name: profileData.name || "User",
        });
        seenIds.add(deal.user_id);
      }
    }
  }

  // Get deal parties (CDE, investor)
  if (roles.includes("cde") || roles.includes("investor")) {
    const { data: rawParties } = await (supabase as SupabaseClient)
      .from("deal_parties")
      .select("user_id, role, profiles(id, email, name)")
      .eq("deal_id", dealId);

    type PartyWithProfile = {
      user_id: string;
      role: string | null;
      profiles:
        | { id: string; email: string; name: string }
        | { id: string; email: string; name: string }[]
        | null;
    };
    const parties = rawParties as PartyWithProfile[] | null;

    parties?.forEach((party) => {
      if (party.user_id && party.profiles && !seenIds.has(party.user_id)) {
        const partyRole = party.role?.toLowerCase();
        const shouldInclude =
          (roles.includes("cde") && partyRole?.includes("cde")) ||
          (roles.includes("investor") && partyRole?.includes("investor"));

        if (shouldInclude) {
          // Handle profiles - could be object or array
          const profileData = Array.isArray(party.profiles)
            ? party.profiles[0]
            : party.profiles;

          if (profileData && typeof profileData === "object") {
            users.push({
              id: party.user_id,
              email: profileData.email || "",
              name: profileData.name || "User",
            });
            seenIds.add(party.user_id);
          }
        }
      }
    });
  }

  // Get admins
  if (roles.includes("admin")) {
    const { data: rawAdmins } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "admin" as never);

    type AdminRow = { id: string; email: string; name: string | null };
    const admins = rawAdmins as AdminRow[] | null;

    admins?.forEach((admin) => {
      if (admin.id && admin.email && !seenIds.has(admin.id)) {
        users.push({
          id: admin.id,
          email: admin.email,
          name: admin.name || "Admin",
        });
        seenIds.add(admin.id);
      }
    });
  }

  return users;
}

/**
 * Send push notification via Expo
 */
async function sendPush(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
  supabase: typeof supabaseAdmin,
): Promise<void> {
  const { data: rawTokens } = await (supabase as SupabaseClient)
    .from("push_tokens")
    .select("token")
    .in("user_id", userIds);

  type TokenRow = { token: string };
  const tokens = rawTokens as TokenRow[] | null;

  if (!tokens?.length) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
    sound: "default",
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Push notification error:", error);
  }
}

/**
 * Send Discord webhook notification
 */
async function sendDiscord(
  event: NotificationEvent,
  title: string,
  body: string,
  payload: NotificationPayload,
  priority: NotificationPriority,
): Promise<void> {
  const channel = EVENT_TO_DISCORD_CHANNEL[event];
  const webhookUrl = DISCORD_WEBHOOKS[channel] || DISCORD_WEBHOOKS.general;

  if (!webhookUrl) {
    console.log(`[Discord] No webhook configured for channel: ${channel}`);
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tcredex.com";
  const dealUrl = `${siteUrl}/deals/${payload.dealId}`;

  // Build Discord embed
  const embed = {
    title,
    description: body,
    color: PRIORITY_COLORS[priority],
    url: dealUrl,
    fields: [
      {
        name: "Deal",
        value: payload.project_name || "Unknown Project",
        inline: true,
      },
      {
        name: "Event",
        value: event
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        inline: true,
      },
    ],
    footer: {
      text: "tCredex Notifications",
      icon_url: `${siteUrl}/images/logo-icon.png`,
    },
    timestamp: new Date().toISOString(),
  };

  // Add additional fields based on event
  if (payload.cde_name) {
    embed.fields.push({ name: "CDE", value: payload.cde_name, inline: true });
  }
  if (payload.allocation_amount) {
    embed.fields.push({
      name: "Allocation",
      value: String(payload.allocation_amount),
      inline: true,
    });
  }
  if (payload.new_status) {
    embed.fields.push({
      name: "New Status",
      value: payload.new_status,
      inline: true,
    });
  }
  if (payload.milestone_name) {
    embed.fields.push({
      name: "Milestone",
      value: `${payload.milestone_name} (${payload.milestone_status || "Updated"})`,
      inline: true,
    });
  }
  if (payload.hours_left !== undefined) {
    embed.fields.push({
      name: "Time Remaining",
      value: `${payload.hours_left} hours`,
      inline: true,
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "tCredex Bot",
        avatar_url: `${siteUrl}/images/logo-icon.png`,
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      console.error(
        "[Discord] Webhook error:",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("[Discord] Webhook error:", error);
  }
}

/**
 * Send emails based on notification event
 */
async function sendEmails(
  event: NotificationEvent,
  users: UserInfo[],
  payload: NotificationPayload,
): Promise<void> {
  // Skip emails in dev mode or when disabled
  if (EMAILS_DISABLED) {
    console.log(
      `[Email] DISABLED - Would send ${event} to ${users.length} users:`,
      users.map((u) => u.email),
    );
    return;
  }

  for (const user of users) {
    try {
      switch (event) {
        case "cde_match_found":
          await emailService.cdeMatch(
            user.email,
            user.name,
            payload.project_name || "Your Project",
            payload.cde_name || "A CDE",
            payload.dealId,
          );
          break;

        case "new_message_received":
          await emailService.newMessage(
            user.email,
            user.name,
            payload.sender_name || "Someone",
            payload.sender_org || "",
            payload.project_name || "A Deal",
            payload.message_preview || "New message...",
            payload.dealId,
          );
          break;

        case "document_requested":
          await emailService.documentRequested(
            user.email,
            user.name,
            payload.requester_name || "Someone",
            payload.document_type || "Document",
            payload.project_name || "Your Project",
            payload.dealId,
          );
          break;

        case "deal_approved":
          await emailService.dealApproved(
            user.email,
            user.name,
            payload.project_name || "Your Project",
            payload.dealId,
          );
          break;

        case "offer_expiring":
          await emailService.offerExpiring(
            user.email,
            user.name,
            payload.project_name || "Your Project",
            payload.cde_name || "A CDE",
            payload.hours_left || 24,
            payload.dealId,
          );
          break;

        case "loi_received":
          await emailService.loiReceived(
            user.email,
            user.name,
            payload.project_name || "Your Project",
            payload.cde_name || "A CDE",
            String(payload.allocation_amount) || "TBD",
            payload.dealId,
            String(payload.loi_id) || "",
          );
          break;

        case "loi_accepted":
          await emailService.loiAccepted(
            user.email,
            user.name,
            payload.project_name || "The Project",
            String(payload.sponsor_name) || "The Sponsor",
            payload.dealId,
          );
          break;

        case "loi_rejected":
          await emailService.loiRejected(
            user.email,
            user.name,
            payload.project_name || "The Project",
            String(payload.sponsor_name) || "The Sponsor",
            payload.dealId,
          );
          break;

        case "loi_countered":
          await emailService.loiCountered(
            user.email,
            user.name,
            payload.project_name || "The Project",
            String(payload.sponsor_name) || "The Sponsor",
            payload.dealId,
            String(payload.loi_id) || "",
          );
          break;

        case "project_submission":
          // Emails for project_submission are handled directly in the outreach route
          // (different templates for onboarded vs non-onboarded CDEs)
          console.log(
            `[Email] project_submission handled by outreach route for ${user.email}`,
          );
          break;

        default:
          console.log(`[Email] No template for event: ${event}`);
      }
    } catch (error) {
      console.error(`Email send error for ${user.email}:`, error);
    }
  }
}

/**
 * Main notification emitter
 */
export async function emitNotification(
  payload: NotificationPayload,
  options: EmitOptions = {},
): Promise<{ success: boolean; notificationIds: string[] }> {
  const rule = getNotificationRule(payload.event);

  if (!rule) {
    console.error(`No notification rule found for event: ${payload.event}`);
    return { success: false, notificationIds: [] };
  }

  const supabase = supabaseAdmin;

  // Get recipients
  const recipientUsers = await getRecipientUsers(
    payload.dealId,
    rule.recipients,
    supabase,
  );
  const recipientUserIds =
    options.recipientUserIds || recipientUsers.map((u) => u.id);

  if (!recipientUserIds.length) {
    console.warn(`No recipients found for notification: ${payload.event}`);
    return { success: true, notificationIds: [] };
  }

  // Interpolate templates
  const vars = payload as Record<string, unknown>;
  const title = interpolate(rule.push.title, vars);
  const body = interpolate(rule.push.body, vars);
  const inAppText = interpolate(rule.in_app, vars);

  const notificationIds: string[] = [];
  const expiresAt = new Date(
    Date.now() + rule.auto_expire * 1000,
  ).toISOString();

  // 1. Create in-app notifications
  if (!options.skipInApp) {
    for (const userId of recipientUserIds) {
      const { data: rawData, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          deal_id: payload.dealId,
          type: getNotificationType(payload.event),
          event: payload.event,
          title,
          body: inAppText,
          priority: rule.priority,
          read: false,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        } as never)
        .select("id")
        .single();

      type InsertResult = { id: string };
      const data = rawData as InsertResult | null;
      if (data?.id) notificationIds.push(data.id);
      if (error) console.error("In-app notification error:", error);
    }
  }

  // 2. Send push notifications
  if (!options.skipPush) {
    await sendPush(
      recipientUserIds,
      title,
      body,
      { dealId: payload.dealId, event: payload.event },
      supabase,
    );
  }

  // 3. Send emails
  if (!options.skipEmail) {
    const usersToEmail = options.recipientUserIds
      ? recipientUsers.filter((u) => options.recipientUserIds?.includes(u.id))
      : recipientUsers;
    await sendEmails(payload.event, usersToEmail, payload);
  }

  // 4. Send Discord webhook notification
  if (!options.skipDiscord) {
    await sendDiscord(payload.event, title, body, payload, rule.priority);
  }

  return { success: true, notificationIds };
}

/**
 * Convenience functions for common notifications
 */
export const notify = {
  cdeMatch: (dealId: string, projectName: string, cdeName: string) =>
    emitNotification({
      event: "cde_match_found",
      dealId,
      project_name: projectName,
      cde_name: cdeName,
    }),

  newMessage: (
    dealId: string,
    projectName: string,
    senderName: string,
    senderOrg?: string,
    messagePreview?: string,
  ) =>
    emitNotification({
      event: "new_message_received",
      dealId,
      project_name: projectName,
      sender_name: senderName,
      sender_org: senderOrg,
      message_preview: messagePreview,
    }),

  documentUploaded: (
    dealId: string,
    projectName: string,
    uploaderName: string,
    filename: string,
  ) =>
    emitNotification({
      event: "document_uploaded",
      dealId,
      project_name: projectName,
      uploader_name: uploaderName,
      filename,
    }),

  documentRequested: (
    dealId: string,
    projectName: string,
    requesterName: string,
    documentType: string,
  ) =>
    emitNotification({
      event: "document_requested",
      dealId,
      project_name: projectName,
      requester_name: requesterName,
      document_type: documentType,
    }),

  statusChanged: (dealId: string, projectName: string, newStatus: string) =>
    emitNotification({
      event: "status_changed",
      dealId,
      project_name: projectName,
      new_status: newStatus,
    }),

  dealApproved: (dealId: string, projectName: string) =>
    emitNotification({
      event: "deal_approved",
      dealId,
      project_name: projectName,
    }),

  closingMilestone: (
    dealId: string,
    projectName: string,
    milestoneName: string,
    milestoneStatus: string,
  ) =>
    emitNotification({
      event: "closing_milestone",
      dealId,
      project_name: projectName,
      milestone_name: milestoneName,
      milestone_status: milestoneStatus,
    }),

  offerExpiring: (
    dealId: string,
    projectName: string,
    hoursLeft: number,
    cdeName?: string,
  ) =>
    emitNotification({
      event: "offer_expiring",
      dealId,
      project_name: projectName,
      hours_left: hoursLeft,
      cde_name: cdeName,
    }),

  // LOI-specific notifications
  loiReceived: (
    dealId: string,
    projectName: string,
    cdeName: string,
    allocationAmount?: string,
  ) =>
    emitNotification({
      event: "loi_received",
      dealId,
      project_name: projectName,
      cde_name: cdeName,
      allocation_amount: allocationAmount,
    }),

  loiAccepted: (dealId: string, projectName: string, sponsorName: string) =>
    emitNotification({
      event: "loi_accepted",
      dealId,
      project_name: projectName,
      sponsor_name: sponsorName,
    }),

  loiRejected: (dealId: string, projectName: string, sponsorName: string) =>
    emitNotification({
      event: "loi_rejected",
      dealId,
      project_name: projectName,
      sponsor_name: sponsorName,
    }),

  loiCountered: (dealId: string, projectName: string, sponsorName: string) =>
    emitNotification({
      event: "loi_countered",
      dealId,
      project_name: projectName,
      sponsor_name: sponsorName,
    }),

  commitmentReceived: (dealId: string, projectName: string, cdeName: string) =>
    emitNotification({
      event: "commitment_received",
      dealId,
      project_name: projectName,
      cde_name: cdeName,
    }),

  commitmentAccepted: (dealId: string, projectName: string) =>
    emitNotification({
      event: "commitment_accepted",
      dealId,
      project_name: projectName,
    }),

  projectSubmitted: (
    dealId: string,
    projectName: string,
    sponsorName: string,
    cdeName: string,
  ) =>
    emitNotification(
      {
        event: "project_submission",
        dealId,
        project_name: projectName,
        sponsor_name: sponsorName,
        cde_name: cdeName,
      },
      { skipEmail: true },
    ), // Emails handled by outreach route (different templates per CDE type)
};
