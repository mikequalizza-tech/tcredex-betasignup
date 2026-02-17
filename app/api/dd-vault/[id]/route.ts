import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DD_CATEGORIES, type DDDocumentStatus } from "@/lib/types/dd-vault";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/dd-vault/[id]
 *
 * Get a single DD document by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from("dd_documents")
      .select(
        `
        *,
        documents:document_id (
          id,
          name,
          file_url,
          file_size,
          mime_type,
          version,
          created_at
        ),
        deals:deal_id (
          id,
          project_name,
          programs
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "DD document not found" },
        { status: 404 },
      );
    }
    await verifyDealAccess(
      request,
      user,
      (data as { deal_id: string }).deal_id,
      "view",
    );

    // Get category metadata
    const categoryMeta = DD_CATEGORIES.find(
      (c) => c.category === data.category,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        categoryMeta,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PATCH /api/dd-vault/[id]
 *
 * Update a DD document (status, attach document, review, etc.)
 * Body (all optional):
 * - status: DDDocumentStatus
 * - documentId: string (attach uploaded document)
 * - required: boolean
 * - requiredBy: 'all' | 'cde' | 'investor' | 'sponsor'
 * - requestedById: string
 * - requestedByOrg: string
 * - reviewNotes: string
 * - reviewedById: string
 * - expiresAt: string
 * - notes: string
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const { data: existingDocument, error: existingError } = await supabase
      .from("dd_documents")
      .select("id, deal_id")
      .eq("id", id)
      .single();

    if (existingError || !existingDocument) {
      return NextResponse.json(
        { error: "DD document not found" },
        { status: 404 },
      );
    }

    await verifyDealAccess(
      request,
      user,
      (existingDocument as { deal_id: string }).deal_id,
      "edit",
    );

    // Build update object
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };

    // Map camelCase to snake_case for database
    const fieldMap: Record<string, string> = {
      status: "status",
      documentId: "document_id",
      required: "required",
      requiredBy: "required_by",
      requestedById: "requested_by_id",
      requestedByOrg: "requested_by_org",
      reviewNotes: "review_notes",
      reviewedById: "reviewed_by_id",
      expiresAt: "expires_at",
      notes: "notes",
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
      if (body[camelKey] !== undefined) {
        updateData[snakeKey] = body[camelKey];
      }
    }

    // Handle status-specific timestamps
    if (body.status) {
      const status = body.status as DDDocumentStatus;

      switch (status) {
        case "requested":
          updateData.requested_at = now;
          break;
        case "pending":
          updateData.uploaded_at = now;
          break;
        case "approved":
        case "rejected":
          updateData.reviewed_at = now;
          break;
      }

      // Check for expiration if setting to approved
      if (status === "approved" && body.documentId) {
        // Get the current document to check category
        const { data: currentDoc } = await supabase
          .from("dd_documents")
          .select("category")
          .eq("id", id)
          .single();

        if (currentDoc) {
          const categoryMeta = DD_CATEGORIES.find(
            (c) => c.category === currentDoc.category,
          );
          if (categoryMeta?.expirationDays) {
            const expirationDate = new Date();
            expirationDate.setDate(
              expirationDate.getDate() + categoryMeta.expirationDays,
            );
            updateData.expires_at = expirationDate.toISOString();
          }
        }
      }
    }

    const { data, error } = await supabase
      .from("dd_documents")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        documents:document_id (
          id,
          name,
          file_url,
          file_size,
          mime_type
        )
      `,
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: getUpdateMessage(body.status),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/dd-vault/[id]
 *
 * Delete a DD document entry (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const { data: existingDocument, error: existingError } = await supabase
      .from("dd_documents")
      .select("id, deal_id")
      .eq("id", id)
      .single();

    if (existingError || !existingDocument) {
      return NextResponse.json(
        { error: "DD document not found" },
        { status: 404 },
      );
    }

    await verifyDealAccess(
      request,
      user,
      (existingDocument as { deal_id: string }).deal_id,
      "edit",
    );

    const { error } = await supabase.from("dd_documents").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "DD document entry deleted",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

function getUpdateMessage(status?: DDDocumentStatus): string {
  if (!status) return "DD document updated";

  switch (status) {
    case "requested":
      return "Document requested from sponsor";
    case "pending":
      return "Document uploaded and pending review";
    case "under_review":
      return "Document is now under review";
    case "approved":
      return "Document approved";
    case "rejected":
      return "Document rejected - please resubmit";
    case "waived":
      return "Document requirement waived";
    default:
      return "DD document updated";
  }
}
