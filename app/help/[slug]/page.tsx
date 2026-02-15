"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { CustomMDX } from "@/components/mdx/mdx";

interface HelpPage {
  slug: string;
  content: string;
  metadata: {
    title: string;
    summary?: string;
    updatedAt?: string;
  };
}

export default function SingleHelp() {
  const params = useParams();
  const slug = params?.slug as string;

  const [help, setHelp] = useState<HelpPage | null>(null);
  const [allHelps, setAllHelps] = useState<HelpPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHelp() {
      try {
        const res = await fetch(`/api/help/${slug}`);
        if (!res.ok) {
          setError("Page not found");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setHelp(data.help);
        setAllHelps(data.allHelps || []);
        setLoading(false);
      } catch {
        setError("Failed to load page");
        setLoading(false);
      }
    }
    if (slug) {
      loadHelp();
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="py-12 md:py-16">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3 mb-8"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-800 rounded"></div>
                  <div className="h-4 bg-gray-800 rounded"></div>
                  <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !help) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="py-12 md:py-16 text-center">
              <h1 className="text-2xl font-semibold text-gray-200 mb-4">Page Not Found</h1>
              <p className="text-gray-400 mb-6">The help article you&apos;re looking for doesn&apos;t exist.</p>
              <Link href="/help" className="text-indigo-400 hover:underline">
                Back to Documentation
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentIndex = allHelps.findIndex((h) => h.slug === slug);
  const prev = currentIndex > 0 ? allHelps[currentIndex - 1] : null;
  const next = currentIndex < allHelps.length - 1 ? allHelps[currentIndex + 1] : null;

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="py-12 md:py-16">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
              <Link href="/help" className="hover:text-indigo-400 transition">
                Docs
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-300">{help.metadata.title}</span>
            </nav>

            {/* Article */}
            <article>
              <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                {help.metadata.title}
              </h1>

              {help.metadata.summary && (
                <p className="text-lg text-indigo-200/65 mb-8">
                  {help.metadata.summary}
                </p>
              )}

              {help.metadata.updatedAt && (
                <p className="text-sm text-gray-500 mb-8 border-b border-gray-800 pb-6">
                  Last updated: {new Date(help.metadata.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}

              <div className="prose prose-invert prose-indigo max-w-none">
                <CustomMDX source={help.content} />
              </div>
            </article>

            {/* Navigation */}
            <nav className="mt-12 pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                {prev ? (
                  <Link
                    href={`/help/${prev.slug}`}
                    className="group flex-1 rounded-lg border border-gray-800 p-4 transition hover:border-gray-700 hover:bg-gray-800/30"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <svg className="w-4 h-4 transition group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </div>
                    <span className="font-medium text-gray-300 group-hover:text-indigo-400 transition">
                      {prev.metadata.title}
                    </span>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}

                {next ? (
                  <Link
                    href={`/help/${next.slug}`}
                    className="group flex-1 rounded-lg border border-gray-800 p-4 transition hover:border-gray-700 hover:bg-gray-800/30 text-right"
                  >
                    <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mb-1">
                      <span>Next</span>
                      <svg className="w-4 h-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-300 group-hover:text-indigo-400 transition">
                      {next.metadata.title}
                    </span>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </nav>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
