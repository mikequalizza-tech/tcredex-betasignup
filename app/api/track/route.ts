/**
 * tCredex QR/Referral Tracking API
 * Tracks scans from QR codes and referral links
 *
 * Usage:
 * - QR Code: tcredex.com/r/[campaign-code]
 * - Referral: tcredex.com/r/[referral-code]?ref=1
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Table 'tracking_events' not yet in DB schema
const supabase = getSupabaseAdmin() as any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const isReferral = searchParams.get("ref") === "1";

  if (!code) {
    return NextResponse.json(
      { error: "Missing code parameter" },
      { status: 400 },
    );
  }

  // Extract tracking info from request
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const referer = request.headers.get("referer") || "";

  // Determine device type
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const deviceType = isMobile ? "mobile" : "desktop";

  try {
    // Log the scan/click to database
    const { error: insertError } = await supabase
      .from("tracking_events")
      .insert({
        code,
        event_type: isReferral ? "referral_click" : "qr_scan",
        ip_hash: hashIP(ip), // Hash for privacy
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        referer,
        created_at: new Date().toISOString(),
      } as never);

    if (insertError) {
      console.error("[Track] Insert error:", insertError);
    }

    // If referral, increment referral count for the referrer
    if (isReferral) {
      await supabase.rpc(
        "increment_referral_clicks" as never,
        { referral_code: code } as never,
      );
    }

    // Return tracking pixel (1x1 transparent GIF) for embed tracking
    // Or redirect info for the redirect endpoint
    return NextResponse.json({
      success: true,
      code,
      tracked: true,
    });
  } catch (error) {
    console.error("[Track] Error:", error);
    return NextResponse.json({ error: "Tracking failed" }, { status: 500 });
  }
}

// Simple hash for IP privacy (not reversible)
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
