import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/knowledge/ingest";
import { KnowledgeCategory } from "@/lib/knowledge/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const category = formData.get("category") as KnowledgeCategory;
    const program = formData.get("program") as string | null;
    const title = formData.get("title") as string | null;
    const source = formData.get("source") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 },
      );
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Supported: PDF, TXT, MD, CSV`,
        },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ingest the document
    const result = await ingestDocument(
      {
        buffer,
        filename: file.name,
        mimeType: file.type,
      },
      {
        category,
        program: program || undefined,
        title: title || undefined,
        source: source || undefined,
        uploadedBy: "admin", // In production, get from auth
      },
    );

    if (result.status === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to ingest document",
      },
      { status: 500 },
    );
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
