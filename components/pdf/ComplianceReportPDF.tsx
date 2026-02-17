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
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5",
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: {
    flexDirection: "column",
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 9,
    color: "#6B7280",
  },
  reportInfo: {
    alignItems: "flex-end",
  },
  reportDate: {
    fontSize: 9,
    color: "#6B7280",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  statusBanner: {
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusCompliant: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  statusWarning: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  statusNonCompliant: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  statusCompliantText: {
    color: "#065F46",
  },
  statusWarningText: {
    color: "#92400E",
  },
  statusNonCompliantText: {
    color: "#991B1B",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6B7280",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: "#374151",
  },
  tableCellWide: {
    flex: 2,
  },
  tableCellNarrow: {
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  dotGreen: {
    backgroundColor: "#10B981",
  },
  dotYellow: {
    backgroundColor: "#F59E0B",
  },
  dotRed: {
    backgroundColor: "#EF4444",
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
    marginRight: 10,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 2,
  },
  timelineEvent: {
    fontSize: 9,
    color: "#111827",
  },
  recommendationsBox: {
    backgroundColor: "#EEF2FF",
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  recommendationBullet: {
    fontSize: 9,
    color: "#4F46E5",
    marginRight: 5,
  },
  recommendationText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#9CA3AF",
    textAlign: "center",
  },
  signoffSection: {
    marginTop: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
  },
  signoffTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },
  signoffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signoffBox: {
    width: "45%",
  },
  signoffLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    height: 25,
    marginBottom: 4,
  },
  signoffLabel: {
    fontSize: 8,
    color: "#6B7280",
  },
});

interface ComplianceMetric {
  name: string;
  requirement: string;
  actual: string;
  status: "compliant" | "warning" | "non-compliant";
}

interface ComplianceEvent {
  date: string;
  event: string;
}

interface ComplianceReportData {
  reportingPeriod: string;
  overallStatus: "compliant" | "warning" | "non-compliant";
  metrics: ComplianceMetric[];
  events: ComplianceEvent[];
  recommendations: string[];
  preparedBy?: string;
  reviewedBy?: string;
}

const getDefaultComplianceData = (deal: Deal): ComplianceReportData => {
  const programMetrics: Record<string, ComplianceMetric[]> = {
    NMTC: [
      {
        name: "QLICI Investment",
        requirement: "≥85% of QEI",
        actual: "92%",
        status: "compliant",
      },
      {
        name: "QALICB Status",
        requirement: "Maintained",
        actual: "Active",
        status: "compliant",
      },
      {
        name: "LIC Location",
        requirement: "In qualified tract",
        actual: "Verified",
        status: "compliant",
      },
      {
        name: "Employment Test",
        requirement: "40% in LIC",
        actual: "65%",
        status: "compliant",
      },
      {
        name: "Gross Income Test",
        requirement: "50% from LIC",
        actual: "78%",
        status: "compliant",
      },
      {
        name: "Sin Business Test",
        requirement: "No prohibited uses",
        actual: "Pass",
        status: "compliant",
      },
    ],
    HTC: [
      {
        name: "Historic Character",
        requirement: "Preserved",
        actual: "Verified",
        status: "compliant",
      },
      {
        name: "QRE Expenditures",
        requirement: "Per approved plans",
        actual: "On track",
        status: "compliant",
      },
      {
        name: "NPS Standards",
        requirement: "Met",
        actual: "Compliant",
        status: "compliant",
      },
      {
        name: "Ownership Continuity",
        requirement: "5 year hold",
        actual: "Year 2",
        status: "compliant",
      },
    ],
    LIHTC: [
      {
        name: "Income Limits",
        requirement: "≤60% AMI",
        actual: "All qualified",
        status: "compliant",
      },
      {
        name: "Rent Limits",
        requirement: "≤30% of limit",
        actual: "Compliant",
        status: "compliant",
      },
      {
        name: "Occupancy Rate",
        requirement: "≥95%",
        actual: "97%",
        status: "compliant",
      },
      {
        name: "Set-Aside Test",
        requirement: "40% at 60%",
        actual: "Met",
        status: "compliant",
      },
      {
        name: "Physical Standards",
        requirement: "HQS compliant",
        actual: "Passed",
        status: "compliant",
      },
    ],
    OZ: [
      {
        name: "90% Asset Test",
        requirement: "≥90% in QOZP",
        actual: "94%",
        status: "compliant",
      },
      {
        name: "70% Tangible Property",
        requirement: "≥70% in zone",
        actual: "85%",
        status: "compliant",
      },
      {
        name: "Substantial Improvement",
        requirement: "Basis doubled",
        actual: "Completed",
        status: "compliant",
      },
      {
        name: "Working Capital",
        requirement: "31-month safe harbor",
        actual: "On schedule",
        status: "compliant",
      },
    ],
  };

  return {
    reportingPeriod: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
    overallStatus: "compliant",
    metrics: programMetrics[deal.programType] || programMetrics.NMTC,
    events: [
      {
        date: new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString(),
        event: "Quarterly compliance review completed",
      },
      {
        date: new Date(
          Date.now() - 180 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString(),
        event: "Annual audit completed - no findings",
      },
      {
        date: new Date(
          Date.now() - 365 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString(),
        event: "Initial closing and compliance period started",
      },
    ],
    recommendations: [
      "Continue quarterly monitoring of key compliance metrics",
      "Maintain comprehensive documentation for annual reporting",
      "Schedule next site visit within 60 days",
    ],
  };
};

interface ComplianceReportPDFProps {
  deal: Deal;
  complianceData?: ComplianceReportData;
}

export function ComplianceReportDocument({
  deal,
  complianceData,
}: ComplianceReportPDFProps) {
  const data = complianceData || getDefaultComplianceData(deal);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "compliant":
        return {
          banner: styles.statusCompliant,
          text: styles.statusCompliantText,
          dot: styles.dotGreen,
        };
      case "warning":
        return {
          banner: styles.statusWarning,
          text: styles.statusWarningText,
          dot: styles.dotYellow,
        };
      case "non-compliant":
        return {
          banner: styles.statusNonCompliant,
          text: styles.statusNonCompliantText,
          dot: styles.dotRed,
        };
      default:
        return {
          banner: styles.statusCompliant,
          text: styles.statusCompliantText,
          dot: styles.dotGreen,
        };
    }
  };

  const statusStyles = getStatusStyle(data.overallStatus);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>tCredex</Text>
            <Text style={styles.headerSubtitle}>Compliance Management</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportDate}>
              Report Date: {new Date().toLocaleDateString()}
            </Text>
            <Text style={styles.reportDate}>
              Period: {data.reportingPeriod}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{deal.programType} COMPLIANCE REPORT</Text>
        <Text style={styles.subtitle}>
          {deal.projectName} | {deal.city}, {deal.state}
        </Text>

        {/* Status Banner */}
        <View style={[styles.statusBanner, statusStyles.banner]}>
          <Text style={[styles.statusLabel, statusStyles.text]}>
            Overall Compliance Status
          </Text>
          <Text style={[styles.statusValue, statusStyles.text]}>
            {data.overallStatus.toUpperCase()}
          </Text>
        </View>

        {/* Project Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Summary</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Deal ID</Text>
              <Text style={styles.infoValue}>{deal.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Program Type</Text>
              <Text style={styles.infoValue}>
                {deal.programType} - {deal.programLevel}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Allocation</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(deal.allocation)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sponsor</Text>
              <Text style={styles.infoValue}>{deal.sponsorName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Census Tract</Text>
              <Text style={styles.infoValue}>{deal.censusTract || "N/A"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Tract Types</Text>
              <Text style={styles.infoValue}>{deal.tractType.join(", ")}</Text>
            </View>
          </View>
        </View>

        {/* Compliance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Metrics</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableCellWide]}>
                Metric
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellNarrow]}>
                Requirement
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellNarrow]}>
                Actual
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableCellNarrow]}>
                Status
              </Text>
            </View>
            {data.metrics.map((metric, index) => (
              <View
                key={index}
                style={
                  index === data.metrics.length - 1
                    ? styles.tableRowLast
                    : styles.tableRow
                }
              >
                <Text style={[styles.tableCell, styles.tableCellWide]}>
                  {metric.name}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellNarrow]}>
                  {metric.requirement}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellNarrow]}>
                  {metric.actual}
                </Text>
                <View
                  style={[
                    styles.tableCell,
                    styles.tableCellNarrow,
                    { flexDirection: "row", alignItems: "center" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      getStatusStyle(metric.status).dot,
                    ]}
                  />
                  <Text style={{ fontSize: 9 }}>{metric.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Compliance Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Timeline</Text>
          <View style={styles.timeline}>
            {data.events.map((event, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>{event.date}</Text>
                  <Text style={styles.timelineEvent}>{event.event}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsBox}>
          <Text style={styles.recommendationTitle}>Recommendations</Text>
          {data.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Sign-off Section */}
        <View style={styles.signoffSection}>
          <Text style={styles.signoffTitle}>Report Sign-Off</Text>
          <View style={styles.signoffRow}>
            <View style={styles.signoffBox}>
              <View style={styles.signoffLine} />
              <Text style={styles.signoffLabel}>Prepared By / Date</Text>
            </View>
            <View style={styles.signoffBox}>
              <View style={styles.signoffLine} />
              <Text style={styles.signoffLabel}>Reviewed By / Date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            tCredex Compliance Report | Generated: {new Date().toLocaleString()}{" "}
            | CONFIDENTIAL
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateComplianceReportPDF(
  deal: Deal,
  complianceData?: ComplianceReportData,
): Promise<Blob> {
  const doc = (
    <ComplianceReportDocument deal={deal} complianceData={complianceData} />
  );
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function downloadComplianceReportPDF(
  deal: Deal,
  complianceData?: ComplianceReportData,
): Promise<void> {
  const blob = await generateComplianceReportPDF(deal, complianceData);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${deal.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_ComplianceReport.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
