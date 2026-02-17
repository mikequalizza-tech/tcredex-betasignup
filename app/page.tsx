import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import HeroHome from "@/components/HeroHome";
import FeaturedDeals from "@/components/FeaturedDeals";
import Workflows from "@/components/workflows";
import NoRiskSection from "@/components/NoRiskSection";
import Cta from "@/components/cta";
import MapSection from "@/components/MapSection";
import Features from "@/components/features";
import { ChatTC } from "@/components/chat";
import AOSProvider from "@/components/aosprovider";

// Preload the map component on initial page load
import("@/components/maps/HomeMapWithTracts");

export default function HomePage() {
  return (
    <AOSProvider>
      <Header />
      <main className="min-h-screen">
        <HeroHome />
        <Features />
        <NoRiskSection />
        <FeaturedDeals />
        <MapSection
          title="Tax Credit Eligibility Lookup"
          description="Search any U.S. address for federal credits (NMTC, LIHTC QCT, DDA, Opportunity Zones) plus state programs. No login required."
          showLegend
          showSearch
        />
        <Workflows />
        <Cta />
      </main>
      <Footer />
      <ChatTC />
    </AOSProvider>
  );
}
