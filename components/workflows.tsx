import Image from "next/image";
import WorflowImg01 from "@/public/images/workflow-01.png";
import WorflowImg02 from "@/public/images/workflow-02.png";
import WorflowImg03 from "@/public/images/workflow-03.png";
import Spotlight from "@/components/spotlight";

export default function Workflows() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Tailored Workflows
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Streamlined Tax Credit Process
            </h2>
            <p className="text-lg text-indigo-200/65">
              From project intake to closing &mdash; tCredex guides QALICBs, CDEs, and investors
              through every step of NMTC, LIHTC, and HTC financing with intelligent
              automation and data-driven insights.
            </p>
          </div>
          <Spotlight className="group mx-auto grid max-w-sm items-start gap-6 lg:max-w-none lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-800 p-px">
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-gray-950 after:absolute after:inset-0 after:bg-linear-to-br after:from-gray-900/50 after:via-gray-800/25 after:to-gray-900/50">
                <Image className="inline-flex" src={WorflowImg01} width={350} height={288} alt="Sponsor workflow" />
                <div className="p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal">
                      <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">For Sponsors</span>
                    </span>
                  </div>
                  <p className="text-indigo-200/65">
                    Submit projects in ~20 minutes. Our AI automatically scores
                    eligibility, matches CDEs, and identifies optimal financing structures.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-800 p-px">
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-gray-950 after:absolute after:inset-0 after:bg-linear-to-br after:from-gray-900/50 after:via-gray-800/25 after:to-gray-900/50">
                <Image className="inline-flex" src={WorflowImg02} width={350} height={288} alt="CDE workflow" />
                <div className="p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal">
                      <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">For CDEs</span>
                    </span>
                  </div>
                  <p className="text-indigo-200/65">
                    Build your pipeline with pre-qualified deals. Filter by allocation
                    type, geography, impact metrics, and investment readiness.
                  </p>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="group/card relative h-full overflow-hidden rounded-2xl bg-gray-800 p-px">
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-gray-950 after:absolute after:inset-0 after:bg-linear-to-br after:from-gray-900/50 after:via-gray-800/25 after:to-gray-900/50">
                <Image className="inline-flex" src={WorflowImg03} width={350} height={288} alt="Investor workflow" />
                <div className="p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal">
                      <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">For Investors</span>
                    </span>
                  </div>
                  <p className="text-indigo-200/65">
                    Access vetted NMTC, LIHTC, and HTC opportunities. Real-time
                    portfolio tracking with compliance monitoring and impact reporting.
                  </p>
                </div>
              </div>
            </div>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}
