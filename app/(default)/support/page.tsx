import Link from "next/link";

export const metadata = {
  title: "Support | tCredex",
  description: "Get help with tCredex and connect with our support team.",
};

export default function SupportPage() {
  return (
    <div className="bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-indigo-400">Need help?</p>
          <h1 className="text-4xl font-bold text-white">Support & Contact</h1>
          <p className="text-lg text-gray-400">
            We're here to help you with onboarding, marketplace questions, and
            technical support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white">Email Us</h2>
            <p className="mt-2 text-gray-400">
              Send us a note and our support team will get back within one
              business day.
            </p>
            <Link
              href="mailto:support@tcredex.com"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              support@tcredex.com
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white">Support Hours</h2>
            <p className="mt-2 text-gray-400">
              Monday–Friday:{" "}
              <span className="text-gray-200">8:00 AM – 8:00 PM ET</span>
            </p>
            <p className="text-gray-400">
              Weekend emergencies:{" "}
              <span className="text-gray-200">24/7 coverage</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              We respond within one business day.
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white">FAQs</h2>
            <p className="mt-2 text-gray-400">
              Browse answers to common questions about the marketplace, pricing,
              and onboarding.
            </p>
            <Link
              href="/faq"
              title="Frequently Asked Questions"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View FAQs
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
                Need faster help?
              </p>
              <h3 className="mt-1 text-2xl font-bold text-white">
                Open a Support Ticket
              </h3>
              <p className="mt-2 text-gray-400">
                Tell us about your issue and include any deal IDs or screenshots
                to help us assist you faster.
              </p>
            </div>
            <Link
              href="/support/request"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Open Request
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              For Sponsors
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Ready to submit a project to the marketplace? Start your intake
              form to get matched with CDEs and investors.
            </p>
            <Link
              href="/intake"
              className="text-sm font-medium text-green-400 hover:text-green-300"
            >
              Submit a Project →
            </Link>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              For CDEs & Investors
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Update your profile to improve matching or browse available
              projects in the marketplace.
            </p>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-purple-400 hover:text-purple-300"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
