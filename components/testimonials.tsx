"use client";

import { useState } from "react";
import useMasonry from "@/utils/useMasonry";

interface Testimonial {
  name: string;
  role: string;
  organization: string;
  orgType: 'cde' | 'sponsor' | 'investor' | 'attorney';
  content: string;
  categories: number[];
}

const testimonials: Testimonial[] = [
  {
    name: "Jennifer M.",
    role: "Director of Investments",
    organization: "Midwest Impact CDE",
    orgType: "cde",
    content: "tCredex has revolutionized how we source deals. What used to take weeks of phone calls and spreadsheets now happens in hours. The AutoMatch feature alone has increased our pipeline quality by 40%.",
    categories: [1, 2],
  },
  {
    name: "Robert T.",
    role: "CFO",
    organization: "Heritage Development Group",
    orgType: "sponsor",
    content: "As a first-time NMTC applicant, I was overwhelmed by the process. tCredex made it simple to understand our eligibility and connected us with the right CDEs for our healthcare project.",
    categories: [1, 3],
  },
  {
    name: "Lisa K.",
    role: "Tax Credit Specialist",
    organization: "National Community Fund",
    orgType: "investor",
    content: "The census tract mapping tool is incredibly accurate. We can now evaluate project eligibility in seconds instead of manually pulling data from multiple sources. A real time-saver.",
    categories: [1, 4],
  },
  {
    name: "Marcus W.",
    role: "Executive Director",
    organization: "Urban Renewal CDE",
    orgType: "cde",
    content: "The deal intake process captures exactly what we need to evaluate projects. No more back-and-forth emails asking for missing information. Our team can make faster decisions with complete data.",
    categories: [1, 2],
  },
  {
    name: "Sandra P.",
    role: "Development Partner",
    organization: "Cornerstone Ventures",
    orgType: "sponsor",
    content: "We submitted our community center project and had three qualified CDEs express interest within 48 hours. The platform matched us with partners who actually fit our project needs.",
    categories: [1, 3],
  },
  {
    name: "David H.",
    role: "Partner",
    organization: "Thompson & Associates LLP",
    orgType: "attorney",
    content: "As tax credit counsel, I appreciate how tCredex standardizes deal documentation. The closing room features ensure all parties have access to the right documents at the right time.",
    categories: [1, 5],
  },
  {
    name: "Michelle R.",
    role: "VP of Community Development",
    organization: "Great Lakes CDE",
    orgType: "cde",
    content: "Managing multiple allocation rounds used to be a nightmare. Now I can see all our federal and state allocations in one dashboard, track deployment deadlines, and monitor compliance commitments.",
    categories: [1, 2],
  },
  {
    name: "James L.",
    role: "CEO",
    organization: "Heartland Manufacturing Co.",
    orgType: "sponsor",
    content: "The Pricing Coach gave us realistic expectations for credit pricing before we even started talking to investors. No surprises, just transparency throughout the process.",
    categories: [1, 3],
  },
  {
    name: "Patricia A.",
    role: "Investment Director",
    organization: "Metro Tax Credit Partners",
    orgType: "investor",
    content: "Portfolio tracking across multiple NMTC investments is now effortless. I can see compliance years, credits remaining, and IRR performance all in one view. Exactly what we needed.",
    categories: [1, 4],
  },
];

export default function Testimonials() {
  const masonryContainer = useMasonry();
  const [category, setCategory] = useState<number>(1);

  const getOrgTypeColor = (orgType: Testimonial['orgType']) => {
    const colors = {
      cde: 'text-purple-400',
      sponsor: 'text-green-400',
      investor: 'text-blue-400',
      attorney: 'text-amber-400',
    };
    return colors[orgType];
  };

  const getOrgTypeBg = (orgType: Testimonial['orgType']) => {
    const colors = {
      cde: 'bg-purple-900/30 border-purple-700/50',
      sponsor: 'bg-green-900/30 border-green-700/50',
      investor: 'bg-blue-900/30 border-blue-700/50',
      attorney: 'bg-amber-900/30 border-amber-700/50',
    };
    return colors[orgType];
  };

  const getCardClass = (categories: number[]) => {
    const base = "relative rounded-2xl bg-gradient-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 p-5 backdrop-blur-sm transition-opacity";
    return categories.includes(category) ? base : base + " opacity-30";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="border-t py-12 md:py-20">
        <div className="mx-auto max-w-3xl pb-12 text-center">
          <h2 className="bg-gradient-to-r from-gray-200 via-indigo-200 to-gray-200 bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
            Trusted by Tax Credit Professionals
          </h2>
          <p className="text-lg text-indigo-200/65">
            CDEs, sponsors, investors, and advisors are streamlining their tax credit transactions with tCredex.
          </p>
        </div>

        <div>
          <div className="flex justify-center pb-12 max-md:hidden md:pb-16">
            <div className="relative inline-flex flex-wrap justify-center rounded-[1.25rem] bg-gray-800/40 p-1 gap-1">
              <button
                className={category === 1 ? "px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium" : "px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white"}
                onClick={() => setCategory(1)}
              >
                View All
              </button>
              <button
                className={category === 2 ? "px-4 py-2 rounded-full bg-gray-900 text-purple-400 text-sm font-medium" : "px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white"}
                onClick={() => setCategory(2)}
              >
                CDEs
              </button>
              <button
                className={category === 3 ? "px-4 py-2 rounded-full bg-gray-900 text-green-400 text-sm font-medium" : "px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white"}
                onClick={() => setCategory(3)}
              >
                Sponsors
              </button>
              <button
                className={category === 4 ? "px-4 py-2 rounded-full bg-gray-900 text-blue-400 text-sm font-medium" : "px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white"}
                onClick={() => setCategory(4)}
              >
                Investors
              </button>
              <button
                className={category === 5 ? "px-4 py-2 rounded-full bg-gray-900 text-amber-400 text-sm font-medium" : "px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white"}
                onClick={() => setCategory(5)}
              >
                Advisors
              </button>
            </div>
          </div>

          <div
            className="mx-auto grid max-w-sm items-start gap-6 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3"
            ref={masonryContainer}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <article className={getCardClass(testimonial.categories)}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getOrgTypeBg(testimonial.orgType)}`}>
                        <span className={getOrgTypeColor(testimonial.orgType)}>
                          {testimonial.orgType.toUpperCase()}
                        </span>
                      </span>
                    </div>
                    <p className="text-indigo-200/65">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${getOrgTypeBg(testimonial.orgType)} ${getOrgTypeColor(testimonial.orgType)}`}>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-sm font-medium text-gray-200">
                        <span>{testimonial.name}</span>
                        <span className="text-gray-700"> - </span>
                        <span className="text-indigo-200/65">
                          {testimonial.role}, {testimonial.organization}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

