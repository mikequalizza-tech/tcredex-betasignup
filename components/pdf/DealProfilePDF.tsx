"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { Deal } from "@/lib/data/deals";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5",
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },
  location: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 10,
  },
  programBadge: {
    backgroundColor: "#10B981",
    color: "#ffffff",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: "#6B7280",
  },
  value: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "bold",
  },
  description: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
  },
  scoreBox: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: "#6B7280",
    flex: 1,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  totalScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4F46E5",
    textAlign: "center",
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    padding: "4 12",
    borderRadius: 12,
    marginTop: 5,
  },
  tierGreenlight: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  tierWatchlist: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  tierDefer: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  gridItem: {
    width: "50%",
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
  },
  confidential: {
    fontSize: 8,
    color: "#EF4444",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "bold",
  },
});

// Program color map
const PROGRAM_COLORS: Record<string, string> = {
  NMTC: "#10B981",
  HTC: "#3B82F6",
  LIHTC: "#8B5CF6",
  OZ: "#F59E0B",
};

interface DealProfilePDFProps {
  deal: Deal;
  score?: null; // Score parameter kept for backwards compatibility but not used
}

// The PDF Document component
export function DealProfileDocument({ deal }: DealProfilePDFProps) {
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>tCredex</Text>
          <Text style={styles.subtitle}>Tax Credit Deal Exchange</Text>
        </View>

        {/* Deal Title */}
        <Text style={styles.title}>{deal.projectName}</Text>
        <Text style={styles.location}>
          {deal.city}, {deal.state}
        </Text>
        <View
          style={[
            styles.programBadge,
            { backgroundColor: PROGRAM_COLORS[deal.programType] || "#6B7280" },
          ]}
        >
          <Text>{deal.programType}</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Summary</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Allocation Request</Text>
              <Text style={styles.value}>
                {formatCurrency(deal.allocation)}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Credit Price</Text>
              <Text style={styles.value}>${deal.creditPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Program Level</Text>
              <Text style={styles.value}>{deal.programLevel}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Census Tract</Text>
              <Text style={styles.value}>{deal.censusTract || "TBD"}</Text>
            </View>
          </View>
        </View>

        {/* Tract Qualifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tract Qualifications</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Tract Types</Text>
              <Text style={styles.value}>{deal.tractType.join(", ")}</Text>
            </View>
            {deal.povertyRate && (
              <View style={styles.gridItem}>
                <Text style={styles.label}>Poverty Rate</Text>
                <Text style={styles.value}>{deal.povertyRate}%</Text>
              </View>
            )}
            {deal.medianIncome && (
              <View style={styles.gridItem}>
                <Text style={styles.label}>Median Income</Text>
                <Text style={styles.value}>
                  {formatCurrency(deal.medianIncome)}
                </Text>
              </View>
            )}
            {deal.jobsCreated && (
              <View style={styles.gridItem}>
                <Text style={styles.label}>Jobs Created</Text>
                <Text style={styles.value}>{deal.jobsCreated}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Project Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Overview</Text>
          <Text style={styles.description}>
            {deal.description ||
              `${deal.projectName} is a ${deal.programType} project located in ${deal.city}, ${deal.state}. This ${deal.programLevel} program opportunity has an allocation of ${formatCurrency(deal.allocation)} at a credit price of $${deal.creditPrice.toFixed(2)}.`}
          </Text>
        </View>

        {/* Community Impact */}
        {deal.communityImpact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Impact</Text>
            <Text style={styles.description}>{deal.communityImpact}</Text>
          </View>
        )}

        {/* Sponsor Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sponsor Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Sponsor Name</Text>
            <Text style={styles.value}>{deal.sponsorName}</Text>
          </View>
          {deal.website && (
            <View style={styles.row}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.value}>{deal.website}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by tCredex on {new Date().toLocaleDateString()} | Deal ID:{" "}
            {deal.id}
          </Text>
          <Text style={styles.confidential}>
            CONFIDENTIAL - For qualified investors only
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Helper function to generate PDF blob
export async function generateDealProfilePDF(
  deal: Deal,
  _score?: null,
): Promise<Blob> {
  const doc = <DealProfileDocument deal={deal} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

// Helper function to download PDF
export async function downloadDealProfilePDF(
  deal: Deal,
  _score?: null,
): Promise<void> {
  const blob = await generateDealProfilePDF(deal);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${deal.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Profile.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
