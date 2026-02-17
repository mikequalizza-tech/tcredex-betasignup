/**
 * tCredex Intake API
 * Submit and manage intake forms with tier progression
 */

import { NextRequest, NextResponse, after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processPostSubmission } from "@/lib/intake/postSubmission";
import { getCategoriesForPrograms } from "@/lib/types/dd-vault";

const supabase = getSupabaseAdmin();

// =============================================================================
// Helper: Resolve sponsor_id from organization_id (create sponsor row if missing)
// =============================================================================
async function resolveSponsorId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  fallbackName?: string,
  fallbackEmail?: string,
): Promise<string> {
  // First try to find existing sponsor by organization_id
  const { data: sponsorRow } = await supabase
    .from("sponsors")
    .select("id")
    .eq("organization_id", organizationId)
    .single();

  const typedSponsorRow = sponsorRow as { id?: string } | null;
  if (typedSponsorRow?.id) {
    return typedSponsorRow.id;
  }

  // Create new sponsor if not found
  const { data: newSponsor, error: sponsorInsertError } = await supabase
    .from("sponsors")
    .insert({
      organization_id: organizationId,
      organization_name: fallbackName || "Sponsor",
      primary_contact_name: fallbackName || "Sponsor",
      primary_contact_email: fallbackEmail,
    } as never)
    .select("id")
    .single();

  const typedNewSponsor = newSponsor as { id?: string } | null;
  if (sponsorInsertError || !typedNewSponsor?.id) {
    console.error("[Intake] Sponsor creation error:", sponsorInsertError);
    throw new Error(
      "Unable to resolve sponsor record. Please ensure your organization is properly set up.",
    );
  }

  return typedNewSponsor.id;
}

// =============================================================================
// POST /api/intake - Submit intake form (creates or updates deal)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, intakeData, saveOnly } = body;

    // Validate required sponsor ID (this is actually organization_id from frontend)
    if (!intakeData.sponsorId) {
      console.error("POST /api/intake error: sponsorId is required");
      return NextResponse.json(
        {
          success: false,
          error:
            "Sponsor ID is required. Please ensure you are logged in with a valid sponsor account.",
        },
        { status: 400 },
      );
    }

    // Resolve sponsor_id from organization_id (create sponsor record if needed)
    const organizationId = intakeData.sponsorId as string;
    const sponsorId = await resolveSponsorId(
      supabase,
      organizationId,
      intakeData.sponsorName,
      intakeData.personCompletingForm,
    );

    // Calculate readiness score
    const { score, tier, missingFields } = calculateReadiness(intakeData);

    // Prepare deal record
    const dealRecord = {
      project_name: intakeData.projectName,
      sponsor_id: sponsorId, // Direct link to sponsors.id
      sponsor_organization_id: organizationId, // Link to org for ownership detection on Deal Page
      sponsor_name: intakeData.sponsorName,
      programs: intakeData.programs || ["NMTC"],
      address: intakeData.address,
      city: intakeData.city,
      state: intakeData.state,
      zip_code: intakeData.zipCode,
      census_tract: intakeData.censusTract,
      latitude: intakeData.latitude,
      longitude: intakeData.longitude,
      tract_eligible: intakeData.tractEligible,
      tract_severely_distressed: intakeData.tractSeverelyDistressed,
      project_type: intakeData.projectType,
      venture_type: intakeData.ventureType,
      project_description: intakeData.projectDescription,
      total_project_cost: intakeData.totalProjectCost,
      nmtc_financing_requested: intakeData.nmtcFinancingRequested,
      financing_gap: intakeData.financingGap,
      jobs_created: intakeData.jobsCreated || intakeData.permanentJobsFTE,
      jobs_retained: intakeData.jobsRetained,
      permanent_jobs_fte: intakeData.permanentJobsFTE,
      construction_jobs_fte: intakeData.constructionJobsFTE,
      commercial_sqft: intakeData.commercialSqft,
      housing_units: intakeData.housingUnits,
      affordable_housing_units: intakeData.affordableHousingUnits,
      community_benefit:
        intakeData.communityBenefit || intakeData.communityImpact,
      site_control: intakeData.siteControl,
      phase_i_environmental: intakeData.phaseIEnvironmental,
      zoning_approval: intakeData.zoningApproval,
      construction_start_date: intakeData.constructionStartDate,
      projected_closing_date: intakeData.projectedClosingDate,
      intake_data: intakeData,
      qalicb_data: extractQALICBData(intakeData),
      htc_data: extractHTCData(intakeData),
      readiness_score: score,
      tier,
      status: saveOnly ? "draft" : tier >= 1 ? "submitted" : "draft",
      visible: !saveOnly && tier >= 1,
      exclusivity_agreed: intakeData.exclusivityAgreed,
      exclusivity_agreed_at: intakeData.exclusivityAgreedAt,
      submitted_at: saveOnly ? null : new Date().toISOString(),
    };

    let data;
    let error;

    if (dealId) {
      // Update existing deal
      ({ data, error } = await supabase
        .from("deals")
        .update(dealRecord as never)
        .eq("id", dealId)
        .select()
        .single());
    } else {
      // Create new deal
      ({ data, error } = await supabase
        .from("deals")
        .insert(dealRecord as never)
        .select()
        .single());
    }

    if (error) {
      console.error("[Intake] Deal save failed:", {
        operation: dealId ? "UPDATE" : "INSERT",
        dealId,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to save deal",
          code: error.code,
          details: error.details,
        },
        { status: 400 },
      );
    }

    // Log to ledger (optional - skip if table doesn't exist)
    try {
      await supabase.from("ledger_events").insert({
        actor_type: "human",
        actor_id: intakeData.personCompletingForm || "unknown",
        entity_type: "application",
        entity_id: (data as unknown as { id: string }).id,
        action: dealId ? "application_updated" : "application_created",
        payload_json: {
          readiness_score: score,
          tier,
          status: (data as unknown as { status: string }).status,
          save_only: saveOnly,
        },
        hash: generateHash(data as unknown as Record<string, unknown>),
      } as never);
    } catch (ledgerError) {
      console.log(
        "[Intake] Ledger logging skipped:",
        ledgerError instanceof Error ? ledgerError.message : "Unknown error",
      );
    }

    // ==========================================================================
    // POST-SUBMISSION PROCESSING (ASYNC — runs after response is sent)
    // AutoMatch + DD Vault init run via after() so intake response is instant.
    // Client polls /api/automatch?dealId=X for match results.
    // ==========================================================================
    type DealData = { id: string; status: string };
    const typedData = data as unknown as DealData | null;

    if (!saveOnly && typedData?.status === "submitted") {
      const submittedDealId = typedData.id;
      const programs = intakeData.programs || ["NMTC"];

      after(async () => {
        // DD Vault initialization
        try {
          const { data: existingVault } = await supabase
            .from("dd_documents")
            .select("id")
            .eq("deal_id", submittedDealId)
            .limit(1);

          if (!existingVault || existingVault.length === 0) {
            const applicableCategories = getCategoriesForPrograms(programs);
            const ddDocuments = applicableCategories.map((cat) => ({
              deal_id: submittedDealId,
              category: cat.category,
              status: "not_started",
              required: cat.defaultRequired,
              required_by: "all",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

            await supabase.from("dd_documents").insert(ddDocuments as never);
            console.log(
              "[Intake] DD Vault initialized with",
              ddDocuments.length,
              "categories",
            );
          }
        } catch (ddError) {
          console.error("[Intake] DD Vault initialization error:", ddError);
        }

        // AutoMatch scoring
        try {
          const postProcessing = await processPostSubmission(submittedDealId);
          console.log("[Intake] Post-submission processing complete:", {
            dealId: submittedDealId,
            matching: postProcessing.matching.success
              ? postProcessing.matching.matchCount + " matches"
              : "Failed",
          });
        } catch (postError) {
          console.error(
            "[Intake] Post-submission processing error:",
            postError,
          );
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        dealId: typedData?.id,
        deal: data,
        readiness: { score, tier, missingFields },
      },
      { status: dealId ? 200 : 201 },
    );
  } catch (error) {
    console.error("POST /api/intake error:", error);

    // Handle specific database errors with user-friendly messages
    const pgError = error as {
      code?: string;
      message?: string;
      details?: string;
    };

    // Duplicate key (unique constraint violation)
    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          error:
            "A deal with this project name already exists for your organization. Please use a different project name or edit the existing deal.",
          code: "DUPLICATE_DEAL",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to submit intake",
      },
      { status: 500 },
    );
  }
}

// =============================================================================
// Readiness Calculation
// =============================================================================
function calculateReadiness(data: Record<string, unknown>): {
  score: number;
  tier: 1 | 2 | 3;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  let score = 0;

  // Tier 1 fields (DealCard Ready) - 40 points
  const tier1Fields = [
    { key: "projectName", points: 5 },
    { key: "sponsorName", points: 5 },
    { key: "address", points: 5 },
    { key: "city", points: 3 },
    { key: "state", points: 2 },
    { key: "censusTract", points: 5 },
    { key: "programs", points: 5 },
    { key: "totalProjectCost", points: 5 },
    { key: "financingGap", points: 5 },
  ];

  tier1Fields.forEach(({ key, points }) => {
    if (data[key] && data[key] !== "" && data[key] !== 0) {
      score += points;
    } else {
      missingFields.push(key);
    }
  });

  // Tier 2 fields (Profile Ready) - 30 points
  const tier2Fields = [
    { key: "projectDescription", points: 5 },
    { key: "communityImpact", points: 5 },
    { key: "permanentJobsFTE", points: 5 },
    { key: "siteControl", points: 5 },
    { key: "constructionStartDate", points: 5 },
    { key: "isProhibitedBusiness", points: 5 },
  ];

  tier2Fields.forEach(({ key, points }) => {
    if (data[key] !== undefined && data[key] !== "" && data[key] !== null) {
      score += points;
    } else {
      missingFields.push(key);
    }
  });

  // Tier 3 fields (Due Diligence Ready) - 30 points
  const tier3Fields = [
    { key: "phaseIEnvironmental", points: 6 },
    { key: "zoningApproval", points: 6 },
    { key: "buildingPermits", points: 6 },
    { key: "constructionDrawings", points: 6 },
    { key: "constructionContract", points: 6 },
  ];

  tier3Fields.forEach(({ key, points }) => {
    if (data[key] && data[key] !== "Not Started") {
      score += points;
    } else {
      missingFields.push(key);
    }
  });

  // Determine tier
  let tier: 1 | 2 | 3 = 1;
  if (score >= 70) tier = 2;
  if (score >= 90) tier = 3;

  return { score, tier, missingFields };
}

function extractQALICBData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const qalicbKeys = [
    "hasEmployees",
    "servicesOtherLocations",
    "tangiblePropertyOtherLocations",
    "grossIncomeOtherLocations",
    "holdsCollectibles",
    "holdsNQFP",
    "intends7YrOperation",
    "isProhibitedBusiness",
    "activePrimarilyRental",
    "derivesRentalIncome",
    "leverageStructure",
    "qalicbGrossIncome",
    "qalicbTangibleProperty",
    "qalicbEmployeeServices",
  ];

  const result: Record<string, unknown> = {};
  qalicbKeys.forEach((key) => {
    if (data[key] !== undefined) result[key] = data[key];
  });
  return result;
}

function extractHTCData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const htcKeys = [
    "htcTypes",
    "historicStatus",
    "part1Status",
    "part2Status",
    "qreAmount",
    "hasStateHTC",
    "stateHTCState",
    "stateHTCRate",
  ];

  const result: Record<string, unknown> = {};
  htcKeys.forEach((key) => {
    if (data[key] !== undefined) result[key] = data[key];
  });
  return result;
}

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
