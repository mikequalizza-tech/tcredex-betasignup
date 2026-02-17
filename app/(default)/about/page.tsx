export const metadata = {
  title: "About us - tCredex",
  description: "Learn about tCredex's mission to streamline tax credit financing for community development",
};

import PageIllustration from "@/components/PageIllustration";
import Hero from "@/components/heroabout";
import Timeline from "@/components/timeline";
import Team from "@/components/team";
import Benefits from "@/components/benefits";
import Career from "@/components/career";
import Clients from "@/components/clients";
import Cta from "@/components/cta";

export default function About() {
  return (
    <>
      <PageIllustration multiple />
      <Hero />
      <Timeline />
      <Team />
      <Benefits />
      <Career />
      <Clients />
      <Cta />
    </>
  );
}
