import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { ChatTC } from "@/components/chat";

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
      <ChatTC />
    </>
  );
}
