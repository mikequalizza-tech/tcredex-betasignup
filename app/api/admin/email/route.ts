/**
 * tCredex Admin API - Email Operations
 * POST /api/admin/email/allocation - Send allocation announcement
 * POST /api/admin/email/profile-added - Send profile added notification
 * POST /api/admin/email/broadcast - Send custom broadcast
 */

import { NextRequest, NextResponse } from "next/server";
import { handleAuthError, requireSystemAdmin } from "@/lib/api/auth-middleware";
import { email } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await requireSystemAdmin(request);

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case "allocation_announcement": {
        // Send allocation announcement to a CDE
        const { to, cdeName, allocationAmount, allocationYear, contactName } =
          body;

        if (!to || !cdeName || !allocationAmount || !allocationYear) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: to, cdeName, allocationAmount, allocationYear",
            },
            { status: 400 },
          );
        }

        const result = await email.allocationAnnouncement(
          to,
          cdeName,
          allocationAmount,
          allocationYear,
          contactName,
        );

        return NextResponse.json({
          success: result.success,
          emailId: result.id,
          error: result.error,
        });
      }

      case "profile_added": {
        // Send "you've been added" notification
        const {
          to,
          organizationName,
          organizationType,
          claimUrl,
          contactName,
        } = body;

        if (!to || !organizationName || !organizationType || !claimUrl) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: to, organizationName, organizationType, claimUrl",
            },
            { status: 400 },
          );
        }

        const result = await email.profileAdded(
          to,
          organizationName,
          organizationType,
          claimUrl,
          contactName,
        );

        return NextResponse.json({
          success: result.success,
          emailId: result.id,
          error: result.error,
        });
      }

      case "bulk_allocation": {
        // Send allocation announcements to multiple CDEs
        const { recipients } = body;

        if (!recipients || !Array.isArray(recipients)) {
          return NextResponse.json(
            { error: "recipients must be an array" },
            { status: 400 },
          );
        }

        const results = [];
        for (const recipient of recipients) {
          const { to, cdeName, allocationAmount, allocationYear, contactName } =
            recipient;

          if (!to || !cdeName || !allocationAmount || !allocationYear) {
            results.push({
              to,
              success: false,
              error: "Missing required fields",
            });
            continue;
          }

          const result = await email.allocationAnnouncement(
            to,
            cdeName,
            allocationAmount,
            allocationYear,
            contactName,
          );

          results.push({
            to,
            cdeName,
            success: result.success,
            emailId: result.id,
            error: result.error,
          });

          // Rate limit: small delay between emails
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;

        return NextResponse.json({
          success: failCount === 0,
          sent: successCount,
          failed: failCount,
          results,
        });
      }

      case "bulk_profile_added": {
        // Send profile added to multiple organizations
        const { recipients } = body;

        if (!recipients || !Array.isArray(recipients)) {
          return NextResponse.json(
            { error: "recipients must be an array" },
            { status: 400 },
          );
        }

        const results = [];
        for (const recipient of recipients) {
          const {
            to,
            organizationName,
            organizationType,
            claimUrl,
            contactName,
          } = recipient;

          if (!to || !organizationName || !organizationType || !claimUrl) {
            results.push({
              to,
              success: false,
              error: "Missing required fields",
            });
            continue;
          }

          const result = await email.profileAdded(
            to,
            organizationName,
            organizationType,
            claimUrl,
            contactName,
          );

          results.push({
            to,
            organizationName,
            success: result.success,
            emailId: result.id,
            error: result.error,
          });

          // Rate limit
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;

        return NextResponse.json({
          success: failCount === 0,
          sent: successCount,
          failed: failCount,
          results,
        });
      }

      case "allocation_request": {
        // Send Allocation Request — Sponsor → CDE (flagship outreach email)
        const {
          to,
          contactName,
          cdeName,
          cdeAllocationAmount,
          cdeAllocationYear,
          sponsorName,
          sponsorContactName,
          projectName,
          dealSummary,
          claimUrl,
          dealId,
        } = body;

        if (
          !to ||
          !contactName ||
          !cdeName ||
          !sponsorName ||
          !sponsorContactName ||
          !projectName ||
          !dealSummary ||
          !claimUrl ||
          !dealId
        ) {
          return NextResponse.json(
            {
              error:
                "Missing required fields: to, contactName, cdeName, sponsorName, sponsorContactName, projectName, dealSummary, claimUrl, dealId",
            },
            { status: 400 },
          );
        }

        const result = await email.allocationRequest(
          to,
          contactName,
          cdeName,
          cdeAllocationAmount || "",
          cdeAllocationYear || new Date().getFullYear(),
          sponsorName,
          sponsorContactName,
          projectName,
          dealSummary,
          claimUrl,
          dealId,
        );

        return NextResponse.json({
          success: result.success,
          emailId: result.id,
          error: result.error,
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid email type. Use: allocation_announcement, profile_added, allocation_request, bulk_allocation, bulk_profile_added",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
