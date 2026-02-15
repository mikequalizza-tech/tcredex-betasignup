import { NextRequest, NextResponse } from "next/server";
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

function getHelpPages() {
  const helpDir = path.join(process.cwd(), "content/help");

  if (!fs.existsSync(helpDir)) {
    return [];
  }

  const files = fs.readdirSync(helpDir).filter((f) => f.endsWith(".mdx"));

  return files.map((file) => {
    const filePath = path.join(helpDir, file);
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const { metadata, content } = parseFrontmatter(rawContent);
    const slug = path.basename(file, ".mdx");

    return { slug, metadata, content };
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const allHelps = getHelpPages();
    const help = allHelps.find((h) => h.slug === slug);

    if (!help) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const navHelps = allHelps.map((h) => ({
      slug: h.slug,
      metadata: { title: h.metadata.title },
    }));

    return NextResponse.json({ help, allHelps: navHelps });
  } catch (error) {
    console.error("Error loading help:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
