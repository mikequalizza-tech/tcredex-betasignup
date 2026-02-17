import HeroHome from "@/components/HeroHome";
import FeaturedDeals from "@/components/FeaturedDeals";
import Workflows from "@/components/workflows";
import NoRiskSection from "@/components/NoRiskSection";
import Cta from "@/components/cta";
import MapSection from "@/components/MapSection";
import Features from "@/components/features";

// Preload the map component on initial page load
// This import starts loading the component module immediately
import("@/components/maps/HomeMapWithTracts");

export default function HomePage() {
  return (
    <>
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
    </>
  );
}
