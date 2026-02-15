import PageIllustration from "@/components/PageIllustration";

export default function HeroHome() {
  return (
    <section className="relative">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              The AI-Powered Tax Credit Marketplace — All 5 Programs, Zero Barriers
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-indigo-200/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                The marketplace for Federal &amp; State NMTC, LIHTC, HTC, Brownfields, and Opportunity Zones.
                Tailored workflows for Sponsors, CDEs, and Investors — connecting the entire tax credit ecosystem.
              </p>

              <div
                className="mb-8 text-left mx-auto max-w-2xl"
                data-aos="fade-up"
                data-aos-delay={300}
              >
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Why tCredex?</h2>
                <ul className="space-y-3 text-lg text-indigo-200/65">
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">&bull;</span>
                    <span><strong>Universal Coverage:</strong> NMTC, HTC, LIHTC, Brownfields, Opportunity Zones — all programs in one platform</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">&bull;</span>
                    <span><strong>True Marketplace:</strong> Custom homepages for Sponsors, CDEs, and Investors with secure data storage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">&bull;</span>
                    <span><strong>Lightning Fast Onboarding:</strong> Get started in ~20 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">&bull;</span>
                    <span><strong>Free to Use:</strong> Pay-for-performance pricing model</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">&bull;</span>
                    <span><strong>AutoMatch AI:</strong> Intelligent matching of Deals, CDEs, Investors, and Census Tract data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-indigo-500">&bull;</span>
                    <span><strong>SOT Map Intelligence:</strong> The industry&apos;s first &quot;Source of Truth&quot; map using data directly from Government sources</span>
                  </li>
                </ul>
              </div>

              <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,--theme(--color-gray-700/.7),transparent)_1]">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <a
                    className="btn group mb-4 w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="#address-lookup"
                  >
                    <span className="relative inline-flex items-center">
                      Address Lookup
                      <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                        &rarr;
                      </span>
                    </span>
                  </a>
                  <a
                    className="btn relative w-full bg-linear-to-b from-purple-600 to-purple-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:ml-4 sm:w-auto"
                    href="#beta-signup"
                  >
                    Join Beta
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            className="mx-auto max-w-3xl"
            data-aos="zoom-y-out"
            data-aos-delay={600}
          >
            <div className="relative rounded-2xl border border-gray-700/50 bg-gray-900/50 px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-400">$450M</p>
                  <p className="text-xs text-gray-500">Historic Tax Credit Investments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">85</p>
                  <p className="text-xs text-gray-500">NMTC Projects Closed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">$3B</p>
                  <p className="text-xs text-gray-500">LIHTC Syndication</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">$350M</p>
                  <p className="text-xs text-gray-500">State Tax Credits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">$650M</p>
                  <p className="text-xs text-gray-500">NMTC Allocation Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
