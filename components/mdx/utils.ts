import fs from "fs";
import path from "path";

type Metadata = {
  title: string;
  summary?: string;
  publishedAt: string;
  updatedAt?: string;
  image?: string;
  author?: string;
  authorImg?: string;
  authorRole?: string;
  authorLink?: string;
  category?: string;
};

function parseFrontmatter(fileContent: string, filename?: string) {
  try {
    const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
    const match = frontmatterRegex.exec(fileContent);
    
    // Handle files without frontmatter
    if (!match) {
      console.warn(`[MDX] No frontmatter found in ${filename || 'unknown file'}`);
      return {
        metadata: {
          title: filename ? path.basename(filename, '.mdx') : "Untitled",
          publishedAt: new Date().toISOString().split('T')[0],
        } as Metadata,
        content: fileContent.trim(),
      };
    }
    
    const frontMatterBlock = match[1];
    const content = fileContent.replace(frontmatterRegex, "").trim();
    const frontMatterLines = frontMatterBlock.trim().split("\n");
    const metadata: Partial<Metadata> = {};

    frontMatterLines.forEach((line) => {
      const colonIndex = line.indexOf(": ");
      if (colonIndex === -1) return;
      
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 2).trim();
      
      // Remove quotes
      value = value.replace(/^['"](.*)['"]$/, "$1");
      
      // Skip array values (like tags: [...])
      if (value.startsWith("[")) return;
      
      // Map alternative field names
      if (key === "date") {
        metadata.publishedAt = value;
      } else if (key === "description") {
        metadata.summary = value;
      } else {
        metadata[key as keyof Metadata] = value;
      }
    });

    // Ensure required fields have defaults
    if (!metadata.title) {
      metadata.title = filename ? path.basename(filename, '.mdx') : "Untitled";
    }
    if (!metadata.publishedAt) {
      metadata.publishedAt = new Date().toISOString().split('T')[0];
    }

    return { metadata: metadata as Metadata, content };
  } catch (error) {
    console.error(`[MDX] Error parsing frontmatter in ${filename || 'unknown file'}:`, error);
    return {
      metadata: {
        title: filename ? path.basename(filename, '.mdx') : "Untitled",
        publishedAt: new Date().toISOString().split('T')[0],
      } as Metadata,
      content: fileContent.trim(),
    };
  }
}

function getMDXFiles(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`[MDX] Directory not found: ${dir}`);
      return [];
    }
    return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
  } catch (error) {
    console.error(`[MDX] Error reading directory ${dir}:`, error);
    return [];
  }
}

function readMDXFile(filePath: string) {
  try {
    const rawContent = fs.readFileSync(filePath, "utf-8");
    return parseFrontmatter(rawContent, filePath);
  } catch (error) {
    console.error(`[MDX] Error reading file ${filePath}:`, error);
    return {
      metadata: {
        title: path.basename(filePath, '.mdx'),
        publishedAt: new Date().toISOString().split('T')[0],
      } as Metadata,
      content: '',
    };
  }
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles
    .map((file) => {
      const { metadata, content } = readMDXFile(path.join(dir, file));
      const slug = path.basename(file, path.extname(file));
      return {
        metadata,
        slug,
        content,
      };
    })
    .filter((post) => post.metadata.title !== "Untitled" || post.content.length > 0);
}

export function getBlogPosts() {
  return getMDXData(path.join(process.cwd(), "content/blog"));
}

export function getHelpPages() {
  return getMDXData(path.join(process.cwd(), "content/help"));
}
