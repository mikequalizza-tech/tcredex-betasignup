import type { Metadata } from "next";
import PageIllustration from "@/components/PageIllustration";
import FooterSeparator from "@/components/FooterSeparator";
import DocsSidebar from "./docs-sidebar";

export const metadata: Metadata = {
  title: "Documentation - tCredex",
  description: "Learn how to use tCredex - the AI-powered marketplace for tax credit financing.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageIllustration multiple />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-[calc(100vh-200px)]">
          {/* Left Sidebar - Sticky navigation */}
          <DocsSidebar />

          {/* Main content area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
      <FooterSeparator />
    </>
  );
}
