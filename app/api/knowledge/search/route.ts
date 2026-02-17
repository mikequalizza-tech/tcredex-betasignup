import { NextRequest, NextResponse } from "next/server";
import { searchKnowledge } from "@/lib/knowledge/vectorStore";
import { KnowledgeCategory } from "@/lib/knowledge/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { query, categories, programs, limit = 5, minScore = 0.7 } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await searchKnowledge(query, {
      categories: categories as KnowledgeCategory[] | undefined,
      programs,
      limit,
      minScore,
    });

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error: unknown) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
