/**
 * tCredex Sponsor Outreach API
 *
 * Allows Sponsors to contact CDEs and Investors about their deals.
 *
 * Business Rules:
 * - Sponsors can have max 3 active CDE requests at a time
 * - Sponsors can have max 3 active Investor requests at a time
 * - Requests expire after 7 days if no response
 * - System users get in-app messages + email
 * - Non-system users get email only (with tracking)
 * - Blacklisted organizations are excluded (e.g., US Bank)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { outreachSchema } from "@/lib/api/schemas";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import { email as emailService } from "@/lib/email";
// notify import removed — emit system's getRecipientUsers queries non-existent columns
// Notifications are created directly via Supabase insert in the outreach loop
import { buildProfileData, buildProfileHTML } from "@/lib/email/profile-html";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Blacklisted organizations (never show in outreach lists)
const BLACKLISTED_ORGS: string[] = [
  // Add orgs to exclude from outreach here
];

/**
 * Generate an 8-character claim code (uppercase alphanumeric, no ambiguous chars)
 * Used instead of magic links so CDEs/Investors can claim their seat domain-independently.
 */
function generateClaimCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

type DeliveryStatus =
  | "sent"
  | "provider_error"
  | "no_contact_email"
  | "recipient_not_found"
  | "processing_error";

interface OutreachDeliveryResult {
  recipientId: string;
  recipientType: "cde" | "investor";
  organizationId?: string;
  organizationName?: string;
  contactEmail?: string;
  status: DeliveryStatus;
  emailId?: string;
  error?: string;
}

// =============================================================================
// POST /api/deals/[id]/outreach - Create outreach request
// =============================================================================
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    if (user.organizationType !== "sponsor") {
      return NextResponse.json(
        { error: "Only sponsors can send outreach" },
        { status: 403 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    await verifyDealAccess(request, user, dealId, "edit");
    const body = await parseBody(request, outreachSchema);
    if (isValidationError(body)) return body;

    const {
      recipientIds, // Array of CDE/Investor IDs
      recipientType, // 'cde' | 'investor'
      message, // Custom message from sponsor
      senderName, // Sponsor's name
      senderOrg, // Sponsor's organization name
    } = body;

    const senderId = user.id;
    const senderOrgId = user.organizationId;

    // Validate required fields (message is optional — email template is self-contained)
    if (!recipientIds?.length || !recipientType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (recipientType !== "cde" && recipientType !== "investor") {
      return NextResponse.json(
        { error: 'recipientType must be either "cde" or "investor"' },
        { status: 400 },
      );
    }

    // Verify deal exists and sender owns it
    // NOTE: Avoid FK joins like sponsors!inner() — Supabase FK relationships may not exist
    const { data: dealData, error: dealError } = await supabase
      .from("deals")
      .select("id, project_name, sponsor_id, sponsor_organization_id")
      .eq("id", dealId)
      .single();

    const deal = dealData as {
      id: string;
      project_name: string;
      sponsor_id: string;
      sponsor_organization_id: string;
    } | null;

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Check if sender owns this deal (support both sponsor_id and sponsor_organization_id)
    const sponsorIdFromDeal =
      typeof deal.sponsor_id === "string" ? deal.sponsor_id : null;
    const sponsorOrgIdFromDeal =
      typeof deal.sponsor_organization_id === "string"
        ? deal.sponsor_organization_id
        : null;
    const { data: sponsorData } = sponsorIdFromDeal
      ? await supabase
          .from("sponsors")
          .select("id, organization_id")
          .eq("id", sponsorIdFromDeal)
          .maybeSingle()
      : { data: null };

    const sponsorOrgId =
      (sponsorData as Record<string, unknown> | null)?.organization_id ||
      sponsorOrgIdFromDeal;
    if (sponsorOrgId !== user.organizationId) {
      return NextResponse.json(
        { error: "Only the deal owner can send outreach" },
        { status: 403 },
      );
    }

    // Resolve sponsor_id used by match_requests; fallback to sender org sponsor row for legacy data.
    const { data: senderSponsorRow } = await supabase
      .from("sponsors")
      .select("id")
      .eq("organization_id", user.organizationId)
      .maybeSingle();
    const sponsorIdForRequests = (sponsorIdFromDeal ||
      (senderSponsorRow as { id: string } | null)?.id ||
      null) as string | null;
    if (!sponsorIdForRequests) {
      return NextResponse.json(
        { error: "Unable to resolve sponsor record for outreach" },
        { status: 400 },
      );
    }

    // Check active request limits (3 per type)
    const { count: activeCount } = await supabase
      .from("match_requests")
      .select("*", { count: "exact", head: true })
      .eq("deal_id", dealId)
      .eq("sponsor_id", sponsorIdForRequests as string)
      .eq("target_type", recipientType)
      .in("status", ["pending", "accepted"]);

    if ((activeCount || 0) + recipientIds.length > 3) {
      const remaining = 3 - (activeCount || 0);
      return NextResponse.json(
        {
          error: `You can only have 3 active ${recipientType} requests at a time. You have ${remaining} slot(s) remaining.`,
        },
        { status: 400 },
      );
    }

    // Check which recipients already have match requests for this deal
    const { data: existingReqs } = await supabase
      .from("match_requests")
      .select("target_id, status")
      .eq("deal_id", dealId)
      .eq("target_type", recipientType)
      .in("target_id", recipientIds);

    const existingTargetIds = new Set<string>(
      (existingReqs || []).map((r) => r.target_id as string),
    );
    const newRecipientIds = recipientIds.filter(
      (id: string) => !existingTargetIds.has(id),
    );
    const skippedCount = recipientIds.length - newRecipientIds.length;

    if (skippedCount > 0) {
      console.log(
        `[Outreach] Skipping ${skippedCount} recipient(s) already contacted for deal ${dealId}`,
      );
    }

    // Build a recipientId → org_id map for target_org_id population
    // We'll populate this as we resolve each recipient later, but for the insert
    // we need to pre-resolve org IDs for new recipients.
    const recipientOrgMap = new Map<string, string>();
    for (const rid of newRecipientIds) {
      if (recipientType === "investor") {
        const { data: inv } = await supabase
          .from("investors")
          .select("organization_id")
          .or(`organization_id.eq.${rid},id.eq.${rid}`)
          .limit(1)
          .single();
        if (inv)
          recipientOrgMap.set(
            rid,
            (inv as { organization_id?: string }).organization_id || rid,
          );
      } else {
        const { data: cde } = await supabase
          .from("cdes_merged")
          .select("organization_id")
          .or(`organization_id.eq.${rid},id.eq.${rid}`)
          .limit(1)
          .single();
        if (cde)
          recipientOrgMap.set(
            rid,
            (cde as { organization_id?: string }).organization_id || rid,
          );
      }
    }

    // Create match requests only for NEW recipients
    let inserted: Record<string, unknown>[] = [];
    if (newRecipientIds.length > 0) {
      const requests = newRecipientIds.map((recipientId: string) => ({
        sponsor_id: sponsorIdForRequests,
        deal_id: dealId,
        target_type: recipientType,
        target_id: recipientId,
        target_org_id: recipientOrgMap.get(recipientId) || recipientId,
        message,
        status: "pending",
        claim_code: generateClaimCode(),
        requested_at: new Date().toISOString(),
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from("match_requests")
        .insert(requests)
        .select();

      if (insertError) {
        console.error("Failed to create outreach requests:", insertError);
        return NextResponse.json(
          { error: "Failed to create outreach requests" },
          { status: 500 },
        );
      }
      inserted = insertedData || [];
    }

    // For already-contacted recipients, fetch their existing claim codes
    if (existingTargetIds.size > 0) {
      const { data: existingWithCodes } = await supabase
        .from("match_requests")
        .select("target_id, claim_code")
        .eq("deal_id", dealId)
        .eq("target_type", recipientType)
        .in("target_id", Array.from(existingTargetIds));

      // Merge existing rows into inserted for claim code map building
      if (existingWithCodes) {
        inserted = [...inserted, ...existingWithCodes];
      }
    }

    // Build targetId → claimCode map from inserted rows
    const claimCodeMap = new Map<string, string>();
    for (const row of (inserted || []) as Record<string, unknown>[]) {
      if (row.target_id && row.claim_code) {
        claimCodeMap.set(String(row.target_id), String(row.claim_code));
      }
    }

    // ==================================================================
    // SEND EMAILS + NOTIFICATIONS per recipient
    // ==================================================================
    // Fetch full deal data (with sponsor join) for email content & Project Profile
    const { data: fullDealData } = await supabase
      .from("deals")
      .select("*, sponsors(*)")
      .eq("id", dealId)
      .single();

    const fullDeal = fullDealData as Record<string, unknown> | null;
    const intake = fullDeal?.intake_data || {};

    // Resolve sponsor contact name
    let sponsorContactName = senderName || "";
    if (!sponsorContactName) {
      const { data: senderUser } = await supabase
        .from("users")
        .select("name")
        .eq("organization_id", senderOrgId)
        .limit(1)
        .single();
      sponsorContactName =
        ((senderUser as Record<string, unknown> | null)?.name as string) ||
        senderOrg ||
        "Sponsor";
    }

    // Build profile data using the SAME shared function as ProjectProfileHTML + PDF route
    const profileData = buildProfileData(fullDeal || deal, intake);
    const sponsorOrgName = senderOrg || profileData.parentOrganization;

    // Build rich deal summary for email template inline card
    const richDealSummary = {
      city: profileData.city,
      state: profileData.state,
      address: profileData.address,
      censusTract: profileData.censusTract,
      programType: (fullDeal?.programs as string[] | undefined)?.[0] || "NMTC",
      allocation: profileData.nmtcRequest || profileData.totalProjectCost || 0,
      projectCost: profileData.totalProjectCost,
      financingGap: profileData.financingGap,
      povertyRate: profileData.povertyRate,
      medianIncome: profileData.medianIncome,
      unemployment: profileData.unemploymentRate,
      shovelReady: profileData.isShovelReady,
      completionDate: profileData.projectedCompletion,
      communityImpact:
        profileData.communityImpact || profileData.projectDescription,
      sources: profileData.sources.length > 0 ? profileData.sources : undefined,
      uses: profileData.uses.length > 0 ? profileData.uses : undefined,
    };

    // Generate Project Profile PDF for email attachment
    // Uses Puppeteer (headless Chrome) to render HTML → PDF
    const profileHtml = buildProfileHTML(profileData);

    let profileAttachmentBuffer: Buffer;
    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(profileHtml, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for all images to finish loading
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve(); // Don't block on broken images
                }),
            ),
        );
      });

      const pdfBytes = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      profileAttachmentBuffer = Buffer.from(pdfBytes);

      await browser.close();
      console.log(
        `[Outreach] PDF Profile generated: ${profileAttachmentBuffer.length} bytes`,
      );
    } catch (pdfError) {
      console.error(
        "[Outreach] PDF generation failed, falling back to HTML:",
        pdfError,
      );
      // Fallback to HTML if PDF generation fails
      profileAttachmentBuffer = Buffer.from(profileHtml, "utf-8");
    }

    // Format currency for CDE allocation display
    const fmtAllocation = (amt: number) => {
      if (!amt) return "$0";
      if (amt >= 1000000) return `$${(amt / 1000000).toFixed(1)}M`;
      if (amt >= 1000) return `$${(amt / 1000).toFixed(0)}K`;
      return `$${amt}`;
    };

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://tcredex-frontend.vercel.app";

    const deliveryResults: OutreachDeliveryResult[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const recipientId of recipientIds) {
      const result: OutreachDeliveryResult = {
        recipientId,
        recipientType,
        status: "processing_error",
      };

      try {
        let contactEmail: string | null = null;
        let contactName = "Team";
        let orgName = "Unknown";
        let orgId = recipientId;
        let cdeAllocationAmount = "$0";
        let cdeAllocationYear = new Date().getFullYear();

        if (recipientType === "investor") {
          // Look up Investor info (investors table uses primary_contact_* columns)
          const investorCols =
            "id, organization_id, organization_name, primary_contact_email, primary_contact_name";
          let { data: investorData } = await supabase
            .from("investors")
            .select(investorCols)
            .eq("organization_id", recipientId)
            .limit(1)
            .single();

          if (!investorData) {
            const { data: byRowId } = await supabase
              .from("investors")
              .select(investorCols)
              .eq("id", recipientId)
              .limit(1)
              .single();
            investorData = byRowId;
          }

          const investor = investorData as Record<string, unknown> | null;
          if (!investor) {
            console.warn(`[Outreach] Investor ${recipientId} not found`);
            result.status = "recipient_not_found";
            result.error = "Investor not found";
            failedCount++;
            deliveryResults.push(result);
            continue;
          }

          contactEmail = investor.primary_contact_email as string | null;
          contactName = (investor.primary_contact_name ||
            investor.organization_name ||
            "Team") as string;
          orgName = (investor.organization_name ||
            "Unknown Investor") as string;
          orgId = (investor.organization_id || investor.id) as string;
        } else {
          // Look up CDE info — try organization_id first, then fall back to row id
          const selectCols =
            "id, organization_id, name, contact_email, contact_name, total_allocation, amount_remaining, year";
          let { data: recipientData } = await supabase
            .from("cdes_merged")
            .select(selectCols)
            .eq("organization_id", recipientId)
            .order("year", { ascending: false })
            .limit(1)
            .single();

          if (!recipientData) {
            const { data: byRowId } = await supabase
              .from("cdes_merged")
              .select(selectCols)
              .eq("id", recipientId)
              .limit(1)
              .single();
            recipientData = byRowId;
          }

          const recipient = recipientData as Record<string, unknown> | null;
          if (!recipient) {
            console.warn(`[Outreach] CDE ${recipientId} not found`);
            result.status = "recipient_not_found";
            result.error = "CDE not found";
            failedCount++;
            deliveryResults.push(result);
            continue;
          }

          contactEmail = recipient.contact_email as string | null;
          contactName = (recipient.contact_name ||
            recipient.name ||
            "Team") as string;
          orgName = (recipient.name || "Unknown CDE") as string;
          orgId = (recipient.organization_id || recipient.id) as string;
          cdeAllocationAmount = fmtAllocation(
            Number(
              recipient.amount_remaining || recipient.total_allocation || 0,
            ),
          );
          cdeAllocationYear =
            (recipient.year as number) || new Date().getFullYear();
        }

        result.organizationId = orgId;
        result.organizationName = orgName;
        result.contactEmail = contactEmail || undefined;

        // Claim code + fallback URL for one-click access
        const claimCode = claimCodeMap.get(recipientId) || "";
        const claimUrl = claimCode
          ? `${baseUrl}/claim?code=${claimCode}`
          : `${baseUrl}/signup?ref=${recipientType}&org=${orgId}&deal=${dealId}`;

        // Check if onboarded: look for active user with matching organization_id
        const { data: onboardedUser } = await supabase
          .from("users")
          .select("id, email, name")
          .eq("organization_id", orgId)
          .limit(1)
          .single();

        const isOnboarded = !!onboardedUser;

        if (isOnboarded) {
          console.log(
            `[Outreach] ${orgName} is ONBOARDED — sending notification + ${recipientType} request email`,
          );
          // Create notification directly for ALL users in the target org
          // (The emit system's getRecipientUsers is broken — queries non-existent columns)
          try {
            const { data: orgUsers } = await supabase
              .from("users")
              .select("id")
              .eq("organization_id", orgId);

            if (orgUsers && orgUsers.length > 0) {
              const notifInserts = orgUsers.map((u: { id: string }) => ({
                user_id: u.id,
                deal_id: dealId,
                type: "match",
                event: "match_request_received",
                title: `Allocation request from ${sponsorOrgName}`,
                body: `${sponsorOrgName} has requested ${recipientType === "cde" ? "NMTC allocation" : "investment"} for "${deal.project_name}"`,
                priority: "high",
                read: false,
                created_at: new Date().toISOString(),
              }));

              await supabase
                .from("notifications")
                .insert(notifInserts as never[]);
              console.log(
                `[Outreach] Notification created for ${orgUsers.length} user(s) in ${orgName}`,
              );
            }
          } catch (notifErr) {
            console.warn(
              "[Outreach] Notification failed (non-blocking):",
              notifErr,
            );
          }

          // Create deal Discord server so both orgs can communicate
          try {
            // Check if a deal server already exists
            const { data: existingServer } = await supabase
              .from("discord_servers")
              .select("id")
              .eq("deal_id", dealId)
              .eq("server_type", "deal")
              .limit(1)
              .maybeSingle();

            let dealServerId: string | undefined;

            if (existingServer) {
              dealServerId = (existingServer as { id: string }).id;
              console.log(
                `[Outreach] Deal Discord server already exists: ${dealServerId}`,
              );
            } else {
              // Create a deal-specific server
              const { data: newServer, error: serverErr } = await supabase
                .from("discord_servers")
                .insert({
                  name: `${deal.project_name}`,
                  owner_id: senderId,
                  organization_id: senderOrgId,
                  deal_id: dealId,
                  server_type: "deal",
                  invite_code: Math.random().toString(36).substring(2, 10),
                } as never)
                .select()
                .single();

              if (serverErr || !newServer) {
                console.warn(
                  "[Outreach] Deal server creation failed:",
                  serverErr,
                );
              } else {
                dealServerId = (newServer as { id: string }).id;

                // Create default channels for the deal server
                const dealChannels = [
                  {
                    name: "general",
                    type: "TEXT",
                    description: "General deal discussion",
                  },
                  {
                    name: "documents",
                    type: "TEXT",
                    description: "Document sharing",
                  },
                  {
                    name: "updates",
                    type: "TEXT",
                    description: "Deal status updates",
                  },
                ];
                for (const ch of dealChannels) {
                  await supabase.from("discord_channels").insert({
                    name: ch.name,
                    type: ch.type,
                    server_id: dealServerId,
                    created_by: senderId,
                    description: ch.description,
                    is_private: false,
                  } as never);
                }

                // Add sponsor org users as members
                const { data: sponsorUsers } = await supabase
                  .from("users")
                  .select("id")
                  .eq("organization_id", senderOrgId);

                for (const u of (sponsorUsers || []) as { id: string }[]) {
                  await supabase.from("discord_members").insert({
                    user_id: u.id,
                    server_id: dealServerId,
                    role: "ADMIN",
                  } as never);
                }

                console.log(
                  `[Outreach] Deal Discord server created: ${dealServerId}`,
                );
              }
            }

            // Add target org users as GUEST members (idempotent via unique constraint)
            if (dealServerId) {
              const { data: targetOrgUsers } = await supabase
                .from("users")
                .select("id")
                .eq("organization_id", orgId);

              for (const u of (targetOrgUsers || []) as { id: string }[]) {
                // Upsert — discord_members has UNIQUE(user_id, server_id)
                await supabase.from("discord_members").upsert(
                  {
                    user_id: u.id,
                    server_id: dealServerId,
                    role: "GUEST",
                  } as never,
                  { onConflict: "user_id,server_id" },
                );
              }
              console.log(
                `[Outreach] Added ${(targetOrgUsers || []).length} ${orgName} user(s) to deal server`,
              );
            }
          } catch (discordErr) {
            console.warn(
              "[Outreach] Deal Discord server setup failed (non-blocking):",
              discordErr,
            );
          }
        } else {
          console.log(
            `[Outreach] ${orgName} is NOT onboarded — sending ${recipientType} request email`,
          );
        }

        // Send the appropriate email based on recipient type
        if (contactEmail) {
          let emailSendResult: {
            success: boolean;
            id?: string;
            error?: string;
          };
          if (recipientType === "investor") {
            // Investment Request email for Investors
            emailSendResult = await emailService.investmentRequest(
              contactEmail,
              contactName,
              orgName,
              sponsorOrgName,
              sponsorContactName,
              deal.project_name,
              richDealSummary,
              claimUrl,
              dealId,
              claimCode,
              profileAttachmentBuffer,
            );
          } else {
            // Allocation Request email for CDEs
            emailSendResult = await emailService.allocationRequest(
              contactEmail,
              contactName,
              orgName,
              cdeAllocationAmount,
              cdeAllocationYear,
              sponsorOrgName,
              sponsorContactName,
              deal.project_name,
              richDealSummary,
              claimUrl,
              dealId,
              claimCode,
              profileAttachmentBuffer,
            );
          }

          if (emailSendResult.success) {
            result.status = "sent";
            result.emailId = emailSendResult.id;
            sentCount++;
            console.log(
              `[Outreach] Email sent to ${contactEmail} for ${orgName}`,
            );
          } else {
            result.status = "provider_error";
            result.error =
              emailSendResult.error || "Email provider rejected request";
            failedCount++;
            console.error(
              `[Outreach] Email provider error for ${orgName}: ${result.error}`,
            );
          }
        } else {
          result.status = "no_contact_email";
          result.error = "No contact email on recipient profile";
          failedCount++;
          console.warn(
            `[Outreach] No contact email for ${orgName} — skipping email`,
          );
        }

        deliveryResults.push(result);
      } catch (err) {
        result.status = "processing_error";
        result.error =
          err instanceof Error ? err.message : "Unexpected processing error";
        failedCount++;
        deliveryResults.push(result);
        console.error(
          `[Outreach] Error processing recipient ${recipientId}:`,
          err,
        );
      }
    }

    // Log to ledger (non-blocking — don't fail the request if ledger table doesn't exist)
    supabase
      .from("ledger_events")
      .insert({
        actor_type: "human",
        actor_id: senderId,
        entity_type: "outreach",
        entity_id: dealId,
        action: "outreach_sent",
        payload_json: {
          deal_name: deal.project_name,
          recipient_type: recipientType,
          recipient_count: recipientIds.length,
        },
        hash: generateHash({ dealId, senderId, recipientIds }),
      } as never)
      .then(({ error }) => {
        if (error)
          console.warn(
            "[Outreach] Ledger insert failed (non-blocking):",
            error.message,
          );
      });

    const createdCount = newRecipientIds.length;
    const partialSuccess = sentCount > 0 && failedCount > 0;
    const responseBody = {
      success: sentCount > 0 || skippedCount > 0,
      partialSuccess,
      created: createdCount,
      skipped: skippedCount,
      sent: sentCount,
      failed: failedCount,
      results: deliveryResults,
      message:
        sentCount > 0
          ? partialSuccess
            ? `Sent ${sentCount} outreach email(s), ${failedCount} failed`
            : skippedCount > 0
              ? `Sent ${sentCount} outreach email(s) (${skippedCount} already contacted)`
              : `Sent ${sentCount} outreach email(s)`
          : skippedCount > 0 && failedCount === 0
            ? `All ${skippedCount} recipient(s) were already contacted for this deal`
            : "No outreach emails were delivered",
    };

    if (sentCount === 0 && skippedCount === 0) {
      return NextResponse.json(responseBody, { status: 502 });
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// GET /api/deals/[id]/outreach - Get available CDEs/Investors for outreach
// =============================================================================
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    if (user.organizationType !== "sponsor") {
      return NextResponse.json(
        { error: "Only sponsors can view outreach options" },
        { status: 403 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { id: dealId } = await params;
    await verifyDealAccess(request, user, dealId, "edit");
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type"); // 'cde' | 'investor' | 'both'

    // Get deal info for matching
    const { data: deal } = await supabase
      .from("deals")
      .select("state, programs, census_tract")
      .eq("id", dealId)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Get existing match requests to mark who has been contacted
    const { data: existingRequestsData } = await supabase
      .from("match_requests")
      .select("target_id, target_type, status")
      .eq("deal_id", dealId);

    const existingRequests = (existingRequestsData || []) as Array<{
      target_id: string;
      target_type: string;
      status: string;
    }>;

    const contactedKeys = new Set(
      existingRequests.map((r) => `${r.target_type}:${r.target_id}`),
    );

    const isContacted = (
      targetType: "cde" | "investor",
      rowId?: string | null,
      organizationId?: string | null,
    ) =>
      (rowId ? contactedKeys.has(`${targetType}:${rowId}`) : false) ||
      (organizationId
        ? contactedKeys.has(`${targetType}:${organizationId}`)
        : false);

    // Get active request counts
    const activeByType = {
      cde: existingRequests.filter(
        (r) =>
          r.target_type === "cde" && ["pending", "accepted"].includes(r.status),
      ).length,
      investor: existingRequests.filter(
        (r) =>
          r.target_type === "investor" &&
          ["pending", "accepted"].includes(r.status),
      ).length,
    };

    const results: {
      cdes?: Record<string, unknown>[];
      investors?: Record<string, unknown>[];
      limits: { cde: number; investor: number };
    } = {
      limits: {
        cde: 3 - activeByType.cde,
        investor: 3 - activeByType.investor,
      },
    };

    // Check which organizations have onboarded users (system users vs email-only)
    const { data: onboardedCdeUsers } = await supabase
      .from("users")
      .select("organization_id")
      .eq("role_type", "cde")
      .eq("is_active", true);
    const onboardedCdeOrgIds = new Set(
      (onboardedCdeUsers || [])
        .map((u: Record<string, unknown>) => u.organization_id)
        .filter(Boolean),
    );

    const { data: onboardedInvestorUsers } = await supabase
      .from("users")
      .select("organization_id")
      .eq("role_type", "investor")
      .eq("is_active", true);
    const onboardedInvestorOrgIds = new Set(
      (onboardedInvestorUsers || [])
        .map((u: Record<string, unknown>) => u.organization_id)
        .filter(Boolean),
    );

    // Fetch CDEs if requested
    if (type === "cde" || type === "both" || !type) {
      // Source CDE outreach list from cdes_merged to match POST recipient lookup.
      const { data: cdesData } = await supabase
        .from("cdes_merged")
        .select(
          `
          id,
          organization_id,
          name,
          status,
          innovative_activities,
          predominant_market,
          target_sectors,
          primary_states,
          amount_remaining,
          total_allocation,
          year
        `,
        )
        .eq("status", "active")
        .order("year", { ascending: false });

      const cdes = (cdesData || []) as Record<string, unknown>[];
      const seenOrgIds = new Set<string>();
      const dedupedCdes = cdes.filter((cde) => {
        const orgId = (cde.organization_id || cde.id) as string;
        if (!orgId || seenOrgIds.has(orgId)) return false;
        seenOrgIds.add(orgId);
        return true;
      });

      results.cdes = dedupedCdes
        .filter((cde) => {
          // Filter out blacklisted orgs
          const orgName = (cde.name || "") as string;
          return !BLACKLISTED_ORGS.some((bl) =>
            orgName.toLowerCase().includes(bl.toLowerCase()),
          );
        })
        .map((cde) => ({
          id: cde.id,
          organizationId: (cde.organization_id || cde.id) as string,
          name: (cde.name || "Unknown CDE") as string,
          website: undefined,
          missionStatement: (cde.innovative_activities ||
            cde.predominant_market ||
            "") as string,
          geographicFocus: (cde.primary_states || []) as string[],
          sectorFocus: (cde.target_sectors || []) as string[],
          allocationAvailable: Number(
            cde.amount_remaining || cde.total_allocation || 0,
          ),
          isSystemUser: onboardedCdeOrgIds.has(
            (cde.organization_id || cde.id) as string,
          ),
          isContacted: isContacted(
            "cde",
            cde.id as string,
            cde.organization_id as string,
          ),
          matchScore: calculateMatchScore(deal as Record<string, unknown>, cde),
        }))
        .sort((a, b) => b.matchScore - a.matchScore); // Best matches first
    }

    // Fetch Investors if requested
    if (type === "investor" || type === "both" || !type) {
      // No organizations table — read directly from investors table
      const { data: investorsData } = await supabase.from("investors").select(`
          id,
          organization_id,
          organization_name,
          investor_type,
          target_credit_types,
          target_states,
          target_sectors,
          min_investment,
          max_investment
        `);

      const investors = (investorsData || []) as Record<string, unknown>[];

      results.investors = investors
        .filter((inv) => {
          // Filter out blacklisted orgs
          const orgName = (inv.organization_name || "") as string;
          return !BLACKLISTED_ORGS.some((bl) =>
            orgName.toLowerCase().includes(bl.toLowerCase()),
          );
        })
        .map((inv) => ({
          id: inv.id,
          organizationId: (inv.organization_id || inv.id) as string,
          name: (inv.organization_name || "Unknown Investor") as string,
          website: undefined,
          programs: (inv.target_credit_types || []) as string[],
          geographicFocus: (inv.target_states || []) as string[],
          sectors: (inv.target_sectors || []) as string[],
          minInvestment: inv.min_investment,
          maxInvestment: inv.max_investment,
          isSystemUser: onboardedInvestorOrgIds.has(
            (inv.organization_id || inv.id) as string,
          ),
          isContacted: isContacted(
            "investor",
            inv.id as string,
            inv.organization_id as string,
          ),
          matchScore: calculateInvestorMatchScore(
            deal as Record<string, unknown>,
            inv,
          ),
        }))
        .sort((a, b) => b.matchScore - a.matchScore); // Best matches first
    }

    return NextResponse.json(results);
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// Helper: Calculate CDE match score
// =============================================================================
function calculateMatchScore(
  deal: Record<string, unknown>,
  cde: Record<string, unknown>,
): number {
  let score = 0;

  // Geographic match (0-40 points)
  const geoFocus = (cde.geographic_focus ||
    cde.primary_states ||
    []) as string[];
  if (geoFocus.includes("ALL") || geoFocus.includes("National")) {
    score += 20;
  } else if (deal.state && geoFocus.includes(deal.state as string)) {
    score += 40;
  }

  // Sector match (0-30 points)
  // TODO: Add sector matching when deal has sector data

  // Has allocation available (0-30 points)
  const allocationAvailable = Number(
    cde.allocation_available ??
      cde.amount_remaining ??
      cde.total_allocation ??
      0,
  );
  if (allocationAvailable > 0) {
    score += 30;
  }

  return score;
}

// =============================================================================
// Helper: Calculate Investor match score
// =============================================================================
function calculateInvestorMatchScore(
  deal: Record<string, unknown>,
  investor: Record<string, unknown>,
): number {
  let score = 0;

  // Program match (0-50 points)
  const dealPrograms = (deal.programs || []) as string[];
  const investorPrograms = (investor.programs ||
    investor.target_credit_types ||
    []) as string[];
  const hasMatchingProgram = dealPrograms.some((p: string) =>
    investorPrograms.includes(p),
  );
  if (hasMatchingProgram) {
    score += 50;
  }

  // Geographic match (0-30 points)
  const investorGeoFocus = (investor.geographic_focus ||
    investor.target_states ||
    []) as string[];
  if (
    investorGeoFocus.includes("ALL") ||
    investorGeoFocus.includes("National")
  ) {
    score += 15;
  } else if (deal.state && investorGeoFocus.includes(deal.state as string)) {
    score += 30;
  }

  // Active investor bonus (0-20 points)
  if (!investor.status || investor.status === "active") {
    score += 20;
  }

  return score;
}

// =============================================================================
// Helper: Generate hash for ledger
// =============================================================================
function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}
