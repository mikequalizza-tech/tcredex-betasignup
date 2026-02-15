import Image from "next/image";

import BlurredShapeImg from "@/public/images/blurred-shape.svg";

const opportunities = [
  {
    title: "CDE Partners",
    description:
      "We're partnering with CDEs nationwide who want to streamline their deal sourcing. Get matched with pre-qualified projects that fit your investment criteria and geographic focus.",
    type: "Partnership",
    benefit: "Reduce sourcing time by 70%",
  },
  {
    title: "Tax Credit Attorneys",
    description:
      "Join our network of legal advisors to support closing room transactions. Help sponsors and CDEs navigate compliance and structure deals that work.",
    type: "Network Partner",
    benefit: "Access deal flow",
  },
  {
    title: "CPA & Advisory Firms",
    description:
      "Partner with tCredex to bring your clients access to our marketplace. We integrate with your existing tax credit models and workflows.",
    type: "Referral Partner",
    benefit: "Revenue sharing",
  },
];

export default function Career() {
  return (
    <section className="relative">
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -mt-64 -translate-x-[80%] opacity-50"
        aria-hidden="true"
      >
        <Image
          className="max-w-none"
          src={BlurredShapeImg}
          width={760}
          height={668}
          alt="Blurred shape"
        />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          <div className="mx-auto max-w-3xl">
            {/* Section header */}
            <h3 className="mb-4 font-nacelle text-xl font-semibold md:text-2xl">
              Partner with tCredex
            </h3>
            <p className="mb-8 text-indigo-200/65">
              We&apos;re building the ecosystem for tax credit financing. Here&apos;s how you can be part of it.
            </p>
            {/* Opportunity list */}
            <div className="-my-6 divide-y">
              {opportunities.map((opportunity, index) => (
                <div
                  key={index}
                  className="py-6 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1]"
                >
                  <div className="group relative flex items-center space-x-3">
                    <div>
                      <div className="mb-2">
                        <span className="font-nacelle text-lg font-semibold text-gray-200">
                          {opportunity.title}
                        </span>
                      </div>
                      <div className="mb-4 text-[1rem] text-indigo-200/65">
                        {opportunity.description}
                      </div>
                      <div className="flex flex-wrap items-center text-sm text-indigo-200/65">
                        <div className="inline-flex items-center">
                          <svg
                            className="mr-2 shrink-0"
                            width={16}
                            height={15}
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              className="fill-indigo-500"
                              d="M6 0a2 2 0 0 0-2 2v7H2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V2a2 2 0 0 0-2-2H6Zm4 13V2H6v11h4Zm4 0h-2V9h2v4ZM4 13v-2H2v2h2Z"
                              fillRule="evenodd"
                            />
                          </svg>
                          <span>{opportunity.type}</span>
                        </div>
                        <span className="mx-3 text-gray-700"> - </span>
                        <div className="inline-flex items-center">
                          <svg
                            className="mr-2 shrink-0"
                            width={16}
                            height={15}
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              className="fill-green-500"
                              d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.707 6.707a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4Z"
                              fillRule="evenodd"
                            />
                          </svg>
                          <span className="text-green-400">{opportunity.benefit}</span>
                        </div>
                      </div>
                    </div>
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
