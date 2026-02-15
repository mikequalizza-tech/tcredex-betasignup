export default function Clients() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Trusted by CDEs & Sponsors Nationwide
            </h2>
            <p className="mt-4 text-lg text-indigo-200/65">
              Join the growing network of community development professionals using tCredex
            </p>
          </div>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="relative flex h-28 flex-col items-center justify-center rounded-2xl p-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
              <div className="text-3xl font-bold text-indigo-400">85,000+</div>
              <div className="text-sm text-gray-400 text-center">Census Tracts Mapped</div>
            </div>
            <div className="relative flex h-28 flex-col items-center justify-center rounded-2xl p-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
              <div className="text-3xl font-bold text-emerald-400">5</div>
              <div className="text-sm text-gray-400 text-center">Tax Credit Programs</div>
            </div>
            <div className="relative flex h-28 flex-col items-center justify-center rounded-2xl p-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
              <div className="text-3xl font-bold text-purple-400">~20 min</div>
              <div className="text-sm text-gray-400 text-center">Average Intake Time</div>
            </div>
            <div className="relative flex h-28 flex-col items-center justify-center rounded-2xl p-4 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
              <div className="text-3xl font-bold text-amber-400">24/7</div>
              <div className="text-sm text-gray-400 text-center">AI-Powered Matching</div>
            </div>
          </div>

          {/* Program Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/30 border border-indigo-700/50 rounded-full">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span className="text-sm font-medium text-indigo-300">NMTC</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-green-300">LIHTC</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-full">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span className="text-sm font-medium text-amber-300">HTC</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-700/50 rounded-full">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm font-medium text-purple-300">Opportunity Zones</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-900/30 border border-teal-700/50 rounded-full">
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
              <span className="text-sm font-medium text-teal-300">Brownfield</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
