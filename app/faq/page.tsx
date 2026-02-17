export const metadata = {
  title: "Bank Due Diligence FAQ | tCredex",
  description:
    "Frequently asked questions for bank counsel and compliance teams evaluating tCredex.",
};

import Link from "next/link";
import PageIllustration from "@/components/PageIllustration";

const faqs = [
  {
    question: "Is tCredex providing investment advice?",
    answer:
      "No. tCredex provides informational tools only. All decisions remain with users and their advisors.",
    highlight: true,
  },
  {
    question: "Does tCredex replace underwriting or compliance review?",
    answer:
      "No. The Platform supports analysis but does not replace institutional underwriting or compliance processes.",
    highlight: true,
  },
  {
    question: "How is AI used?",
    answer:
      "AI-assisted analytics are advisory, transparent, and subject to human oversight.",
    highlight: false,
  },
  {
    question: "Who owns the data?",
    answer:
      "Users retain ownership of submitted data. tCredex owns Platform software and workflows.",
    highlight: false,
  },
  {
    question: "How is historical data handled?",
    answer: "Data versions are preserved for audit and disclosure purposes.",
    highlight: false,
  },
  {
    question: "Does tCredex enforce transaction exclusivity?",
    answer:
      "No. tCredex is an intelligence and workflow platform, not a broker.",
    highlight: true,
  },
];

export default function FAQPage() {
  return (
    <>
      <PageIllustration />
      <section>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-medium mb-4">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Bank & Counsel Ready
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Due Diligence FAQ
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Common questions from bank counsel, compliance officers, and
                institutional partners evaluating the tCredex platform.
              </p>
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-6 ${
                    faq.highlight
                      ? "bg-indigo-900/20 border border-indigo-500/30"
                      : "bg-gray-900/50 border border-gray-800"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      faq.highlight ? "text-indigo-400" : "text-white"
                    }`}
                  >
                    Q: {faq.question}
                  </h3>
                  <p className="text-gray-300">
                    <span className="font-medium text-gray-200">A:</span>{" "}
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Summary Box */}
            <div className="mt-12 bg-green-900/20 border border-green-500/30 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-green-400 mb-4">
                Platform Classification Summary
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Technology platform, not financial advisor</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Informational tools, not investment advice</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>AI is advisory with human oversight</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Audit-ready data versioning</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Non-exclusive, non-broker model</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Users retain data ownership</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-4">
                Need More Information?
              </h2>
              <p className="text-gray-300 mb-4">
                Our team is available to support your due diligence process.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:legal@tcredex.com"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Contact Legal Team
                </a>
                <Link
                  href="/terms"
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors"
                >
                  View Full Terms
                </Link>
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
