export const metadata = {
  title: "Platform Terms of Use | tCredex",
  description: "tCredex Platform Terms of Use - Counsel-ready terms for the AI-powered tax credit marketplace.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

export default function TermsPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">tCredex Platform Terms of Use</h1>
              <p className="text-gray-400">Effective Date: December 15, 2025</p>
              <p className="text-gray-500 text-sm mt-2">Company: tCredex LLC (&quot;tCredex&quot;), a Delaware Limited Liability Company. tCredex LLC is a subsidiary of American Impact Ventures LLC (&quot;AIV&quot;), a Delaware Limited Liability Company.</p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Section 1 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">1. Platform Purpose</h2>
                <p className="text-gray-300 mb-4">
                  tCredex provides a technology platform offering data aggregation, mapping, eligibility analysis, 
                  and workflow coordination tools related to community development finance programs, including NMTC, 
                  HTC, Opportunity Zones, and applicable state programs (the &quot;Platform&quot;).
                </p>
                <p className="text-gray-300 mb-3">tCredex does not:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Provide investment, legal, tax, accounting, or compliance advice</li>
                  <li>Act as a broker, dealer, placement agent, fiduciary, or advisor</li>
                  <li>Approve, allocate, underwrite, or close transactions</li>
                </ul>
                <p className="text-gray-400 mt-4 italic">
                  All decisions remain solely with Platform users and their professional advisors.
                </p>
              </div>

              {/* Section 2 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">2. Eligibility and Authority</h2>
                <p className="text-gray-300 mb-3">By registering, you represent that:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>You are at least 18 years old</li>
                  <li>You have authority to bind the entity you represent</li>
                  <li>Information you provide is accurate and current</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">3. Accounts and Security</h2>
                <p className="text-gray-300">
                  You are responsible for safeguarding login credentials and all activity under your account. 
                  tCredex may suspend or terminate access for misuse, security concerns, or violations of these Terms.
                </p>
              </div>

              {/* Section 4 */}
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-amber-400 mb-4">4. Use of Information; No Reliance</h2>
                <p className="text-gray-300 mb-4">
                  All Platform content is provided for <strong className="text-amber-400">informational purposes only</strong>.
                </p>
                <p className="text-gray-300">
                  You agree not to rely on Platform outputs as a substitute for independent professional judgment.
                </p>
              </div>

              {/* Section 5 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">5. Analytics and AI Tools</h2>
                <p className="text-gray-300 mb-3">
                  Certain Platform features may include automated analytics or scoring models. These tools:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                  <li>Are advisory only</li>
                  <li>Do not make binding decisions</li>
                  <li>Are subject to human review and override</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
                <p className="text-gray-300">
                  The Platform and all underlying software, content, workflows, and data structures are owned by 
                  tCredex or its licensors. Users receive a limited, revocable, non-transferable license to use 
                  the Platform for its intended purposes.
                </p>
              </div>

              {/* Section 7 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">7. Confidentiality</h2>
                <p className="text-gray-300">
                  Non-public information accessed through the Platform is confidential and may only be used for 
                  legitimate Platform purposes.
                </p>
              </div>

              {/* Section 8 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">8. Third-Party Services</h2>
                <p className="text-gray-300">
                  tCredex may rely on third-party data providers or service partners. tCredex is not responsible 
                  for the availability or accuracy of third-party data.
                </p>
              </div>

              {/* Section 9 */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-red-400 mb-4">9. Disclaimers</h2>
                <p className="text-gray-300 font-semibold">
                  THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot;
                </p>
                <p className="text-gray-300 mt-2">
                  TCREDEX DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED.
                </p>
              </div>

              {/* Section 10 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">10. Limitation of Liability</h2>
                <p className="text-gray-300">
                  To the maximum extent permitted by law, tCredex&apos;s total liability is limited to fees paid by 
                  you to tCredex in the prior twelve (12) months, if any.
                </p>
              </div>

              {/* Section 11 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">11. Indemnification</h2>
                <p className="text-gray-300">
                  You agree to indemnify and hold harmless tCredex from claims arising from your use of the Platform, 
                  submitted data, or interactions with third parties.
                </p>
              </div>

              {/* Section 12 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">12. Dispute Resolution</h2>
                <p className="text-gray-300">
                  Disputes shall be resolved through confidential binding arbitration in Delaware, except where 
                  prohibited by law. No class actions.
                </p>
              </div>

              {/* Section 13 */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">13. Governing Law</h2>
                <p className="text-gray-300">
                  These Terms are governed by the laws of the State of Delaware.
                </p>
              </div>

              {/* Role-Specific Schedules */}
              <div className="border-t border-gray-700 pt-8 mt-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Role-Specific Schedules</h2>
                
                {/* Schedule A */}
                <div id="schedule-sponsor" className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8 mb-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">Schedule A — Sponsors / Developers</h3>
                  <p className="text-gray-300 mb-3">Sponsors acknowledge responsibility for:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Accuracy of submitted project data</li>
                    <li>Independent verification of eligibility</li>
                    <li>No reliance on Platform outputs as approvals</li>
                  </ul>
                </div>

                {/* Schedule B */}
                <div id="schedule-cde" className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8 mb-6">
                  <h3 className="text-lg font-bold text-green-400 mb-4">Schedule B — CDEs</h3>
                  <p className="text-gray-300 mb-3">CDEs retain sole discretion over:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Allocation decisions</li>
                    <li>Compliance interpretations</li>
                    <li>Underwriting and approvals</li>
                  </ul>
                </div>

                {/* Schedule C */}
                <div id="schedule-investor" className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-8 mb-6">
                  <h3 className="text-lg font-bold text-purple-400 mb-4">Schedule C — Investors</h3>
                  <p className="text-gray-300 mb-3">Investors acknowledge:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Platform information is informational only</li>
                    <li>No offer or solicitation is made</li>
                    <li>Independent diligence is required</li>
                  </ul>
                </div>

                {/* Schedule D */}
                <div id="schedule-consultant" className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-amber-400 mb-4">Schedule D — Consultants</h3>
                  <p className="text-gray-300 mb-3">
                    Consultants represent authority to act on behalf of clients and agree not to:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Misrepresent Platform outputs</li>
                    <li>Circumvent Platform workflows</li>
                    <li>Scrape or resell Platform data</li>
                  </ul>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mt-8">
                <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
                <p className="text-gray-300">
                  <strong>tCredex LLC</strong><br />
                  A subsidiary of American Impact Ventures LLC<br />
                  Email: <a href="mailto:legal@tcredex.com" className="text-indigo-400 hover:text-indigo-300">legal@tcredex.com</a>
                </p>
              </div>
            </div>

            {/* Back Link */}
            <div className="mt-12 text-center">
              <Link href="/" className="text-indigo-400 hover:text-indigo-300">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
