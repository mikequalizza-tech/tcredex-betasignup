"use client";

import { useState } from "react";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";
import Link from "next/link";

export default function ContactAIV() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    topic: "",
    projectType: "",
    allocation: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "aiv_advisory" }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      setSubmitted(true);
    } catch (_err) {
      setError(
        "Failed to send message. Please email us directly at deals@americanimpactventures.com",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <>
        <PageIllustration multiple />
        <section>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="py-12 md:py-20">
              <div className="text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-green-400"
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
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Request Received!
                </h1>
                <p className="text-lg text-gray-400 mb-8">
                  Thank you for reaching out. The American Impact Ventures team
                  will review your inquiry and get back to you within 1-2
                  business days.
                </p>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-left">
                  <h3 className="font-semibold text-white mb-3">
                    While you wait:
                  </h3>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">→</span>
                      Explore the{" "}
                      <a
                        href="/map"
                        className="text-indigo-400 hover:underline"
                      >
                        Eligibility Map
                      </a>{" "}
                      to check your project location
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">→</span>
                      Browse the{" "}
                      <a
                        href="/deals"
                        className="text-indigo-400 hover:underline"
                      >
                        Marketplace
                      </a>{" "}
                      to see active deals
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-indigo-400">→</span>
                      Start a{" "}
                      <a
                        href="/intake"
                        className="text-indigo-400 hover:underline"
                      >
                        Deal Submission
                      </a>{" "}
                      to get your project listed
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        <FooterSeparator />
      </>
    );
  }

  return (
    <>
      <PageIllustration multiple />
      <section>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-20">
            {/* Section header */}
            <div className="pb-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700 text-emerald-300 text-sm font-medium mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Tax Credit Experts
              </div>
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                American Impact Ventures
              </h1>
              <div className="mx-auto max-w-3xl">
                <p className="text-xl text-indigo-200/65">
                  Expert tax credit advisory for deal structuring, CDE matching,
                  investor relationships, and full transaction support.
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Contact Info Sidebar */}
              <div className="space-y-6">
                {/* Track Record */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold text-white mb-4">
                    Our Track Record
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        NMTC Allocation Closed
                      </span>
                      <span className="font-bold text-emerald-400">$650M+</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">LIHTC Syndication</span>
                      <span className="font-bold text-purple-400">$3B</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        Historic Tax Credits
                      </span>
                      <span className="font-bold text-blue-400">$450M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">State Tax Credits</span>
                      <span className="font-bold text-amber-400">$350M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">NMTC Projects</span>
                      <span className="font-bold text-green-400">85</span>
                    </div>
                  </div>
                </div>

                {/* Direct Contact */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold text-white mb-4">
                    Direct Contact
                  </h3>
                  <div className="space-y-3">
                    <a
                      href="mailto:deals@americanimpactventures.com"
                      className="flex items-center gap-3 text-gray-400 hover:text-emerald-400 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      deals@americanimpactventures.com
                    </a>
                    <a
                      href="https://americanimpactventures.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-gray-400 hover:text-emerald-400 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      americanimpactventures.com
                    </a>
                  </div>
                </div>

                {/* Services */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold text-white mb-4">
                    Advisory Services
                  </h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Deal structuring & optimization
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      CDE introductions & matching
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Investor relationship management
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      NMTC application support
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Full closing coordination
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Credit stacking strategies
                    </li>
                  </ul>
                </div>

                {/* Platform Support Link */}
                <Link
                  href="/contact"
                  className="block bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-indigo-600 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                        Platform Support?
                      </h4>
                      <p className="text-sm text-gray-500">
                        For tCredex help, click here →
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Contact form */}
              <div className="lg:col-span-2">
                <form
                  onSubmit={handleSubmit}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-8"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">
                    Tell Us About Your Project
                  </h2>

                  {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="mb-1 block text-sm font-medium text-indigo-200/65"
                          htmlFor="name"
                        >
                          Name *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="form-input w-full"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-sm font-medium text-indigo-200/65"
                          htmlFor="email"
                        >
                          Email *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="form-input w-full"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="mb-1 block text-sm font-medium text-indigo-200/65"
                          htmlFor="phone"
                        >
                          Phone
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="form-input w-full"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-sm font-medium text-indigo-200/65"
                          htmlFor="company"
                        >
                          Company / Organization
                        </label>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleChange}
                          className="form-input w-full"
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label
                          className="mb-1 block text-sm font-medium text-indigo-200/65"
                          htmlFor="topic"
                        >
                          How Can We Help? *
                        </label>
                        <select
                          id="topic"
                          name="topic"
                          required
                          value={formData.topic}
                          onChange={handleChange}
                          className="form-select w-full text-gray-200"
                        >
                          <option value="" disabled>
                            Select a topic
                          </option>
                          <option value="deal-structuring">
                            Deal Structuring
                          </option>
                          <option value="cde-matching">CDE Matching</option>
                          <option value="investor-intro">
                            Investor Introductions
                          </option>
                          <option value="application-support">
                            Application Support
                          </option>
                          <option value="pricing-guidance">
                            Pricing Guidance
                          </option>
                          <option value="closing-support">
                            Closing Support
                          </option>
                          <option value="general-consultation">
                            General Consultation
                          </option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-sm font-medium text-indigo-200/65"
                          htmlFor="projectType"
                        >
                          Project Type
                        </label>
                        <select
                          id="projectType"
                          name="projectType"
                          value={formData.projectType}
                          onChange={handleChange}
                          className="form-select w-full text-gray-200"
                        >
                          <option value="" disabled>
                            Select program type
                          </option>
                          <option value="nmtc">NMTC</option>
                          <option value="lihtc">LIHTC</option>
                          <option value="htc">Historic Tax Credit</option>
                          <option value="oz">Opportunity Zone</option>
                          <option value="brownfield">Brownfield</option>
                          <option value="multiple">
                            Multiple Credits / Stacking
                          </option>
                          <option value="not-sure">Not Sure Yet</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        className="mb-1 block text-sm font-medium text-indigo-200/65"
                        htmlFor="allocation"
                      >
                        Estimated Project Size / Allocation
                      </label>
                      <select
                        id="allocation"
                        name="allocation"
                        value={formData.allocation}
                        onChange={handleChange}
                        className="form-select w-full text-gray-200"
                      >
                        <option value="" disabled>
                          Select range
                        </option>
                        <option value="under-5m">Under $5M</option>
                        <option value="5m-10m">$5M - $10M</option>
                        <option value="10m-25m">$10M - $25M</option>
                        <option value="25m-50m">$25M - $50M</option>
                        <option value="over-50m">Over $50M</option>
                        <option value="not-sure">Not Sure Yet</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="mb-1 block text-sm font-medium text-indigo-200/65"
                        htmlFor="message"
                      >
                        Tell Us More *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        value={formData.message}
                        onChange={handleChange}
                        className="form-textarea w-full text-gray-200"
                        placeholder="Describe your project, questions, or how we can help..."
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-sm text-indigo-200/65">
                      By submitting, you agree to our{" "}
                      <a
                        className="underline hover:no-underline"
                        href="/privacy"
                      >
                        Privacy Policy
                      </a>
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn group w-full sm:w-auto bg-linear-to-t from-emerald-600 to-emerald-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative inline-flex items-center">
                        {isSubmitting ? "Sending..." : "Request Consultation"}
                        <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FooterSeparator />
    </>
  );
}
