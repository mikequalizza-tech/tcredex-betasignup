export const metadata = {
  title: "Privacy Policy | tCredex",
  description: "tCredex Privacy Policy - How we collect, use, and protect your information.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

export default function PrivacyPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">tCredex Privacy Policy</h1>
              <p className="text-gray-400">Effective Date: December 15, 2025</p>
            </div>

            {/* Intro */}
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-8 mb-8">
              <p className="text-gray-300">
                tCredex respects the confidentiality and security of user information. This Privacy Policy 
                describes how information is collected, used, and protected.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Information We Collect */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">Information We Collect</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Account registration details</li>
                  <li>Organization-level information</li>
                  <li>Usage data related to Platform features</li>
                </ul>
              </div>

              {/* How We Use Information */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">How We Use Information</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>To operate and improve the Platform</li>
                  <li>To provide role-appropriate access</li>
                  <li>To support compliance, auditing, and security</li>
                </ul>
              </div>

              {/* Data Sharing */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-green-400 mb-4">Data Sharing</h2>
                <p className="text-gray-300 mb-4">
                  <strong className="text-green-400">tCredex does not sell personal data.</strong>
                </p>
                <p className="text-gray-300">
                  Data may be shared with trusted service providers solely to operate the Platform.
                </p>
              </div>

              {/* Data Security */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">Data Security</h2>
                <p className="text-gray-300">
                  tCredex employs commercially reasonable safeguards to protect information.
                </p>
              </div>

              {/* User Responsibilities */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">User Responsibilities</h2>
                <p className="text-gray-300">
                  Users are responsible for ensuring they have rights to submit any data uploaded to the Platform.
                </p>
              </div>

              {/* Contact */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-4">Contact</h2>
                <p className="text-gray-300">
                  For privacy-related inquiries:<br />
                  <a href="mailto:privacy@tcredex.com" className="text-indigo-400 hover:text-indigo-300">privacy@tcredex.com</a>
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
