/**
 * Shared Project Profile HTML generator
 *
 * Used by:
 * - /api/deals/[id]/pdf (Puppeteer → PDF)
 * - /api/deals/[id]/outreach (email attachment)
 *
 * Mirrors the design of ProjectProfileHTML.tsx (the canonical on-screen component).
 * All styles are inline so the HTML is self-contained and renderable anywhere.
 */

// =====================================================================
// Data types
// =====================================================================

export interface ProfileData {
  parentOrganization: string;
  projectName: string;
  address: string;
  city: string;
  state: string;
  censusTract: string;
  povertyRate?: number;
  medianIncome?: number;
  unemploymentRate?: number;
  totalProjectCost: number;
  nmtcRequest?: number;
  stateNmtcRequest?: number;
  htcAmount?: number;
  financingGap?: number;
  isShovelReady: boolean;
  projectedCompletion?: string;
  sources: { name: string; amount: number }[];
  uses: { name: string; amount: number }[];
  projectDescription: string;
  communityImpact: string;
  jobsCreated?: number;
  constructionJobs?: number;
  permanentJobs?: number;
  featuredImageUrl?: string;
  contactEmail?: string;
  dealId?: string;
  sponsorDescription?: string;
  organizationType?: string;
  womanOwned?: boolean;
  minorityOwned?: boolean;
  veteranOwned?: boolean;
  lowIncomeOwned?: boolean;
}

// =====================================================================
// Build profile data from a deal + intake object
// =====================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deal/intake come from Supabase JSONB with deeply nested optional properties
export function buildProfileData(deal: any, intake: any): ProfileData {
  const normalizeText = (v: unknown): string =>
    typeof v === "string" ? v.trim() : "";
  const projectDesc = normalizeText(
    intake.projectDescription ||
      deal.description ||
      deal.project_description ||
      "",
  );
  const sponsorDescCandidates = [
    deal.sponsors?.description,
    deal.sponsor_description,
  ];
  const sponsorDesc =
    sponsorDescCandidates
      .map(normalizeText)
      .find((v) => v && v.toLowerCase() !== projectDesc.toLowerCase()) || "";

  const sources: { name: string; amount: number }[] = [];
  if (intake.financingSources) {
    for (const s of intake.financingSources) {
      if (s.source && s.amount)
        sources.push({ name: s.source, amount: s.amount });
    }
  } else {
    if (intake.equityAmount)
      sources.push({ name: "Equity", amount: intake.equityAmount });
    if (intake.debtAmount)
      sources.push({ name: "Debt", amount: intake.debtAmount });
    if (intake.grantAmount)
      sources.push({ name: "Grants", amount: intake.grantAmount });
    if (intake.nmtcFinancingRequested)
      sources.push({
        name: "NMTC Equity",
        amount: intake.nmtcFinancingRequested,
      });
  }

  const uses: { name: string; amount: number }[] = [];
  if (intake.landCost) uses.push({ name: "Land", amount: intake.landCost });
  if (intake.acquisitionCost)
    uses.push({ name: "Acquisition", amount: intake.acquisitionCost });
  if (intake.constructionCost)
    uses.push({ name: "Construction", amount: intake.constructionCost });
  if (intake.softCosts)
    uses.push({ name: "Soft Costs", amount: intake.softCosts });
  if (intake.developerFee)
    uses.push({ name: "Developer Fee", amount: intake.developerFee });
  if (intake.contingency)
    uses.push({ name: "Contingency", amount: intake.contingency });

  let featuredImageUrl: string | undefined;
  if (intake.featuredImageId && intake.projectImages) {
    const featured = intake.projectImages.find(
      (img: { id?: string; url?: string }) => img.id === intake.featuredImageId,
    );
    if (featured) featuredImageUrl = featured.url;
  }
  if (!featuredImageUrl && intake.projectImages?.length > 0) {
    const first = intake.projectImages[0];
    featuredImageUrl = typeof first === "string" ? first : first?.url;
  }
  if (!featuredImageUrl) {
    featuredImageUrl =
      deal.hero_image_url ||
      deal.featured_image_url ||
      deal.heroImageUrl ||
      deal.featuredImageUrl;
  }

  // Also check deal-level sources/uses
  if (sources.length === 0 && deal.sources) {
    for (const s of deal.sources) {
      if (s.name && s.amount) sources.push(s);
    }
  }
  if (uses.length === 0 && deal.uses) {
    for (const u of deal.uses) {
      if (u.name && u.amount) uses.push(u);
    }
  }

  return {
    parentOrganization:
      deal.sponsors?.organization_name ||
      deal.sponsor_name ||
      intake.organizationName ||
      intake.sponsorName ||
      "Sponsor Organization",
    projectName: intake.projectName || deal.project_name || "Untitled Project",
    address: intake.address || deal.address || "",
    city: intake.city || deal.city || "",
    state: intake.state || deal.state || "",
    censusTract: intake.censusTract || deal.census_tract || "",
    povertyRate: intake.tractPovertyRate || deal.poverty_rate,
    medianIncome: intake.tractMedianIncome || deal.median_income_percent,
    unemploymentRate: intake.tractUnemployment || deal.unemployment_rate,
    totalProjectCost: intake.totalProjectCost || deal.total_project_cost || 0,
    nmtcRequest: intake.nmtcFinancingRequested || deal.nmtc_financing_requested,
    stateNmtcRequest: intake.stateNmtcRequest || deal.state_nmtc_request,
    htcAmount: intake.qreAmount || deal.htc_amount,
    financingGap: intake.financingGap || deal.financing_gap,
    isShovelReady:
      intake.isShovelReady === "Yes" ||
      intake.isShovelReady === true ||
      deal.shovel_ready === true,
    projectedCompletion:
      intake.projectedCompletionDate || deal.projected_completion_date,
    sources,
    uses,
    projectDescription: projectDesc,
    communityImpact: intake.communityImpact || deal.community_impact || "",
    jobsCreated:
      intake.jobsCreated || intake.permanentJobsFTE || deal.jobs_created,
    constructionJobs: intake.constructionJobsFTE || deal.construction_jobs,
    permanentJobs: intake.permanentJobsFTE || deal.permanent_jobs,
    featuredImageUrl,
    contactEmail: intake.sponsorEmail || intake.contactEmail,
    dealId: deal.id,
    sponsorDescription: sponsorDesc,
    organizationType:
      intake.organizationType || deal.sponsors?.organization_type,
    womanOwned:
      deal.sponsors?.woman_owned === true ||
      intake.womanOwned === "Yes" ||
      intake.womanOwned === true,
    minorityOwned:
      deal.sponsors?.minority_owned === true ||
      intake.minorityOwned === "Yes" ||
      intake.minorityOwned === true,
    veteranOwned:
      deal.sponsors?.veteran_owned === true ||
      intake.veteranOwned === "Yes" ||
      intake.veteranOwned === true,
    lowIncomeOwned:
      deal.sponsors?.low_income_owned === true ||
      intake.lowIncomeOwned === "Yes" ||
      intake.lowIncomeOwned === true,
  };
}

// =====================================================================
// HTML builder (string template — matches ProjectProfileHTML.tsx design)
// =====================================================================

function fmtCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildProfileHTML(d: ProfileData): string {
  const totalSources = d.sources.reduce((s, x) => s + x.amount, 0);
  const totalUses = d.uses.reduce((s, x) => s + x.amount, 0);
  const dealIdDisplay = d.dealId
    ? `tcredex.com_${new Date().getFullYear()}-${d.dealId.slice(-4)}`
    : "—";

  // Build sidebar financial items
  let financials = "";
  financials += `<div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Total Cost</span><span style="color:#38bdf8;font-weight:600;font-size:7.5pt">${esc(fmtCurrency(d.totalProjectCost))}</span></div>`;
  if (d.nmtcRequest && d.nmtcRequest > 0)
    financials += `<div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Fed NMTC Req</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${esc(fmtCurrency(d.nmtcRequest))}</span></div>`;
  if (d.stateNmtcRequest && d.stateNmtcRequest > 0)
    financials += `<div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">State NMTC Req</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${esc(fmtCurrency(d.stateNmtcRequest))}</span></div>`;
  if (d.htcAmount && d.htcAmount > 0)
    financials += `<div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Total HTC</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${esc(fmtCurrency(d.htcAmount))}</span></div>`;
  if (d.financingGap && d.financingGap > 0)
    financials += `<div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Financing Gap</span><span style="color:#facc15;font-weight:600;font-size:7.5pt">${esc(fmtCurrency(d.financingGap))}</span></div>`;

  // Jobs section
  let jobsSection = "";
  if (d.jobsCreated || d.permanentJobs || d.constructionJobs) {
    jobsSection += `<div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-top:8px;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Jobs Created</div>`;
    if (d.permanentJobs || d.jobsCreated)
      jobsSection += `<div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:4px;border-left:2px solid #4ade80"><span style="font-size:6pt;color:#c7d2fe">Permanent</span><span style="font-size:6.5pt;color:#4ade80;font-weight:700">${d.permanentJobs || d.jobsCreated}</span></div>`;
    if (d.constructionJobs && d.constructionJobs > 0)
      jobsSection += `<div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:4px;border-left:2px solid #38bdf8"><span style="font-size:6pt;color:#c7d2fe">Construction</span><span style="font-size:6.5pt;color:#38bdf8;font-weight:700">${d.constructionJobs}</span></div>`;
  }

  // Sources table
  let sourcesSection = "";
  if (d.sources.length > 0) {
    sourcesSection += `<div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-top:8px;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Sources</div>`;
    sourcesSection += `<table style="width:100%;font-size:6pt;border-collapse:collapse"><tbody>`;
    for (const s of d.sources.slice(0, 4)) {
      sourcesSection += `<tr><td style="padding:0;color:#c7d2fe;vertical-align:top">${esc(s.name)}</td><td style="padding:0;text-align:right;color:#fff;font-weight:600;white-space:nowrap">${esc(fmtCurrency(s.amount))}</td></tr>`;
    }
    sourcesSection += `<tr><td colspan="2"><div style="border-top:1px solid #818cf8;margin-top:2px;padding-top:1px;font-weight:700;text-align:right;color:#38bdf8;font-size:6.5pt">Total: ${esc(fmtCurrency(totalSources))}</div></td></tr></tbody></table>`;
  }

  // Uses table
  let usesSection = "";
  if (d.uses.length > 0) {
    usesSection += `<div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-top:8px;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Uses</div>`;
    usesSection += `<table style="width:100%;font-size:6pt;border-collapse:collapse"><tbody>`;
    for (const u of d.uses.slice(0, 4)) {
      usesSection += `<tr><td style="padding:0;color:#c7d2fe;vertical-align:top">${esc(u.name)}</td><td style="padding:0;text-align:right;color:#fff;font-weight:600;white-space:nowrap">${esc(fmtCurrency(u.amount))}</td></tr>`;
    }
    usesSection += `<tr><td colspan="2"><div style="border-top:1px solid #818cf8;margin-top:2px;padding-top:1px;font-weight:700;text-align:right;color:#38bdf8;font-size:6.5pt">Total: ${esc(fmtCurrency(totalUses))}</div></td></tr></tbody></table>`;
  }

  // Certifications
  let certsSection = "";
  if (
    d.womanOwned ||
    d.minorityOwned ||
    d.veteranOwned ||
    d.lowIncomeOwned ||
    d.organizationType
  ) {
    certsSection += `<div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-top:8px;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Certifications</div>`;
    if (d.organizationType)
      certsSection += `<div style="font-size:6pt;color:#c7d2fe;margin-bottom:2px">${esc(d.organizationType)}</div>`;
    if (d.womanOwned)
      certsSection += `<div style="font-size:6pt;color:#e9d5ff;margin-bottom:1px;padding-left:4px;border-left:2px solid #a78bfa">Woman-Owned</div>`;
    if (d.minorityOwned)
      certsSection += `<div style="font-size:6pt;color:#bfdbfe;margin-bottom:1px;padding-left:4px;border-left:2px solid #60a5fa">Minority-Owned</div>`;
    if (d.veteranOwned)
      certsSection += `<div style="font-size:6pt;color:#bbf7d0;margin-bottom:1px;padding-left:4px;border-left:2px solid #4ade80">Veteran-Owned</div>`;
    if (d.lowIncomeOwned)
      certsSection += `<div style="font-size:6pt;color:#fde68a;margin-bottom:1px;padding-left:4px;border-left:2px solid #facc15">Low-Income Designated</div>`;
  }

  // Hero image
  const heroImage = d.featuredImageUrl
    ? `<div style="width:100%;height:2.0in;border-radius:4px;margin-bottom:6px;overflow:hidden;border:1px solid #e2e8f0;flex-shrink:0"><img src="${esc(d.featuredImageUrl)}" style="width:100%;height:100%;object-fit:cover" /></div>`
    : `<div style="width:100%;height:2.0in;background-color:#f1f5f9;border-radius:4px;margin-bottom:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;border:1px solid #e2e8f0;background-image:radial-gradient(#cbd5e1 1px,transparent 1px);background-size:10px 10px;font-weight:600;letter-spacing:1px;flex-shrink:0">Project Rendering</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
</style>
</head>
<body>
<div style="width:8.5in;height:11in;background-color:white;display:flex;position:relative;overflow:hidden">
  <!-- SIDEBAR -->
  <div style="width:1.8in;background:linear-gradient(180deg,#1e1b4b 0%,#312e81 50%,#4c51bf 100%);color:#fff;display:flex;flex-direction:column;padding:0.1in;flex-shrink:0;font-size:7pt">
    <!-- Logo -->
    <div style="margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.15)">
      <svg width="100%" height="30" viewBox="0 0 140 30" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="24" font-family="Arial,sans-serif" font-weight="900" font-size="24" fill="#ffffff">tCredex</text>
        <circle cx="95" cy="14" r="3" fill="#38bdf8"/>
      </svg>
    </div>

    <div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Deal Stats</div>

    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:7.5pt;font-weight:700;text-transform:uppercase;display:block">Parent Org</span><span style="color:#fff;font-weight:700;font-size:7.5pt">${esc(d.parentOrganization)}</span></div>
    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Project</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${esc(d.projectName)}</span></div>
    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Location</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${d.address ? esc(d.address) + "<br/>" : ""}${esc(d.city)}, ${esc(d.state)}</span></div>
    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Census Tract</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${esc(d.censusTract || "—")}</span></div>

    <div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-top:8px;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Demographics</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:4px;border-left:2px solid #818cf8"><span style="font-size:6pt;color:#c7d2fe">Poverty</span><span style="font-size:6.5pt;color:#fff;font-weight:600">${d.povertyRate ?? "—"}%</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:4px;border-left:2px solid #818cf8"><span style="font-size:6pt;color:#c7d2fe">Med Inc</span><span style="font-size:6.5pt;color:#fff;font-weight:600">${d.medianIncome ?? "—"}% MFI</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:2px;padding-left:4px;border-left:2px solid #818cf8"><span style="font-size:6pt;color:#c7d2fe">Unemp</span><span style="font-size:6.5pt;color:#fff;font-weight:600">${d.unemploymentRate ?? "—"}%</span></div>

    <div style="font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#a5b4fc;margin-top:8px;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,0.1)">Financials</div>
    ${financials}

    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Shovel Ready</span><span style="color:${d.isShovelReady ? "#4ade80" : "#facc15"};font-weight:600;font-size:7.5pt">${d.isShovelReady ? "YES" : "NO"}</span></div>
    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Completion</span><span style="color:#fff;font-weight:600;font-size:7.5pt">${esc(fmtDate(d.projectedCompletion))}</span></div>
    <div style="margin-bottom:5px;line-height:1.15"><span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Deal ID</span><span style="font-family:monospace;color:#a5b4fc;font-size:7pt">${esc(dealIdDisplay)}</span></div>

    ${jobsSection}
    ${sourcesSection}
    ${usesSection}
    ${certsSection}

    <!-- Footer -->
    <div style="margin-top:auto;padding-top:8px;text-align:center;border-top:1px solid rgba(255,255,255,0.15)">
      <div style="margin-bottom:5px;line-height:1.15">
        <span style="color:#c7d2fe;font-size:6pt;font-weight:700;text-transform:uppercase;display:block">Contact</span>
        <span style="color:#fff;font-weight:600;font-size:7.5pt">tCredex.com</span>
        <span style="color:#38bdf8;display:block;font-size:7pt">${esc(d.contactEmail || "Info@tCredex.com")}</span>
      </div>
      <div style="margin-top:8px;opacity:0.9">
        <svg width="50" height="65" viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg">
          <path fill="#9CB687" d="M100,430Q200,530 300,430L280,430Q200,500 120,430Z"/>
          <path fill="#6E9D87" d="M85,410L315,410L315,425L85,425Z"/>
          <rect fill="#D58659" x="130" y="300" width="55" height="100"/>
          <rect fill="#FFF" x="152" y="315" width="10" height="15"/>
          <rect fill="#D58659" x="215" y="285" width="55" height="115"/>
          <rect fill="#FFF" x="237" y="305" width="10" height="15"/>
          <path fill="#6E9D87" d="M150,410Q200,410 250,410Q240,300 230,250L260,200L250,190L220,230L220,150L205,100L190,150L190,230L160,190L150,200L180,250Q170,300 150,410Z"/>
          <ellipse fill="#9CB687" cx="200" cy="60" rx="15" ry="30"/>
          <ellipse fill="#9CB687" cx="240" cy="70" rx="15" ry="30" transform="rotate(20 240 70)"/>
          <ellipse fill="#9CB687" cx="160" cy="70" rx="15" ry="30" transform="rotate(-20 160 70)"/>
        </svg>
      </div>
    </div>
  </div>

  <!-- MAIN CONTENT -->
  <div style="flex:1;padding:0.15in;display:flex;flex-direction:column;gap:4px">
    <div style="font-size:16pt;font-weight:900;color:#0f172a;line-height:1;margin-bottom:4px;letter-spacing:-0.5px">tCredex.com Tax Credit – Project Profile</div>
    <div style="font-size:10pt;font-weight:600;color:#64748b;margin-bottom:6px">${esc(d.projectName)} <span style="color:#cbd5e1;margin:0 5px">|</span> ${esc(d.city)}, ${esc(d.state)}</div>

    ${heroImage}

    <div style="flex:2.6;min-height:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="font-size:9pt;font-weight:700;color:#0f172a;text-transform:uppercase;border-bottom:2px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;flex-shrink:0">The Project</div>
      <div style="font-size:8pt;line-height:1.35;color:#334155;text-align:justify;overflow:hidden;padding-bottom:2px">${esc(d.projectDescription || "Project description not provided.")}</div>
    </div>

    <div style="flex:2.0;min-height:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="font-size:9pt;font-weight:700;color:#0f172a;text-transform:uppercase;border-bottom:2px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;flex-shrink:0">Community Impact</div>
      <div style="font-size:8pt;line-height:1.35;color:#334155;text-align:justify;overflow:hidden;padding-bottom:2px">${esc(d.communityImpact || "Community impact information not provided.")}</div>
    </div>

    <div style="flex:1.5;min-height:0;overflow:hidden;display:flex;flex-direction:column">
      <div style="font-size:9pt;font-weight:700;color:#0f172a;text-transform:uppercase;border-bottom:2px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;flex-shrink:0">About the Sponsor</div>
      <div style="font-size:8pt;line-height:1.35;color:#334155;text-align:justify;overflow:hidden;padding-bottom:2px">${esc(d.sponsorDescription || d.parentOrganization + " is the sponsor organization for this project.")}</div>
    </div>

    <div style="text-align:center;font-size:7pt;color:#cbd5e1;font-weight:500;padding-top:4px">&copy; ${new Date().getFullYear()} tCredex.com &bull; Smart Tools for Impact Investing</div>
  </div>
</div>
</body>
</html>`;
}
