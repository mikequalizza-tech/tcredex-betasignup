/**
 * Closing Room Document Upload API
 * POST: Upload a document to Supabase storage
 * GET: List uploaded documents for a closing room
 * DELETE: Remove an uploaded document
 */

import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

/** Untyped Supabase client for tables not yet in the generated Database type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedSupabaseClient = SupabaseClient<any, any, any>;

interface ClosingRoomDocument {
  id: string;
  deal_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  checklist_item: string | null;
  status: string;
  uploaded_by: string;
  uploaded_at: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// GET /api/closing-room/documents/upload?dealId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const category = searchParams.get("category");
    const checklistItem = searchParams.get("checklistItem");

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "view");

    // Get documents for this closing room
    let query = (supabase as unknown as UntypedSupabaseClient)
      .from("closing_room_documents")
      .select(
        `
        id,
        deal_id,
        file_name,
        file_path,
        file_size,
        mime_type,
        category,
        checklist_item,
        status,
        uploaded_by,
        uploaded_at,
        approved_by,
        approved_at,
        notes
      `,
      )
      .eq("deal_id", dealId)
      .order("uploaded_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (checklistItem) {
      query = query.eq("checklist_item", checklistItem);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc: ClosingRoomDocument) => {
        if (doc.file_path) {
          const { data: signedUrlData } = await supabase.storage
            .from("closing-documents")
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

          return {
            ...doc,
            url: signedUrlData?.signedUrl || null,
          };
        }
        return { ...doc, url: null };
      }),
    );

    return NextResponse.json({
      documents: documentsWithUrls,
      count: documentsWithUrls.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/closing-room/documents/upload
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const dealId = formData.get("dealId") as string | null;
    const category = formData.get("category") as string | null;
    const checklistItem = formData.get("checklistItem") as string | null;
    const notes = formData.get("notes") as string | null;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type ${file.type} not allowed. Allowed types: PDF, Word, Excel, Images, Text`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of 25MB` },
        { status: 400 },
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${dealId}/${category || "general"}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("closing-documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 },
      );
    }

    // Record in database
    const { data: documentData, error: dbError } = await (
      supabase as unknown as UntypedSupabaseClient
    )
      .from("closing_room_documents")
      .insert({
        deal_id: dealId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        category: category || "general",
        checklist_item: checklistItem,
        status: "pending_review",
        uploaded_by: user.id,
        notes: notes,
      } as never)
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Try to clean up the uploaded file
      await supabase.storage
        .from("closing-documents")
        .remove([uploadData.path]);
      return NextResponse.json(
        { error: "Failed to record document" },
        { status: 500 },
      );
    }

    const document = documentData as {
      id: string;
      file_name?: string;
      [key: string]: unknown;
    };

    // Generate signed URL for immediate use
    const { data: signedUrlData } = await supabase.storage
      .from("closing-documents")
      .createSignedUrl(uploadData.path, 3600);

    // Log to ledger
    await supabase.from("ledger_events").insert({
      actor_type: "human",
      actor_id: user.id,
      entity_type: "document",
      entity_id: document.id,
      action: "document_uploaded",
      payload_json: {
        deal_id: dealId,
        file_name: file.name,
        category,
        checklist_item: checklistItem,
      },
      hash: generateHash({ id: document.id, file: file.name }),
    } as never);

    return NextResponse.json(
      {
        success: true,
        document: {
          ...document,
          url: signedUrlData?.signedUrl || null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/closing-room/documents/upload?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Get document info first
    const { data: document, error: fetchError } = await (
      supabase as unknown as UntypedSupabaseClient
    )
      .from("closing_room_documents")
      .select("id, file_path, deal_id, file_name")
      .eq("id", documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }
    await verifyDealAccess(
      request,
      user,
      (document as { deal_id: string }).deal_id,
      "edit",
    );

    // Delete from storage
    if (document.file_path) {
      const { error: storageError } = await supabase.storage
        .from("closing-documents")
        .remove([document.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue with DB deletion even if storage fails
      }
    }

    // Delete from database
    const { error: dbError } = await (
      supabase as unknown as UntypedSupabaseClient
    )
      .from("closing_room_documents")
      .delete()
      .eq("id", documentId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete document record" },
        { status: 500 },
      );
    }

    // Log to ledger
    await supabase.from("ledger_events").insert({
      actor_type: "human",
      actor_id: user.id,
      entity_type: "document",
      entity_id: documentId,
      action: "document_deleted",
      payload_json: {
        deal_id: document.deal_id,
        file_name: document.file_name,
      },
      hash: generateHash({ id: documentId, action: "deleted" }),
    } as never);

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/closing-room/documents/upload - Update document status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { documentId, status, approvedBy, notes } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 },
      );
    }

    const { data: existingDocument, error: existingError } = await (
      supabase as unknown as UntypedSupabaseClient
    )
      .from("closing_room_documents")
      .select("deal_id")
      .eq("id", documentId)
      .single();

    if (existingError || !existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }
    await verifyDealAccess(
      request,
      user,
      (existingDocument as { deal_id: string }).deal_id,
      "edit",
    );

    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
      if (status === "approved") {
        updates.approved_by = approvedBy || user.id;
        updates.approved_at = new Date().toISOString();
      }
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data: document, error } = await (
      supabase as unknown as UntypedSupabaseClient
    )
      .from("closing_room_documents")
      .update(updates as never)
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      console.error("Document update error:", error);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    return handleAuthError(error);
  }
}

function generateHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data) + Date.now();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}
