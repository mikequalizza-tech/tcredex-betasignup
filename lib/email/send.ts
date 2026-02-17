/**
 * tCredex Email Service
 *
 * Send transactional emails using Resend (or fallback to console in dev)
 *
 * Setup:
 * 1. Create account at resend.com
 * 2. Add RESEND_API_KEY to .env.local
 * 3. Verify your domain
 */

import * as templates from "./templates";

// Email provider configuration
// Note: These are read at runtime in API routes, not at module load time
const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  "tCredex.com | AI-Powered Tax Credit Marketplace <noreply@tcredex.com>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[]; // base64-encoded content
}

/**
 * Send an email via Resend API
 */
async function sendEmail(
  params: SendEmailParams,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { to, subject, html, text, replyTo, attachments } = params;

  // Check if RESEND_API_KEY is configured
  const apiKey = process.env.RESEND_API_KEY;
  const isDev = process.env.NODE_ENV === "development";
  const emailsDisabled = process.env.DISABLE_EMAILS === "true";

  // Emails explicitly disabled - skip entirely
  if (emailsDisabled) {
    console.log("\n📧 [EMAIL DISABLED]");
    console.log("To:", Array.isArray(to) ? to.join(", ") : to);
    console.log("Subject:", subject);
    console.log("(Set DISABLE_EMAILS=false to enable)\n");
    return { success: true, id: "disabled-" + Date.now() };
  }

  // In development without API key, just log the email
  if (isDev && !apiKey) {
    console.log("\n📧 [EMAIL - DEV MODE - NO API KEY]");
    console.log("To:", Array.isArray(to) ? to.join(", ") : to);
    console.log("Subject:", subject);
    console.log("From:", FROM_EMAIL);
    console.log("---");
    console.log(text || "HTML email - check templates");
    console.log("---\n");
    return { success: true, id: "dev-" + Date.now() };
  }

  if (!apiKey) {
    console.error(
      "[Email] RESEND_API_KEY not configured in environment variables",
    );
    return {
      success: false,
      error: "Email service not configured - RESEND_API_KEY missing",
    };
  }

  try {
    console.log(`\n[Email] 📧 Sending email...`);
    console.log(`[Email] To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] From: ${FROM_EMAIL}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        reply_to: replyTo,
        ...(attachments?.length ? { attachments } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Email] ❌ Send failed:", {
        status: response.status,
        statusText: response.statusText,
        error: data,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
      });
      return {
        success: false,
        error: data.message || data.error || "Failed to send email",
      };
    }

    console.log(`[Email] ✅ Sent successfully! ID: ${data.id}`);
    console.log(`[Email] Response:`, JSON.stringify(data, null, 2));
    return { success: true, id: data.id };
  } catch (error) {
    console.error("[Email] ❌ Send exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Email sending functions for each template
 */
export const email = {
  /**
   * Send account confirmation email
   */
  confirmEmail: async (to: string, userName: string, confirmUrl: string) => {
    const { subject, html, text } = templates.confirmEmailTemplate({
      userName,
      confirmUrl,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send team invitation email
   */
  teamInvite: async (
    to: string,
    inviteeName: string,
    inviterName: string,
    organizationName: string,
    roleName: string,
    inviteUrl: string,
  ) => {
    const { subject, html, text } = templates.teamInviteTemplate({
      inviteeName,
      inviterName,
      organizationName,
      roleName,
      inviteUrl,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send team invite with claim code (beta version)
   */
  teamInviteWithCode: async (
    to: string,
    inviteeName: string,
    inviterName: string,
    organizationName: string,
    roleName: string,
    claimCode: string,
    message?: string,
  ) => {
    const { subject, html, text } = templates.teamInviteWithCodeTemplate({
      inviteeName,
      inviterName,
      organizationName,
      roleName,
      claimCode,
      message,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send welcome email after confirmation
   */
  welcome: async (
    to: string,
    userName: string,
    role: "sponsor" | "cde" | "investor",
  ) => {
    const { subject, html, text } = templates.welcomeTemplate({
      userName,
      role,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send deal submitted confirmation
   */
  dealSubmitted: async (
    to: string,
    userName: string,
    projectName: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.dealSubmittedTemplate({
      userName,
      projectName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send CDE match notification
   */
  cdeMatch: async (
    to: string,
    userName: string,
    projectName: string,
    cdeName: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.cdeMatchTemplate({
      userName,
      projectName,
      cdeName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send new message notification
   */
  newMessage: async (
    to: string,
    userName: string,
    senderName: string,
    senderOrg: string,
    projectName: string,
    messagePreview: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.newMessageTemplate({
      userName,
      senderName,
      senderOrg,
      projectName,
      messagePreview,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send document request notification
   */
  documentRequested: async (
    to: string,
    userName: string,
    requesterName: string,
    documentType: string,
    projectName: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.documentRequestedTemplate({
      userName,
      requesterName,
      documentType,
      projectName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send deal approved notification
   */
  dealApproved: async (
    to: string,
    userName: string,
    projectName: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.dealApprovedTemplate({
      userName,
      projectName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send offer expiring warning
   */
  offerExpiring: async (
    to: string,
    userName: string,
    projectName: string,
    cdeName: string,
    hoursLeft: number,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.offerExpiringTemplate({
      userName,
      projectName,
      cdeName,
      hoursLeft,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send password reset email
   */
  passwordReset: async (to: string, userName: string, resetUrl: string) => {
    const { subject, html, text } = templates.passwordResetTemplate({
      userName,
      resetUrl,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send profile added notification (Preqin-style)
   */
  profileAdded: async (
    to: string,
    organizationName: string,
    organizationType: "CDE" | "Investor" | "Sponsor" | "Lender",
    claimUrl: string,
    contactName?: string,
  ) => {
    const { subject, html, text } = templates.profileAddedTemplate({
      contactName,
      organizationName,
      organizationType,
      claimUrl,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send deal inquiry / expression of interest
   */
  dealInquiry: async (
    to: string,
    userName: string,
    projectName: string,
    inquirerName: string,
    inquirerOrg: string,
    inquirerRole: string,
    dealId: string,
    message?: string,
  ) => {
    const { subject, html, text } = templates.dealInquiryTemplate({
      userName,
      projectName,
      inquirerName,
      inquirerOrg,
      inquirerRole,
      message,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send weekly digest
   */
  weeklyDigest: async (
    to: string,
    userName: string,
    stats: { newDeals: number; newMatches: number; unreadMessages: number },
    featuredDeals?: Array<{
      projectName: string;
      city: string;
      state: string;
      programType: string;
      allocation: number;
    }>,
  ) => {
    const { subject, html, text } = templates.weeklyDigestTemplate({
      userName,
      stats,
      featuredDeals,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send allocation announcement to CDEs
   */
  allocationAnnouncement: async (
    to: string,
    cdeName: string,
    allocationAmount: number,
    allocationYear: number,
    contactName?: string,
  ) => {
    const { subject, html, text } = templates.allocationAnnouncementTemplate({
      cdeName,
      contactName,
      allocationAmount,
      allocationYear,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send LOI received notification to sponsor
   */
  loiReceived: async (
    to: string,
    userName: string,
    projectName: string,
    cdeName: string,
    allocationAmount: string,
    dealId: string,
    loiId: string,
  ) => {
    const { subject, html, text } = templates.loiReceivedTemplate({
      userName,
      projectName,
      cdeName,
      allocationAmount,
      dealId,
      loiId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send LOI accepted notification to CDE
   */
  loiAccepted: async (
    to: string,
    userName: string,
    projectName: string,
    sponsorName: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.loiAcceptedTemplate({
      userName,
      projectName,
      sponsorName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send LOI rejected notification to CDE
   */
  loiRejected: async (
    to: string,
    userName: string,
    projectName: string,
    sponsorName: string,
    dealId: string,
  ) => {
    const { subject, html, text } = templates.loiRejectedTemplate({
      userName,
      projectName,
      sponsorName,
      dealId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send LOI countered notification to CDE
   */
  loiCountered: async (
    to: string,
    userName: string,
    projectName: string,
    sponsorName: string,
    dealId: string,
    loiId: string,
  ) => {
    const { subject, html, text } = templates.loiCounteredTemplate({
      userName,
      projectName,
      sponsorName,
      dealId,
      loiId,
    });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send project submission to onboarded CDE (has active users)
   */
  projectSubmissionOnboarded: async (
    to: string,
    contactName: string,
    cdeName: string,
    projectName: string,
    sponsorName: string,
    dealSummary: {
      city: string;
      state: string;
      programType: string;
      allocation: number;
      projectCost: number;
      censusTract?: string;
      communityImpact?: string;
    },
    dealId: string,
  ) => {
    const { subject, html, text } =
      templates.projectSubmissionOnboardedTemplate({
        contactName,
        cdeName,
        projectName,
        sponsorName,
        dealSummary,
        dealId,
      });
    return sendEmail({ to, subject, html, text });
  },

  /**
   * Send Allocation Request email — Sponsor → CDE
   * Flagship outreach with inline Deal Card + Project Profile attachment
   */
  allocationRequest: async (
    to: string,
    contactName: string,
    cdeName: string,
    cdeAllocationAmount: string,
    cdeAllocationYear: number,
    sponsorName: string,
    sponsorContactName: string,
    projectName: string,
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
    },
    claimUrl: string,
    dealId: string,
    claimCode?: string,
    profileHtml?: Buffer,
  ) => {
    const { subject, html, text } = templates.allocationRequestTemplate({
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
      claimCode,
    });
    const sanitizedName = projectName
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_");
    const attachments = profileHtml
      ? [
          {
            filename: `${sanitizedName}_Project_Profile.pdf`,
            content: profileHtml.toString("base64"),
          },
        ]
      : undefined;
    return sendEmail({ to, subject, html, text, attachments });
  },

  /**
   * Send Investment Request email — Sponsor → Investor
   * Flagship outreach with inline Deal Card + Project Profile attachment
   */
  investmentRequest: async (
    to: string,
    contactName: string,
    investorName: string,
    sponsorName: string,
    sponsorContactName: string,
    projectName: string,
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
    },
    claimUrl: string,
    dealId: string,
    claimCode?: string,
    profileHtml?: Buffer,
  ) => {
    const { subject, html, text } = templates.investmentRequestTemplate({
      contactName,
      investorName,
      sponsorName,
      sponsorContactName,
      projectName,
      dealSummary,
      claimUrl,
      dealId,
      claimCode,
    });
    const sanitizedName = projectName
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_");
    const attachments = profileHtml
      ? [
          {
            filename: `${sanitizedName}_Project_Profile.pdf`,
            content: profileHtml.toString("base64"),
          },
        ]
      : undefined;
    return sendEmail({ to, subject, html, text, attachments });
  },

  /**
   * Send project submission to non-onboarded CDE (cold outreach with attachment)
   */
  projectSubmissionColdOutreach: async (
    to: string,
    contactName: string,
    cdeName: string,
    projectName: string,
    sponsorName: string,
    dealSummary: {
      city: string;
      state: string;
      programType: string;
      allocation: number;
      projectCost: number;
      censusTract?: string;
      communityImpact?: string;
    },
    cdeId: string,
    profileHtml?: Buffer,
  ) => {
    const { subject, html, text } =
      templates.projectSubmissionColdOutreachTemplate({
        contactName,
        cdeName,
        projectName,
        sponsorName,
        dealSummary,
        cdeId,
      });
    const sanitizedName = projectName
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "_");
    const attachments = profileHtml
      ? [
          {
            filename: `${sanitizedName}_Project_Profile.pdf`,
            content: profileHtml.toString("base64"),
          },
        ]
      : undefined;
    return sendEmail({ to, subject, html, text, attachments });
  },

  /**
   * Send blog announcement email
   */
  blogAnnouncement: async (
    to: string,
    title: string,
    summary: string,
    author: string,
    imageUrl: string,
    blogUrl: string,
  ) => {
    const { subject, html, text } = templates.blogAnnouncementTemplate({
      title,
      summary,
      author,
      imageUrl,
      blogUrl,
    });
    return sendEmail({ to, subject, html, text });
  },
};

export default email;
