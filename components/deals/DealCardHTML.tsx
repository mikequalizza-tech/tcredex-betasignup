'use client';

/**
 * DealCardHTML - Compact 3.5x5.5 Deal Card for PDF export
 * Light theme with purple gradient banner
 * Uses inline styles for PDF compatibility with html2pdf
 */

interface DealCardHTMLProps {
  deal: {
    id: string;
    projectName?: string;
    sponsorName?: string;
    city?: string;
    state?: string;
    zip?: string;
    address?: string;
    censusTract?: string;
    povertyRate?: number;
    medianIncome?: number;
    unemployment?: number;
    projectCost?: number;
    allocation?: number;
    stateNMTCAllocation?: number;
    htcAmount?: number;
    shovelReady?: boolean;
    completionDate?: string;
    financingGap?: number;
    totalSources?: number;
    totalUses?: number;
    sources?: Array<{ name: string; amount: number }>;
    uses?: Array<{ name: string; amount: number }>;
    submittedDate?: string;
    programType?: 'NMTC' | 'HTC' | 'LIHTC' | 'OZ' | 'Brownfield' | string;
    status?: string;
    tractEligible?: boolean;
    tractSeverelyDistressed?: boolean;
  };
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || amount === 0) return '—';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '—';
  return `${value.toFixed(1)}%`;
};

const formatDate = (date: string | undefined | null) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
};

const generateDealId = (id: string) => {
  // Extract numeric portion or use first 8 chars
  const shortId = id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  return shortId || id.slice(0, 8);
};

export default function DealCardHTML({ deal }: DealCardHTMLProps) {
  const sources = deal.sources || [];
  const uses = deal.uses || [];
  const totalSources = deal.totalSources || sources.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalUses = deal.totalUses || uses.reduce((sum, u) => sum + (u.amount || 0), 0);

  // Styles object for consistency
  const styles = {
    card: {
      width: '336px', // 3.5 inches at 96dpi
      height: '528px', // 5.5 inches at 96dpi
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: '6px',
      overflow: 'hidden',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
    },
    bannerTop: {
      background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #4c51bf 100%)',
      padding: '10px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dealIdBadge: {
      color: '#c7d2fe',
      fontSize: '6.5pt',
      fontWeight: 700,
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.2)',
      padding: '2px 6px',
      borderRadius: '4px',
    },
    cardContent: {
      flex: 1,
      padding: '12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '5px',
    },
    cardType: {
      fontSize: '8pt',
      fontWeight: 800,
      color: '#64748b',
      textTransform: 'uppercase' as const,
      marginBottom: '1px',
      letterSpacing: '0.5px',
    },
    projTitle: {
      fontSize: '10pt',
      fontWeight: 900,
      color: '#0f172a',
      lineHeight: 1.1,
      marginBottom: '1px',
    },
    projSubtitle: {
      fontSize: '7pt',
      fontWeight: 600,
      color: '#475569',
      borderBottom: '1px solid #e2e8f0',
      paddingBottom: '4px',
      lineHeight: 1.2,
    },
    sectionHead: {
      fontSize: '6.5pt',
      fontWeight: 800,
      color: '#1e1b4b',
      textTransform: 'uppercase' as const,
      marginBottom: '3px',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #f1f5f9',
    },
    fieldLabel: {
      fontSize: '5pt',
      fontWeight: 700,
      color: '#94a3b8',
      textTransform: 'uppercase' as const,
      marginBottom: '1px',
    },
    fieldValue: {
      fontSize: '7.5pt',
      fontWeight: 800,
      color: '#0f172a',
      whiteSpace: 'nowrap' as const,
    },
    bigNum: {
      fontSize: '9pt',
    },
    hlBlue: {
      color: '#312e81',
    },
    hlAlert: {
      color: '#b45309',
    },
    hlYes: {
      color: '#059669',
    },
    miniTable: {
      width: '100%',
      fontSize: '5.5pt',
      borderCollapse: 'collapse' as const,
      marginBottom: '1px',
    },
    miniTableTd: {
      padding: 0,
      color: '#475569',
      borderBottom: '1px dashed #f1f5f9',
      verticalAlign: 'top' as const,
    },
    miniTableAmt: {
      textAlign: 'right' as const,
      fontWeight: 700,
      color: '#0f172a',
      whiteSpace: 'nowrap' as const,
    },
    miniTotal: {
      borderTop: '1px solid #cbd5e1',
      fontWeight: 800,
      textAlign: 'right' as const,
      color: '#312e81',
      fontSize: '6pt',
      paddingTop: '1px',
    },
    cardFooter: {
      marginTop: 'auto',
      paddingTop: '5px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    contactInfo: {
      fontSize: '6.5pt',
      fontWeight: 600,
      color: '#64748b',
      lineHeight: 1.2,
    },
    contactLink: {
      color: '#312e81',
      textDecoration: 'none',
      fontWeight: 700,
    },
  };

  // Tree/Building Logo SVG
  const TreeBuildingLogo = () => (
    <svg width="22" height="28" viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.8 }}>
      <path fill="#6E9D87" d="M100,430Q200,530 300,430L280,430Q200,500 120,430Z"/>
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
  );

  return (
    <div id="deal-card-html" style={styles.card}>
      {/* Purple Gradient Banner */}
      <div style={styles.bannerTop}>
        <svg width="80" height="18" viewBox="0 0 140 30" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="24" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="26" fill="#ffffff">tCredex</text>
          <circle cx="95" cy="14" r="3" fill="#38bdf8"/>
        </svg>
        <div style={styles.dealIdBadge}># {generateDealId(deal.id)}</div>
      </div>

      <div style={styles.cardContent}>
        {/* Header Section */}
        <div>
          <div style={styles.cardType}>tCredex.com DEAL CARD Summary</div>
          <div style={styles.projTitle}>{deal.projectName || 'Untitled Project'}</div>
          <div style={styles.projSubtitle}>
            {deal.sponsorName || '—'}<br/>
            {deal.address || '—'} | {deal.city}, {deal.state} {deal.zip || ''}
          </div>
        </div>

        {/* Financial Overview */}
        <div>
          <div style={styles.sectionHead}>Financial Overview</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px 8px',
            background: '#f8fafc',
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Total Project Cost</span>
              <span style={{ ...styles.fieldValue, ...styles.bigNum, ...styles.hlBlue }}>
                {formatCurrency(deal.projectCost)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Financing Gap</span>
              <span style={{ ...styles.fieldValue, ...styles.bigNum, ...styles.hlAlert }}>
                {formatCurrency(deal.financingGap)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Fed NMTC Req</span>
              <span style={styles.fieldValue}>{formatCurrency(deal.allocation)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>State NMTC Req</span>
              <span style={styles.fieldValue}>{formatCurrency(deal.stateNMTCAllocation)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
              <span style={styles.fieldLabel}>Total HTC Avail.</span>
              <span style={styles.fieldValue}>{formatCurrency(deal.htcAmount)}</span>
            </div>
          </div>
        </div>

        {/* Project Vitals & Demographics */}
        <div>
          <div style={styles.sectionHead}>Project Vitals & Demographics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Shovel Ready</span>
              <span style={{ ...styles.fieldValue, ...styles.hlYes }}>
                {deal.shovelReady ? 'Yes' : 'No'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Completion</span>
              <span style={styles.fieldValue}>{formatDate(deal.completionDate)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Tract ID</span>
              <span style={{ ...styles.fieldValue, fontSize: '7pt' }}>{deal.censusTract || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Status</span>
              <span style={{ ...styles.fieldValue, ...styles.hlAlert, fontSize: '7pt' }}>
                {deal.status || '—'}
              </span>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '4px 4px',
            marginTop: '4px',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '3px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Poverty</span>
              <span style={styles.fieldValue}>{formatPercent(deal.povertyRate)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Med Inc</span>
              <span style={styles.fieldValue}>{formatPercent(deal.medianIncome)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.fieldLabel}>Unemp</span>
              <span style={styles.fieldValue}>{formatPercent(deal.unemployment)}</span>
            </div>
          </div>
        </div>

        {/* Sources & Uses Section */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Sources */}
            <div>
              <div style={{ ...styles.sectionHead, fontSize: '6pt', border: 'none', marginBottom: '1px' }}>
                Sources
              </div>
              <table style={styles.miniTable}>
                <tbody>
                  {sources.length > 0 ? (
                    sources.slice(0, 2).map((source, idx) => (
                      <tr key={idx}>
                        <td style={styles.miniTableTd}>{source.name}</td>
                        <td style={{ ...styles.miniTableTd, ...styles.miniTableAmt }}>
                          {formatCurrency(source.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={styles.miniTableTd}>—</td>
                      <td style={{ ...styles.miniTableTd, ...styles.miniTableAmt }}>—</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2}>
                      <div style={styles.miniTotal}>Total: {formatCurrency(totalSources)}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Uses */}
            <div>
              <div style={{ ...styles.sectionHead, fontSize: '6pt', border: 'none', marginBottom: '1px' }}>
                Uses
              </div>
              <table style={styles.miniTable}>
                <tbody>
                  {uses.length > 0 ? (
                    uses.slice(0, 2).map((use, idx) => (
                      <tr key={idx}>
                        <td style={styles.miniTableTd}>{use.name}</td>
                        <td style={{ ...styles.miniTableTd, ...styles.miniTableAmt }}>
                          {formatCurrency(use.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={styles.miniTableTd}>—</td>
                      <td style={{ ...styles.miniTableTd, ...styles.miniTableAmt }}>—</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2}>
                      <div style={styles.miniTotal}>Total: {formatCurrency(totalUses)}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.cardFooter}>
          <div style={styles.contactInfo}>
            Request More Information:<br/>
            tcredex.com<br/>
            <a href="mailto:Info@tCredex.com" style={styles.contactLink}>Info@tCredex.com</a>
          </div>
          <TreeBuildingLogo />
        </div>
      </div>
    </div>
  );
}
