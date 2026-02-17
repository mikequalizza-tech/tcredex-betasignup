'use client';

import { useState } from 'react';
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";
import Link from 'next/link';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: 'platform_support' }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      setSubmitted(true);
    } catch (_err) {
      setError('Failed to send message. Please email us directly at support@tcredex.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Support Request Received!</h1>
                <p className="text-lg text-gray-400 mb-8">
                  Our support team will review your request and get back to you within 24 hours.
                </p>
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                >
                  Return Home
                </Link>
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
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                tCredex Support
              </h1>
              <div className="mx-auto max-w-3xl">
                <p className="text-xl text-indigo-200/65">
                  Get help with the tCredex platform - account issues, technical support, and feature questions.
                </p>
              </div>
            </div>

            {/* Support Options */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-2">Email Support</h3>
                <a href="mailto:support@tcredex.com" className="text-indigo-400 hover:underline">
                  support@tcredex.com
                </a>
              </div>

              <Link href="/contact-aiv" className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center hover:border-indigo-600 transition-colors group">
                <div className="w-12 h-12 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">Tax Credit Advisory</h3>
                <p className="text-gray-400 text-sm">
                  Need deal structuring help? Contact AIV →
                </p>
              </Link>
            </div>

            {/* Contact form */}
            <form onSubmit={handleSubmit} className="mx-auto max-w-[640px] bg-gray-900 rounded-xl border border-gray-800 p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Submit a Support Request</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="name">
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
                    <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
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

                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="topic">
                    What do you need help with? *
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    required
                    value={formData.topic}
                    onChange={handleChange}
                    className="form-select w-full text-gray-200"
                  >
                    <option value="" disabled>Select a topic</option>
                    <option value="account">Account / Login Issues</option>
                    <option value="intake">Intake Form Help</option>
                    <option value="map">Map / Eligibility Check</option>
                    <option value="marketplace">Marketplace Questions</option>
                    <option value="documents">Document Upload</option>
                    <option value="technical">Technical Issue / Bug</option>
                    <option value="billing">Billing / Subscription</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="message">
                    Describe Your Issue *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="form-textarea w-full text-gray-200"
                    placeholder="Please describe what you're experiencing or what you need help with..."
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-sm text-indigo-200/65">
                  We typically respond within 24 hours.
                </p>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="btn group w-full sm:w-auto bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative inline-flex items-center">
                    {isSubmitting ? 'Sending...' : 'Submit Request'}
                    <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <FooterSeparator />
    </>
  );
}
