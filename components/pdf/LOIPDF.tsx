"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { LOI } from "@/types/loi";
import type { Deal } from "@/lib/data/deals";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 50,
    fontFamily: "Helvetica",
  },
  letterhead: {
    marginBottom: 30,
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
  logoSubtext: {
    fontSize: 10,
    color: "#6B7280",
  },
  dateSection: {
    marginBottom: 25,
    alignItems: "flex-end",
  },
  date: {
    fontSize: 11,
    color: "#374151",
  },
  documentLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
  },
  recipientSection: {
    marginBottom: 25,
  },
  recipientName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
  },
  recipientAddress: {
    fontSize: 10,
    color: "#374151",
    marginTop: 3,
  },
  reSection: {
    marginBottom: 25,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  reLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 3,
  },
  reValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  reSubvalue: {
    fontSize: 10,
    color: "#374151",
    marginTop: 2,
  },
  greeting: {
    fontSize: 11,
    color: "#111827",
    marginBottom: 15,
  },
  bodyText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.6,
    marginBottom: 12,
    textAlign: "justify",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  termsTable: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
  },
  termsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  termsRowLast: {
    flexDirection: "row",
  },
  termsLabel: {
    width: "40%",
    padding: 10,
    backgroundColor: "#F9FAFB",
    fontSize: 10,
    color: "#374151",
    fontWeight: "bold",
  },
  termsValue: {
    width: "60%",
    padding: 10,
    fontSize: 10,
    color: "#111827",
  },
  conditionsSection: {
    marginTop: 10,
  },
  conditionItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 10,
  },
  conditionNumber: {
    width: 20,
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "bold",
  },
  conditionText: {
    flex: 1,
    fontSize: 10,
    color: "#374151",
  },
  legalSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
  },
  legalTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  legalText: {
    fontSize: 8,
    color: "#92400E",
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 35,
  },
  closing: {
    fontSize: 11,
    color: "#111827",
    marginBottom: 30,
  },
  signatureBlock: {
    marginBottom: 25,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    width: 250,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
  signatureName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 3,
  },
  signatureTitle: {
    fontSize: 9,
    color: "#6B7280",
  },
  acceptanceSection: {
    marginTop: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    backgroundColor: "#F9FAFB",
  },
  acceptanceTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 15,
    textTransform: "uppercase",
  },
  acceptanceText: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 15,
    lineHeight: 1.5,
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
});

interface LOIPDFProps {
  loi: LOI;
  deal: Deal;
  cdeName?: string;
  cdeContact?: string;
}

export function LOIDocument({ loi, deal, cdeName, cdeContact }: LOIPDFProps) {
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const leverageLabels = {
    standard: "Standard Leverage",
    "self-leverage": "Self-Leverage",
    hybrid: "Hybrid Structure",
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          <Text style={styles.logo}>
            {cdeName || "Community Development Entity"}
          </Text>
          <Text style={styles.logoSubtext}>New Markets Tax Credit Program</Text>
        </View>

        {/* Date */}
        <View style={styles.dateSection}>
          <Text style={styles.date}>
            {formatDate(loi.issued_at || loi.created_at)}
          </Text>
          <Text style={styles.documentLabel}>LOI No. {loi.loi_number}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.recipientSection}>
          <Text style={styles.recipientName}>{deal.sponsorName}</Text>
          <Text style={styles.recipientAddress}>
            {deal.city}, {deal.state}
          </Text>
        </View>

        {/* RE: Line */}
        <View style={styles.reSection}>
          <Text style={styles.reLabel}>RE: Letter of Intent</Text>
          <Text style={styles.reValue}>{deal.projectName}</Text>
          <Text style={styles.reSubvalue}>
            {deal.programType} Financing |{" "}
            {formatCurrency(loi.allocation_amount)}
          </Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Dear {deal.sponsorName}:</Text>

        {/* Opening Paragraph */}
        <Text style={styles.bodyText}>
          {cdeName || "The CDE"} is pleased to submit this Letter of Intent
          ("LOI") expressing our interest in providing New Markets Tax Credit
          allocation for the above-referenced project. This LOI sets forth the
          principal terms under which we would consider making a Qualified
          Low-Income Community Investment ("QLICI") in connection with your
          project.
        </Text>

        {/* Proposed Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proposed Terms</Text>
          <View style={styles.termsTable}>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>NMTC Allocation</Text>
              <Text style={styles.termsValue}>
                {formatCurrency(loi.allocation_amount)}
              </Text>
            </View>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>QLICI Rate</Text>
              <Text style={styles.termsValue}>
                {loi.qlici_rate ? `${loi.qlici_rate}%` : "Market Rate"}
              </Text>
            </View>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>Leverage Structure</Text>
              <Text style={styles.termsValue}>
                {leverageLabels[loi.leverage_structure || "standard"]}
              </Text>
            </View>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>Term</Text>
              <Text style={styles.termsValue}>{loi.term_years || 7} years</Text>
            </View>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>Expected Closing</Text>
              <Text style={styles.termsValue}>
                {loi.expected_closing_date
                  ? formatDate(loi.expected_closing_date)
                  : "To be determined"}
              </Text>
            </View>
            <View style={styles.termsRowLast}>
              <Text style={styles.termsLabel}>LOI Expiration</Text>
              <Text style={styles.termsValue}>
                {loi.expires_at
                  ? formatDate(loi.expires_at)
                  : "60 days from date of this letter"}
              </Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {loi.conditions && loi.conditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conditions Precedent</Text>
            <Text style={styles.bodyText}>
              This LOI and any subsequent commitment is contingent upon the
              following conditions being satisfied:
            </Text>
            <View style={styles.conditionsSection}>
              {loi.conditions.map((condition, index) => (
                <View key={condition.id} style={styles.conditionItem}>
                  <Text style={styles.conditionNumber}>{index + 1}.</Text>
                  <Text style={styles.conditionText}>
                    {condition.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Special Terms */}
        {loi.special_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Terms</Text>
            <Text style={styles.bodyText}>{loi.special_terms}</Text>
          </View>
        )}

        {/* Legal Disclaimer */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Important Notice</Text>
          <Text style={styles.legalText}>
            This Letter of Intent is provided for discussion purposes only and
            does not constitute a binding commitment to provide NMTC allocation
            or financing. Any commitment would be subject to: (i) satisfactory
            completion of due diligence, (ii) approval by all required parties,
            (iii) execution of definitive documentation, and (iv) all conditions
            precedent being satisfied or waived. This LOI is confidential and
            intended solely for the addressee.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.closing}>
            We look forward to working with you on this project.
          </Text>
          <Text style={styles.closing}>Sincerely,</Text>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {cdeContact || "Authorized Signatory"}
            </Text>
            <Text style={styles.signatureTitle}>{cdeName || "CDE"}</Text>
          </View>
        </View>

        {/* Acceptance */}
        <View style={styles.acceptanceSection}>
          <Text style={styles.acceptanceTitle}>Sponsor Acknowledgment</Text>
          <Text style={styles.acceptanceText}>
            By signing below, Sponsor acknowledges receipt of this Letter of
            Intent and agrees to the terms set forth herein, subject to the
            execution of definitive documentation.
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ width: "45%" }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Sponsor Signature</Text>
            </View>
            <View style={{ width: "45%" }}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated via tCredex | LOI #{loi.loi_number} |{" "}
            {formatDate(new Date().toISOString())} | CONFIDENTIAL
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateLOIPDF(
  loi: LOI,
  deal: Deal,
  cdeName?: string,
  cdeContact?: string,
): Promise<Blob> {
  const doc = (
    <LOIDocument
      loi={loi}
      deal={deal}
      cdeName={cdeName}
      cdeContact={cdeContact}
    />
  );
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function downloadLOIPDF(
  loi: LOI,
  deal: Deal,
  cdeName?: string,
  cdeContact?: string,
): Promise<void> {
  const blob = await generateLOIPDF(loi, deal, cdeName, cdeContact);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LOI_${loi.loi_number}_${deal.projectName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
