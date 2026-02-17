/**
 * tCredex Post-Submission Processing
 *
 * Orchestrates the workflow after a deal is submitted:
 * 1. Find CDE matches using backend AutoMatch API
 * 2. Send notifications to matched CDEs
 * 3. Log all events to ledger
 */

import { getSupabaseAdmin } from "@/lib/supabase";

interface MatchResult {
  dealId: string;
  projectName: string;
  matches: Array<{
    cdeId: string;
    cdeName: string;
    totalScore: number;
    matchStrength: "excellent" | "good" | "fair" | "weak";
    reasons: string[];
  }>;
  timestamp: string;
}

// Call AutoMatch API using absolute URL (required for server-side fetch)
async function findMatches(
  dealId: string,
  options: { minScore?: number; maxResults?: number; notifyMatches?: boolean },
): Promise<MatchResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/automatch/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dealId, ...options }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "AutoMatch API failed");
  }

  return response.json();
}

const supabase = getSupabaseAdmin();

// =============================================================================
// TYPES
// =============================================================================

export interface PostSubmissionResult {
  dealId: string;
  matching: {
    success: boolean;
    matchCount?: number;
    topMatch?: {
      cdeName: string;
      score: number;
      strength: string;
    };
    error?: string;
  };
  notifications: {
    sent: number;
    failed: number;
  };
}

// =============================================================================
// MAIN ORCHESTRATION FUNCTION
// =============================================================================

export async function processPostSubmission(
  dealId: string,
): Promise<PostSubmissionResult> {
  const result: PostSubmissionResult = {
    dealId,
    matching: { success: false },
    notifications: { sent: 0, failed: 0 },
  };

  try {
    // 1. Fetch the deal to verify it exists
    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("id, project_name, program_type, state")
      .eq("id", dealId)
      .single();

    if (fetchError || !deal) {
      throw new Error("Deal not found");
    }

    // 2. Run AutoMatch to find CDE matches
    try {
      const matchResult = await findMatches(dealId, {
        minScore: 40,
        maxResults: 5,
        notifyMatches: true,
      });

      result.matching = {
        success: true,
        matchCount: matchResult.matches.length,
        topMatch: matchResult.matches[0]
          ? {
              cdeName: matchResult.matches[0].cdeName,
              score: matchResult.matches[0].totalScore,
              strength: matchResult.matches[0].matchStrength,
            }
          : undefined,
      };

      // Count notifications (already sent by findMatches if notifyMatches=true)
      result.notifications.sent = matchResult.matches.filter(
        (m) => m.matchStrength === "excellent" || m.matchStrength === "good",
      ).length;

      // Log to ledger
      await supabase.from("ledger_events").insert({
        actor_type: "system",
        actor_id: "automatch_engine",
        entity_type: "deal",
        entity_id: dealId,
        action: "matches_found",
        payload_json: {
          match_count: matchResult.matches.length,
          top_matches: matchResult.matches.slice(0, 3).map((m) => ({
            cde: m.cdeName,
            score: m.totalScore,
            strength: m.matchStrength,
          })),
        },
        hash: Date.now().toString(16),
      } as never);
    } catch (matchError) {
      console.error("AutoMatch failed:", matchError);
      result.matching.error =
        matchError instanceof Error ? matchError.message : "Matching failed";
    }
  } catch (error) {
    console.error("Post-submission processing failed:", error);
  }

  return result;
}

// =============================================================================
// HELPER: Run processing for multiple deals (batch)
// =============================================================================

export async function processPostSubmissionBatch(
  dealIds: string[],
): Promise<PostSubmissionResult[]> {
  const results: PostSubmissionResult[] = [];

  for (const dealId of dealIds) {
    const result = await processPostSubmission(dealId);
    results.push(result);
  }

  return results;
}
