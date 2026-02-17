/**
 * tCredex Intake Form v4 - Barrel Exports
 * Single import point for all intake components
 */

// Main shell component
export { IntakeShell } from "./IntakeShell";

// Layout components
export { ProgressRail } from "./ProgressRail";
export { SectionRenderer } from "./SectionRenderer";
export { ReadinessMeter } from "./ReadinessMeter";

// Section components
export { ProjectBasics } from "./sections/ProjectBasics";
export { SponsorDetails } from "./sections/SponsorDetails";
export { LocationTract } from "./sections/LocationTract";
export { ProgramSelector } from "./sections/ProgramSelector";
export { SocialImpact } from "./sections/SocialImpact";
export { EconomicBenefits } from "./sections/EconomicBenefits";
export { ProjectTeam } from "./sections/ProjectTeam";
export { ProjectCosts } from "./sections/ProjectCosts";
export { CapitalStack } from "./sections/CapitalStack";
export { SiteControl } from "./sections/SiteControl";
export { Timeline } from "./sections/Timeline";
export { ProjectReadiness } from "./sections/ProjectReadiness";
export { NMTC_QALICB } from "./sections/NMTC_QALICB";
export { HTC_Details } from "./sections/HTC_Details";
export { LIHTC_Housing } from "./sections/LIHTC_Housing";
export { OZ_Details } from "./sections/OZ_Details";
export { DueDiligenceDocs } from "./sections/DueDiligenceDocs";

// Types re-export
export type {
  IntakeData,
  ProgramType,
  ProgramLevel,
  OrganizationType,
  TriState,
  YesNo,
  SiteControlStatus,
  DueDiligenceStatus,
  DesignProgress,
  CostEstimateBasis,
  LeverageStructure,
  HistoricStatus,
  PartStatus,
  LIHTCType,
  TractType,
  UploadedDocument,
  DocumentCategory,
  DocumentRequirement,
  ProjectImage,
  FinancingSource,
  TeamMember,
  TierRequirements,
} from "@/types/intake";

// Constants re-export
export { TIER_CONFIG, DOCUMENT_REQUIREMENTS } from "@/types/intake";
