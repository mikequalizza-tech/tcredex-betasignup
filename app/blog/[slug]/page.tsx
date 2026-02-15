"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { CustomMDX } from "@/components/mdx/mdx";

interface BlogPost {
  slug: string;
  content: string;
  metadata: {
    title: string;
    summary?: string;
    image?: string;
    author?: string;
    authorImg?: string;
    authorRole?: string;
    authorLink?: string;
    category?: string;
    publishedAt?: string;
  };
}

const AuthorAvatar = ({
  src,
  alt,
  href,
}: {
  src?: string;
  alt: string;
  href?: string;
}) => {
  const safe = href && href !== "#0" ? href : undefined;
  const [imgError, setImgError] = useState(false);

  const fallback = (
    <div className="inline-flex shrink-0 rounded-full w-9 h-9 bg-indigo-600 items-center justify-center text-white text-sm font-medium">
      {alt?.trim()?.charAt(0)?.toUpperCase() || "A"}
    </div>
  );

  const content = src && !imgError ? (
    <Image
      className="inline-flex shrink-0 rounded-full"
      src={src}
      width={36}
      height={36}
      alt={alt}
      onError={() => setImgError(true)}
    />
  ) : (
    fallback
  );

  return safe ? <a href={safe}>{content}</a> : content;
};

export default function SinglePost() {
  const params = useParams();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/data/blog/${slug}.json`);
        if (!res.ok) {
          setError("Post not found");
          setLoading(false);
          return;
        }
        const post = await res.json();
        setPost(post);
        setLoading(false);
      } catch {
        setError("Failed to load post");
        setLoading(false);
      }
    }
    if (slug) {
      loadPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          <section>
            <div className="px-4 sm:px-6">
              <div className="py-12 md:py-20">
                <div className="mx-auto max-w-3xl">
                  <div className="animate-pulse">
                    <div className="h-10 bg-gray-800 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-800 rounded w-1/2 mb-8"></div>
                    <div className="aspect-video bg-gray-800 rounded-2xl mb-8"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          <section>
            <div className="px-4 sm:px-6">
              <div className="py-12 md:py-20 text-center">
                <h1 className="text-2xl font-semibold text-gray-200 mb-4">Post Not Found</h1>
                <p className="text-gray-400 mb-6">The blog post you&apos;re looking for doesn&apos;t exist.</p>
                <Link href="/blog" className="text-indigo-400 hover:underline">
                  Back to Blog
                </Link>
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
          <div className="px-4 sm:px-6">
            <div className="py-12 md:py-20">
              <div className="mx-auto max-w-3xl">
                <article>
                  <header className="mb-8">
                    <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                      {post.metadata.title}
                    </h1>
                    <div className="mx-auto mb-5 max-w-3xl">
                      <p className="text-lg text-indigo-200/65">
                        {post.metadata.summary}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <AuthorAvatar
                          src={post.metadata.authorImg}
                          alt={post.metadata.author || "tCredex"}
                          href={post.metadata.authorLink}
                        />
                        <div className="text-sm font-medium text-gray-200">
                          <span>{post.metadata.author || "tCredex"}</span>
                          <span className="text-gray-700"> - </span>
                          <span className="text-indigo-200/65">
                            {post.metadata.authorRole || "Author"}
                          </span>
                        </div>
                      </div>
                      {post.metadata.category && (
                        <ul className="flex flex-wrap gap-2">
                          <li>
                            <span className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal">
                              <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                                {post.metadata.category}
                              </span>
                            </span>
                          </li>
                        </ul>
                      )}
                    </div>
                  </header>

                  {post.metadata.image && (
                    <figure className="relative my-8 overflow-hidden rounded-2xl border border-gray-800/80 lg:-ml-32 lg:-mr-32">
                      <Image
                        className="aspect-video w-full object-cover opacity-70 grayscale"
                        src={post.metadata.image}
                        width={1024}
                        height={576}
                        alt={post.metadata.title}
                        priority
                      />
                    </figure>
                  )}

                  <div className="prose prose-invert max-w-none">
                    <CustomMDX source={post.content} />
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
