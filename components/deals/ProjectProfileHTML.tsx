"use client";

import React from "react";

interface ProjectProfileData {
  // Organization/Sponsor
  parentOrganization: string;
  projectName: string;

  // Location
  address: string;
  city: string;
  state: string;
  censusTract: string;

  // Tract Data
  povertyRate?: number;
  medianIncome?: number;
  unemploymentRate?: number;

  // Financials
  totalProjectCost: number;
  nmtcRequest?: number;
  stateNmtcRequest?: number;
  htcAmount?: number;
  financingGap?: number;

  // Status
  isShovelReady: boolean;
  projectedCompletion?: string;

  // Sources & Uses
  sources: { name: string; amount: number }[];
  uses: { name: string; amount: number }[];

  // Project Info
  projectNumber?: string;
  projectDescription: string;
  communityImpact: string;

  // Impact Metrics
  jobsCreated?: number;
  constructionJobs?: number;
  permanentJobs?: number;

  // Featured Image
  featuredImageUrl?: string;

  // Contact
  contactEmail?: string;
  contactPhone?: string;

  // Deal ID
  dealId?: string;

  // About Sponsor
  sponsorContactName?: string;
  sponsorDescription?: string;
  sponsorWebsite?: string;
  sponsorYearFounded?: string;
  organizationType?: string;
  womanOwned?: boolean;
  minorityOwned?: boolean;
  veteranOwned?: boolean;
  lowIncomeOwned?: boolean;
}

interface ProjectProfileHTMLProps {
  data: ProjectProfileData;
  forPdf?: boolean;
}

/**
 * ProjectProfileHTML - Renders the Project Profile as HTML for PDF generation
 *
 * New polished design with narrow purple gradient sidebar (1.8in)
 * and maximized content area for project narrative
 */
export default function ProjectProfileHTML({
  data,
  forPdf = false,
}: ProjectProfileHTMLProps) {
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatDate = (dateStr?: string): string => {
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
  };

  const totalSources = data.sources.reduce((sum, s) => sum + s.amount, 0);
  const totalUses = data.uses.reduce((sum, u) => sum + u.amount, 0);

  // Generate deal ID display
  const dealIdDisplay = data.dealId
    ? `tcredex.com_${new Date().getFullYear()}-${data.dealId.slice(-4)}`
    : data.projectNumber || "—";

  return (
    <div
      style={{
        margin: 0,
        padding: forPdf ? 0 : "40px",
        backgroundColor: forPdf ? "#fff" : "#525659",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "8.5in",
          height: "11in",
          backgroundColor: "white",
          display: "flex",
          boxShadow: forPdf ? "none" : "0 0 30px rgba(0,0,0,0.6)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* NARROW SIDEBAR (1.8in) */}
        <div
          style={{
            width: "1.8in",
            background:
              "linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4c51bf 100%)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            padding: "0.1in",
            flexShrink: 0,
            fontSize: "7pt",
          }}
        >
          {/* Logo Top */}
          <div
            style={{
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <svg
              width="100%"
              height="30"
              viewBox="0 0 140 30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <text
                x="0"
                y="24"
                fontFamily="Arial, sans-serif"
                fontWeight="900"
                fontSize="24"
                fill="#ffffff"
              >
                tCredex
              </text>
              <circle cx="95" cy="14" r="3" fill="#38bdf8" />
            </svg>
          </div>

          {/* Deal Stats Header */}
          <div
            style={{
              fontSize: "7pt",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#a5b4fc",
              marginBottom: "2px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Deal Stats
          </div>

          {/* Parent Org */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "7.5pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Parent Org
            </span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "7.5pt" }}>
              {data.parentOrganization}
            </span>
          </div>

          {/* Project */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Project
            </span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}>
              {data.projectName}
            </span>
          </div>

          {/* Location */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Location
            </span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}>
              {data.address && (
                <>
                  {data.address}
                  <br />
                </>
              )}
              {data.city}, {data.state}
            </span>
          </div>

          {/* Census Tract */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Census Tract
            </span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}>
              {data.censusTract || "—"}
            </span>
          </div>

          {/* Demographics Header */}
          <div
            style={{
              fontSize: "7pt",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#a5b4fc",
              marginTop: "8px",
              marginBottom: "2px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Demographics
          </div>

          {/* Poverty */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "2px",
              paddingLeft: "4px",
              borderLeft: "2px solid #818cf8",
            }}
          >
            <span style={{ fontSize: "6pt", color: "#c7d2fe" }}>Poverty</span>
            <span style={{ fontSize: "6.5pt", color: "#fff", fontWeight: 600 }}>
              {data.povertyRate ?? "—"}%
            </span>
          </div>

          {/* Med Inc */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "2px",
              paddingLeft: "4px",
              borderLeft: "2px solid #818cf8",
            }}
          >
            <span style={{ fontSize: "6pt", color: "#c7d2fe" }}>Med Inc</span>
            <span style={{ fontSize: "6.5pt", color: "#fff", fontWeight: 600 }}>
              {data.medianIncome ?? "—"}% MFI
            </span>
          </div>

          {/* Unemp */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "2px",
              paddingLeft: "4px",
              borderLeft: "2px solid #818cf8",
            }}
          >
            <span style={{ fontSize: "6pt", color: "#c7d2fe" }}>Unemp</span>
            <span style={{ fontSize: "6.5pt", color: "#fff", fontWeight: 600 }}>
              {data.unemploymentRate ?? "—"}%
            </span>
          </div>

          {/* Financials Header */}
          <div
            style={{
              fontSize: "7pt",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#a5b4fc",
              marginTop: "8px",
              marginBottom: "2px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Financials
          </div>

          {/* Total Cost */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Total Cost
            </span>
            <span
              style={{ color: "#38bdf8", fontWeight: 600, fontSize: "7.5pt" }}
            >
              {formatCurrency(data.totalProjectCost)}
            </span>
          </div>

          {/* Fed NMTC Req */}
          {data.nmtcRequest !== undefined && data.nmtcRequest > 0 && (
            <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
              <span
                style={{
                  color: "#c7d2fe",
                  fontSize: "6pt",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Fed NMTC Req
              </span>
              <span
                style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}
              >
                {formatCurrency(data.nmtcRequest)}
              </span>
            </div>
          )}

          {/* State NMTC Req */}
          {data.stateNmtcRequest !== undefined && data.stateNmtcRequest > 0 && (
            <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
              <span
                style={{
                  color: "#c7d2fe",
                  fontSize: "6pt",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                State NMTC Req
              </span>
              <span
                style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}
              >
                {formatCurrency(data.stateNmtcRequest)}
              </span>
            </div>
          )}

          {/* Total HTC */}
          {data.htcAmount !== undefined && data.htcAmount > 0 && (
            <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
              <span
                style={{
                  color: "#c7d2fe",
                  fontSize: "6pt",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Total HTC
              </span>
              <span
                style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}
              >
                {formatCurrency(data.htcAmount)}
              </span>
            </div>
          )}

          {/* Financing Gap */}
          {data.financingGap !== undefined && data.financingGap > 0 && (
            <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
              <span
                style={{
                  color: "#c7d2fe",
                  fontSize: "6pt",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Financing Gap
              </span>
              <span
                style={{ color: "#facc15", fontWeight: 600, fontSize: "7.5pt" }}
              >
                {formatCurrency(data.financingGap)}
              </span>
            </div>
          )}

          {/* Shovel Ready */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Shovel Ready
            </span>
            <span
              style={{
                color: data.isShovelReady ? "#4ade80" : "#facc15",
                fontWeight: 600,
                fontSize: "7.5pt",
              }}
            >
              {data.isShovelReady ? "YES" : "NO"}
            </span>
          </div>

          {/* Completion */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Completion
            </span>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}>
              {formatDate(data.projectedCompletion)}
            </span>
          </div>

          {/* Deal ID */}
          <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
            <span
              style={{
                color: "#c7d2fe",
                fontSize: "6pt",
                fontWeight: 700,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              Deal ID
            </span>
            <span
              style={{
                fontFamily: "monospace",
                color: "#a5b4fc",
                fontSize: "7pt",
              }}
            >
              {dealIdDisplay}
            </span>
          </div>

          {/* Jobs / Impact Header */}
          {(data.jobsCreated ||
            data.permanentJobs ||
            data.constructionJobs) && (
            <>
              <div
                style={{
                  fontSize: "7pt",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#a5b4fc",
                  marginTop: "8px",
                  marginBottom: "2px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Jobs Created
              </div>
              {(data.permanentJobs || data.jobsCreated) && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                    paddingLeft: "4px",
                    borderLeft: "2px solid #4ade80",
                  }}
                >
                  <span style={{ fontSize: "6pt", color: "#c7d2fe" }}>
                    Permanent
                  </span>
                  <span
                    style={{
                      fontSize: "6.5pt",
                      color: "#4ade80",
                      fontWeight: 700,
                    }}
                  >
                    {data.permanentJobs || data.jobsCreated}
                  </span>
                </div>
              )}
              {data.constructionJobs && data.constructionJobs > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                    paddingLeft: "4px",
                    borderLeft: "2px solid #38bdf8",
                  }}
                >
                  <span style={{ fontSize: "6pt", color: "#c7d2fe" }}>
                    Construction
                  </span>
                  <span
                    style={{
                      fontSize: "6.5pt",
                      color: "#38bdf8",
                      fontWeight: 700,
                    }}
                  >
                    {data.constructionJobs}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Sources Header */}
          {data.sources.length > 0 && (
            <>
              <div
                style={{
                  fontSize: "7pt",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#a5b4fc",
                  marginTop: "8px",
                  marginBottom: "2px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Sources
              </div>
              <table
                style={{
                  width: "100%",
                  fontSize: "6pt",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  {data.sources.slice(0, 4).map((s, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: 0,
                          color: "#c7d2fe",
                          verticalAlign: "top",
                        }}
                      >
                        {s.name}
                      </td>
                      <td
                        style={{
                          padding: 0,
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(s.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2}>
                      <div
                        style={{
                          borderTop: "1px solid #818cf8",
                          marginTop: "2px",
                          paddingTop: "1px",
                          fontWeight: 700,
                          textAlign: "right",
                          color: "#38bdf8",
                          fontSize: "6.5pt",
                        }}
                      >
                        Total: {formatCurrency(totalSources)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Uses Header */}
          {data.uses.length > 0 && (
            <>
              <div
                style={{
                  fontSize: "7pt",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#a5b4fc",
                  marginTop: "8px",
                  marginBottom: "2px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Uses
              </div>
              <table
                style={{
                  width: "100%",
                  fontSize: "6pt",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  {data.uses.slice(0, 4).map((u, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: 0,
                          color: "#c7d2fe",
                          verticalAlign: "top",
                        }}
                      >
                        {u.name}
                      </td>
                      <td
                        style={{
                          padding: 0,
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(u.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2}>
                      <div
                        style={{
                          borderTop: "1px solid #818cf8",
                          marginTop: "2px",
                          paddingTop: "1px",
                          fontWeight: 700,
                          textAlign: "right",
                          color: "#38bdf8",
                          fontSize: "6.5pt",
                        }}
                      >
                        Total: {formatCurrency(totalUses)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Certifications */}
          {(data.womanOwned ||
            data.minorityOwned ||
            data.veteranOwned ||
            data.lowIncomeOwned ||
            data.organizationType) && (
            <>
              <div
                style={{
                  fontSize: "7pt",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#a5b4fc",
                  marginTop: "8px",
                  marginBottom: "2px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Certifications
              </div>
              {data.organizationType && (
                <div
                  style={{
                    fontSize: "6pt",
                    color: "#c7d2fe",
                    marginBottom: "2px",
                  }}
                >
                  {data.organizationType}
                </div>
              )}
              {data.womanOwned && (
                <div
                  style={{
                    fontSize: "6pt",
                    color: "#e9d5ff",
                    marginBottom: "1px",
                    paddingLeft: "4px",
                    borderLeft: "2px solid #a78bfa",
                  }}
                >
                  Woman-Owned
                </div>
              )}
              {data.minorityOwned && (
                <div
                  style={{
                    fontSize: "6pt",
                    color: "#bfdbfe",
                    marginBottom: "1px",
                    paddingLeft: "4px",
                    borderLeft: "2px solid #60a5fa",
                  }}
                >
                  Minority-Owned
                </div>
              )}
              {data.veteranOwned && (
                <div
                  style={{
                    fontSize: "6pt",
                    color: "#bbf7d0",
                    marginBottom: "1px",
                    paddingLeft: "4px",
                    borderLeft: "2px solid #4ade80",
                  }}
                >
                  Veteran-Owned
                </div>
              )}
              {data.lowIncomeOwned && (
                <div
                  style={{
                    fontSize: "6pt",
                    color: "#fde68a",
                    marginBottom: "1px",
                    paddingLeft: "4px",
                    borderLeft: "2px solid #facc15",
                  }}
                >
                  Low-Income Designated
                </div>
              )}
            </>
          )}

          {/* Sidebar Footer */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "8px",
              textAlign: "center",
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ marginBottom: "5px", lineHeight: 1.15 }}>
              <span
                style={{
                  color: "#c7d2fe",
                  fontSize: "6pt",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Contact
              </span>
              <span
                style={{ color: "#fff", fontWeight: 600, fontSize: "7.5pt" }}
              >
                tCredex.com
              </span>
              <a
                href="mailto:Info@tCredex.com"
                style={{
                  color: "#38bdf8",
                  textDecoration: "none",
                  display: "block",
                  fontSize: "7pt",
                }}
              >
                {data.contactEmail || "Info@tCredex.com"}
              </a>
            </div>

            {/* AIV Logo placeholder */}
            <div style={{ marginTop: "8px", opacity: 0.9 }}>
              <svg
                width="50"
                height="65"
                viewBox="0 0 400 520"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#9CB687"
                  d="M100,430Q200,530 300,430L280,430Q200,500 120,430Z"
                />
                <path fill="#6E9D87" d="M85,410L315,410L315,425L85,425Z" />
                <rect fill="#D58659" x="130" y="300" width="55" height="100" />
                <rect fill="#FFF" x="152" y="315" width="10" height="15" />
                <rect fill="#D58659" x="215" y="285" width="55" height="115" />
                <rect fill="#FFF" x="237" y="305" width="10" height="15" />
                <path
                  fill="#6E9D87"
                  d="M150,410Q200,410 250,410Q240,300 230,250L260,200L250,190L220,230L220,150L205,100L190,150L190,230L160,190L150,200L180,250Q170,300 150,410Z"
                />
                <ellipse fill="#9CB687" cx="200" cy="60" rx="15" ry="30" />
                <ellipse
                  fill="#9CB687"
                  cx="240"
                  cy="70"
                  rx="15"
                  ry="30"
                  transform="rotate(20 240 70)"
                />
                <ellipse
                  fill="#9CB687"
                  cx="160"
                  cy="70"
                  rx="15"
                  ry="30"
                  transform="rotate(-20 160 70)"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div
          style={{
            flex: 1,
            padding: "0.15in 0.15in 0.15in 0.15in",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Main Header */}
          <div
            style={{
              fontSize: "16pt",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1,
              marginBottom: "4px",
              letterSpacing: "-0.5px",
            }}
          >
            tCredex.com Tax Credit – Project Profile
          </div>

          {/* Project Sub Details */}
          <div
            style={{
              fontSize: "10pt",
              fontWeight: 600,
              color: "#64748b",
              marginBottom: "6px",
            }}
          >
            {data.projectName}{" "}
            <span style={{ color: "#cbd5e1", margin: "0 5px" }}>|</span>{" "}
            {data.city}, {data.state}
          </div>

          {/* Hero Image */}
          {data.featuredImageUrl ? (
            <div
              style={{
                width: "100%",
                height: "2.0in",
                borderRadius: "4px",
                marginBottom: "6px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                flexShrink: 0,
              }}
            >
              <img
                src={data.featuredImageUrl}
                alt={data.projectName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "2.0in",
                backgroundColor: "#f1f5f9",
                borderRadius: "4px",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                border: "1px solid #e2e8f0",
                backgroundImage:
                  "radial-gradient(#cbd5e1 1px, transparent 1px)",
                backgroundSize: "10px 10px",
                fontWeight: 600,
                letterSpacing: "1px",
                flexShrink: 0,
              }}
            >
              Project Rendering
            </div>
          )}

          {/* The Project Section — flex: 2.5 */}
          <div
            style={{
              flex: 2.5,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "9pt",
                fontWeight: 700,
                color: "#0f172a",
                textTransform: "uppercase",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "3px",
                marginBottom: "5px",
                flexShrink: 0,
              }}
            >
              The Project
            </div>
            <div
              style={{
                fontSize: "8pt",
                lineHeight: 1.35,
                color: "#334155",
                textAlign: "justify",
                overflow: "hidden",
              }}
            >
              {data.projectDescription || "Project description not provided."}
            </div>
          </div>

          {/* Community Impact Section — flex: 2.0 */}
          <div
            style={{
              flex: 2.0,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "9pt",
                fontWeight: 700,
                color: "#0f172a",
                textTransform: "uppercase",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "3px",
                marginBottom: "5px",
                flexShrink: 0,
              }}
            >
              Community Impact
            </div>
            <div
              style={{
                fontSize: "8pt",
                lineHeight: 1.35,
                color: "#334155",
                textAlign: "justify",
                overflow: "hidden",
              }}
            >
              {data.communityImpact ||
                "Community impact information not provided."}
            </div>
          </div>

          {/* About the Sponsor Section — flex: 1.5 */}
          <div
            style={{
              flex: 1.5,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "9pt",
                fontWeight: 700,
                color: "#0f172a",
                textTransform: "uppercase",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "3px",
                marginBottom: "5px",
                flexShrink: 0,
              }}
            >
              About the Sponsor
            </div>
            <div
              style={{
                fontSize: "8pt",
                lineHeight: 1.35,
                color: "#334155",
                textAlign: "justify",
                overflow: "hidden",
              }}
            >
              {data.sponsorDescription ||
                `${data.parentOrganization} is the sponsor organization for this project.`}
            </div>
          </div>

          {/* Watermark Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: "7pt",
              color: "#cbd5e1",
              fontWeight: 500,
              paddingTop: "4px",
            }}
          >
            © {new Date().getFullYear()} tCredex.com • Smart Tools for Impact
            Investing
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to generate Project Profile data from a Deal object
 */
export function generateProfileData(
  deal: Record<string, unknown>,
  intakeData?: Record<string, unknown>,
): ProjectProfileData {
  const sponsors = deal.sponsors as Record<string, unknown> | undefined;
  const intake =
    intakeData ||
    (deal.intakeData as Record<string, unknown>) ||
    (deal.intake_data as Record<string, unknown>) ||
    ({} as Record<string, unknown>);
  const normalizeText = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";
  const projectDescriptionText = normalizeText(
    intake.projectDescription ||
      deal.projectDescription ||
      deal.project_description ||
      deal.description,
  );
  const sponsorDescriptionCandidates = [
    sponsors?.description,
    deal.sponsorDescription,
  ];
  const sponsorDescriptionText =
    sponsorDescriptionCandidates
      .map(normalizeText)
      .find(
        (value) =>
          value && value.toLowerCase() !== projectDescriptionText.toLowerCase(),
      ) || "";

  // Build sources from intake financing sources
  const sources: { name: string; amount: number }[] = [];
  if (intake.financingSources) {
    (intake.financingSources as Array<Record<string, unknown>>).forEach(
      (source) => {
        if (source.source && source.amount) {
          sources.push({
            name: source.source as string,
            amount: source.amount as number,
          });
        }
      },
    );
  } else {
    // Fallback to simple fields
    if (intake.equityAmount)
      sources.push({ name: "Equity", amount: intake.equityAmount as number });
    if (intake.debtAmount)
      sources.push({ name: "Debt", amount: intake.debtAmount as number });
    if (intake.grantAmount)
      sources.push({ name: "Grants", amount: intake.grantAmount as number });
    if (intake.nmtcFinancingRequested)
      sources.push({
        name: "NMTC Equity",
        amount: intake.nmtcFinancingRequested as number,
      });
  }

  // Build uses from intake cost breakdown
  const uses: { name: string; amount: number }[] = [];
  if (intake.landCost)
    uses.push({ name: "Land", amount: intake.landCost as number });
  if (intake.acquisitionCost)
    uses.push({
      name: "Acquisition",
      amount: intake.acquisitionCost as number,
    });
  if (intake.constructionCost)
    uses.push({
      name: "Construction",
      amount: intake.constructionCost as number,
    });
  if (intake.softCosts)
    uses.push({ name: "Soft Costs", amount: intake.softCosts as number });
  if (intake.developerFee)
    uses.push({ name: "Developer Fee", amount: intake.developerFee as number });
  if (intake.contingency)
    uses.push({ name: "Contingency", amount: intake.contingency as number });

  // Get featured image URL
  let featuredImageUrl: string | undefined;
  const projectImages = intake.projectImages as
    | Array<Record<string, unknown>>
    | undefined;
  if (intake.featuredImageId && projectImages) {
    const featuredImg = projectImages.find(
      (img) => img.id === intake.featuredImageId,
    );
    if (featuredImg) {
      featuredImageUrl = featuredImg.url as string;
    }
  }
  if (!featuredImageUrl && projectImages && projectImages.length > 0) {
    featuredImageUrl = projectImages[0].url as string;
  }

  return {
    parentOrganization:
      (sponsors?.organization_name as string) ||
      (deal.sponsorName as string) ||
      (intake.organizationName as string) ||
      (intake.sponsorName as string) ||
      "Sponsor Organization",
    projectName:
      (intake.projectName as string) ||
      (deal.projectName as string) ||
      (deal.project_name as string) ||
      "Untitled Project",
    address: (intake.address as string) || (deal.address as string) || "",
    city: (intake.city as string) || (deal.city as string) || "",
    state: (intake.state as string) || (deal.state as string) || "",
    censusTract:
      (intake.censusTract as string) ||
      (deal.censusTract as string) ||
      (deal.census_tract as string) ||
      "",
    povertyRate:
      (intake.tractPovertyRate as number) ||
      (deal.povertyRate as number) ||
      (deal.poverty_rate as number | undefined),
    medianIncome:
      (intake.tractMedianIncome as number) ||
      (deal.medianIncomePercent as number) ||
      (deal.median_income_percent as number | undefined),
    unemploymentRate:
      (intake.tractUnemployment as number) ||
      (deal.unemploymentRate as number) ||
      (deal.unemployment_rate as number | undefined),
    totalProjectCost:
      (intake.totalProjectCost as number) ||
      (deal.totalProjectCost as number) ||
      (deal.total_project_cost as number) ||
      0,
    nmtcRequest:
      (intake.nmtcFinancingRequested as number) ||
      (deal.nmtcRequest as number) ||
      (deal.nmtc_financing_requested as number | undefined),
    stateNmtcRequest:
      (intake.stateNmtcRequest as number) ||
      (deal.stateNmtcRequest as number) ||
      (deal.state_nmtc_request as number | undefined),
    htcAmount:
      (intake.qreAmount as number) ||
      (deal.htcAmount as number) ||
      (deal.htc_amount as number | undefined),
    financingGap:
      (intake.financingGap as number) ||
      (deal.financingGap as number) ||
      (deal.financing_gap as number | undefined),
    isShovelReady:
      intake.isShovelReady === "Yes" ||
      intake.isShovelReady === true ||
      deal.isShovelReady === true ||
      deal.shovel_ready === true,
    projectedCompletion:
      (intake.projectedCompletionDate as string) ||
      (deal.completionDate as string) ||
      (deal.projected_completion_date as string | undefined),
    sources,
    uses,
    projectNumber: deal.id
      ? `tcredex.com_${new Date().getFullYear()}-${(deal.id as string).slice(-4)}`
      : undefined,
    projectDescription: projectDescriptionText,
    communityImpact:
      (intake.communityImpact as string) ||
      (deal.communityImpact as string) ||
      (deal.community_impact as string) ||
      "",
    jobsCreated:
      (intake.jobsCreated as number) ||
      (intake.permanentJobsFTE as number) ||
      (deal.jobsCreated as number) ||
      (deal.jobs_created as number | undefined),
    constructionJobs:
      (intake.constructionJobsFTE as number) ||
      (deal.constructionJobs as number) ||
      (deal.construction_jobs as number | undefined),
    permanentJobs:
      (intake.permanentJobsFTE as number) ||
      (deal.permanentJobs as number) ||
      (deal.permanent_jobs as number | undefined),
    featuredImageUrl,
    contactEmail:
      (intake.sponsorEmail as string) ||
      (intake.contactEmail as string) ||
      (deal.contactEmail as string | undefined),
    contactPhone:
      (intake.sponsorPhone as string) ||
      (intake.contactPhone as string) ||
      (deal.contactPhone as string | undefined),
    dealId: deal.id as string | undefined,

    // About Sponsor
    sponsorContactName:
      (intake.personCompletingForm as string) ||
      (intake.contactName as string) ||
      (deal.sponsorContactName as string | undefined),
    sponsorDescription: sponsorDescriptionText,
    sponsorWebsite:
      (sponsors?.website as string) ||
      (intake.sponsorWebsite as string) ||
      (deal.sponsorWebsite as string | undefined),
    sponsorYearFounded:
      (sponsors?.year_founded as string) ||
      (intake.sponsorYearFounded as string) ||
      (deal.sponsorYearFounded as string | undefined),
    organizationType:
      (intake.organizationType as string) ||
      (sponsors?.organization_type as string) ||
      (deal.organizationType as string) ||
      (deal.organization_type as string | undefined),
    womanOwned:
      sponsors?.woman_owned === true ||
      intake.womanOwned === "Yes" ||
      intake.womanOwned === true ||
      deal.woman_owned === true,
    minorityOwned:
      sponsors?.minority_owned === true ||
      intake.minorityOwned === "Yes" ||
      intake.minorityOwned === true ||
      deal.minority_owned === true,
    veteranOwned:
      sponsors?.veteran_owned === true ||
      intake.veteranOwned === "Yes" ||
      intake.veteranOwned === true ||
      deal.veteran_owned === true,
    lowIncomeOwned:
      sponsors?.low_income_owned === true ||
      intake.lowIncomeOwned === "Yes" ||
      intake.lowIncomeOwned === true ||
      deal.low_income_owned === true,
  };
}
