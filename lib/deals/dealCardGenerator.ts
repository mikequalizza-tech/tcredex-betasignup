/**
 * DealCard Generator
 * Transforms IntakeData into Deal format for DealCard display
 */

import { IntakeData } from "@/types/intake";
import { Deal, ProgramType } from "@/lib/data/deals";

// =============================================================================
// TRANSFORMER
// =============================================================================

export interface DealCardGeneratorResult {
  deal: Deal;
  completeness: {
    tier: 1 | 2 | 3;
    percentage: number;
    missingFields: string[];
  };
  warnings: string[];
}

/**
 * Generate a Deal object from IntakeData
 */
export function generateDealFromIntake(
  intake: IntakeData,
  dealId?: string,
): DealCardGeneratorResult {
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Check required Tier 1 fields
  if (!intake.projectName) missingFields.push("Project Name");
  if (!intake.sponsorName) missingFields.push("Sponsor Name");
  if (!intake.address) missingFields.push("Address");
  if (!intake.censusTract) missingFields.push("Census Tract");
  if (!intake.programs?.length) missingFields.push("Programs");
  if (!intake.totalProjectCost) missingFields.push("Total Project Cost");
  if (!intake.financingGap) missingFields.push("Financing Gap");

  // Calculate completeness
  const tier1Fields = [
    "projectName",
    "sponsorName",
    "address",
    "censusTract",
    "programs",
    "totalProjectCost",
    "financingGap",
  ];
  const tier2Fields = [
    ...tier1Fields,
    "projectDescription",
    "communityImpact",
    "permanentJobsFTE",
    "constructionJobsFTE",
  ];
  const tier3Fields = [
    ...tier2Fields,
    "phaseIEnvironmental",
    "zoningApproval",
    "buildingPermits",
  ];

  const countFilled = (fields: string[]) =>
    fields.filter((f) => {
      const val = intake[f as keyof IntakeData];
      if (val === undefined || val === null || val === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    }).length;

  const tier1Filled = countFilled(tier1Fields);
  const tier2Filled = countFilled(tier2Fields);
  const tier3Filled = countFilled(tier3Fields);

  const tier1Pct = (tier1Filled / tier1Fields.length) * 100;
  const tier2Pct = (tier2Filled / tier2Fields.length) * 100;
  const tier3Pct = (tier3Filled / tier3Fields.length) * 100;

  const tier = tier3Pct >= 95 ? 3 : tier2Pct >= 70 ? 2 : tier1Pct >= 80 ? 1 : 1;
  const percentage = Math.round(
    tier1Pct * 0.4 + tier2Pct * 0.35 + tier3Pct * 0.25,
  );

  // Build location string
  const locationParts: string[] = [];
  if (intake.city) locationParts.push(intake.city);
  if (intake.state) locationParts.push(intake.state);
  const _location =
    locationParts.length > 0 ? locationParts.join(", ") : "Location TBD";

  // Calculate requested amounts by program
  let _fedNmtcReq: number | undefined;
  let _stateNmtcReq: number | undefined;
  let _htcAmount: number | undefined;
  let _lihtcAmount: number | undefined;

  if (intake.programs?.includes("NMTC")) {
    _fedNmtcReq = intake.requestedAllocation || intake.financingGap;
  }
  if (intake.programs?.includes("HTC")) {
    // HTC is typically 20% of QRE
    _htcAmount = intake.htcQRE ? intake.htcQRE * 0.2 : undefined;
  }
  if (intake.programs?.includes("LIHTC")) {
    _lihtcAmount = intake.lihtcRequestedAmount;
  }

  // Determine shovel ready status
  const shovelReady = Boolean(
    intake.phaseIEnvironmental === "Complete" &&
    intake.zoningApproval === "Complete" &&
    intake.buildingPermits === "Complete" &&
    intake.constructionDrawings &&
    parseInt(String(intake.constructionDrawings)) >= 90,
  );

  if (intake.programs?.includes("NMTC") && !intake.tractEligible) {
    warnings.push("Census tract may not be NMTC eligible");
  }

  if (intake.financingGap && intake.totalProjectCost) {
    const gapPct = (intake.financingGap / intake.totalProjectCost) * 100;
    if (gapPct < 15) {
      // Program-aware warning messaging
      const isNMTC = intake.programs?.includes("NMTC");
      const isLIHTC = intake.programs?.includes("LIHTC");
      const isHTC = intake.programs?.includes("HTC");

      if (isNMTC) {
        warnings.push("Financing gap below 15% may reduce CDE interest");
      } else if (isLIHTC) {
        warnings.push(
          "Financing gap below 15% may reduce syndicator/investor interest",
        );
      } else if (isHTC) {
        warnings.push("Financing gap below 15% may reduce investor interest");
      } else {
        warnings.push("Financing gap below 15% may reduce investor interest");
      }
    }
    if (gapPct > 50) {
      warnings.push(
        "Large financing gap (>50%) - ensure sources are identified",
      );
    }
  }

  // Build the Deal object (matching lib/data/deals.ts Deal interface)
  const deal: Deal = {
    id: dealId || `DEAL-${Date.now()}`,
    projectName: intake.projectName || "Untitled Project",
    sponsorName: intake.sponsorName || "",
    // Sponsor description comes from organization profile data, not project narrative.
    sponsorDescription: "",
    programType:
      ((intake.programs && intake.programs[0]) as ProgramType) || "NMTC",
    programLevel: "federal",
    allocation: intake.requestedAllocation || intake.financingGap || 0,
    creditPrice: 0.76,
    state: intake.state || "",
    city: intake.city || "",
    tractType: [],
    status: "available",
    description: intake.projectDescription,
    communityImpact: intake.communityImpact,
    submittedDate: new Date().toISOString(),
    povertyRate: intake.tractPovertyRate,
    medianIncome: intake.tractMedianIncome,
    visible: true,
    coordinates:
      intake.latitude && intake.longitude
        ? [intake.longitude, intake.latitude]
        : undefined,
    projectCost: intake.totalProjectCost || 0,
    financingGap: intake.financingGap || 0,
    censusTract: intake.censusTract,
    unemployment: intake.tractUnemployment,
    shovelReady,
    completionDate: intake.constructionEndDate,
    heroImageUrl: intake.projectImages?.[0]?.url,
    projectImages: intake.projectImages,
  };

  return {
    deal,
    completeness: {
      tier,
      percentage,
      missingFields,
    },
    warnings,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate intake data meets minimum requirements for DealCard
 */
export function validateForDealCard(intake: IntakeData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!intake.projectName?.trim()) {
    errors.push("Project name is required");
  }
  if (!intake.sponsorName?.trim()) {
    errors.push("Sponsor name is required");
  }
  if (!intake.programs?.length) {
    errors.push("At least one program must be selected");
  }
  if (!intake.totalProjectCost || intake.totalProjectCost <= 0) {
    errors.push("Total project cost must be greater than zero");
  }
  if (!intake.financingGap || intake.financingGap <= 0) {
    errors.push("Financing gap must be greater than zero");
  }

  // Recommended fields
  if (!intake.address) {
    warnings.push("Address recommended for better CDE matching");
  }
  if (!intake.censusTract) {
    warnings.push("Census tract recommended for eligibility verification");
  }
  if (!intake.projectDescription) {
    warnings.push("Project description helps CDEs understand your project");
  }
  if (!intake.communityImpact) {
    warnings.push("Community impact statement is important for CDE evaluation");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// EXPORT FORMATS
// =============================================================================

/**
 * Generate a shareable summary for the deal
 */
export function generateDealSummary(deal: Deal): string {
  const location =
    [deal.city, deal.state].filter(Boolean).join(", ") || "Unknown Location";
  const lines: string[] = [
    `📋 ${deal.projectName}`,
    `📍 ${location}`,
    `💰 Project Cost: $${((deal.projectCost || 0) / 1000000).toFixed(1)}M`,
    `📊 Financing Gap: $${((deal.financingGap || 0) / 1000000).toFixed(2)}M`,
  ];

  if (deal.censusTract) {
    lines.push(`🗺️ Census Tract: ${deal.censusTract}`);
  }

  if (deal.shovelReady) {
    lines.push(`✅ Shovel Ready`);
  }

  lines.push("");
  lines.push(`🔗 View on tCredex: https://tcredex.com/deals/${deal.id}`);

  return lines.join("\n");
}

/**
 * Generate JSON export for API integration
 */
export function generateDealJSON(deal: Deal): string {
  return JSON.stringify(deal, null, 2);
}
