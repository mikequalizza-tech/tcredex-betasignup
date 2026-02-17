/**
 * tCredex Email Templates
 * Professional transactional emails
 */

/** Escape HTML special characters to prevent injection in email templates */
function escapeHtml(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Brand colors
const COLORS = {
  primary: "#6366f1", // Indigo
  success: "#22c55e", // Green
  warning: "#f59e0b", // Amber
  dark: "#111827", // Gray-900
  gray: "#6b7280", // Gray-500
  lightGray: "#f9fafb", // Gray-50
  light: "#f3f4f6", // Gray-100
  white: "#ffffff",
};

// Brand logo — hosted image with text fallback for email clients that block images
const LOGO_URL =
  "https://tcredex-frontend.vercel.app/brand/logo-tcredex-cropped.png";
const LOGO_HTML = `
  <div style="text-align: center; padding: 16px 0;">
    <a href="https://tcredex.com" style="text-decoration: none;">
      <img src="${LOGO_URL}" alt="tCredex.com" width="220" height="80" style="display: block; margin: 0 auto; max-width: 220px; height: auto;" />
    </a>
    <p style="margin: 8px 0 0; color: #6B7280; font-size: 14px; font-family: Arial, sans-serif;">AI-Powered Tax Credit Marketplace</p>
  </div>
`;

/**
 * Base email layout wrapper
 */
export function baseTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>tCredex</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    .button { background-color: ${COLORS.primary}; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block; }
    .button:hover { background-color: #4f46e5; }
    .button-success { background-color: ${COLORS.success}; }
    .button-warning { background-color: ${COLORS.warning}; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px !important; }
      .logo-img { width: 180px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.light};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preheader)}</div>` : ""}

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.light};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Container -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.white}; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; border-bottom: 1px solid ${COLORS.light};">
              <a href="https://tcredex.com" style="text-decoration: none;">
                ${LOGO_HTML}
              </a>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.dark}; border-radius: 0 0 12px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Social Links -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://linkedin.com/company/tcredex" style="color: ${COLORS.gray}; text-decoration: none; font-size: 13px;">LinkedIn</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://twitter.com/tcredex" style="color: ${COLORS.gray}; text-decoration: none; font-size: 13px;">X (Twitter)</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 8px; color: ${COLORS.gray}; font-size: 12px;">
                      tCredex | AI-Powered Tax Credit Marketplace
                    </p>
                    <p style="margin: 0 0 8px; color: ${COLORS.gray}; font-size: 12px;">
                      Connecting sponsors, CDEs, and investors for NMTC, HTC, LIHTC, and Opportunity Zone deals.
                    </p>
                    <p style="margin: 0 0 12px; color: ${COLORS.gray}; font-size: 11px;">
                      <a href="https://tcredex.com/unsubscribe" style="color: ${COLORS.gray};">Unsubscribe</a> ·
                      <a href="https://tcredex.com/privacy" style="color: ${COLORS.gray};">Privacy Policy</a>
                    </p>

                    <!-- Legal Disclaimer -->
                    <p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #374151; color: #4b5563; font-size: 10px; line-height: 1.5;">
                      This communication is facilitated through tCredex. All parties have agreed to conduct
                      deal-related communications exclusively through the tCredex platform per their service agreement.
                      This email and any attachments are confidential and intended solely for the addressee.
                      tCredex is a product of American Impact Ventures LLC.
                      Tax credit investments involve risk. Past performance is not indicative of future results.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Email: Confirm Your Account
 */
export function confirmEmailTemplate(params: {
  userName: string;
  confirmUrl: string;
}): { subject: string; html: string; text: string } {
  const { userName, confirmUrl } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      Please confirm your tCredex account
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Thank you for your interest in tCredex – the AI-powered tax credit marketplace connecting sponsors, CDEs, and investors.
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      For exclusive access to deal matching, eligibility tools, and marketplace features, please confirm your email below to finish setting up your account.
    </p>
    
    <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
      Just one more step and you'll be set
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${confirmUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Confirm Your Email
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      To log in, please use the email address and password entered during sign-up. If you have any questions, please don't hesitate to <a href="mailto:support@tcredex.com" style="color: ${COLORS.primary};">get in touch</a>.
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Many Thanks,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: "Please confirm your tCredex account",
    html: baseTemplate(content, "Confirm your email to access tCredex"),
    text: `Dear ${userName},\n\nPlease confirm your tCredex account by visiting: ${confirmUrl}\n\nMany Thanks,\nThe tCredex Team`,
  };
}

/**
 * Email: Team Invitation
 */
export function teamInviteTemplate(params: {
  inviteeName: string;
  inviterName: string;
  organizationName: string;
  roleName: string;
  inviteUrl: string;
}): { subject: string; html: string; text: string } {
  const { inviteeName, inviterName, organizationName, roleName, inviteUrl } =
    params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      You've been invited to join ${escapeHtml(organizationName)} on tCredex
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Hi ${escapeHtml(inviteeName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(organizationName)}</strong> on tCredex as a <strong>${escapeHtml(roleName)}</strong>.
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      tCredex is the AI-powered tax credit marketplace connecting sponsors, CDEs, and investors. Click below to accept the invitation and set up your account.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${inviteUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      This invitation link expires in 24 hours. If you have any questions, contact <a href="mailto:support@tcredex.com" style="color: ${COLORS.primary};">support@tcredex.com</a>.
    </p>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Many Thanks,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `${inviterName} invited you to join ${organizationName} on tCredex`,
    html: baseTemplate(
      content,
      `You've been invited to join ${organizationName} on tCredex`,
    ),
    text: `Hi ${inviteeName},\n\n${inviterName} has invited you to join ${organizationName} on tCredex as a ${roleName}.\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 24 hours.\n\nMany Thanks,\nThe tCredex Team`,
  };
}

/**
 * Email: Team Invite with Claim Code (beta version)
 */
export function teamInviteWithCodeTemplate(params: {
  inviteeName: string;
  inviterName: string;
  organizationName: string;
  roleName: string;
  claimCode: string;
  message?: string;
}): { subject: string; html: string; text: string } {
  const {
    inviteeName,
    inviterName,
    organizationName,
    roleName,
    claimCode,
    message,
  } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      You've been invited to join ${escapeHtml(organizationName)} on tCredex
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Hi ${escapeHtml(inviteeName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(organizationName)}</strong> on tCredex as a <strong>${escapeHtml(roleName)}</strong>.
    </p>

    ${
      message
        ? `
    <div style="margin: 0 0 24px; padding: 16px; background-color: ${COLORS.lightGray}; border-left: 4px solid ${COLORS.primary}; border-radius: 4px;">
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 14px; font-style: italic;">
        "${escapeHtml(message)}"
      </p>
    </div>
    `
        : ""
    }

    <p style="margin: 0 0 16px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Use this claim code to set up your account:
    </p>

    <div style="margin: 0 0 24px; text-align: center; padding: 24px; background-color: ${COLORS.lightGray}; border-radius: 8px;">
      <div style="font-size: 32px; font-weight: 700; color: ${COLORS.primary}; letter-spacing: 4px; font-family: 'Courier New', monospace;">
        ${escapeHtml(claimCode)}
      </div>
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tcredex.com"}/claim?code=${claimCode}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Claim Your Account
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      This claim code expires in 7 days. If you have any questions, contact <a href="mailto:support@tcredex.com" style="color: ${COLORS.primary};">support@tcredex.com</a>.
    </p>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Many Thanks,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  const plainText = `Hi ${inviteeName},

${inviterName} has invited you to join ${organizationName} on tCredex as a ${roleName}.
${message ? `\nMessage from ${inviterName}: "${message}"\n` : ""}
Use this claim code to set up your account:

${claimCode}

Visit ${process.env.NEXT_PUBLIC_SITE_URL || "https://tcredex.com"}/claim?code=${claimCode} to claim your account.

This code expires in 7 days.

Many Thanks,
The tCredex Team`;

  return {
    subject: `${inviterName} invited you to join ${organizationName} on tCredex`,
    html: baseTemplate(
      content,
      `You've been invited to join ${organizationName} on tCredex`,
    ),
    text: plainText,
  };
}

/**
 * Email: Welcome to tCredex
 */
export function welcomeTemplate(params: {
  userName: string;
  role: "sponsor" | "cde" | "investor";
}): { subject: string; html: string; text: string } {
  const { userName, role } = params;

  const roleMessages = {
    sponsor:
      "Start by submitting your first deal through our streamlined intake form.",
    cde: "Browse the marketplace to find qualified projects that match your allocation criteria.",
    investor:
      "Explore tax credit opportunities and connect with CDEs managing deals.",
  };

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎉 Welcome to tCredex!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Your account is now active. You're officially part of the AI-powered tax credit marketplace.
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${roleMessages[role]}
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        Quick Start:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: ${COLORS.gray}; font-size: 14px; line-height: 1.8;">
        <li>Check any address for tax credit eligibility</li>
        <li>Browse available deals in the marketplace</li>
        <li>Complete your profile for better matches</li>
        <li>Download our mobile app to monitor deals on the go</li>
      </ul>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/dashboard" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Welcome aboard,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: "🎉 Welcome to tCredex!",
    html: baseTemplate(content, "Your tCredex account is ready"),
    text: `Dear ${userName},\n\nWelcome to tCredex! Your account is now active.\n\n${roleMessages[role]}\n\nVisit your dashboard: https://tcredex.com/dashboard\n\nThe tCredex Team`,
  };
}

/**
 * Email: Deal Submitted
 */
export function dealSubmittedTemplate(params: {
  userName: string;
  projectName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      ✅ Deal Submitted Successfully
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Your deal <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong> has been submitted to the tCredex marketplace.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        What happens next:
      </p>
      <ol style="margin: 0; padding-left: 20px; color: ${COLORS.gray}; font-size: 14px; line-height: 1.8;">
        <li>Our team will review your submission (24-48 hours)</li>
        <li>AutoMatch AI will identify potential CDE partners</li>
        <li>You'll receive notifications when matches are found</li>
        <li>CDEs can message you directly through the platform</li>
      </ol>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Your Deal
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      <strong>Tip:</strong> Complete your deal profile to increase match quality. Upload site photos, financial projections, and Phase I documents when available.
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Thank you for using tCredex,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `✅ Deal Submitted: ${projectName}`,
    html: baseTemplate(content, `Your deal ${projectName} has been submitted`),
    text: `Dear ${userName},\n\nYour deal "${projectName}" has been submitted to tCredex.\n\nView your deal: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: CDE Match Found
 */
export function cdeMatchTemplate(params: {
  userName: string;
  projectName: string;
  cdeName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, cdeName, dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎯 New CDE Match Found!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Great news! Our AutoMatch AI has identified a potential partner for your project.
    </p>

    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${COLORS.primary};">
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${escapeHtml(cdeName)}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px;">
        is interested in <strong>${escapeHtml(projectName)}</strong>
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Log in to view their profile, allocation availability, and send them a message.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Match Details
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Good luck,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `🎯 New CDE Match: ${cdeName} for ${projectName}`,
    html: baseTemplate(content, `${cdeName} is interested in your project`),
    text: `Dear ${userName},\n\n${cdeName} is a match for your project "${projectName}".\n\nView match: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: New Message
 */
export function newMessageTemplate(params: {
  userName: string;
  senderName: string;
  senderOrg: string;
  projectName: string;
  messagePreview: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const {
    userName,
    senderName,
    senderOrg,
    projectName,
    messagePreview,
    dealId,
  } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      💬 New Message
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      You have a new message regarding <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong>.
    </p>

    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 14px; font-weight: 600;">
        ${escapeHtml(senderName)} · ${escapeHtml(senderOrg)}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 15px; font-style: italic;">
        "${escapeHtml(messagePreview.length > 150 ? messagePreview.substring(0, 150) + "..." : messagePreview)}"
      </p>
    </div>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}/messages" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Reply Now
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `💬 ${senderName} sent you a message on ${projectName}`,
    html: baseTemplate(content, `New message from ${senderName}`),
    text: `Dear ${userName},\n\n${senderName} from ${senderOrg} sent you a message on "${projectName}":\n\n"${messagePreview}"\n\nReply: https://tcredex.com/deals/${dealId}/messages\n\nThe tCredex Team`,
  };
}

/**
 * Email: Document Requested
 */
export function documentRequestedTemplate(params: {
  userName: string;
  requesterName: string;
  documentType: string;
  projectName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, requesterName, documentType, projectName, dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      📄 Document Requested
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong style="color: ${COLORS.dark};">${escapeHtml(requesterName)}</strong> has requested a document for <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong>.
    </p>

    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${COLORS.warning};">
      <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px; text-transform: uppercase;">
        Requested Document
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${escapeHtml(documentType)}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Please upload this document to keep your deal moving forward.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}/documents" class="button" style="background-color: ${COLORS.warning}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Upload Document
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Thank you,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📄 ${documentType} requested for ${projectName}`,
    html: baseTemplate(content, `Please upload ${documentType}`),
    text: `Dear ${userName},\n\n${requesterName} has requested "${documentType}" for ${projectName}.\n\nUpload: https://tcredex.com/deals/${dealId}/documents\n\nThe tCredex Team`,
  };
}

/**
 * Email: Deal Approved
 */
export function dealApprovedTemplate(params: {
  userName: string;
  projectName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎉 Deal Approved!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Congratulations! <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong> has been approved and is now live in the tCredex marketplace.
    </p>
    
    <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0; color: ${COLORS.success}; font-size: 18px; font-weight: 600;">
        ✅ Your deal is now visible to CDEs and investors
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Our AutoMatch AI is already searching for the best CDE partners. You'll be notified as matches are found.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Your Live Deal
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Congratulations again,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `🎉 Approved: ${projectName} is now live!`,
    html: baseTemplate(content, "Your deal has been approved"),
    text: `Dear ${userName},\n\nCongratulations! "${projectName}" has been approved and is now live.\n\nView: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: Offer Expiring
 */
export function offerExpiringTemplate(params: {
  userName: string;
  projectName: string;
  cdeName: string;
  hoursLeft: number;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, cdeName, hoursLeft, dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      ⏳ Offer Expiring Soon
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      The offer from <strong style="color: ${COLORS.dark};">${escapeHtml(cdeName)}</strong> for <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong> is expiring soon.
    </p>
    
    <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; border: 2px solid ${COLORS.warning};">
      <p style="margin: 0 0 8px; color: ${COLORS.warning}; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        Time Remaining
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 36px; font-weight: 700;">
        ${hoursLeft} hours
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Don't miss this opportunity. Take action now to keep your deal moving forward.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.warning}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Respond to Offer
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Act fast,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `⚠️ Offer expiring in ${hoursLeft} hours: ${projectName}`,
    html: baseTemplate(content, `Urgent: Offer expires in ${hoursLeft} hours`),
    text: `Dear ${userName},\n\nThe offer from ${cdeName} for "${projectName}" expires in ${hoursLeft} hours.\n\nRespond: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: Password Reset
 */
export function passwordResetTemplate(params: {
  userName: string;
  resetUrl: string;
}): { subject: string; html: string; text: string } {
  const { userName, resetUrl } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      Reset your password
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We received a request to reset your tCredex password. Click the button below to choose a new password.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${resetUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Stay secure,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: "Reset your tCredex password",
    html: baseTemplate(content, "Password reset request"),
    text: `Dear ${userName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nThe tCredex Team`,
  };
}

/**
 * Email: Profile Added to Database (Preqin-style)
 * Used when we import CDE data or organization is referenced
 */
export function profileAddedTemplate(params: {
  contactName?: string;
  organizationName: string;
  organizationType: "CDE" | "Investor" | "Sponsor" | "Lender";
  claimUrl: string;
}): { subject: string; html: string; text: string } {
  const { contactName, organizationName, organizationType, claimUrl } = params;
  const greeting = contactName
    ? `Dear ${escapeHtml(contactName)},`
    : "Dear Sir/Madam,";

  const content = `
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${greeting}
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Your organization, <strong style="color: ${COLORS.dark};">${escapeHtml(organizationName)}</strong>, has been added to tCredex — the AI-powered marketplace connecting sponsors, CDEs, and investors for tax credit transactions.
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We are building the industry's most comprehensive platform for NMTC, HTC, LIHTC, and Opportunity Zone financing. Our mission is to increase transparency and connect qualified projects with capital.
    </p>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        Your Profile on tCredex:
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
        As the tax credit industry's emerging marketplace, we wanted to make you aware that we may hold your business contact details, such as organization name, allocation history, geographic focus, and sector preferences in our database.
      </p>
    </div>
    
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
        How have we collected your information?
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
        Your information was gathered from publicly available sources including CDFI Fund allocation announcements, press releases, corporate websites, and industry publications.
      </p>
      <p style="margin: 12px 0 0; color: ${COLORS.gray}; font-size: 14px;">
        To learn more about us or your data rights, visit our <a href="https://tcredex.com/privacy" style="color: ${COLORS.primary};">Privacy Notice</a>.
      </p>
    </div>
    
    <p style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
      Want to control what your tCredex profile shows?
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${
        organizationType === "CDE"
          ? "Claim your profile to showcase your allocation availability, sector focus, and deal preferences to qualified sponsors actively seeking NMTC partners."
          : "Claim your profile to ensure your organization's information is accurate and discover relevant opportunities in the marketplace."
      }
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="${claimUrl}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Claim Your Profile
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Questions? Reach out to our team at <a href="mailto:info@tcredex.com" style="color: ${COLORS.primary};">info@tcredex.com</a>
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Kind Regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `${organizationName} has been added to tCredex`,
    html: baseTemplate(content, "Your organization is now on tCredex"),
    text: `${greeting}\n\nYour organization, ${organizationName}, has been added to tCredex.\n\nClaim your profile: ${claimUrl}\n\nKind Regards,\nThe tCredex Team`,
  };
}

/**
 * Email: Deal Inquiry / Expression of Interest
 */
export function dealInquiryTemplate(params: {
  userName: string;
  projectName: string;
  inquirerName: string;
  inquirerOrg: string;
  inquirerRole: string;
  message?: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const {
    userName,
    projectName,
    inquirerName,
    inquirerOrg,
    inquirerRole,
    message,
    dealId,
  } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      📬 New Interest in Your Deal
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Someone has expressed interest in <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong>.
    </p>

    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid ${COLORS.primary};">
      <p style="margin: 0 0 4px; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${escapeHtml(inquirerName)}
      </p>
      <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 14px;">
        ${escapeHtml(inquirerOrg)} · ${escapeHtml(inquirerRole)}
      </p>
      ${
        message
          ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px; font-style: italic;">
          "${escapeHtml(message.length > 200 ? message.substring(0, 200) + "..." : message)}"
        </p>
      </div>
      `
          : ""
      }
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Log in to view their full profile and start a conversation.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View & Respond
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Good luck,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📬 ${inquirerOrg} is interested in ${projectName}`,
    html: baseTemplate(
      content,
      `${inquirerName} from ${inquirerOrg} is interested in your deal`,
    ),
    text: `Dear ${userName},\n\n${inquirerName} from ${inquirerOrg} has expressed interest in ${projectName}.\n\nView: https://tcredex.com/deals/${dealId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: Weekly Digest
 */
export function weeklyDigestTemplate(params: {
  userName: string;
  stats: {
    newDeals: number;
    newMatches: number;
    unreadMessages: number;
  };
  featuredDeals?: Array<{
    projectName: string;
    city: string;
    state: string;
    programType: string;
    allocation: number;
  }>;
}): { subject: string; html: string; text: string } {
  const { userName, stats, featuredDeals } = params;

  const dealsList =
    featuredDeals
      ?.map(
        (deal) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${COLORS.light};">
        <p style="margin: 0 0 4px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
          ${escapeHtml(deal.projectName)}
        </p>
        <p style="margin: 0; color: ${COLORS.gray}; font-size: 13px;">
          ${escapeHtml(deal.city)}, ${escapeHtml(deal.state)} · ${escapeHtml(deal.programType)} · ${(deal.allocation / 1000000).toFixed(1)}M
        </p>
      </td>
    </tr>
  `,
      )
      .join("") || "";

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      Your Weekly tCredex Update
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Hi ${escapeHtml(userName)}, here's what's happening in the marketplace this week.
    </p>
    
    <!-- Stats Row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td width="33%" style="text-align: center; padding: 16px; background-color: ${COLORS.light}; border-radius: 8px 0 0 8px;">
          <p style="margin: 0; color: ${COLORS.primary}; font-size: 28px; font-weight: 700;">${stats.newDeals}</p>
          <p style="margin: 4px 0 0; color: ${COLORS.gray}; font-size: 12px;">New Deals</p>
        </td>
        <td width="33%" style="text-align: center; padding: 16px; background-color: ${COLORS.light};">
          <p style="margin: 0; color: ${COLORS.success}; font-size: 28px; font-weight: 700;">${stats.newMatches}</p>
          <p style="margin: 4px 0 0; color: ${COLORS.gray}; font-size: 12px;">New Matches</p>
        </td>
        <td width="33%" style="text-align: center; padding: 16px; background-color: ${COLORS.light}; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: ${COLORS.warning}; font-size: 28px; font-weight: 700;">${stats.unreadMessages}</p>
          <p style="margin: 4px 0 0; color: ${COLORS.gray}; font-size: 12px;">Messages</p>
        </td>
      </tr>
    </table>
    
    ${
      featuredDeals?.length
        ? `
    <p style="margin: 24px 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">
      Featured Deals This Week:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${dealsList}
    </table>
    `
        : ""
    }
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Browse Marketplace
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      See you next week,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📊 Your Weekly tCredex Update: ${stats.newDeals} new deals`,
    html: baseTemplate(content, `${stats.newDeals} new deals this week`),
    text: `Hi ${userName},\n\nThis week: ${stats.newDeals} new deals, ${stats.newMatches} matches, ${stats.unreadMessages} messages.\n\nBrowse: https://tcredex.com/deals\n\nThe tCredex Team`,
  };
}

/**
 * Email: Allocation Announcement (for CDEs)
 */
export function allocationAnnouncementTemplate(params: {
  cdeName: string;
  contactName?: string;
  allocationAmount: number;
  allocationYear: number;
}): { subject: string; html: string; text: string } {
  const { cdeName, contactName, allocationAmount, allocationYear } = params;
  const greeting = contactName
    ? `Dear ${escapeHtml(contactName)},`
    : `Dear ${escapeHtml(cdeName)} Team,`;
  const formattedAmount = `${(allocationAmount / 1000000).toFixed(0)}M`;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      🎉 Congratulations on Your ${allocationYear} NMTC Allocation!
    </h1>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      ${greeting}
    </p>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We noticed that <strong style="color: ${COLORS.dark};">${escapeHtml(cdeName)}</strong> received a <strong style="color: ${COLORS.success};">${formattedAmount}</strong> NMTC allocation for ${allocationYear}. Congratulations!
    </p>
    
    <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; color: ${COLORS.success}; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        ${allocationYear} Allocation
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 36px; font-weight: 700;">
        ${formattedAmount}
      </p>
    </div>
    
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      tCredex has qualified sponsors actively seeking CDE partners. Our marketplace can help you deploy your allocation efficiently by connecting you with pre-vetted projects that match your investment criteria.
    </p>
    
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/cde/register" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Find Qualified Projects
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Questions about how tCredex works? Reply to this email or visit <a href="https://tcredex.com/how-it-works" style="color: ${COLORS.primary};">tcredex.com/how-it-works</a>
    </p>
    
    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `🎉 Congrats on your ${formattedAmount} NMTC allocation, ${cdeName}!`,
    html: baseTemplate(
      content,
      `${cdeName} received ${formattedAmount} in ${allocationYear}`,
    ),
    text: `${greeting}\n\nCongratulations on your ${formattedAmount} NMTC allocation for ${allocationYear}!\n\ntCredex can help you find qualified projects.\n\nLearn more: https://tcredex.com/cde/register\n\nThe tCredex Team`,
  };
}

/**
 * Email: LOI Received (Sponsor receives from CDE)
 */
export function loiReceivedTemplate(params: {
  userName: string;
  projectName: string;
  cdeName: string;
  allocationAmount: string;
  dealId: string;
  loiId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, cdeName, allocationAmount, dealId, loiId } =
    params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      📬 New Letter of Intent Received
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Great news! A CDE has submitted a Letter of Intent for your project.
    </p>

    <div style="background-color: #dcfce7; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid ${COLORS.success};">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 18px; font-weight: 600;">
        ${escapeHtml(projectName)}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%">
            <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px; text-transform: uppercase;">CDE</p>
            <p style="margin: 0; color: ${COLORS.dark}; font-size: 16px; font-weight: 600;">${escapeHtml(cdeName)}</p>
          </td>
          <td width="50%">
            <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px; text-transform: uppercase;">Allocation Offered</p>
            <p style="margin: 0; color: ${COLORS.success}; font-size: 20px; font-weight: 700;">${escapeHtml(allocationAmount)}</p>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Please review the LOI terms and respond within the specified timeframe. You can accept, counter, or decline the offer.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}/loi/${loiId}" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Review LOI
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Good luck,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `📬 LOI Received: ${cdeName} for ${projectName}`,
    html: baseTemplate(
      content,
      `${cdeName} has submitted an LOI for ${projectName}`,
    ),
    text: `Dear ${userName},\n\n${cdeName} has submitted a Letter of Intent for ${projectName}.\n\nAllocation Offered: ${allocationAmount}\n\nReview: https://tcredex.com/deals/${dealId}/loi/${loiId}\n\nThe tCredex Team`,
  };
}

/**
 * Email: LOI Accepted (CDE receives notification)
 */
export function loiAcceptedTemplate(params: {
  userName: string;
  projectName: string;
  sponsorName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, sponsorName, dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      ✅ LOI Accepted!
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Great news! Your Letter of Intent has been accepted.
    </p>

    <div style="background-color: #dcfce7; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; color: ${COLORS.success}; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        Accepted
      </p>
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 20px; font-weight: 700;">
        ${escapeHtml(projectName)}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px;">
        Sponsor: ${escapeHtml(sponsorName)}
      </p>
    </div>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      The deal is now in the "Seeking Capital" phase. You may proceed with investor outreach and due diligence.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            View Deal
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Congratulations,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `✅ LOI Accepted: ${projectName}`,
    html: baseTemplate(
      content,
      `${sponsorName} accepted your LOI for ${projectName}`,
    ),
    text: `Dear ${userName},\n\nGreat news! ${sponsorName} has accepted your LOI for ${projectName}.\n\nView: https://tcredex.com/deals/${dealId}\n\nCongratulations,\nThe tCredex Team`,
  };
}

/**
 * Email: LOI Rejected (CDE receives notification)
 */
export function loiRejectedTemplate(params: {
  userName: string;
  projectName: string;
  sponsorName: string;
  dealId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, sponsorName, dealId: _dealId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      LOI Declined
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      We're sorry to inform you that your Letter of Intent has been declined.
    </p>

    <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; border-left: 4px solid #ef4444;">
      <p style="margin: 0 0 8px; color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        Declined
      </p>
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 20px; font-weight: 700;">
        ${escapeHtml(projectName)}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px;">
        Sponsor: ${escapeHtml(sponsorName)}
      </p>
    </div>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      There are many other qualified projects in the marketplace. Browse deals that match your criteria.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Browse Deals
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `LOI Declined: ${projectName}`,
    html: baseTemplate(
      content,
      `${sponsorName} declined your LOI for ${projectName}`,
    ),
    text: `Dear ${userName},\n\n${sponsorName} has declined your LOI for ${projectName}.\n\nBrowse other deals: https://tcredex.com/deals\n\nBest regards,\nThe tCredex Team`,
  };
}

/**
 * Email: LOI Countered (CDE receives notification)
 */
export function loiCounteredTemplate(params: {
  userName: string;
  projectName: string;
  sponsorName: string;
  dealId: string;
  loiId: string;
}): { subject: string; html: string; text: string } {
  const { userName, projectName, sponsorName, dealId, loiId } = params;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      ↔️ Counter Proposal Received
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(userName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      The sponsor has submitted a counter proposal for your Letter of Intent.
    </p>

    <div style="background-color: #fff7ed; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; border-left: 4px solid ${COLORS.warning};">
      <p style="margin: 0 0 8px; color: ${COLORS.warning}; font-size: 14px; font-weight: 600; text-transform: uppercase;">
        Counter Proposal
      </p>
      <p style="margin: 0 0 8px; color: ${COLORS.dark}; font-size: 20px; font-weight: 700;">
        ${escapeHtml(projectName)}
      </p>
      <p style="margin: 0; color: ${COLORS.gray}; font-size: 14px;">
        Sponsor: ${escapeHtml(sponsorName)}
      </p>
    </div>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Please review the proposed modifications and consider revising your LOI terms.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}/loi/${loiId}" class="button" style="background-color: ${COLORS.warning}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Review Counter
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `↔️ Counter Proposal: ${projectName}`,
    html: baseTemplate(
      content,
      `${sponsorName} has countered your LOI for ${projectName}`,
    ),
    text: `Dear ${userName},\n\n${sponsorName} has submitted a counter proposal for ${projectName}.\n\nReview: https://tcredex.com/deals/${dealId}/loi/${loiId}\n\nBest regards,\nThe tCredex Team`,
  };
}

// Helper to format currency in emails
function emailCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/**
 * Email: Allocation Request — Sponsor → CDE
 *
 * The flagship outreach email. A Sponsor has selected this CDE for their project.
 * Includes an inline Deal Card in the email body and the Project Profile as an attachment.
 * Contains a magic link for the CDE to claim their seat on tCredex.
 */
export function allocationRequestTemplate(params: {
  contactName: string;
  cdeName: string;
  cdeAllocationAmount: string;
  cdeAllocationYear: number;
  sponsorName: string;
  sponsorContactName: string;
  projectName: string;
  dealSummary: {
    city: string;
    state: string;
    address?: string;
    censusTract?: string;
    programType: string;
    allocation: number;
    projectCost: number;
    financingGap?: number;
    povertyRate?: number;
    medianIncome?: number;
    unemployment?: number;
    shovelReady?: boolean;
    completionDate?: string;
    communityImpact?: string;
    sources?: Array<{ name: string; amount: number }>;
    uses?: Array<{ name: string; amount: number }>;
  };
  claimUrl: string;
  dealId: string;
  claimCode?: string;
}): { subject: string; html: string; text: string } {
  const {
    contactName,
    cdeName,
    cdeAllocationAmount,
    cdeAllocationYear,
    sponsorName,
    sponsorContactName,
    projectName,
    dealSummary,
    claimUrl,
    dealId: _dealId,
    claimCode,
  } = params;

  const {
    city,
    state,
    address,
    censusTract,
    programType,
    allocation,
    projectCost,
    financingGap,
    povertyRate,
    medianIncome,
    unemployment,
    shovelReady,
    completionDate,
    communityImpact,
    sources,
    uses,
  } = dealSummary;

  // Format helpers
  const fmtCurrency = (amt: number | undefined) => {
    if (!amt) return "\u2014";
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(1)}M`;
    if (amt >= 1000) return `$${(amt / 1000).toFixed(0)}K`;
    return `$${amt.toFixed(0)}`;
  };
  const fmtPercent = (val: number | undefined) =>
    val !== undefined ? `${val.toFixed(1)}%` : "\u2014";
  const fmtDate = (d: string | undefined) => {
    if (!d) return "\u2014";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Build Sources & Uses rows for the inline Deal Card
  const sourcesRows = (sources || [])
    .slice(0, 3)
    .map(
      (s) => `
    <tr>
      <td style="padding: 2px 0; color: #475569; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${escapeHtml(s.name)}</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${fmtCurrency(s.amount)}</td>
    </tr>
  `,
    )
    .join("");

  const usesRows = (uses || [])
    .slice(0, 3)
    .map(
      (u) => `
    <tr>
      <td style="padding: 2px 0; color: #475569; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${escapeHtml(u.name)}</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${fmtCurrency(u.amount)}</td>
    </tr>
  `,
    )
    .join("");

  const totalSources = (sources || []).reduce(
    (sum, s) => sum + (s.amount || 0),
    0,
  );
  const totalUses = (uses || []).reduce((sum, u) => sum + (u.amount || 0), 0);

  const content = `
    <!-- Congratulations Banner (table+bgcolor for Gmail compatibility) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px; border-radius: 8px;">
      <tr>
        <td align="center" bgcolor="#1e1b4b" style="background-color: #1e1b4b; padding: 28px 24px; border-radius: 8px;">
          <p style="margin: 0 0 8px; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800;">
            Request for NMTC Allocation
          </p>
          <p style="margin: 0 0 12px; color: #ffffff; font-size: 26px; font-weight: 800; line-height: 1.2;">
            ${escapeHtml(projectName)}
          </p>
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">
            ${escapeHtml(city)}, ${escapeHtml(state)}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(contactName)},
    </p>

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Congratulations <strong style="color: ${COLORS.dark};">${escapeHtml(cdeName)}</strong> on your ${cdeAllocationYear}
      <strong style="color: ${COLORS.success};">${cdeAllocationAmount}</strong> NMTC allocation award!
    </p>

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      I am writing to formally request NMTC allocation for the
      <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong> project.
      ${escapeHtml(cdeName)} has been specifically selected based on your available allocation,
      geographic investment priorities, and strong alignment with the project&rsquo;s mission and sector focus.
    </p>

    <!-- PRIMARY CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="#1e40af" style="background-color: #1e40af; border-radius: 10px; box-shadow: 0 4px 14px rgba(30,64,175,0.4);">
                <a href="${claimUrl}" style="color: #ffffff; text-decoration: none; padding: 20px 52px; font-weight: 800; font-size: 18px; display: inline-block; font-family: Arial, sans-serif; letter-spacing: 0.3px;">
                  Claim Your Seat on tCredex &rarr;
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 10px 0 0; color: ${COLORS.gray}; font-size: 13px;">
            No cost. No obligation. Get started in under 2 minutes.
          </p>
        </td>
      </tr>
    </table>

    ${
      claimCode
        ? `
    <!-- Claim Code (alternative to button) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px;">
      <tr>
        <td align="center" style="padding: 0;">
          <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; font-family: Arial, sans-serif;">
            Or enter your claim code at <strong style="color: #1e1b4b;">tcredex.com/claim</strong>
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border: 1px dashed #a5b4fc; border-radius: 8px;">
            <tr>
              <td align="center" bgcolor="#f8f7ff" style="background-color: #f8f7ff; padding: 12px 28px; border-radius: 8px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #4338ca;">
                  ${escapeHtml(claimCode.slice(0, 4))}&nbsp;${escapeHtml(claimCode.slice(4))}
                </span>
              </td>
            </tr>
          </table>
          <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px; font-family: Arial, sans-serif;">
            Code expires in 30 days.
          </p>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <!-- INLINE DEAL CARD -->
    <div style="margin: 28px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border: 1px solid #e2e8f0;">

      <!-- Deal Card Banner (table+bgcolor for Gmail) -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td bgcolor="#1e1b4b" style="background-color: #1e1b4b; padding: 14px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color: #ffffff; font-size: 20px; font-weight: 900; font-family: Arial, sans-serif;">tCredex</span>
                </td>
                <td style="text-align: right;">
                  <span style="color: #ffffff; font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 1px;">
                    DEAL CARD
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Card Body -->
      <div style="background: #ffffff; padding: 20px;">

        <!-- Project Header -->
        <p style="margin: 0 0 2px; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
          tCredex.com Deal Card Summary
        </p>
        <p style="margin: 0 0 4px; color: #0f172a; font-size: 18px; font-weight: 900; line-height: 1.2;">
          ${escapeHtml(projectName)}
        </p>
        <p style="margin: 0 0 16px; color: #475569; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          ${escapeHtml(sponsorName)}<br/>
          ${address ? `${escapeHtml(address)} | ` : ""}${escapeHtml(city)}, ${escapeHtml(state)}${censusTract ? ` | Tract: ${escapeHtml(censusTract)}` : ""}
        </p>

        <!-- Financial Overview -->
        <p style="margin: 0 0 8px; color: #1e1b4b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          Financial Overview
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <tr>
            <td width="50%" style="padding: 8px 12px;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Total Project Cost</p>
              <p style="margin: 0; color: #312e81; font-size: 18px; font-weight: 800;">${fmtCurrency(projectCost)}</p>
            </td>
            <td width="50%" style="padding: 8px 12px;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">NMTC Allocation Request</p>
              <p style="margin: 0; color: ${COLORS.success}; font-size: 18px; font-weight: 800;">${fmtCurrency(allocation)}</p>
            </td>
          </tr>
          ${
            financingGap
              ? `
          <tr>
            <td colspan="2" style="padding: 4px 12px 8px;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Financing Gap</p>
              <p style="margin: 0; color: #b45309; font-size: 16px; font-weight: 800;">${fmtCurrency(financingGap)}</p>
            </td>
          </tr>
          `
              : ""
          }
        </table>

        <!-- Vitals -->
        <p style="margin: 16px 0 8px; color: #1e1b4b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          Project Vitals
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Program</p>
              <p style="margin: 0; color: #0f172a; font-size: 13px; font-weight: 800;">${programType || "NMTC"}</p>
            </td>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Shovel Ready</p>
              <p style="margin: 0; color: ${shovelReady ? "#059669" : "#0f172a"}; font-size: 13px; font-weight: 800;">${shovelReady ? "Yes" : "No"}</p>
            </td>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Completion</p>
              <p style="margin: 0; color: #0f172a; font-size: 13px; font-weight: 800;">${fmtDate(completionDate)}</p>
            </td>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Tract</p>
              <p style="margin: 0; color: #0f172a; font-size: 12px; font-weight: 800;">${escapeHtml(censusTract) || "\u2014"}</p>
            </td>
          </tr>
        </table>

        ${
          povertyRate !== undefined ||
          medianIncome !== undefined ||
          unemployment !== undefined
            ? `
        <!-- Demographics -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f1f5f9; border-radius: 4px; margin-top: 8px;">
          <tr>
            <td width="33%" style="padding: 6px 8px; text-align: center;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700;">POVERTY</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800;">${fmtPercent(povertyRate)}</p>
            </td>
            <td width="33%" style="padding: 6px 8px; text-align: center;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700;">MED INCOME</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800;">${fmtPercent(medianIncome)}</p>
            </td>
            <td width="33%" style="padding: 6px 8px; text-align: center;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700;">UNEMP</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800;">${fmtPercent(unemployment)}</p>
            </td>
          </tr>
        </table>
        `
            : ""
        }

        ${
          sources?.length || uses?.length
            ? `
        <!-- Sources & Uses -->
        <p style="margin: 16px 0 8px; color: #1e1b4b; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          Sources & Uses
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${
              sources?.length
                ? `
            <td width="50%" style="vertical-align: top; padding-right: 8px;">
              <p style="margin: 0 0 4px; color: #1e1b4b; font-size: 10px; font-weight: 800; text-transform: uppercase;">Sources</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${sourcesRows}
                <tr>
                  <td colspan="2" style="border-top: 1px solid #cbd5e1; padding-top: 3px; text-align: right; font-weight: 800; color: #312e81; font-size: 12px;">
                    Total: ${fmtCurrency(totalSources)}
                  </td>
                </tr>
              </table>
            </td>
            `
                : ""
            }
            ${
              uses?.length
                ? `
            <td width="50%" style="vertical-align: top; padding-left: 8px;">
              <p style="margin: 0 0 4px; color: #1e1b4b; font-size: 10px; font-weight: 800; text-transform: uppercase;">Uses</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${usesRows}
                <tr>
                  <td colspan="2" style="border-top: 1px solid #cbd5e1; padding-top: 3px; text-align: right; font-weight: 800; color: #312e81; font-size: 12px;">
                    Total: ${fmtCurrency(totalUses)}
                  </td>
                </tr>
              </table>
            </td>
            `
                : ""
            }
          </tr>
        </table>
        `
            : ""
        }

        <!-- Community Impact is in the attached Project Profile, not repeated here -->

        <!-- Card Footer -->
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin: 0; color: #64748b; font-size: 11px;">
                  Project Profile attached &middot; Claim your seat to connect with the Sponsor
                </p>
              </td>
              <td style="text-align: right;">
                <a href="${claimUrl}" style="color: #312e81; font-size: 11px; font-weight: 700; text-decoration: none;">tcredex.com</a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    <!-- END DEAL CARD -->

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      The complete <strong>Project Profile</strong> is attached to this email for your team's review.
    </p>

    <!-- Value Proposition -->
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 700;">
        Why tCredex? &mdash; Completely Free for CDEs
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; vertical-align: top; width: 28px;">
            <span style="color: ${COLORS.success}; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Allocation &amp; Deal Management</strong> &mdash; Track your allocation pipeline, manage incoming project submissions, and monitor deployment from one dashboard.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: ${COLORS.success}; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Confidential Document Storage</strong> &mdash; Secure, encrypted vault for due diligence documents with role-based access controls.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: ${COLORS.success}; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Closing Checklist Generation</strong> &mdash; Automated closing document checklists tailored to each deal's program type and structure.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: ${COLORS.success}; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Encrypted Deal Closing Room</strong> &mdash; Private, secure communications between all parties &mdash; Sponsor, CDE, Investor, and counsel.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: ${COLORS.success}; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Sponsor &amp; Investor Portal</strong> &mdash; Your counterparts are already here. Streamline communications across the entire deal lifecycle.
          </td>
        </tr>
      </table>
    </div>

    <!-- Sponsor Signature -->
    <div style="margin: 32px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 4px; color: ${COLORS.dark}; font-size: 16px; line-height: 1.5;">
        Regards,
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 18px; font-weight: 700; line-height: 1.4;">
        ${escapeHtml(sponsorContactName)}
      </p>
      <p style="margin: 0 0 16px; color: ${COLORS.gray}; font-size: 15px;">
        ${escapeHtml(sponsorName)}
      </p>

      <div style="padding-top: 14px; border-top: 1px solid #e5e7eb;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle; padding-right: 12px;">
              <a href="https://tcredex.com" style="text-decoration: none;">
                <span style="font-size: 22px; font-weight: 800; color: #6538D4;">t</span><span style="font-size: 22px; font-weight: 800; color: #3C91F5;">Credex</span><span style="font-size: 17px; font-weight: 800; color: #3C91F5;">.com</span>
              </a>
            </td>
            <td style="vertical-align: middle; border-left: 2px solid #e5e7eb; padding-left: 12px;">
              <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px; line-height: 1.4;">
                AI-Powered Tax Credit Marketplace<br/>
                Connecting Sponsors, CDEs &amp; Investors
              </p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  return {
    subject: `Claim Your Seat at tCredex \u2014 ${fmtCurrency(allocation)} Allocation Request from ${projectName}`,
    html: baseTemplate(
      content,
      `${sponsorContactName} at ${sponsorName} has selected ${cdeName} for a ${fmtCurrency(allocation)} NMTC allocation request`,
    ),
    text: `Dear ${contactName},\n\nCongratulations ${cdeName} on your ${cdeAllocationYear} ${cdeAllocationAmount} NMTC allocation award!\n\nI am writing to formally request NMTC allocation for the ${projectName} project. ${cdeName} has been specifically selected based on your available allocation, geographic investment priorities, and strong alignment with the project\u2019s mission and sector focus.\n\nAllocation Request: ${fmtCurrency(allocation)}\nTotal Project Cost: ${fmtCurrency(projectCost)}${financingGap ? `\nFinancing Gap: ${fmtCurrency(financingGap)}` : ""}\nProgram: ${programType || "NMTC"}${censusTract ? `\nCensus Tract: ${censusTract}` : ""}${communityImpact ? `\n\nCommunity Impact: ${communityImpact}` : ""}\n\ntCredex is completely free for CDEs:\n- Allocation & Deal Management\n- Confidential Document Storage\n- Closing Checklist Generation\n- Encrypted Deal Closing Room\n- Sponsor & Investor Portal\n\n${claimCode ? `YOUR CLAIM CODE: ${claimCode}\nEnter this code at tcredex.com/claim to get started.\n` : ""}Claim your seat: ${claimUrl}\n\nThe complete Project Profile is attached for your review.\n\nRegards,\n${sponsorContactName}\n${sponsorName}\n\nvia tCredex.com - AI-Powered Tax Credit Marketplace`,
  };
}

/**
 * Email: Project Submission — Onboarded CDE
 * Sent to CDEs that have active users on tCredex
 */
export function projectSubmissionOnboardedTemplate(params: {
  contactName: string;
  cdeName: string;
  projectName: string;
  sponsorName: string;
  dealSummary: {
    city: string;
    state: string;
    programType: string;
    allocation: number;
    projectCost: number;
    censusTract?: string;
    communityImpact?: string;
  };
  dealId: string;
}): { subject: string; html: string; text: string } {
  const {
    contactName,
    cdeName,
    projectName,
    sponsorName,
    dealSummary,
    dealId,
  } = params;
  const {
    city,
    state,
    programType,
    allocation,
    projectCost,
    censusTract,
    communityImpact,
  } = dealSummary;

  const content = `
    <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700;">
      New Project Submission
    </h1>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(contactName)},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong style="color: ${COLORS.dark};">${escapeHtml(sponsorName)}</strong> has submitted a project to
      <strong style="color: ${COLORS.dark};">${escapeHtml(cdeName)}</strong> for NMTC allocation consideration.
    </p>

    <!-- Deal Card Summary -->
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid ${COLORS.primary};">
      <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
        Project
      </p>
      <p style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 20px; font-weight: 700;">
        ${escapeHtml(projectName)}
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Location</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">${escapeHtml(city)}, ${escapeHtml(state)}</p>
          </td>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Program</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">${programType || "NMTC"}</p>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Allocation Request</p>
            <p style="margin: 2px 0 0; color: ${COLORS.success}; font-size: 15px; font-weight: 700;">${emailCurrency(allocation)}</p>
          </td>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Total Project Cost</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">${emailCurrency(projectCost)}</p>
          </td>
        </tr>
        ${
          censusTract
            ? `
        <tr>
          <td colspan="2" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Census Tract</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px;">${escapeHtml(censusTract)}</p>
          </td>
        </tr>
        `
            : ""
        }
      </table>

      ${
        communityImpact
          ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px;">Community Impact</p>
        <p style="margin: 0; color: ${COLORS.dark}; font-size: 14px; line-height: 1.5;">
          ${escapeHtml(communityImpact.length > 300 ? communityImpact.substring(0, 300) + "..." : communityImpact)}
        </p>
      </div>
      `
          : ""
      }
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/deals/${dealId}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Review on tCredex
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Log in to your tCredex account to view the full Project Profile and respond to this submission.
    </p>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Best regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `New Project Submission: ${projectName} — ${city}, ${state}`,
    html: baseTemplate(
      content,
      `${sponsorName} submitted ${projectName} for your review`,
    ),
    text: `Dear ${contactName},\n\n${sponsorName} has submitted "${projectName}" (${city}, ${state}) to ${cdeName} for NMTC allocation consideration.\n\nAllocation Request: ${emailCurrency(allocation)}\nProject Cost: ${emailCurrency(projectCost)}\n\nReview: https://tcredex.com/deals/${dealId}\n\nBest regards,\nThe tCredex Team`,
  };
}

/**
 * Email: Project Submission — Cold Outreach (Non-Onboarded CDE)
 * Personalized email with Project Profile attached
 */
export function projectSubmissionColdOutreachTemplate(params: {
  contactName: string;
  cdeName: string;
  projectName: string;
  sponsorName: string;
  dealSummary: {
    city: string;
    state: string;
    programType: string;
    allocation: number;
    projectCost: number;
    censusTract?: string;
    communityImpact?: string;
  };
  cdeId: string;
}): { subject: string; html: string; text: string } {
  const { contactName, cdeName, projectName, sponsorName, dealSummary, cdeId } =
    params;
  const {
    city,
    state,
    programType,
    allocation,
    projectCost,
    censusTract,
    communityImpact,
  } = dealSummary;

  const content = `
    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(contactName) || `${escapeHtml(cdeName)} Team`},
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong style="color: ${COLORS.dark};">${escapeHtml(sponsorName)}</strong> has identified
      <strong style="color: ${COLORS.dark};">${escapeHtml(cdeName)}</strong> as a potential NMTC partner for their project
      and would like to share the following opportunity with your team.
    </p>

    <!-- Deal Card Summary -->
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid ${COLORS.primary};">
      <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
        Project Opportunity
      </p>
      <p style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 20px; font-weight: 700;">
        ${escapeHtml(projectName)}
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Location</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">${escapeHtml(city)}, ${escapeHtml(state)}</p>
          </td>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Program</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">${programType || "NMTC"}</p>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Allocation Request</p>
            <p style="margin: 2px 0 0; color: ${COLORS.success}; font-size: 15px; font-weight: 700;">${emailCurrency(allocation)}</p>
          </td>
          <td width="50%" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Total Project Cost</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px; font-weight: 600;">${emailCurrency(projectCost)}</p>
          </td>
        </tr>
        ${
          censusTract
            ? `
        <tr>
          <td colspan="2" style="padding: 6px 0;">
            <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px;">Census Tract</p>
            <p style="margin: 2px 0 0; color: ${COLORS.dark}; font-size: 15px;">${escapeHtml(censusTract)}</p>
          </td>
        </tr>
        `
            : ""
        }
      </table>

      ${
        communityImpact
          ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px; color: ${COLORS.gray}; font-size: 12px;">Community Impact</p>
        <p style="margin: 0; color: ${COLORS.dark}; font-size: 14px; line-height: 1.5;">
          ${escapeHtml(communityImpact.length > 300 ? communityImpact.substring(0, 300) + "..." : communityImpact)}
        </p>
      </div>
      `
          : ""
      }
    </div>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      A detailed Project Profile is attached for your review.
    </p>

    <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      tCredex is the AI-powered tax credit marketplace connecting sponsors, CDEs, and investors. Your organization's profile is already on our platform based on publicly available CDFI Fund data. Claim your spot to manage incoming project submissions and connect with qualified sponsors.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td>
          <a href="https://tcredex.com/auth/register?role=cde&ref=${cdeId}" class="button" style="background-color: ${COLORS.success}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
            Claim Your Spot on tCredex
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.6;">
      Questions? Reply to this email or contact us at <a href="mailto:info@tcredex.com" style="color: ${COLORS.primary};">info@tcredex.com</a>
    </p>

    <p style="margin: 24px 0 0; color: ${COLORS.dark}; font-size: 16px;">
      Kind Regards,<br>
      <strong>The tCredex Team</strong>
    </p>
  `;

  return {
    subject: `NMTC Project Opportunity: ${projectName} — ${city}, ${state}`,
    html: baseTemplate(
      content,
      `${sponsorName} has a project opportunity for ${cdeName}`,
    ),
    text: `Dear ${contactName || `${cdeName} Team`},\n\n${sponsorName} has identified ${cdeName} as a potential NMTC partner for their project "${projectName}" in ${city}, ${state}.\n\nAllocation Request: ${emailCurrency(allocation)}\nProject Cost: ${emailCurrency(projectCost)}${censusTract ? `\nCensus Tract: ${censusTract}` : ""}\n\nA detailed Project Profile is attached.\n\nClaim your spot: https://tcredex.com/auth/register?role=cde&ref=${cdeId}\n\nKind Regards,\nThe tCredex Team`,
  };
}

/**
 * Email: Investment Request — Sponsor → Investor
 *
 * Flagship outreach email for investors. A Sponsor has identified this Investor
 * as a potential capital partner for their tax credit project.
 * Includes an inline Deal Card in the email body and the Project Profile as an attachment.
 * Contains a magic link for the Investor to claim their seat on tCredex.
 */
export function investmentRequestTemplate(params: {
  contactName: string;
  investorName: string;
  sponsorName: string;
  sponsorContactName: string;
  projectName: string;
  dealSummary: {
    city: string;
    state: string;
    address?: string;
    censusTract?: string;
    programType: string;
    allocation: number;
    projectCost: number;
    financingGap?: number;
    povertyRate?: number;
    medianIncome?: number;
    unemployment?: number;
    shovelReady?: boolean;
    completionDate?: string;
    communityImpact?: string;
    sources?: Array<{ name: string; amount: number }>;
    uses?: Array<{ name: string; amount: number }>;
  };
  claimUrl: string;
  dealId: string;
  claimCode?: string;
}): { subject: string; html: string; text: string } {
  const {
    contactName,
    investorName,
    sponsorName,
    sponsorContactName,
    projectName,
    dealSummary,
    claimUrl,
    dealId: _dealId,
    claimCode,
  } = params;

  const {
    city,
    state,
    address,
    censusTract,
    programType,
    allocation,
    projectCost,
    financingGap,
    povertyRate,
    medianIncome,
    unemployment,
    shovelReady,
    completionDate,
    communityImpact,
    sources,
    uses,
  } = dealSummary;

  // Format helpers
  const fmtCurrency = (amt: number | undefined) => {
    if (!amt) return "\u2014";
    if (amt >= 1000000) return `$${(amt / 1000000).toFixed(1)}M`;
    if (amt >= 1000) return `$${(amt / 1000).toFixed(0)}K`;
    return `$${amt.toFixed(0)}`;
  };
  const fmtPercent = (val: number | undefined) =>
    val !== undefined ? `${val.toFixed(1)}%` : "\u2014";
  const fmtDate = (d: string | undefined) => {
    if (!d) return "\u2014";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Build Sources & Uses rows for the inline Deal Card
  const sourcesRows = (sources || [])
    .slice(0, 3)
    .map(
      (s) => `
    <tr>
      <td style="padding: 2px 0; color: #475569; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${escapeHtml(s.name)}</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${fmtCurrency(s.amount)}</td>
    </tr>
  `,
    )
    .join("");

  const usesRows = (uses || [])
    .slice(0, 3)
    .map(
      (u) => `
    <tr>
      <td style="padding: 2px 0; color: #475569; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${escapeHtml(u.name)}</td>
      <td style="padding: 2px 0; text-align: right; font-weight: 700; color: #0f172a; font-size: 11px; border-bottom: 1px dashed #f1f5f9;">${fmtCurrency(u.amount)}</td>
    </tr>
  `,
    )
    .join("");

  const totalSources = (sources || []).reduce(
    (sum, s) => sum + (s.amount || 0),
    0,
  );
  const totalUses = (uses || []).reduce((sum, u) => sum + (u.amount || 0), 0);

  // Determine CRA eligibility hint based on tract data
  const isCRAEligible =
    (povertyRate && povertyRate >= 20) || (medianIncome && medianIncome <= 80);
  const craLabel = isCRAEligible ? "CRA-Eligible" : "CRA Status TBD";

  const content = `
    <!-- Investment Opportunity Banner -->
    <div style="background: linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0284c7 100%); border-radius: 8px; padding: 28px 24px; margin: 0 0 28px; text-align: center;">
      <p style="margin: 0 0 4px; color: #bae6fd; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
        Tax Credit Investment Opportunity
      </p>
      <p style="margin: 0 0 12px; color: #ffffff; font-size: 26px; font-weight: 800; line-height: 1.2;">
        ${escapeHtml(projectName)}
      </p>
      <p style="margin: 0; color: #7dd3fc; font-size: 14px;">
        ${escapeHtml(city)}, ${escapeHtml(state)} &middot; ${programType || "NMTC"}
      </p>
    </div>

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      Dear ${escapeHtml(contactName)},
    </p>

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      I am writing to present a <strong style="color: ${COLORS.dark};">${programType || "tax credit"}</strong>
      investment opportunity for <strong style="color: ${COLORS.dark};">${escapeHtml(investorName)}</strong>.
      Your organization has been specifically selected based on your investment focus, geographic coverage,
      and program alignment.
    </p>

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      <strong style="color: ${COLORS.dark};">${escapeHtml(projectName)}</strong> in ${escapeHtml(city)}, ${escapeHtml(state)}
      is seeking a qualified investor to participate in a
      <strong style="color: #0284c7;">${fmtCurrency(allocation)}</strong> ${programType || "NMTC"} transaction.
    </p>

    <!-- PRIMARY CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" bgcolor="#0c4a6e" style="background-color: #0c4a6e; border-radius: 10px; box-shadow: 0 4px 14px rgba(12,74,110,0.4);">
                <a href="${claimUrl}" style="color: #ffffff; text-decoration: none; padding: 20px 52px; font-weight: 800; font-size: 18px; display: inline-block; font-family: Arial, sans-serif; letter-spacing: 0.3px;">
                  Claim Your Seat on tCredex &rarr;
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 10px 0 0; color: ${COLORS.gray}; font-size: 13px;">
            No cost. No obligation. Get started in under 2 minutes.
          </p>
        </td>
      </tr>
    </table>

    ${
      claimCode
        ? `
    <!-- Claim Code (alternative to button) -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px;">
      <tr>
        <td align="center" style="padding: 0;">
          <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; font-family: Arial, sans-serif;">
            Or enter your claim code at <strong style="color: #0c4a6e;">tcredex.com/claim</strong>
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border: 1px dashed #7dd3fc; border-radius: 8px;">
            <tr>
              <td align="center" bgcolor="#f0f9ff" style="background-color: #f0f9ff; padding: 12px 28px; border-radius: 8px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #0c4a6e;">
                  ${escapeHtml(claimCode.slice(0, 4))}&nbsp;${escapeHtml(claimCode.slice(4))}
                </span>
              </td>
            </tr>
          </table>
          <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px; font-family: Arial, sans-serif;">
            Code expires in 30 days.
          </p>
        </td>
      </tr>
    </table>
    `
        : ""
    }

    <!-- INLINE DEAL CARD -->
    <div style="margin: 28px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.12); border: 1px solid #e2e8f0;">

      <!-- Deal Card Banner -->
      <div style="background: linear-gradient(90deg, #0c4a6e 0%, #075985 50%, #0284c7 100%); padding: 14px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="color: #ffffff; font-size: 20px; font-weight: 900; font-family: Arial, sans-serif;">tCredex</span>
              <span style="color: #38bdf8; font-size: 10px; vertical-align: super;">&#9679;</span>
            </td>
            <td style="text-align: right;">
              <span style="color: #bae6fd; font-size: 11px; font-weight: 700; font-family: monospace; background: rgba(0,0,0,0.2); padding: 3px 8px; border-radius: 4px;">
                INVESTMENT CARD
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Card Body -->
      <div style="background: #ffffff; padding: 20px;">

        <!-- Project Header -->
        <p style="margin: 0 0 2px; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
          tCredex.com Investment Summary
        </p>
        <p style="margin: 0 0 4px; color: #0f172a; font-size: 18px; font-weight: 900; line-height: 1.2;">
          ${escapeHtml(projectName)}
        </p>
        <p style="margin: 0 0 16px; color: #475569; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          ${escapeHtml(sponsorName)}<br/>
          ${address ? `${escapeHtml(address)} | ` : ""}${escapeHtml(city)}, ${escapeHtml(state)}${censusTract ? ` | Tract: ${escapeHtml(censusTract)}` : ""}
        </p>

        <!-- Financial Overview -->
        <p style="margin: 0 0 8px; color: #0c4a6e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          Financial Overview
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">
          <tr>
            <td width="50%" style="padding: 8px 12px;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Total Project Cost</p>
              <p style="margin: 0; color: #0c4a6e; font-size: 18px; font-weight: 800;">${fmtCurrency(projectCost)}</p>
            </td>
            <td width="50%" style="padding: 8px 12px;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">${programType || "NMTC"} Investment</p>
              <p style="margin: 0; color: #0284c7; font-size: 18px; font-weight: 800;">${fmtCurrency(allocation)}</p>
            </td>
          </tr>
          ${
            financingGap
              ? `
          <tr>
            <td colspan="2" style="padding: 4px 12px 8px;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Financing Gap</p>
              <p style="margin: 0; color: #b45309; font-size: 16px; font-weight: 800;">${fmtCurrency(financingGap)}</p>
            </td>
          </tr>
          `
              : ""
          }
        </table>

        <!-- Vitals -->
        <p style="margin: 16px 0 8px; color: #0c4a6e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          Project Vitals
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Program</p>
              <p style="margin: 0; color: #0f172a; font-size: 13px; font-weight: 800;">${programType || "NMTC"}</p>
            </td>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Shovel Ready</p>
              <p style="margin: 0; color: ${shovelReady ? "#059669" : "#0f172a"}; font-size: 13px; font-weight: 800;">${shovelReady ? "Yes" : "No"}</p>
            </td>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">Completion</p>
              <p style="margin: 0; color: #0f172a; font-size: 13px; font-weight: 800;">${fmtDate(completionDate)}</p>
            </td>
            <td width="25%" style="padding: 4px 0;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase;">CRA Status</p>
              <p style="margin: 0; color: ${isCRAEligible ? "#059669" : "#64748b"}; font-size: 12px; font-weight: 800;">${craLabel}</p>
            </td>
          </tr>
        </table>

        ${
          povertyRate !== undefined ||
          medianIncome !== undefined ||
          unemployment !== undefined
            ? `
        <!-- Demographics -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border-radius: 4px; margin-top: 8px;">
          <tr>
            <td width="33%" style="padding: 6px 8px; text-align: center;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700;">POVERTY</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800;">${fmtPercent(povertyRate)}</p>
            </td>
            <td width="33%" style="padding: 6px 8px; text-align: center;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700;">MED INCOME</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800;">${fmtPercent(medianIncome)}</p>
            </td>
            <td width="33%" style="padding: 6px 8px; text-align: center;">
              <p style="margin: 0 0 2px; color: #94a3b8; font-size: 10px; font-weight: 700;">UNEMP</p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 800;">${fmtPercent(unemployment)}</p>
            </td>
          </tr>
        </table>
        `
            : ""
        }

        ${
          sources?.length || uses?.length
            ? `
        <!-- Sources & Uses -->
        <p style="margin: 16px 0 8px; color: #0c4a6e; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          Sources & Uses
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${
              sources?.length
                ? `
            <td width="50%" style="vertical-align: top; padding-right: 8px;">
              <p style="margin: 0 0 4px; color: #0c4a6e; font-size: 10px; font-weight: 800; text-transform: uppercase;">Sources</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${sourcesRows}
                <tr>
                  <td colspan="2" style="border-top: 1px solid #cbd5e1; padding-top: 3px; text-align: right; font-weight: 800; color: #0c4a6e; font-size: 12px;">
                    Total: ${fmtCurrency(totalSources)}
                  </td>
                </tr>
              </table>
            </td>
            `
                : ""
            }
            ${
              uses?.length
                ? `
            <td width="50%" style="vertical-align: top; padding-left: 8px;">
              <p style="margin: 0 0 4px; color: #0c4a6e; font-size: 10px; font-weight: 800; text-transform: uppercase;">Uses</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${usesRows}
                <tr>
                  <td colspan="2" style="border-top: 1px solid #cbd5e1; padding-top: 3px; text-align: right; font-weight: 800; color: #0c4a6e; font-size: 12px;">
                    Total: ${fmtCurrency(totalUses)}
                  </td>
                </tr>
              </table>
            </td>
            `
                : ""
            }
          </tr>
        </table>
        `
            : ""
        }

        <!-- Community Impact is in the attached Project Profile, not repeated here -->

        <!-- Card Footer -->
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin: 0; color: #64748b; font-size: 11px;">
                  Project Profile attached &middot; Claim your seat to connect with the Sponsor
                </p>
              </td>
              <td style="text-align: right;">
                <a href="${claimUrl}" style="color: #0c4a6e; font-size: 11px; font-weight: 700; text-decoration: none;">tcredex.com</a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    <!-- END DEAL CARD -->

    <p style="margin: 0 0 20px; color: ${COLORS.gray}; font-size: 16px; line-height: 1.6;">
      The complete <strong>Project Profile</strong> is attached to this email for your team's review.
    </p>

    <!-- Value Proposition for Investors -->
    <div style="background-color: ${COLORS.light}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 12px; color: ${COLORS.dark}; font-size: 15px; font-weight: 700;">
        Why tCredex? &mdash; Completely Free for Investors
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; vertical-align: top; width: 28px;">
            <span style="color: #0284c7; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Deal Flow Pipeline</strong> &mdash; Browse vetted tax credit deals matched to your investment criteria and geographic focus.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: #0284c7; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">CRA Credit Tracking</strong> &mdash; Identify CRA-eligible investments with census tract data, poverty rates, and distress indicators.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: #0284c7; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Due Diligence Vault</strong> &mdash; Secure, encrypted document storage with role-based access for all transaction parties.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; vertical-align: top;">
            <span style="color: #0284c7; font-size: 16px;">&#10003;</span>
          </td>
          <td style="padding: 6px 0; color: ${COLORS.gray}; font-size: 14px; line-height: 1.5;">
            <strong style="color: ${COLORS.dark};">Encrypted Closing Room</strong> &mdash; Private communications between Sponsor, CDE, Investor, and counsel through deal close.
          </td>
        </tr>
      </table>
    </div>

    <!-- Sponsor Signature -->
    <div style="margin: 32px 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 4px; color: ${COLORS.dark}; font-size: 16px; line-height: 1.5;">
        Regards,
      </p>
      <p style="margin: 0; color: ${COLORS.dark}; font-size: 18px; font-weight: 700; line-height: 1.4;">
        ${escapeHtml(sponsorContactName)}
      </p>
      <p style="margin: 0 0 16px; color: ${COLORS.gray}; font-size: 15px;">
        ${escapeHtml(sponsorName)}
      </p>

      <div style="padding-top: 14px; border-top: 1px solid #e5e7eb;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle; padding-right: 12px;">
              <a href="https://tcredex.com" style="text-decoration: none;">
                <span style="font-size: 22px; font-weight: 800; color: #6538D4;">t</span><span style="font-size: 22px; font-weight: 800; color: #3C91F5;">Credex</span><span style="font-size: 17px; font-weight: 800; color: #3C91F5;">.com</span>
              </a>
            </td>
            <td style="vertical-align: middle; border-left: 2px solid #e5e7eb; padding-left: 12px;">
              <p style="margin: 0; color: ${COLORS.gray}; font-size: 12px; line-height: 1.4;">
                AI-Powered Tax Credit Marketplace<br/>
                Connecting Sponsors, CDEs &amp; Investors
              </p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  return {
    subject: `Tax Credit Investment Opportunity \u2014 ${projectName} (${fmtCurrency(allocation)} ${programType || "NMTC"})`,
    html: baseTemplate(
      content,
      `${sponsorContactName} at ${sponsorName} is presenting a ${fmtCurrency(allocation)} ${programType || "NMTC"} investment opportunity to ${investorName}`,
    ),
    text: `Dear ${contactName},\n\nI am writing to present a ${programType || "tax credit"} investment opportunity for ${investorName}.\n\n${projectName} in ${city}, ${state} is seeking a qualified investor to participate in a ${fmtCurrency(allocation)} ${programType || "NMTC"} transaction.\n\nInvestment Amount: ${fmtCurrency(allocation)}\nTotal Project Cost: ${fmtCurrency(projectCost)}${financingGap ? `\nFinancing Gap: ${fmtCurrency(financingGap)}` : ""}\nProgram: ${programType || "NMTC"}${censusTract ? `\nCensus Tract: ${censusTract}` : ""}${communityImpact ? `\n\nCommunity Impact: ${communityImpact}` : ""}\n\ntCredex is completely free for Investors:\n- Deal Flow Pipeline\n- CRA Credit Tracking\n- Due Diligence Vault\n- Encrypted Closing Room\n\n${claimCode ? `YOUR CLAIM CODE: ${claimCode}\nEnter this code at tcredex.com/claim to get started.\n` : ""}Claim your seat: ${claimUrl}\n\nThe complete Project Profile is attached for your review.\n\nRegards,\n${sponsorContactName}\n${sponsorName}\n\nvia tCredex.com - AI-Powered Tax Credit Marketplace`,
  };
}

/**
 * Email: Blog Announcement
 * Sent to beta_signups when a new blog post is published
 */
export function blogAnnouncementTemplate(params: {
  title: string;
  summary: string;
  author: string;
  imageUrl: string;
  blogUrl: string;
}) {
  const { title, summary, author, imageUrl, blogUrl } = params;
  const safeTitle = escapeHtml(title);
  const safeSummary = escapeHtml(summary);
  const safeAuthor = escapeHtml(author);

  const heroImage = imageUrl
    ? `<tr>
        <td style="padding: 0;">
          <img src="${escapeHtml(imageUrl)}" alt="${safeTitle}" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 8px;" />
        </td>
      </tr>
      <tr><td style="height: 24px;"></td></tr>`
    : "";

  const content = `
    ${heroImage}

    <tr>
      <td>
        <p style="margin: 0 0 8px; color: ${COLORS.primary}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          New from tCredex
        </p>
        <h1 style="margin: 0 0 16px; color: ${COLORS.dark}; font-size: 24px; font-weight: 700; line-height: 1.3;">
          ${safeTitle}
        </h1>
        <p style="margin: 0 0 8px; color: ${COLORS.gray}; font-size: 13px;">
          By ${safeAuthor}
        </p>
      </td>
    </tr>

    <tr><td style="height: 16px;"></td></tr>

    ${
      safeSummary
        ? `<tr>
      <td>
        <p style="margin: 0 0 24px; color: ${COLORS.dark}; font-size: 16px; line-height: 1.6;">
          ${safeSummary}
        </p>
      </td>
    </tr>`
        : ""
    }

    <tr>
      <td align="center" style="padding: 8px 0 24px;">
        <a href="${escapeHtml(blogUrl)}" class="button" style="background-color: ${COLORS.primary}; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
          Read Now
        </a>
      </td>
    </tr>

    <tr>
      <td>
        <p style="margin: 0; color: ${COLORS.gray}; font-size: 13px; line-height: 1.5;">
          You're receiving this because you signed up for updates from tCredex.
          <a href="https://tcredex.com/unsubscribe" style="color: ${COLORS.primary};">Unsubscribe</a>
        </p>
      </td>
    </tr>
  `;

  return {
    subject: `${title} — New on tCredex`,
    html: baseTemplate(content, `New blog post: ${title}`),
    text: `New from tCredex\n\n${title}\nBy ${author}\n\n${summary}\n\nRead the full post: ${blogUrl}\n\nYou're receiving this because you signed up for updates from tCredex.\nUnsubscribe: https://tcredex.com/unsubscribe`,
  };
}
