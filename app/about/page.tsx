import { Metadata } from "next";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import PageIllustration from "@/components/PageIllustration";
import Hero from "@/components/heroabout";
import Timeline from "@/components/timeline";
import Team from "@/components/team";
import Career from "@/components/career";
import Clients from "@/components/clients";
import Cta from "@/components/cta";

export const metadata: Metadata = {
  title: "About tCredex - AI-Powered Tax Credit Marketplace",
  description: "Learn about tCredex's mission to streamline NMTC, LIHTC, HTC, Opportunity Zone, and Brownfield tax credit financing for community development. 25+ years of experience, 85,000+ census tracts mapped.",
  openGraph: {
    title: "About tCredex - AI-Powered Tax Credit Marketplace",
    description: "Learn about tCredex's mission to streamline tax credit financing for community development.",
    url: "/about",
  },
  alternates: {
    canonical: "/about",
  },
};

export default function About() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <PageIllustration multiple />
        <Hero />
        <Timeline />
        <Team />
        <Career />
        <Clients />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
