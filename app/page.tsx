import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import HeroHome from "@/components/HeroHome";
import Workflows from "@/components/workflows";
import MapSection from "@/components/MapSection";
import Features from "@/components/features";
import BetaSignup from "@/components/BetaSignup";
import HomeFAQ from "@/components/HomeFAQ";
import ChatTC from "@/components/chat/ChatTC";
import { FAQSchema } from "@/components/StructuredData";

// Preload the map component on initial page load
import("@/components/maps/HomeMapWithTracts");

const faqItems = [
  {
    question: "What is tCredex?",
    answer: "tCredex is an AI-powered marketplace that connects community development projects with tax credit financing across five programs: New Markets Tax Credits (NMTC), Low-Income Housing Tax Credits (LIHTC), Historic Tax Credits (HTC), Opportunity Zones, and Brownfield Credits.",
  },
  {
    question: "How does the census tract eligibility lookup work?",
    answer: "Enter any U.S. address and tCredex instantly determines eligibility across all five tax credit programs by cross-referencing 85,000+ census tracts with federal and state program data. Results include NMTC qualification, LIHTC QCT/DDA status, Opportunity Zone designation, and state-level credits.",
  },
  {
    question: "What is a QALICB and how does tCredex help?",
    answer: "A QALICB (Qualified Active Low-Income Community Business) is a business or project that qualifies to receive NMTC financing. tCredex helps QALICBs find matched CDEs using AI-powered AutoMatch, which scores compatibility based on geography, sector focus, deal size, and CDE preferences.",
  },
  {
    question: "How does AutoMatch work?",
    answer: "AutoMatch uses a binary scoring algorithm with 15 criteria to match deals with CDEs and investors. It evaluates geography, sector alignment, deal size, rural/urban focus, distress levels, and more. Each CDE is scored 0-100% compatibility, with Excellent (80%+), Good (65%+), and Fair (50%+) tiers.",
  },
  {
    question: "Is tCredex free to use?",
    answer: "The beta version offers free access to census tract eligibility lookups, blog content, and documentation. The full platform with deal intake, CDE matching, pipeline management, and closing room features will be available at launch.",
  },
  {
    question: "What tax credit programs does tCredex cover?",
    answer: "tCredex is the first marketplace covering all five major tax credit programs: New Markets Tax Credits (NMTC), Low-Income Housing Tax Credits (LIHTC), Historic Tax Credits (HTC), Opportunity Zones (OZ), and Brownfield Credits. This includes both federal and state-level programs.",
  },
];

export default function HomePage() {
  return (
    <>
      <FAQSchema items={faqItems} />
      <Header />
      <main className="min-h-screen">
        <HeroHome />
        <Features />
        <MapSection
          title="Tax Credit Eligibility Lookup"
          description="Search any U.S. address for federal credits (NMTC, LIHTC QCT, DDA, Opportunity Zones) plus state programs. No login required."
          showSearch
        />
        <Workflows />
        <HomeFAQ items={faqItems} />
        <BetaSignup />
      </main>
      <Footer />
      <ChatTC />
    </>
  );
}
