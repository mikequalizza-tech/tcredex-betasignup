/**
 * Server-side Project Profile PDF generator for email attachments.
 * Uses @react-pdf/renderer's renderToBuffer (Node.js, no browser needed).
 *
 * Called from: /api/deals/[id]/outreach POST handler
 *
 * Matches the design of ProjectProfileHTML.tsx — professional 1-page layout
 * with financial overview, demographics, project details, and sponsor info.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// ─── Colors ─────────────────────────────────────────────────────────
const COLORS = {
  primary: "#1e1b4b", // Indigo-950
  primaryLight: "#c7d2fe", // Indigo-200
  accent: "#22c55e", // Green-500
  accentDark: "#15803d", // Green-700
  text: "#334155", // Slate-700
  textLight: "#64748b", // Slate-500
  textMuted: "#94a3b8", // Slate-400
  border: "#e2e8f0", // Slate-200
  bgLight: "#f8fafc", // Slate-50
  white: "#ffffff",
  red: "#ef4444",
  amber: "#f59e0b",
  purple: "#7c3aed",
};

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", backgroundColor: COLORS.white },

  // Header bar
  headerBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 36,
  },
  headerBrand: {
    fontSize: 8,
    color: COLORS.primaryLight,
    marginBottom: 4,
    letterSpacing: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.white },
  headerSub: { fontSize: 10, color: COLORS.primaryLight, marginTop: 3 },

  // Hero image
  heroImage: { width: "100%", height: 160, objectFit: "cover" },
  heroPlaceholder: { width: "100%", height: 20, backgroundColor: "#e0e7ff" },

  // Main content
  content: { paddingHorizontal: 36, paddingTop: 14 },

  // Stats grid (financial overview)
  statsRow: { flexDirection: "row", marginBottom: 12, gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  statBoxAccent: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  statLabel: {
    fontSize: 7,
    color: COLORS.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: { fontSize: 14, fontWeight: "bold", color: COLORS.primary },
  statValueGreen: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.accentDark,
  },

  // Detail pills row
  detailRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  detailPill: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  detailPillLabel: { fontSize: 7, color: COLORS.textLight, marginRight: 4 },
  detailPillValue: { fontSize: 8, fontWeight: "bold", color: COLORS.primary },

  // Section
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 3,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  body: { fontSize: 8.5, color: COLORS.text, lineHeight: 1.5 },

  // Sources & Uses
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableLabel: { flex: 1, fontSize: 8, color: COLORS.text },
  tableValue: {
    width: 80,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.textLight,
    textTransform: "uppercase",
  },

  // Demographics bar
  demoRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  demoItem: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    padding: 6,
    borderRadius: 3,
    alignItems: "center",
  },
  demoLabel: {
    fontSize: 6,
    color: COLORS.textLight,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  demoValue: { fontSize: 10, fontWeight: "bold", color: COLORS.primary },

  // Certifications
  certRow: { flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" },
  certBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  certText: { fontSize: 6.5, color: COLORS.purple, fontWeight: "bold" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 6.5, color: COLORS.textMuted },
  footerConfidential: { fontSize: 6.5, color: COLORS.red, fontWeight: "bold" },
});

// ─── Types ───────────────────────────────────────────────────────────
export interface ProfilePdfData {
  projectName: string;
  sponsorName: string;
  city: string;
  state: string;
  address?: string;
  totalProjectCost: number;
  nmtcRequest: number;
  description: string;
  communityImpact: string;
  aboutSponsor: string;
  featuredImageUrl?: string;
  censusTract?: string;
  programType?: string;
  povertyRate?: number;
  medianIncome?: number;
  unemployment?: number;
  shovelReady?: boolean;
  completionDate?: string;
  sources?: Array<{ name: string; amount: number }>;
  uses?: Array<{ name: string; amount: number }>;
  dealId?: string;
  // Jobs
  jobsCreated?: number;
  constructionJobs?: number;
  permanentJobs?: number;
  // Certifications
  womanOwned?: boolean;
  minorityOwned?: boolean;
  veteranOwned?: boolean;
  lowIncomeOwned?: boolean;
  organizationType?: string;
  // Financing details
  stateNmtcRequest?: number;
  htcAmount?: number;
  financingGap?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function fmtCurrency(amt: number): string {
  if (!amt) return "\u2014";
  if (amt >= 1_000_000) return `$${(amt / 1_000_000).toFixed(1)}M`;
  if (amt >= 1_000) return `$${(amt / 1_000).toFixed(0)}K`;
  return `$${amt.toLocaleString()}`;
}

function truncate(text: string, max: number): string {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut) + "...";
}

function cleanText(text: string): string {
  return text
    .replace(/^[-\u2014\u2013\u2022]\s*/gm, "\u2022 ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ─── Document ────────────────────────────────────────────────────────
function ProfileDocument({ data }: { data: ProfilePdfData }) {
  const hasImage = !!data.featuredImageUrl;
  const maxChars = hasImage ? 500 : 700;
  const hasDemographics =
    data.povertyRate != null ||
    data.medianIncome != null ||
    data.unemployment != null;
  const hasSourcesUses =
    (data.sources?.length || 0) > 0 || (data.uses?.length || 0) > 0;
  const hasJobs =
    (data.jobsCreated || 0) > 0 ||
    (data.constructionJobs || 0) > 0 ||
    (data.permanentJobs || 0) > 0;
  const certs: string[] = [];
  if (data.womanOwned) certs.push("Woman-Owned");
  if (data.minorityOwned) certs.push("Minority-Owned");
  if (data.veteranOwned) certs.push("Veteran-Owned");
  if (data.lowIncomeOwned) certs.push("Low-Income Owned");

  return (
    <Document title={`${data.projectName} - Project Profile`} author="tCredex">
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.headerBar}>
          <Text style={s.headerBrand}>
            tCredex.com {"\u2022"} PROJECT PROFILE
          </Text>
          <Text style={s.headerTitle}>{data.projectName}</Text>
          <Text style={s.headerSub}>
            {data.sponsorName} {"\u2022"} {data.city}, {data.state}
            {data.address ? `  \u2022  ${data.address}` : ""}
          </Text>
        </View>

        {/* Hero Image */}
        {data.featuredImageUrl ? (
          <Image style={s.heroImage} src={data.featuredImageUrl} />
        ) : (
          <View style={s.heroPlaceholder} />
        )}

        <View style={s.content}>
          {/* Financial Overview - Main Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Project Cost</Text>
              <Text style={s.statValue}>
                {fmtCurrency(data.totalProjectCost)}
              </Text>
            </View>
            <View style={s.statBoxAccent}>
              <Text style={s.statLabel}>NMTC Allocation Request</Text>
              <Text style={s.statValueGreen}>
                {fmtCurrency(data.nmtcRequest)}
              </Text>
            </View>
            {data.financingGap ? (
              <View style={s.statBox}>
                <Text style={s.statLabel}>Financing Gap</Text>
                <Text style={s.statValue}>
                  {fmtCurrency(data.financingGap)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Detail Pills */}
          <View style={s.detailRow}>
            {data.programType && (
              <View style={s.detailPill}>
                <Text style={s.detailPillLabel}>Program:</Text>
                <Text style={s.detailPillValue}>{data.programType}</Text>
              </View>
            )}
            {data.censusTract && (
              <View style={s.detailPill}>
                <Text style={s.detailPillLabel}>Census Tract:</Text>
                <Text style={s.detailPillValue}>{data.censusTract}</Text>
              </View>
            )}
            {data.shovelReady && (
              <View style={s.detailPill}>
                <Text style={s.detailPillLabel}>{"\u2705"}</Text>
                <Text style={s.detailPillValue}>Shovel Ready</Text>
              </View>
            )}
            {data.completionDate && (
              <View style={s.detailPill}>
                <Text style={s.detailPillLabel}>Completion:</Text>
                <Text style={s.detailPillValue}>{data.completionDate}</Text>
              </View>
            )}
            {data.stateNmtcRequest ? (
              <View style={s.detailPill}>
                <Text style={s.detailPillLabel}>State NMTC:</Text>
                <Text style={s.detailPillValue}>
                  {fmtCurrency(data.stateNmtcRequest)}
                </Text>
              </View>
            ) : null}
            {data.htcAmount ? (
              <View style={s.detailPill}>
                <Text style={s.detailPillLabel}>HTC Amount:</Text>
                <Text style={s.detailPillValue}>
                  {fmtCurrency(data.htcAmount)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Demographics */}
          {hasDemographics && (
            <View style={s.demoRow}>
              {data.povertyRate != null && (
                <View style={s.demoItem}>
                  <Text style={s.demoLabel}>Poverty Rate</Text>
                  <Text style={s.demoValue}>{data.povertyRate}%</Text>
                </View>
              )}
              {data.medianIncome != null && (
                <View style={s.demoItem}>
                  <Text style={s.demoLabel}>MFI %</Text>
                  <Text style={s.demoValue}>
                    {data.medianIncome.toFixed(1)}%
                  </Text>
                </View>
              )}
              {data.unemployment != null && (
                <View style={s.demoItem}>
                  <Text style={s.demoLabel}>Unemployment</Text>
                  <Text style={s.demoValue}>{data.unemployment}%</Text>
                </View>
              )}
              {hasJobs && (
                <View style={s.demoItem}>
                  <Text style={s.demoLabel}>Jobs Created</Text>
                  <Text style={s.demoValue}>
                    {data.jobsCreated ||
                      (data.constructionJobs || 0) + (data.permanentJobs || 0)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Sources & Uses (compact table) */}
          {hasSourcesUses && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Sources & Uses</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                {/* Sources */}
                {(data.sources?.length || 0) > 0 && (
                  <View style={{ flex: 1 }}>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableHeaderText, { flex: 1 }]}>
                        Source
                      </Text>
                      <Text
                        style={[
                          s.tableHeaderText,
                          { width: 70, textAlign: "right" },
                        ]}
                      >
                        Amount
                      </Text>
                    </View>
                    {data.sources!.map((src, i) => (
                      <View key={`s${i}`} style={s.tableRow}>
                        <Text style={s.tableLabel}>{src.name}</Text>
                        <Text style={s.tableValue}>
                          {fmtCurrency(src.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Uses */}
                {(data.uses?.length || 0) > 0 && (
                  <View style={{ flex: 1 }}>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableHeaderText, { flex: 1 }]}>Use</Text>
                      <Text
                        style={[
                          s.tableHeaderText,
                          { width: 70, textAlign: "right" },
                        ]}
                      >
                        Amount
                      </Text>
                    </View>
                    {data.uses!.map((use, i) => (
                      <View key={`u${i}`} style={s.tableRow}>
                        <Text style={s.tableLabel}>{use.name}</Text>
                        <Text style={s.tableValue}>
                          {fmtCurrency(use.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Project Description */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>The Project</Text>
            <Text style={s.body}>
              {truncate(cleanText(data.description), maxChars)}
            </Text>
          </View>

          {/* Community Impact */}
          {data.communityImpact && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Community Impact</Text>
              <Text style={s.body}>
                {truncate(cleanText(data.communityImpact), maxChars)}
              </Text>
            </View>
          )}

          {/* About the Sponsor */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About the Sponsor</Text>
            <Text style={s.body}>
              {truncate(cleanText(data.aboutSponsor), Math.min(maxChars, 400))}
            </Text>
            {certs.length > 0 && (
              <View style={s.certRow}>
                {certs.map((cert, i) => (
                  <View key={i} style={s.certBadge}>
                    <Text style={s.certText}>{cert}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {"\u00a9"} {new Date().getFullYear()} tCredex {"\u2022"} AI-Powered
            Tax Credit Marketplace {"\u2022"} tCredex.com
            {data.dealId ? `  \u2022  ${data.dealId.slice(-8)}` : ""}
          </Text>
          <Text style={s.footerConfidential}>CONFIDENTIAL</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Public API ──────────────────────────────────────────────────────
/**
 * Generate a Project Profile PDF as a Node.js Buffer.
 * Safe to call from API routes (server-side, no browser needed).
 */
export async function generateProfilePdfBuffer(
  data: ProfilePdfData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<ProfileDocument data={data} />);
  return Buffer.from(buffer);
}
