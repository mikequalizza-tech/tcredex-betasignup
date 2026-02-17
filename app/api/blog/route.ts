import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);

  if (!match) {
    return {
      metadata: {
        title: "Untitled",
        publishedAt: new Date().toISOString().split("T")[0],
      },
      content: fileContent.trim(),
    };
  }

  const frontMatterBlock = match[1];
  const content = fileContent.replace(frontmatterRegex, "").trim();
  const metadata: Record<string, string> = {};

  frontMatterBlock.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    value = value.replace(/^['"](.*)['"]$/, "$1");
    if (value.startsWith("[")) return;
    if (!value) return;
    metadata[key] = value;
  });

  return { metadata, content };
}

function getMdxPosts() {
  const blogDir = path.join(process.cwd(), "content/blog");

  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));

  return files.map((file) => {
    const filePath = path.join(blogDir, file);
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const { metadata } = parseFrontmatter(rawContent);
    const slug = path.basename(file, ".mdx");

    return { slug, metadata, source: "mdx" as const };
  });
}

export async function GET() {
  try {
    // 1. Get MDX posts
    const mdxPosts = getMdxPosts();

    // 2. Get published DB posts
    let dbPosts: {
      slug: string;
      metadata: Record<string, string>;
      source: "db";
    }[] = [];
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from("blog_posts")
        .select(
          "slug, title, summary, author, author_role, category, image_url, published_at",
        )
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data) {
        interface DbBlogRow {
          slug: string;
          title: string;
          summary: string | null;
          author: string;
          author_role: string | null;
          category: string | null;
          image_url: string | null;
          published_at: string | null;
        }
        dbPosts = (data as DbBlogRow[]).map((row) => ({
          slug: row.slug,
          metadata: {
            title: row.title,
            summary: row.summary || "",
            author: row.author,
            authorRole: row.author_role || "",
            category: row.category || "Insights",
            image: row.image_url || "",
            publishedAt: row.published_at
              ? row.published_at.split("T")[0]
              : new Date().toISOString().split("T")[0],
          },
          source: "db" as const,
        }));
      }
    } catch {
      // DB unavailable — fall back to MDX only
    }

    // 3. Merge and deduplicate by slug (DB wins over MDX)
    const slugSet = new Set<string>();
    const allPosts: { slug: string; metadata: Record<string, string> }[] = [];

    for (const post of dbPosts) {
      slugSet.add(post.slug);
      allPosts.push(post);
    }
    for (const post of mdxPosts) {
      if (!slugSet.has(post.slug)) {
        allPosts.push(post);
      }
    }

    // 4. Sort by date descending
    allPosts.sort((a, b) => {
      const dateA = new Date(a.metadata.publishedAt || "1970-01-01");
      const dateB = new Date(b.metadata.publishedAt || "1970-01-01");
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ posts: allPosts });
  } catch (error) {
    console.error("Error loading blog posts:", error);
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 },
    );
  }
}
