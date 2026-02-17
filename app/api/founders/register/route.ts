/**
 * Founder Member Registration API
 *
 * Creates founder member account with:
 * - Unique referral code (FM-XXXXX)
 * - Tracks referral attribution
 * - Sends to ledger for audit trail
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Table 'founder_members' not yet in DB schema
const supabase = getSupabaseAdmin() as any;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      company,
      role,
      referral_code,
      utm_source,
      tracking_cookie,
    } = body;

    // Validate required fields
    if (!email || !name || !company || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if email already registered
    const { data: existing } = await supabase
      .from("founder_members")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // Generate unique founder code
    const founderCode = generateFounderCode();

    // Parse tracking cookie if present
    let trackingData = null;
    if (tracking_cookie) {
      try {
        trackingData = JSON.parse(tracking_cookie);
      } catch {}
    }

    // Create founder member record
    const { data: founder, error: insertError } = await supabase
      .from("founder_members")
      .insert({
        email: email.toLowerCase(),
        name,
        company,
        role,
        founder_code: founderCode,
        referred_by: referral_code || null,
        utm_source: utm_source || trackingData?.code || null,
        status: "pending",
        deals_at_founder_rate: 1, // Start with 1 deal at 1%
        referral_count: 0,
        created_at: new Date().toISOString(),
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("[Founders] Insert error:", insertError);
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 },
      );
    }

    // If referred, increment referrer's count
    if (referral_code) {
      // Get the referrer
      const { data: referrerData } = await supabase
        .from("founder_members")
        .select("id, referral_count, deals_at_founder_rate")
        .eq("founder_code", referral_code.toUpperCase())
        .single();

      type ReferrerRow = {
        id: string;
        referral_count: number | null;
        deals_at_founder_rate: number | null;
      };
      const referrer = referrerData as ReferrerRow | null;

      if (referrer) {
        const newCount = (referrer.referral_count || 0) + 1;
        // Every 2 referrals = 1 more deal at founder rate
        const newDeals = Math.floor(newCount / 2) + 1; // +1 for their own first deal

        await supabase
          .from("founder_members")
          .update({
            referral_count: newCount,
            deals_at_founder_rate: newDeals,
          } as never)
          .eq("id", referrer.id);
      }
    }

    // Log to audit ledger
    try {
      await supabase.from("ledger_events").insert({
        event_timestamp: new Date().toISOString(),
        actor_type: "human",
        actor_id: email.toLowerCase(),
        entity_type: "application",
        entity_id: (founder as { id: string }).id,
        action: "application_created",
        payload_json: {
          type: "founder_registration",
          email: email.toLowerCase(),
          name,
          company,
          role,
          founder_code: founderCode,
          referred_by: referral_code || null,
          utm_source: utm_source || null,
        },
        prev_hash: null,
        hash: "pending", // Will be computed by background job
      } as never);
    } catch (ledgerError) {
      // Don't block registration on ledger failure
      console.error("[Founders] Ledger error:", ledgerError);
    }

    // TODO: Send welcome email
    // await sendFounderWelcomeEmail(email, name, founderCode);

    return NextResponse.json({
      success: true,
      founder_code: founderCode,
      message: "Welcome to tCredex as a Founder Member!",
    });
  } catch (error) {
    console.error("[Founders] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Generate unique founder code (FM-XXXXX format)
function generateFounderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding confusing chars
  let code = "FM-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
