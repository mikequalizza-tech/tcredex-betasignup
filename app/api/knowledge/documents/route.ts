import { NextRequest, NextResponse } from "next/server";
import { listDocuments } from "@/lib/knowledge/vectorStore";
import type { KnowledgeCategory } from "@/lib/knowledge/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as KnowledgeCategory | null;

    const documents = await listDocuments(category || undefined);

    return NextResponse.json(documents);
  } catch (error: unknown) {
    console.error("List documents error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list documents",
      },
      { status: 500 },
    );
  }
}
