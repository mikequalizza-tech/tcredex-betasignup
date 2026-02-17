import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseBody, isValidationError } from "@/lib/api/validate";
import { contactSchema } from "@/lib/api/schemas";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Escape HTML special characters to prevent injection in email content */
function escapeHtml(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic: string;
  projectType?: string;
  allocation?: string;
  message: string;
  type?: "platform_support" | "aiv_advisory";
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, contactSchema);
    if (isValidationError(parsed)) return parsed;
    const body: ContactFormData = parsed;

    // Determine routing based on type
    const isAIVRequest = body.type === "aiv_advisory";
    const destinationEmail = isAIVRequest
      ? "deals@americanimpactventures.com"
      : "support@tcredex.com";
    const emailSubjectPrefix = isAIVRequest
      ? "[AIV Lead]"
      : "[tCredex Support]";
    const source = isAIVRequest ? "aiv_contact_form" : "tcredex_support_form";

    // Try to save to Supabase if configured
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Table 'contact_leads' not yet in DB schema
        const { error: dbError } = await (supabase as any)
          .from("contact_leads")
          .insert({
            name: body.name,
            email: body.email,
            phone: body.phone || null,
            company: body.company || null,
            topic: body.topic,
            project_type: body.projectType || null,
            allocation: body.allocation || null,
            message: body.message,
            source: source,
            lead_type: isAIVRequest ? "advisory" : "support",
            created_at: new Date().toISOString(),
          });

        if (dbError) {
          console.error("Supabase insert error:", dbError);
          // Don't fail if DB insert fails - we'll still try email
        }
      } catch (dbErr) {
        console.error("Database error:", dbErr);
        // Continue - email fallback
      }
    }

    // Try to send email notification via Resend if configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const emailHtml = isAIVRequest
          ? `
            <h2>New Tax Credit Advisory Request</h2>
            <p><strong>From:</strong> ${escapeHtml(body.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(body.phone) || "Not provided"}</p>
            <p><strong>Company:</strong> ${escapeHtml(body.company) || "Not provided"}</p>
            <hr>
            <p><strong>Topic:</strong> ${escapeHtml(body.topic)}</p>
            <p><strong>Project Type:</strong> ${escapeHtml(body.projectType) || "Not specified"}</p>
            <p><strong>Allocation:</strong> ${escapeHtml(body.allocation) || "Not specified"}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(body.message).replace(/\n/g, "<br>")}</p>
            <hr>
            <p><small>Submitted via tCredex - AIV Consultation Form</small></p>
          `
          : `
            <h2>New Platform Support Request</h2>
            <p><strong>From:</strong> ${escapeHtml(body.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
            <hr>
            <p><strong>Topic:</strong> ${escapeHtml(body.topic)}</p>
            <hr>
            <p><strong>Issue Description:</strong></p>
            <p>${escapeHtml(body.message).replace(/\n/g, "<br>")}</p>
            <hr>
            <p><small>Submitted via tCredex Support Form</small></p>
          `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "tCredex <noreply@tcredex.com>",
            to: [destinationEmail],
            subject: `${emailSubjectPrefix} ${body.topic} - ${body.name}`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Email send failed:", await emailResponse.text());
        }
      } catch (emailErr) {
        console.error("Email error:", emailErr);
        // Don't fail the request if email fails
      }
    }

    // Log the lead regardless (for debugging / backup)
    console.log("=== NEW CONTACT LEAD ===");
    console.log("Type:", isAIVRequest ? "AIV Advisory" : "Platform Support");
    console.log("Destination:", destinationEmail);
    console.log("Name:", body.name);
    console.log("Email:", body.email);
    console.log("Phone:", body.phone);
    console.log("Company:", body.company);
    console.log("Topic:", body.topic);
    console.log("Project Type:", body.projectType);
    console.log("Allocation:", body.allocation);
    console.log("Message:", body.message);
    console.log("========================");

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 },
    );
  }
}
