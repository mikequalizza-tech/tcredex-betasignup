export default function HeroAbout() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
              About tCredex
            </h1>
            <div className="mx-auto max-w-3xl">
              <p className="text-xl text-indigo-200/65 mb-6">
                The AI-powered marketplace connecting tax credit projects with the capital they need.
              </p>
              <p className="text-base text-indigo-200/50">
                tCredex was born from a simple observation: the tax credit financing ecosystem is fragmented, opaque, and inefficient. Project sponsors struggle to find CDEs with allocation authority. CDEs waste time reviewing unqualified deals. Investors lack visibility into the pipeline.
              </p>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-3">Our Mission</h2>
                <p className="text-indigo-200/65">
                  To democratize access to tax credit financing by creating the most efficient marketplace for connecting community development projects with the capital they need to succeed.
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-100 mb-3">Our Vision</h2>
                <p className="text-indigo-200/65">
                  A world where every qualified project in low-income and distressed communities can access tax credit financing quickly, transparently, and at fair terms.
                </p>
              </div>
            </div>

            {/* 5 Programs */}
            <div className="mt-12 text-center">
              <h2 className="text-xl font-semibold text-gray-100 mb-6">5 Tax Credit Programs. One Platform.</h2>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 bg-indigo-900/50 text-indigo-300 rounded-full text-sm font-medium">NMTC</span>
                <span className="px-4 py-2 bg-green-900/50 text-green-300 rounded-full text-sm font-medium">LIHTC</span>
                <span className="px-4 py-2 bg-amber-900/50 text-amber-300 rounded-full text-sm font-medium">HTC</span>
                <span className="px-4 py-2 bg-purple-900/50 text-purple-300 rounded-full text-sm font-medium">Opportunity Zones</span>
                <span className="px-4 py-2 bg-teal-900/50 text-teal-300 rounded-full text-sm font-medium">Brownfield</span>
              </div>
            </div>

            {/* Affiliate Note */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500">
                tCredex.com is an affiliate of American Impact Ventures LLC
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
