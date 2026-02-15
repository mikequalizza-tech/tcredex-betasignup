"use client";

import { useEffect, useState } from "react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import PostItem from "./post-item";
import CategoryProvider from "./category-provider";
import BlogFilters from "./filters";

interface BlogPost {
  slug: string;
  metadata: {
    title: string;
    summary?: string;
    publishedAt?: string;
    category?: string;
    author?: string;
    authorRole?: string;
    image?: string;
    authorImg?: string;
  };
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/data/blog-index.json");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (e) {
        console.error("Failed to load blog posts:", e);
      }
      setLoading(false);
    }
    loadPosts();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          <section>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="py-12 md:py-20">
                <div className="pb-12 text-center">
                  <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                    The tCredex Blog
                  </h1>
                </div>
                <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[16/10] bg-gray-800 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/4 mb-3"></div>
                      <div className="h-6 bg-gray-800 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-800 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <section>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="py-12 md:py-20">
              {/* Section header */}
              <div className="pb-12 text-center">
                <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl">
                  The tCredex Blog
                </h1>
                <div className="mx-auto max-w-3xl">
                  <p className="text-xl text-indigo-200/65">
                    Insights on tax credit financing, NMTC strategies, and community
                    development from tCredex.
                  </p>
                </div>
              </div>
              <div>
                <CategoryProvider>
                  <BlogFilters />
                  <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
                    {posts.length === 0 ? (
                      <div className="col-span-3 text-center py-12">
                        <p className="text-gray-400">No blog posts found.</p>
                      </div>
                    ) : (
                      posts.map((post, postIndex) => (
                        <PostItem key={postIndex} metadata={post.metadata} slug={post.slug} />
                      ))
                    )}
                  </div>
                </CategoryProvider>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
