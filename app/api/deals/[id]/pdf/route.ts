/**
 * Server-side PDF generation using Puppeteer (headless Chrome)
 *
 * GET /api/deals/[id]/pdf?type=profile|card
 *
 * Renders the ProjectProfileHTML or DealCardHTML as a real browser page,
 * then prints to PDF. This produces pixel-perfect output because it uses
 * a real Chrome rendering engine (same as what the user sees on screen).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { buildProfileData, buildProfileHTML } from "@/lib/email/profile-html";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: dealId } = await context.params;

  if (!dealId) {
    return NextResponse.json({ error: "Deal ID is required" }, { status: 400 });
  }

  try {
    // 1. Fetch deal data server-side
    const supabase = getSupabaseAdmin();
    const { data: deal, error } = await supabase
      .from("deals")
      .select("*, sponsors(*)")
      .eq("id", dealId)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // 2. Build profile data (shared with outreach email attachment)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deal from select('*, sponsors(*)') has 30+ fields accessed by buildProfileData
    const d = deal as any;
    const intake = d.intake_data || d.draft_data || {};
    const profileData = buildProfileData(d, intake);

    // 3. Generate standalone HTML page with all inline styles
    const html = buildProfileHTML(profileData);

    // 4. Use Puppeteer to render HTML → PDF
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

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

    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    // 5. Return PDF
    const filename = `${(d.project_name || "project").replace(/[^a-zA-Z0-9]/g, "_")}_profile.pdf`;
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[PDF] Generation error:", err);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(err) },
      { status: 500 },
    );
  }
}
