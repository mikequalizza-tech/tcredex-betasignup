"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const transformToSlug = (input: string) => {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

// Simple markdown parser for common elements
function parseMarkdown(source: string): React.ReactNode[] {
  const lines = source.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let listType: "ul" | "ol" = "ul";
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let _codeBlockLang = "";

  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listType;
      elements.push(
        <ListTag
          key={elements.length}
          className={`mb-6 ml-6 ${listType === "ul" ? "list-disc" : "list-decimal"} space-y-2`}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-indigo-200/65">
              {parseInline(item)}
            </li>
          ))}
        </ListTag>,
      );
      listItems = [];
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre
          key={elements.length}
          className="mb-6 overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/70 p-4"
        >
          <code>{codeBlockContent.join("\n")}</code>
        </pre>,
      );
      codeBlockContent = [];
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
        _codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Horizontal rule
    if (
      line.trim() === "---" ||
      line.trim() === "***" ||
      line.trim() === "___"
    ) {
      flushList();
      elements.push(
        <hr key={elements.length} className="my-8 border-gray-800" />,
      );
      continue;
    }

    // Headers
    const h4Match = line.match(/^####\s+(.+)$/);
    if (h4Match) {
      flushList();
      const text = h4Match[1];
      const slug = transformToSlug(text);
      elements.push(
        <h4
          key={elements.length}
          id={slug}
          className="mt-6 mb-3 text-lg font-semibold text-gray-200"
        >
          {parseInline(text)}
        </h4>,
      );
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      flushList();
      const text = h3Match[1];
      const slug = transformToSlug(text);
      elements.push(
        <h3
          key={elements.length}
          id={slug}
          className="mt-8 mb-4 text-xl font-semibold text-gray-200"
        >
          {parseInline(text)}
        </h3>,
      );
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushList();
      const text = h2Match[1];
      const slug = transformToSlug(text);
      elements.push(
        <h2
          key={elements.length}
          id={slug}
          className="mt-10 mb-4 text-2xl font-semibold text-gray-200"
        >
          {parseInline(text)}
        </h2>,
      );
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushList();
      const text = h1Match[1];
      const slug = transformToSlug(text);
      elements.push(
        <h1
          key={elements.length}
          id={slug}
          className="mt-10 mb-4 text-3xl font-semibold text-gray-200"
        >
          {parseInline(text)}
        </h1>,
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={elements.length}
          className="mb-6 border-l-4 border-indigo-500 pl-4 italic text-indigo-200/65"
        >
          {parseInline(line.slice(2))}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p
        key={elements.length}
        className="mb-6 leading-relaxed text-indigo-200/65"
      >
        {parseInline(line)}
      </p>,
    );
  }

  flushList();
  flushCodeBlock();

  return elements;
}

// Parse inline markdown (bold, italic, links, code, images)
function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Image: ![alt](src)
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      parts.push(
        <span key={key++} className="block my-4">
          <Image
            src={imgMatch[2]}
            alt={imgMatch[1]}
            width={800}
            height={450}
            className="rounded-lg"
          />
        </span>,
      );
      remaining = remaining.slice(imgMatch[0].length);
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const href = linkMatch[2];
      const isExternal = href.startsWith("http");
      if (isExternal) {
        parts.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        parts.push(
          <Link
            key={key++}
            href={href}
            className="text-indigo-400 hover:underline"
          >
            {linkMatch[1]}
          </Link>,
        );
      }
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)([^*_]+)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-semibold text-gray-200">
          {boldMatch[2]}
        </strong>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-gray-800/50 px-1.5 py-0.5 text-sm text-indigo-300"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Regular text - find next special character or end
    const nextSpecial = remaining.search(/[!\[*_`]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Special char that didn't match any pattern - treat as text
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : parts;
}

export function CustomMDX({ source }: { source: string }) {
  // Strip frontmatter if present
  const content = source.replace(/^---[\s\S]*?---\s*/, "");

  return <div>{parseMarkdown(content)}</div>;
}
