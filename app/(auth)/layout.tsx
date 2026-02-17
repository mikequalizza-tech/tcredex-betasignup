'use client';

import Link from "next/link";
import Image from "next/image";
import PageIllustration from "@/components/PageIllustration";
import { AuthProvider } from "@/lib/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {/* Minimal header with logo */}
      <header className="absolute top-0 left-0 right-0 z-30 py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/tcredex_512x128.png"
                alt="tCredex"
                width={140}
                height={35}
                priority
              />
            </Link>
            <Link 
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>
      
      <main className="relative flex grow flex-col pt-16">
        <PageIllustration multiple />
        {children}
      </main>
    </AuthProvider>
  );
}
