/**
 * tCredex Ledger Anchor API
 * Called by scheduled cron job to anchor ledger state externally
 */

import { NextRequest, NextResponse } from "next/server";
import { runScheduledAnchoring, getLedgerService } from "@/lib/ledger";

// POST /api/ledger/anchor - Run anchoring job
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (for Vercel Cron or similar)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Build config from environment or request body
    const config: Parameters<typeof runScheduledAnchoring>[0] = {};

    // GitHub Gist anchoring
    const githubToken = process.env.LEDGER_GITHUB_TOKEN || body.github_token;
    const gistId = process.env.LEDGER_GITHUB_GIST_ID || body.gist_id;
    if (githubToken) {
      config.github = { token: githubToken, gistId };
    }

    // Escrow email anchoring
    const escrowEmail = process.env.LEDGER_ESCROW_EMAIL || body.escrow_email;
    if (escrowEmail && process.env.SMTP_HOST) {
      config.email = {
        escrowEmail,
        smtp: {
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT || "587"),
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
          from: process.env.SMTP_FROM || "ledger@tcredex.com",
        },
      };
    }

    // Blockchain anchoring
    if (body.blockchain || process.env.LEDGER_BLOCKCHAIN_ENABLED === "true") {
      config.blockchain = { provider: "opentimestamps" };
    }

    if (Object.keys(config).length === 0) {
      return NextResponse.json(
        {
          error: "No anchoring methods configured",
          hint: "Set LEDGER_GITHUB_TOKEN or other env vars",
        },
        { status: 400 },
      );
    }

    const results = await runScheduledAnchoring(config);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[API] Ledger anchor error:", error);
    return NextResponse.json(
      {
        error: "Anchoring failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// GET /api/ledger/anchor - Get recent anchors
export async function GET() {
  try {
    const service = getLedgerService();
    const anchors = await service.getAnchors(20);
    const latest = await service.getLatestHash();

    return NextResponse.json({
      success: true,
      latest_event: latest,
      recent_anchors: anchors,
    });
  } catch (error) {
    console.error("[API] Ledger anchor GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to get anchors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
