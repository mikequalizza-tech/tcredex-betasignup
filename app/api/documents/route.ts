/**
 * tCredex Documents API
 * Document upload and management
 *
 * CRITICAL: All endpoints require authentication and org filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  handleAuthError,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

// =============================================================================
// GET /api/documents - List documents with filters
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const dealId = searchParams.get("deal_id");
    const organizationId = searchParams.get("organization_id");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // CRITICAL: Validate org access
    if (
      organizationId &&
      organizationId !== user.organizationId &&
      user.organizationType !== "admin"
    ) {
      return NextResponse.json(
        { error: "You can only view documents for your organization" },
        { status: 403 },
      );
    }

    let query = supabase
      .from("documents")
      .select("*, deals(id, project_name)")
      .order("created_at", { ascending: false });

    // CRITICAL: Filter by user's organization
    const queryOrgId = organizationId || user.organizationId;
    query = query.eq("organization_id", queryOrgId);

    if (dealId) {
      // CRITICAL: Verify user can access this deal
      await verifyDealAccess(request, user, dealId, "view");
      query = query.eq("deal_id", dealId);
    }
    if (category) query = query.eq("category", category as never);
    if (status) query = query.eq("status", status as never);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      documents: data,
      organizationId: user.organizationId,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// POST /api/documents - Create document record
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    if (!body.name || !body.file_url) {
      return NextResponse.json(
        { error: "name and file_url are required" },
        { status: 400 },
      );
    }

    // CRITICAL: Validate org access
    if (
      body.organization_id &&
      body.organization_id !== user.organizationId &&
      user.organizationType !== "admin"
    ) {
      return NextResponse.json(
        { error: "You can only create documents for your organization" },
        { status: 403 },
      );
    }

    // CRITICAL: If deal_id provided, verify user can access it
    if (body.deal_id) {
      await verifyDealAccess(request, user, body.deal_id, "edit");
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        organization_id: body.organization_id || user.organizationId,
        deal_id: body.deal_id,
        closing_room_id: body.closing_room_id,
        uploaded_by: body.uploaded_by || user.id,
        name: body.name,
        file_url: body.file_url,
        file_size: body.file_size,
        mime_type: body.mime_type,
        category: body.category,
        tags: body.tags || [],
        status: "pending",
      } as never)
      .select()
      .single();

    if (error) throw error;

    const typedData = data as Record<string, unknown>;

    // Log to ledger
    await supabase.from("ledger_events").insert({
      actor_type: "human",
      actor_id: user.id,
      entity_type: "document",
      entity_id: (typedData as { id: string }).id,
      action: "document_uploaded",
      payload_json: {
        name: body.name,
        category: body.category,
        deal_id: body.deal_id,
      },
      hash: generateHash(typedData),
    } as never);

    return NextResponse.json(
      {
        ...typedData,
        organizationId: user.organizationId,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}

// =============================================================================
// PUT /api/documents - Upload file directly to Supabase Storage
// =============================================================================
export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Require authentication
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();

    // Check content type to determine if this is a file upload or JSON request
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Direct file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const dealId = formData.get("dealId") as string | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 },
        );
      }

      // CRITICAL: If deal_id provided, verify user can access it
      if (dealId) {
        await verifyDealAccess(request, user, dealId, "edit");
      }

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = dealId
        ? `deals/${dealId}/${timestamp}-${safeName}`
        : `orgs/${user.organizationId}/${timestamp}-${safeName}`;

      // Ensure bucket exists
      await ensureBucketExists(supabase);

      // Upload file directly
      const fileBuffer = await file.arrayBuffer();
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(path, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
          {
            error: "Failed to upload file",
            details: error.message,
          },
          { status: 500 },
        );
      }

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${path}`;

      return NextResponse.json({
        success: true,
        path: data.path,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        organizationId: user.organizationId,
      });
    } else {
      // JSON request for signed URL (legacy support)
      const body = await request.json();
      const { fileName, contentType: _fileContentType, dealId } = body;

      if (!fileName) {
        return NextResponse.json(
          { error: "fileName is required" },
          { status: 400 },
        );
      }

      // CRITICAL: If deal_id provided, verify user can access it
      if (dealId) {
        await verifyDealAccess(request, user, dealId, "edit");
      }

      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = dealId
        ? `deals/${dealId}/${timestamp}-${safeName}`
        : `orgs/${user.organizationId}/${timestamp}-${safeName}`;

      await ensureBucketExists(supabase);

      // Create signed upload URL
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUploadUrl(path);

      if (error) {
        console.error("Signed URL error:", error.message, error);
        return NextResponse.json(
          {
            error: "Failed to create upload URL",
            details: error.message,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        uploadUrl: data.signedUrl,
        path,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${path}`,
        organizationId: user.organizationId,
      });
    }
  } catch (error) {
    return handleAuthError(error);
  }
}

// Helper to ensure the documents bucket exists
async function ensureBucketExists(
  supabase: ReturnType<typeof getSupabaseAdmin>,
) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === "documents");

  if (!bucketExists) {
    console.log("Creating documents bucket...");
    const { error: createError } = await supabase.storage.createBucket(
      "documents",
      {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/gif",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
    );

    if (createError && !createError.message.includes("already exists")) {
      console.error("Failed to create bucket:", createError);
      throw new Error(`Bucket creation failed: ${createError.message}`);
    }
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
