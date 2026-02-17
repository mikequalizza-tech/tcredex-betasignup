import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { ChatTC } from "@/components/chat";
import AOSProvider from "@/components/aosprovider";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AOSProvider>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ChatTC />
    </AOSProvider>
  );
}
