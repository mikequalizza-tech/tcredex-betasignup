import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // 1. Check DB first
    try {
      const supabase = getSupabaseAdmin();
      const { data: dbPost } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (dbPost) {
        interface DbBlogPost {
          title: string;
          summary: string | null;
          content: string;
          author: string;
          author_role: string | null;
          category: string | null;
          image_url: string | null;
          published_at: string | null;
        }
        const row = dbPost as DbBlogPost;
        return NextResponse.json({
          post: {
            slug,
            metadata: {
              title: row.title,
              summary: row.summary || "",
              author: row.author,
              authorRole: row.author_role || "",
              category: row.category || "Insights",
              image: row.image_url || "",
              publishedAt: row.published_at
                ? row.published_at.split("T")[0]
                : "",
            },
            content: row.content,
          },
        });
      }
    } catch {
      // DB unavailable — fall through to MDX
    }

    // 2. Fall back to MDX file
    const blogDir = path.join(process.cwd(), "content/blog");
    if (!fs.existsSync(blogDir)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));
    for (const file of files) {
      const fileSlug = path.basename(file, ".mdx");
      if (fileSlug === slug) {
        const filePath = path.join(blogDir, file);
        const rawContent = fs.readFileSync(filePath, "utf-8");
        const { metadata, content } = parseFrontmatter(rawContent);
        return NextResponse.json({ post: { slug, metadata, content } });
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Error loading blog:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
