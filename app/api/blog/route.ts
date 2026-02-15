import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);

  if (!match) {
    return {
      metadata: { title: "Untitled", publishedAt: new Date().toISOString().split("T")[0] },
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

function getBlogPosts() {
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

    return { slug, metadata };
  });
}

export async function GET() {
  try {
    const posts = getBlogPosts();

    posts.sort((a, b) => {
      const dateA = new Date(a.metadata.publishedAt || "1970-01-01");
      const dateB = new Date(b.metadata.publishedAt || "1970-01-01");
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error loading blog posts:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
