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

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 50,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  documentTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 25,
    marginTop: 10,
  },
  documentSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableLabel: {
    width: "40%",
    padding: 10,
    backgroundColor: "#F9FAFB",
    fontSize: 10,
    color: "#374151",
    fontWeight: "bold",
  },
  tableValue: {
    width: "60%",
    padding: 10,
    fontSize: 10,
    color: "#111827",
  },
  highlightRow: {
    backgroundColor: "#EEF2FF",
  },
  disclaimer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
  },
  disclaimerTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 5,
  },
  disclaimerText: {
    fontSize: 8,
    color: "#92400E",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
  },
  pageNumber: {
    fontSize: 8,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 5,
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    marginBottom: 5,
    height: 40,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
});

const PROGRAM_DETAILS: Record<
  string,
  { creditSchedule: string; compliancePeriod: string }
> = {
  NMTC: {
    creditSchedule: "5% years 1-3, 6% years 4-7 (39% total)",
    compliancePeriod: "7 years",
  },
  HTC: {
    creditSchedule: "20% of QREs in year placed in service",
    compliancePeriod: "5 years",
  },
  LIHTC: {
    creditSchedule: "Annual credit over 10 years",
    compliancePeriod: "15 years + 15 year extended",
  },
  OZ: {
    creditSchedule: "Capital gains deferral/exclusion",
    compliancePeriod: "10 years for full exclusion",
  },
};

interface TermSheetPDFProps {
  deal: Deal;
  terms?: {
    creditRate?: number;
    closingDate?: string;
    legalCounsel?: string;
    specialConditions?: string[];
  };
}

export function TermSheetDocument({ deal, terms }: TermSheetPDFProps) {
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const programDetails =
    PROGRAM_DETAILS[deal.programType] || PROGRAM_DETAILS.NMTC;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>tCredex</Text>
          <Text style={styles.headerSubtitle}>Tax Credit Deal Exchange</Text>
        </View>

        {/* Document Title */}
        <Text style={styles.documentTitle}>{deal.programType} TERM SHEET</Text>
        <Text style={styles.documentSubtitle}>
          {deal.projectName} | {deal.city}, {deal.state}
        </Text>

        {/* Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Project Name</Text>
              <Text style={styles.tableValue}>{deal.projectName}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Location</Text>
              <Text style={styles.tableValue}>
                {deal.city}, {deal.state}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Census Tract</Text>
              <Text style={styles.tableValue}>
                {deal.censusTract || "To be confirmed"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Tract Qualifications</Text>
              <Text style={styles.tableValue}>{deal.tractType.join(", ")}</Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={styles.tableLabel}>Sponsor</Text>
              <Text style={styles.tableValue}>{deal.sponsorName}</Text>
            </View>
          </View>
        </View>

        {/* Financial Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Terms</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.highlightRow]}>
              <Text style={styles.tableLabel}>Allocation Amount</Text>
              <Text style={styles.tableValue}>
                {formatCurrency(deal.allocation)}
              </Text>
            </View>
            <View style={[styles.tableRow, styles.highlightRow]}>
              <Text style={styles.tableLabel}>Credit Price</Text>
              <Text style={styles.tableValue}>
                ${deal.creditPrice.toFixed(4)} per dollar
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Program Type</Text>
              <Text style={styles.tableValue}>
                {deal.programType} - {deal.programLevel}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Credit Schedule</Text>
              <Text style={styles.tableValue}>
                {programDetails.creditSchedule}
              </Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={styles.tableLabel}>Compliance Period</Text>
              <Text style={styles.tableValue}>
                {programDetails.compliancePeriod}
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Terms</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Target Closing Date</Text>
              <Text style={styles.tableValue}>
                {terms?.closingDate || "To be determined"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Legal Counsel</Text>
              <Text style={styles.tableValue}>
                {terms?.legalCounsel || "To be assigned"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Due Diligence Period</Text>
              <Text style={styles.tableValue}>45 days from execution</Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={styles.tableLabel}>Exclusivity Period</Text>
              <Text style={styles.tableValue}>90 days from execution</Text>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>IMPORTANT NOTICE</Text>
          <Text style={styles.disclaimerText}>
            This term sheet is for discussion purposes only and does not
            constitute a binding commitment to provide financing or enter into
            any transaction. All terms are subject to satisfactory completion of
            due diligence, approval by all parties, and execution of definitive
            documentation. This document is confidential and intended only for
            the parties named herein.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Sponsor Signature / Date</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Investor Signature / Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by tCredex on {new Date().toLocaleDateString()} | Deal ID:{" "}
            {deal.id}
          </Text>
          <Text style={styles.pageNumber}>CONFIDENTIAL - Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateTermSheetPDF(
  deal: Deal,
  terms?: TermSheetPDFProps["terms"],
): Promise<Blob> {
  const doc = <TermSheetDocument deal={deal} terms={terms} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function downloadTermSheetPDF(
  deal: Deal,
  terms?: TermSheetPDFProps["terms"],
): Promise<void> {
  const blob = await generateTermSheetPDF(deal, terms);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${deal.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_TermSheet.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
