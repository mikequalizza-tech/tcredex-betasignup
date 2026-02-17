export const metadata = {
  title: "Ledger Integrity & Tamper-Evident Logging | tCredex",
  description: "Appendix X - How tCredex maintains a tamper-evident, append-only ledger of critical events for audit, compliance, and transparency.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

export default function LedgerIntegrityPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Appendix X
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Ledger Integrity & Tamper-Evident Logging</h1>
              <p className="text-gray-400">
                Platform: tCredex.com Marketplace<br />
                Operator / Advisor: American Impact Ventures, LLC (&quot;AIV&quot;)
              </p>
            </div>

            {/* Quick Nav */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-400 mb-3">Jump to:</p>
              <div className="flex flex-wrap gap-2">
                <a href="#overview" className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Overview</a>
                <a href="#architecture" className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Architecture</a>
                <a href="#investors" className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">For Investors</a>
                <a href="#cdes" className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">For CDEs/CDFIs</a>
                <a href="#regulators" className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">For Regulators</a>
                <a href="#checklist" className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">Evidence Checklist</a>
              </div>
            </div>

            {/* Overview */}
            <div id="overview" className="mb-12">
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-8 mb-6">
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">What This Is</h2>
                <p className="text-gray-300 mb-4">
                  The tCredex.com Marketplace is designed to be <strong className="text-white">auditable by construction</strong>. 
                  Every critical action—AI scoring, eligibility decisions, CDE matches, document events, and closings—is 
                  recorded in an append-only, tamper-evident ledger.
                </p>
                <p className="text-gray-300">
                  AIV designs and oversees this control framework and provides expert consulting services to platform clients. 
                  Practically, this functions as a <span className="text-indigo-400 font-semibold">flight recorder for community tax credit transactions</span>.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-3">What We Log</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>Who</strong> acted (system, human user, or API key)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>What</strong> action was taken</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>On which</strong> application/project/CDE/document/closing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>When</strong> it occurred (precise UTC timestamp)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span><strong>Why</strong> it occurred (data that drove the decision)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-3">How Immutability Works</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>Ledger is <strong>append-only</strong>: entries can be added but not modified or deleted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>Enforced in application code AND at database level with triggers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>Each event has a <strong>cryptographic hash</strong> forming a chain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>Any past change exposes inconsistencies immediately</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Architecture Details */}
            <div id="architecture" className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Technical Architecture</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-white mb-4">1. Ledger Architecture</h3>
                  <p className="text-gray-300 mb-4">
                    The tCredex.com Marketplace maintains a dedicated, append-only audit ledger in a separate PostgreSQL 
                    table (<code className="text-indigo-400 bg-gray-800 px-2 py-0.5 rounded">ledger_events</code>) isolated from transactional business tables.
                  </p>
                  <p className="text-gray-400 text-sm mb-4">Each ledger event captures:</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <ul className="space-y-1 text-gray-300">
                      <li>• Event timestamp (UTC)</li>
                      <li>• Actor type (system, human, api_key)</li>
                      <li>• Actor identifier</li>
                      <li>• Entity type and identifier</li>
                      <li>• Action performed</li>
                    </ul>
                    <ul className="space-y-1 text-gray-300">
                      <li>• Payload snapshot</li>
                      <li>• Model version (where applicable)</li>
                      <li>• Reason codes</li>
                      <li>• prev_hash / hash (SHA-256)</li>
                      <li>• Optional Ed25519 signature</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-white mb-4">2. Tamper-Evident Hash Chain</h3>
                  <p className="text-gray-300 mb-4">
                    For each event, a canonical string is built from the event id, UTC timestamp, actor, entity, action, 
                    payload, reason codes, model version, and prev_hash. A <strong className="text-indigo-400">SHA-256 digest</strong> is computed 
                    and stored in the hash field.
                  </p>
                  <p className="text-gray-300">
                    This creates a strict hash chain: any change to historical data, order, or content will result in 
                    mismatched hashes during verification, <strong className="text-red-400">immediately flagging tampering or corruption</strong>.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-white mb-4">3. External Anchoring</h3>
                  <p className="text-gray-300 mb-4">
                    To provide independent evidence of ledger state at defined points in time, the platform 
                    periodically anchors the latest ledger hash to external systems:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-indigo-400 font-semibold mb-2">Code Hosting</div>
                      <p className="text-gray-400 text-sm">Automated hourly writes to GitHub gists</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-green-400 font-semibold mb-2">Blockchain</div>
                      <p className="text-gray-400 text-sm">Hash embedded in timestamp proof</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-purple-400 font-semibold mb-2">Escrow</div>
                      <p className="text-gray-400 text-sm">Email to external counsel/audit firm</p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-4 italic">
                    Only the hash and non-sensitive metadata are transmitted—no PII, financial details, or credit-sensitive information.
                  </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-white mb-4">4. Logged Event Categories</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-indigo-400 font-semibold mb-2">Application & Intake</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Creation, updates, status changes</li>
                        <li>• Key field edits</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-green-400 font-semibold mb-2">AI Scoring & Eligibility</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Distress and impact scores</li>
                        <li>• Model versions, program flags</li>
                        <li>• Reason codes/explanations</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-purple-400 font-semibold mb-2">Matching & Structuring</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Auto-matches (QALICB ↔ CDE)</li>
                        <li>• Manual overrides with rationale</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-amber-400 font-semibold mb-2">Documents & Closing</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• Uploads, content hashes</li>
                        <li>• Signature events, closing milestones</li>
                        <li>• Funding, post-closing adjustments</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Investor Section */}
            <div id="investors" className="mb-12">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">For Investors</h2>
                <p className="text-gray-300 mb-6">
                  You are pricing risk and compliance across dozens or hundreds of community investments. If the underlying 
                  data, eligibility decisions, and closing records are questionable, your yield and reputation are at risk.
                </p>

                <h3 className="text-lg font-semibold text-white mb-3">What You Get</h3>
                <ul className="space-y-2 text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Deal-by-deal audit trail covering intake, scoring, CDE matching, document events, and closing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Cryptographic hash chaining so historical events cannot be silently altered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>External anchors to prove what you see today is what existed at the time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Model versioning and reason codes showing why a project qualified</span>
                  </li>
                </ul>

                <div className="bg-blue-950/50 rounded-lg p-4">
                  <p className="text-blue-300 font-medium">
                    Bottom Line: You are not just buying credits. You are buying into a platform that can show, with 
                    cryptographic proof, how each transaction was screened, structured, and closed.
                  </p>
                </div>
              </div>
            </div>

            {/* CDE Section */}
            <div id="cdes" className="mb-12">
              <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-green-400 mb-4">For CDEs / CDFIs</h2>
                <p className="text-gray-300 mb-6">
                  You are responsible for deploying highly targeted capital into distressed communities while staying 
                  inside tight program rules. Examiners and investors will ask you to prove that your allocations and 
                  loans followed policy.
                </p>

                <h3 className="text-lg font-semibold text-white mb-3">What You Get</h3>
                <ul className="space-y-2 text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Transparent log of how each application was scored on distress and impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Evidence of how and why your CDE was matched, including manual overrides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Document hashes and closing event logs aligned with your internal files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pre-packaged, verifiable evidence sets instead of ad-hoc screenshots</span>
                  </li>
                </ul>

                <div className="bg-green-950/50 rounded-lg p-4">
                  <p className="text-green-300 font-medium">
                    Bottom Line: You can show regulators and investors that your deployment decisions are not only 
                    principled, but also traceable and independently verifiable.
                  </p>
                </div>
              </div>
            </div>

            {/* Regulator Section */}
            <div id="regulators" className="mb-12">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">For Banks & Regulators</h2>
                <p className="text-gray-300 mb-6">
                  Banks and supervisors are increasingly focused on how community investments are sourced, screened, 
                  and monitored. You need to see that credit and impact decisions are not arbitrary and can be audited years later.
                </p>

                <h3 className="text-lg font-semibold text-white mb-3">What You Get</h3>
                <ul className="space-y-2 text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tamper-evident ledger recording every key step in the transaction lifecycle</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Clear visibility into models, thresholds, and rules that drive decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Independent anchoring making back-dating or silent edits detectable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Evidence packages reviewable without reverse-engineering the platform</span>
                  </li>
                </ul>

                <div className="bg-purple-950/50 rounded-lg p-4">
                  <p className="text-purple-300 font-medium">
                    Bottom Line: Instead of opaque decision-making, you get a verifiable trail of how community 
                    investments were evaluated and executed, aligned with supervisory expectations.
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div id="checklist" className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Evidence Package Checklist</h2>
              <p className="text-gray-400 mb-6">
                Use this checklist when responding to regulators, investors, CDEs/CDFIs, or bank partners requesting 
                proof of ledger integrity and decision traceability.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 1 – Scope Definition</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Define the time period covered (start and end dates)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Define the scope of entities (deals, funds, CDEs, investors, programs)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Identify the requesting party and their role</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Confirm data-sharing and confidentiality constraints in writing</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 2 – Ledger Extracts</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Export ledger events for the defined scope (CSV or parquet)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Include: event id, timestamp, actor, entity, action, model_version, reason_codes, prev_hash, hash, sig</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Validate extract is complete (no gaps in id/timestamp sequence)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Store copy of exact extract in internal evidence repository</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 3 – Chain Verification Report</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Run official verification tool against extracted ledger slice</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Confirm all recomputed hashes match stored hash values</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Confirm prev_hash equals hash of prior event for all events</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Verify all signatures using current public key (where used)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Generate human-readable verification report</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 4 – External Anchor Evidence</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Identify anchoring mechanisms in effect for the period</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Retrieve references (gist IDs, transaction hashes, email headers)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Confirm final hash matches at least one external anchor</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Capture screenshots or export proofs where appropriate</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Document verification steps for third-party replication</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 5 – Model & Reason-Code Documentation</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> List all distinct model_version values in the ledger slice</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Attach model documentation for each version</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Provide descriptions for reason codes or feature explanations</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Note any restricted factors per regulatory/investor policies</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 6 – Supporting Business Context</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Provide narrative of normal ledger use (intake, scoring, matching, closing)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Link ledger events to business artifacts (memos, minutes, binders)</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Note any data-quality issues or remediations</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Include AIV commentary explaining methodology</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Section 7 – Packaging & Sign-Off</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Assemble all components into clearly labeled evidence pack</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Have authorized representative review and sign off</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Record request and response in internal log</li>
                    <li className="flex items-center gap-2"><span className="text-gray-600">☐</span> Store final evidence pack in secure, versioned repository</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* AIV Role */}
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-8 mb-8">
              <h2 className="text-xl font-bold text-amber-400 mb-4">Role of American Impact Ventures, LLC (AIV)</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>Designs and validates the ledger architecture and control set</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>Provides expert consulting services to clients on interpreting and using logs for compliance, audits, and transactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-amber-400 mt-1">•</span>
                  <span>Supports regulators, investors, and CDEs/CDFIs in independent verification of ledger integrity when needed</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-4">Request Ledger Evidence</h2>
              <p className="text-gray-300 mb-6">
                For authorized evidence requests or questions about ledger integrity controls:
              </p>
              <a 
                href="mailto:compliance@tcredex.com" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                compliance@tcredex.com
              </a>
            </div>

            {/* Back Link */}
            <div className="mt-12 text-center">
              <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 mr-6">
                ← Platform Terms
              </Link>
              <Link href="/faq" className="text-indigo-400 hover:text-indigo-300">
                Due Diligence FAQ →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
