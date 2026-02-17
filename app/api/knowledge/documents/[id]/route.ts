import { NextRequest, NextResponse } from "next/server";
import {
  getDocument,
  deleteDocument,
  getChunksForDocument,
} from "@/lib/knowledge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const document = await getDocument(id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Optionally include chunks
    const { searchParams } = new URL(req.url);
    const includeChunks = searchParams.get("includeChunks") === "true";

    if (includeChunks) {
      const chunks = await getChunksForDocument(id);
      return NextResponse.json({ ...document, chunks });
    }

    return NextResponse.json(document);
  } catch (error: unknown) {
    console.error("Get document error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get document",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await deleteDocument(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete document",
      },
      { status: 500 },
    );
  }
}
