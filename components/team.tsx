export default function Team() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              It&apos;s All About the People
            </h2>
          </div>

          {/* Team Description */}
          <div className="mx-auto max-w-4xl">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 md:p-12">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                tCredex.com&apos;s team brings more than{" "}
                <span className="text-indigo-400 font-semibold">
                  25 years of deep, specialized experience
                </span>{" "}
                across the full spectrum of community development finance and
                tax-credit execution. Their background includes operating a
                high-performing Community Development Entity (CDE), securing
                more than{" "}
                <span className="text-green-400 font-semibold">
                  11 industry awards
                </span>
                , and successfully syndicating billions in Low-Income Housing
                Tax Credits (LIHTC).
              </p>

              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Beyond financial structuring, the team has{" "}
                <span className="text-indigo-400 font-semibold">
                  direct, hands-on development experience
                </span>
                , giving them a practical understanding of how complex projects
                come together in the real world. They have engineered some of
                the most intricate capital stacks in the industry, navigating
                multi-layered tax-credit structures, compliance requirements,
                and syndication methodologies with precision.
              </p>

              <p className="text-gray-300 text-lg leading-relaxed">
                This combination of technical expertise, operational leadership,
                and real-world development insight positions tCredex.com as a{" "}
                <span className="text-indigo-400 font-semibold">
                  uniquely capable partner
                </span>{" "}
                for organizations seeking to structure, finance, and execute
                sophisticated community development and tax-credit transactions.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">
                  25+
                </div>
                <div className="text-sm text-gray-400">Years Experience</div>
              </div>
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                  11+
                </div>
                <div className="text-sm text-gray-400">Industry Awards</div>
              </div>
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                  $B+
                </div>
                <div className="text-sm text-gray-400">LIHTC Syndicated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
