"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Commitment } from "@/types/loi";
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
    borderBottomColor: "#10B981",
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 5,
  },
  logoSubtext: {
    fontSize: 10,
    color: "#6B7280",
  },
  dateSection: {
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateLeft: {
    flexDirection: "column",
  },
  dateRight: {
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
  statusBadge: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#10B981",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  recipientSection: {
    marginBottom: 25,
  },
  recipientLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 3,
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
    padding: 15,
    backgroundColor: "#ECFDF5",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  reLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 3,
  },
  reValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  reSubvalue: {
    fontSize: 11,
    color: "#374151",
    marginTop: 3,
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
  highlightText: {
    fontWeight: "bold",
    color: "#111827",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#10B981",
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
  termsRowHighlight: {
    backgroundColor: "#ECFDF5",
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
  termsValueBold: {
    fontWeight: "bold",
  },
  conditionsSection: {
    marginTop: 10,
  },
  conditionItem: {
    flexDirection: "row",
    marginBottom: 10,
    paddingLeft: 10,
  },
  conditionNumber: {
    width: 20,
    fontSize: 10,
    color: "#10B981",
    fontWeight: "bold",
  },
  conditionContent: {
    flex: 1,
  },
  conditionText: {
    fontSize: 10,
    color: "#374151",
  },
  conditionMeta: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 2,
  },
  partiesSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  partiesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  partyRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  partyLabel: {
    width: "25%",
    fontSize: 9,
    color: "#6B7280",
  },
  partyValue: {
    width: "75%",
    fontSize: 9,
    color: "#111827",
    fontWeight: "bold",
  },
  legalSection: {
    marginTop: 20,
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
    marginTop: 30,
  },
  closing: {
    fontSize: 11,
    color: "#111827",
    marginBottom: 25,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    height: 30,
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
  acceptanceBox: {
    marginTop: 20,
    padding: 15,
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 4,
    backgroundColor: "#F0FDF4",
  },
  acceptanceTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
    textTransform: "uppercase",
    textAlign: "center",
  },
  acceptanceText: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 15,
    lineHeight: 1.5,
    textAlign: "center",
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

interface CommitmentLetterPDFProps {
  commitment: Commitment;
  deal: Deal;
  investorName?: string;
  investorContact?: string;
}

export function CommitmentLetterDocument({
  commitment,
  deal,
  investorName,
  investorContact,
}: CommitmentLetterPDFProps) {
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

  const partyLabels: Record<string, string> = {
    sponsor: "Sponsor",
    cde: "CDE",
    investor: "Investor",
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          <Text style={styles.logo}>
            {investorName || "Tax Credit Investor"}
          </Text>
          <Text style={styles.logoSubtext}>Investment Commitment</Text>
        </View>

        {/* Date and Status */}
        <View style={styles.dateSection}>
          <View style={styles.dateLeft}>
            <Text style={styles.date}>
              {formatDate(commitment.issued_at || commitment.created_at)}
            </Text>
            <Text style={styles.documentLabel}>
              Commitment #{commitment.commitment_number}
            </Text>
          </View>
          <View style={styles.dateRight}>
            <Text style={styles.statusBadge}>
              {commitment.status === "all_accepted"
                ? "FULLY COMMITTED"
                : "COMMITMENT LETTER"}
            </Text>
          </View>
        </View>

        {/* Recipients */}
        <View style={styles.recipientSection}>
          <Text style={styles.recipientLabel}>TO:</Text>
          <Text style={styles.recipientName}>{deal.sponsorName}</Text>
          <Text style={styles.recipientAddress}>
            {deal.city}, {deal.state}
          </Text>
        </View>

        {/* RE: Section */}
        <View style={styles.reSection}>
          <Text style={styles.reLabel}>
            RE: {commitment.credit_type} Investment Commitment
          </Text>
          <Text style={styles.reValue}>{deal.projectName}</Text>
          <Text style={styles.reSubvalue}>
            Investment: {formatCurrency(commitment.investment_amount)} |
            Pricing: $
            {(commitment.pricing_cents_per_credit
              ? commitment.pricing_cents_per_credit / 100
              : 0
            ).toFixed(2)}
            /credit
          </Text>
        </View>

        {/* Opening */}
        <Text style={styles.greeting}>Dear {deal.sponsorName}:</Text>

        <Text style={styles.bodyText}>
          {investorName || "The Investor"} is pleased to confirm our commitment
          to invest in the {commitment.credit_type} tax credits generated by the
          above-referenced project, subject to the terms and conditions set
          forth below.
        </Text>

        {/* Investment Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Terms</Text>
          <View style={styles.termsTable}>
            <View style={[styles.termsRow, styles.termsRowHighlight]}>
              <Text style={styles.termsLabel}>Investment Amount</Text>
              <Text style={[styles.termsValue, styles.termsValueBold]}>
                {formatCurrency(commitment.investment_amount)}
              </Text>
            </View>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>Credit Type</Text>
              <Text style={styles.termsValue}>{commitment.credit_type}</Text>
            </View>
            {commitment.credit_rate && (
              <View style={styles.termsRow}>
                <Text style={styles.termsLabel}>Credit Rate</Text>
                <Text style={styles.termsValue}>{commitment.credit_rate}%</Text>
              </View>
            )}
            {commitment.expected_credits && (
              <View style={styles.termsRow}>
                <Text style={styles.termsLabel}>Expected Credits</Text>
                <Text style={styles.termsValue}>
                  {formatCurrency(commitment.expected_credits)}
                </Text>
              </View>
            )}
            <View style={[styles.termsRow, styles.termsRowHighlight]}>
              <Text style={styles.termsLabel}>Pricing</Text>
              <Text style={[styles.termsValue, styles.termsValueBold]}>
                $
                {(commitment.pricing_cents_per_credit
                  ? commitment.pricing_cents_per_credit / 100
                  : 0
                ).toFixed(4)}{" "}
                per credit dollar
              </Text>
            </View>
            {commitment.net_benefit_to_project && (
              <View style={styles.termsRow}>
                <Text style={styles.termsLabel}>Net Benefit to Project</Text>
                <Text style={styles.termsValue}>
                  {formatCurrency(commitment.net_benefit_to_project)}
                </Text>
              </View>
            )}
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>Target Closing</Text>
              <Text style={styles.termsValue}>
                {commitment.target_closing_date
                  ? formatDate(commitment.target_closing_date)
                  : "To be determined"}
              </Text>
            </View>
            <View style={styles.termsRow}>
              <Text style={styles.termsLabel}>Commitment Expiration</Text>
              <Text style={styles.termsValue}>
                {commitment.expires_at
                  ? formatDate(commitment.expires_at)
                  : "90 days from date of this letter"}
              </Text>
            </View>
            <View style={styles.termsRowLast}>
              <Text style={styles.termsLabel}>CRA Eligible</Text>
              <Text style={styles.termsValue}>
                {commitment.cra_eligible ? "Yes" : "No"}
              </Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {commitment.conditions && commitment.conditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conditions to Closing</Text>
            <Text style={styles.bodyText}>
              This commitment is subject to the satisfaction of the following
              conditions:
            </Text>
            <View style={styles.conditionsSection}>
              {commitment.conditions.map((condition, index) => (
                <View key={condition.id} style={styles.conditionItem}>
                  <Text style={styles.conditionNumber}>{index + 1}.</Text>
                  <View style={styles.conditionContent}>
                    <Text style={styles.conditionText}>
                      {condition.description}
                    </Text>
                    <Text style={styles.conditionMeta}>
                      Responsible:{" "}
                      {partyLabels[condition.responsible_party] ||
                        condition.responsible_party}
                      {condition.due_date &&
                        ` | Due: ${formatDate(condition.due_date)}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Special Terms */}
        {commitment.special_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Terms</Text>
            <Text style={styles.bodyText}>{commitment.special_terms}</Text>
          </View>
        )}

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Binding Commitment</Text>
          <Text style={styles.legalText}>
            Upon acceptance by all parties, this commitment letter constitutes a
            binding obligation to consummate the investment transaction
            described herein, subject to the satisfaction of the conditions
            precedent set forth above. This commitment may only be modified by
            written agreement of all parties.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <Text style={styles.closing}>
            Please indicate your acceptance by signing below.
          </Text>

          {/* Investor Signature */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>INVESTOR:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>
                {investorContact || "Authorized Signatory"}
              </Text>
              <Text style={styles.signatureTitle}>
                {investorName || "Investor"}
              </Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>DATE:</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        {/* Acceptance Box */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceTitle}>Acceptance</Text>
          <Text style={styles.acceptanceText}>
            The undersigned hereby accepts the terms of this Commitment Letter.
          </Text>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>SPONSOR:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>{deal.sponsorName}</Text>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>DATE:</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated via tCredex | Commitment #{commitment.commitment_number} |{" "}
            {formatDate(new Date().toISOString())} | CONFIDENTIAL
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateCommitmentLetterPDF(
  commitment: Commitment,
  deal: Deal,
  investorName?: string,
  investorContact?: string,
): Promise<Blob> {
  const doc = (
    <CommitmentLetterDocument
      commitment={commitment}
      deal={deal}
      investorName={investorName}
      investorContact={investorContact}
    />
  );
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function downloadCommitmentLetterPDF(
  commitment: Commitment,
  deal: Deal,
  investorName?: string,
  investorContact?: string,
): Promise<void> {
  const blob = await generateCommitmentLetterPDF(
    commitment,
    deal,
    investorName,
    investorContact,
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Commitment_${commitment.commitment_number}_${deal.projectName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
