import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { ChatTC } from "@/components/chat";

export const metadata = {
  title: "NMTC Tract Map | tCredex",
  description: "Explore NMTC-eligible census tracts with our interactive mapping tool.",
};

export default function TractMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-950">
        {children}
      </main>
      <Footer />
      <ChatTC />
    </>
  );
}
