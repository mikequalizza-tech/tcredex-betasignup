'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import { Deal } from '@/lib/data/deals';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#6B7280',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dealName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  dealLocation: {
    fontSize: 9,
    color: '#6B7280',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
  },
  progressBar: {
    marginBottom: 25,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: '#374151',
    fontWeight: 'bold',
  },
  progressValue: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  sectionStatus: {
    fontSize: 9,
    color: '#6B7280',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 2,
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 10,
    color: '#111827',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 8,
    color: '#6B7280',
  },
  itemStatus: {
    width: 70,
    textAlign: 'right',
  },
  statusPending: {
    fontSize: 8,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  statusComplete: {
    fontSize: 8,
    color: '#10B981',
    fontWeight: 'bold',
  },
  statusRequired: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  notesLines: {
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
    height: 20,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#9CA3AF',
  },
});

interface ChecklistItem {
  label: string;
  description: string;
  status: 'pending' | 'complete' | 'required';
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

const getDefaultChecklist = (programType: string): ChecklistSection[] => {
  const commonSections: ChecklistSection[] = [
    {
      title: 'Due Diligence Documents',
      items: [
        { label: 'Corporate Documents', description: 'Articles of incorporation, bylaws, good standing certificates', status: 'required', checked: false },
        { label: 'Financial Statements', description: 'Audited financials for past 3 years', status: 'required', checked: false },
        { label: 'Project Pro Forma', description: 'Detailed sources and uses, cash flow projections', status: 'required', checked: false },
        { label: 'Title Commitment', description: 'Preliminary title report with all exceptions', status: 'pending', checked: false },
        { label: 'Environmental Reports', description: 'Phase I ESA, Phase II if applicable', status: 'required', checked: false },
        { label: 'Appraisal', description: 'MAI appraisal current within 6 months', status: 'pending', checked: false },
      ],
    },
    {
      title: 'Legal Documents',
      items: [
        { label: 'Operating Agreement', description: 'Investment entity operating agreement', status: 'required', checked: false },
        { label: 'Loan Documents', description: 'All loan agreements, notes, security instruments', status: 'required', checked: false },
        { label: 'Closing Opinions', description: 'Legal opinions from borrower counsel', status: 'required', checked: false },
        { label: 'Insurance Certificates', description: 'All required insurance coverage', status: 'pending', checked: false },
        { label: 'UCC Filings', description: 'UCC-1 financing statements', status: 'pending', checked: false },
      ],
    },
    {
      title: 'Closing Conditions',
      items: [
        { label: 'Investor Approval', description: 'Final investment committee approval', status: 'required', checked: false },
        { label: 'Funds Verification', description: 'Confirmation of available funds', status: 'required', checked: false },
        { label: 'Closing Statement', description: 'Final closing statement approved by all parties', status: 'pending', checked: false },
        { label: 'Wire Instructions', description: 'Verified wire transfer instructions', status: 'pending', checked: false },
      ],
    },
  ];

  // Program-specific sections
  const programSections: Record<string, ChecklistSection[]> = {
    NMTC: [
      {
        title: 'NMTC-Specific Requirements',
        items: [
          { label: 'CDE Allocation Letter', description: 'Allocation award from CDFI Fund', status: 'required', checked: false },
          { label: 'QALICB Certification', description: 'Business qualification certification', status: 'required', checked: false },
          { label: 'Census Tract Verification', description: 'LIC tract eligibility confirmation', status: 'required', checked: false },
          { label: 'Job Creation Plan', description: 'Projected jobs and community impact', status: 'pending', checked: false },
          { label: 'CDFI Fund Forms', description: 'Required CDFI Fund reporting forms', status: 'required', checked: false },
        ],
      },
    ],
    HTC: [
      {
        title: 'HTC-Specific Requirements',
        items: [
          { label: 'NPS Part 1 Approval', description: 'Historic significance certification', status: 'required', checked: false },
          { label: 'NPS Part 2 Approval', description: 'Rehabilitation plan approval', status: 'required', checked: false },
          { label: 'SHPO Correspondence', description: 'State Historic Preservation Office communications', status: 'pending', checked: false },
          { label: 'QRE Breakdown', description: 'Qualified Rehabilitation Expenditures detail', status: 'required', checked: false },
          { label: 'Architect Certification', description: 'Architect certification of compliance', status: 'pending', checked: false },
        ],
      },
    ],
    LIHTC: [
      {
        title: 'LIHTC-Specific Requirements',
        items: [
          { label: 'HFA Allocation', description: 'State housing finance agency allocation letter', status: 'required', checked: false },
          { label: 'LURA (Land Use)', description: 'Land Use Restriction Agreement', status: 'required', checked: false },
          { label: 'Rent Roll', description: 'Projected rent roll with AMI calculations', status: 'required', checked: false },
          { label: 'Market Study', description: 'Third-party market study', status: 'pending', checked: false },
          { label: 'Cost Certification', description: 'CPA cost certification (upon completion)', status: 'pending', checked: false },
        ],
      },
    ],
    OZ: [
      {
        title: 'Opportunity Zone Requirements',
        items: [
          { label: 'QOF Certification', description: 'Qualified Opportunity Fund self-certification', status: 'required', checked: false },
          { label: 'OZ Tract Verification', description: 'Census tract OZ designation confirmation', status: 'required', checked: false },
          { label: '180-Day Compliance', description: 'Investor gain recognition timing documentation', status: 'required', checked: false },
          { label: 'Substantial Improvement', description: 'Basis doubling plan (if applicable)', status: 'pending', checked: false },
          { label: 'Form 8996', description: 'Annual QOF certification form', status: 'pending', checked: false },
        ],
      },
    ],
  };

  return [...(programSections[programType] || []), ...commonSections];
}

interface ClosingChecklistPDFProps {
  deal: Deal;
  checklist?: ChecklistSection[];
  completedItems?: number;
  totalItems?: number;
}

export function ClosingChecklistDocument({ deal, checklist, completedItems, totalItems }: ClosingChecklistPDFProps) {
  const sections = checklist || getDefaultChecklist(deal.programType);
  const total = totalItems || sections.reduce((sum, s) => sum + s.items.length, 0);
  const completed = completedItems || sections.reduce((sum, s) => sum + s.items.filter(i => i.checked).length, 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>tCredex</Text>
            <Text style={styles.headerSubtitle}>Closing Room</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dealName}>{deal.projectName}</Text>
            <Text style={styles.dealLocation}>{deal.city}, {deal.state} | {deal.programType}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>CLOSING DOCUMENT CHECKLIST</Text>
        <Text style={styles.subtitle}>
          Deal ID: {deal.id} | Generated: {new Date().toLocaleDateString()}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Text style={styles.progressLabel}>Completion Progress</Text>
          <Text style={styles.progressValue}>{completed} / {total} ({progress}%)</Text>
        </View>

        {/* Checklist Sections */}
        {sections.map((section, sIndex) => (
          <View key={sIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionStatus}>
                {section.items.filter(i => i.checked).length} / {section.items.length} complete
              </Text>
            </View>
            {section.items.map((item, iIndex) => (
              <View key={iIndex} style={styles.checklistItem}>
                <View style={item.checked ? { ...styles.checkbox, ...styles.checkboxChecked } : styles.checkbox}>
                  {item.checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
                <View style={styles.itemStatus}>
                  <Text style={
                    item.status === 'complete' ? styles.statusComplete :
                    item.status === 'required' ? styles.statusRequired :
                    styles.statusPending
                  }>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>NOTES</Text>
          <View style={styles.notesLines} />
          <View style={styles.notesLines} />
          <View style={styles.notesLines} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            tCredex Closing Checklist | Sponsor: {deal.sponsorName}
          </Text>
          <Text style={styles.footerText}>CONFIDENTIAL</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateClosingChecklistPDF(deal: Deal, options?: Omit<ClosingChecklistPDFProps, 'deal'>): Promise<Blob> {
  const doc = <ClosingChecklistDocument deal={deal} {...options} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function downloadClosingChecklistPDF(deal: Deal, options?: Omit<ClosingChecklistPDFProps, 'deal'>): Promise<void> {
  const blob = await generateClosingChecklistPDF(deal, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${deal.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_ClosingChecklist.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
