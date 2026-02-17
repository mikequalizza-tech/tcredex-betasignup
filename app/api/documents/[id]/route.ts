/**
 * tCredex Documents API - Single Document
 * GET/PATCH/DELETE for individual documents
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  AuthError,
  AuthUser,
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

const supabase = getSupabaseAdmin();

// GET /api/documents/[id] - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    await assertDocumentAccess(request, user, id, "view");

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/documents/[id] - Update document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    await assertDocumentAccess(request, user, id, "edit");

    // Only allow updating certain fields
    const allowedFields = [
      "name",
      "description",
      "category",
      "status",
      "tags",
      "required_for_closing",
    ];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("documents")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    await assertDocumentAccess(request, user, id, "edit");

    // Get document first to find file path for storage cleanup
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("file_url")
      .eq("id", id)
      .single<{ file_url: string | null }>();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 },
        );
      }
      throw fetchError;
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Try to delete from storage (non-blocking)
    if (doc?.file_url) {
      try {
        const path = doc.file_url.split("/documents/")[1];
        if (path) {
          await supabase.storage.from("documents").remove([path]);
        }
      } catch (storageError) {
        console.warn("Failed to delete file from storage:", storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function assertDocumentAccess(
  request: NextRequest,
  user: AuthUser,
  documentId: string,
  mode: "view" | "edit",
): Promise<void> {
  if (user.organizationType === "admin") {
    return;
  }

  const { data, error } = await supabase
    .from("documents")
    .select("id, deal_id, organization_id, uploaded_by")
    .eq("id", documentId)
    .single();

  if (error || !data) {
    throw new AuthError("NOT_FOUND", "Document not found", 404);
  }

  const doc = data as {
    deal_id?: string | null;
    organization_id?: string | null;
    uploaded_by?: string | null;
  };

  if (doc.deal_id) {
    await verifyDealAccess(
      request,
      user,
      doc.deal_id,
      mode === "edit" ? "edit" : "view",
    );
    return;
  }

  if (doc.organization_id && doc.organization_id === user.organizationId) {
    return;
  }

  if (doc.uploaded_by && doc.uploaded_by === user.id) {
    return;
  }

  throw new AuthError("FORBIDDEN", "Forbidden", 403);
}
