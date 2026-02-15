"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function HomeFAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative" id="faq">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-gradient-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-gradient-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                FAQ
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-indigo-200/65">
              Everything you need to know about tCredex and tax credit financing.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-800 bg-gray-900/30 overflow-hidden"
                >
                  <button
                    className="flex w-full items-center justify-between px-6 py-4 text-left"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    aria-expanded={openIndex === index}
                  >
                    <span className="font-medium text-gray-200 pr-4">{item.question}</span>
                    <svg
                      className={`w-5 h-5 text-indigo-400 shrink-0 transition-transform duration-200 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-200 ${
                      openIndex === index ? "max-h-96 pb-4" : "max-h-0"
                    }`}
                  >
                    <p className="px-6 text-indigo-200/65 leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
