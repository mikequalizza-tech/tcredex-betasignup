/**
 * tCredex Global Search API
 * PostgreSQL full-text search via Supabase RPC + Knowledge Base vector search
 *
 * Searches: deals, CDEs, investors, blog posts, help docs (local MDX), knowledge base (vector)
 * Role-based filtering built into the SQL function (no post-filter needed).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import { getSupabaseAdmin } from "@/lib/supabase";
import { searchKnowledge } from "@/lib/knowledge/vectorStore";
import { SearchResult as KnowledgeSearchResult } from "@/lib/knowledge/types";
import fs from "fs";
import path from "path";

interface HelpDocResult {
  type: string;
  slug: string;
  title: string;
  summary: string;
  score: number;
  url: string;
}

// Search help documentation (local MDX/MD files — same source as ChatTC)
function searchHelpDocs(query: string, limit: number = 5): HelpDocResult[] {
  try {
    const helpDir = path.join(process.cwd(), "content/help");
    if (!fs.existsSync(helpDir)) return [];

    const queryLower = query.toLowerCase();
    const files = fs.readdirSync(helpDir);

    return files
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .map((file) => {
        try {
          const content = fs.readFileSync(path.join(helpDir, file), "utf-8");
          const parts = content.split("---");
          let title = file.replace(/\.(mdx?|md)$/, "").replace(/-/g, " ");
          let summary = "";

          if (parts.length > 1) {
            const frontmatter = parts[1];
            const titleMatch = frontmatter.match(
              /title:\s*["']?([^"'\n]+)["']?/,
            );
            const summaryMatch = frontmatter.match(
              /summary:\s*["']?([^"'\n]+)["']?/,
            );
            if (titleMatch) title = titleMatch[1];
            if (summaryMatch) summary = summaryMatch[1];
          }

          const body = parts.length > 2 ? parts.slice(2).join("---") : content;
          const matchesTitle = title.toLowerCase().includes(queryLower);
          const matchesSummary = summary.toLowerCase().includes(queryLower);
          const matchesContent = body.toLowerCase().includes(queryLower);

          if (matchesTitle || matchesSummary || matchesContent) {
            return {
              type: "help",
              slug: file.replace(/\.(mdx?|md)$/, ""),
              title,
              summary: summary || body.slice(0, 150) + "...",
              score: matchesTitle ? 1.0 : matchesSummary ? 0.8 : 0.5,
              url: `/help/${file.replace(/\.(mdx?|md)$/, "")}`,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((item): item is HelpDocResult => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch {
    return [];
  }
}

// =============================================================================
// GET /api/search - Global search across deals, CDEs, help docs, knowledge base
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query.trim()) {
      return NextResponse.json({
        deals: [],
        cdes: [],
        investors: [],
        blog: [],
        help: [],
        knowledge: [],
        total: 0,
      });
    }

    const supabase = getSupabaseAdmin();

    // Run all six searches in parallel
    // Custom RPC functions — not in generated types
    const sb = supabase as unknown as {
      rpc: (
        fn: string,
        params: Record<string, unknown>,
      ) => Promise<{
        data: Record<string, unknown>[];
        error: unknown;
      }>;
    };
    type RpcResult = Promise<{
      data: Record<string, unknown>[];
      error: unknown;
    }>;

    const [
      dealsResult,
      cdesResult,
      investorsResult,
      blogResult,
      helpDocs,
      knowledgeResults,
    ] = await Promise.all([
      // PostgreSQL full-text search on deals (role-filtered in SQL)
      sb.rpc("search_deals", {
        search_query: query,
        result_limit: limit,
        user_org_type: user.organizationType || null,
        user_org_id: user.organizationId || null,
      }) as RpcResult,

      // PostgreSQL full-text search on CDEs
      sb.rpc("search_cdes", {
        search_query: query,
        result_limit: limit,
      }) as RpcResult,

      // PostgreSQL full-text search on investors
      sb.rpc("search_investors", {
        search_query: query,
        result_limit: limit,
      }) as RpcResult,

      // PostgreSQL full-text search on blog posts
      sb.rpc("search_blog_posts", {
        search_query: query,
        result_limit: 5,
      }) as RpcResult,

      // Local MDX help docs
      Promise.resolve(searchHelpDocs(query, 5)),

      // Vector search on knowledge base
      searchKnowledge(query, { limit: 5, minScore: 0.5 }).catch(() => []),
    ]);

    const deals = dealsResult.data || [];
    const cdes = cdesResult.data || [];
    const investors = investorsResult.data || [];
    const blog = blogResult.data || [];

    // Format knowledge results
    const knowledge = (knowledgeResults || []).map(
      (k: KnowledgeSearchResult) => {
        const metadata = k.chunk.metadata;
        const content = k.chunk.content || "";
        return {
          type: "knowledge",
          id: k.chunk.id,
          title: k.document?.title || "Knowledge Article",
          content: content.slice(0, 200) + "...",
          category: metadata.category,
          program: metadata.program,
          score: k.score,
        };
      },
    );

    const results = {
      deals,
      cdes,
      investors,
      blog,
      help: helpDocs,
      knowledge,
      total:
        deals.length +
        cdes.length +
        investors.length +
        blog.length +
        helpDocs.length +
        knowledge.length,
    };

    return NextResponse.json(results, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    console.error("[Search] Error:", error);
    return handleAuthError(error);
  }
}
