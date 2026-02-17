import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DD_CATEGORIES,
  getCategoriesForPrograms,
  calculateVaultSummary,
  type DDDocumentCategory,
  type DDDocumentStatus,
} from "@/lib/types/dd-vault";
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
 * GET /api/dd-vault
 *
 * Get DD documents for a deal with optional filters.
 * Query params:
 * - dealId: string (required)
 * - category: DDDocumentCategory (optional)
 * - status: DDDocumentStatus (optional)
 * - requiredOnly: boolean (optional)
 * - includeSummary: boolean (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const dealId = searchParams.get("dealId");
    const category = searchParams.get("category") as DDDocumentCategory | null;
    const status = searchParams.get("status") as DDDocumentStatus | null;
    const requiredOnly = searchParams.get("requiredOnly") === "true";
    const includeSummary = searchParams.get("includeSummary") === "true";

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "view");

    // Simple query without embedded join - document details fetched separately if needed
    let query = supabase.from("dd_documents").select("*").eq("deal_id", dealId);

    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);
    if (requiredOnly) query = query.eq("required", true);

    query = query.order("category", { ascending: true });

    const { data: documents, error } = await query;

    console.log(
      `[DD Vault GET] dealId=${dealId}, found ${documents?.length || 0} documents`,
    );

    if (error) {
      console.error("[DD Vault GET] Supabase query error:", error);
      return NextResponse.json(
        {
          error: error.message || "Database query failed",
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
        { status: 500 },
      );
    }

    // Transform to camelCase for frontend
    const transformedDocs = (documents || []).map((doc) => ({
      id: doc.id,
      dealId: doc.deal_id,
      category: doc.category,
      documentId: doc.document_id,
      status: doc.status,
      required: doc.required,
      requiredBy: doc.required_by,
      requestedById: doc.requested_by_id,
      requestedByOrg: doc.requested_by_org,
      requestedAt: doc.requested_at,
      uploadedAt: doc.uploaded_at,
      reviewedAt: doc.reviewed_at,
      reviewedById: doc.reviewed_by_id,
      reviewNotes: doc.review_notes,
      expiresAt: doc.expires_at,
      notes: doc.notes,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      document: undefined, // Document details fetched separately when needed
    }));

    let summary = null;
    if (includeSummary) {
      summary = calculateVaultSummary(dealId, transformedDocs);
    }

    // Note: fetchApi unwraps `data` field, so we nest everything under data
    return NextResponse.json({
      data: {
        data: transformedDocs,
        summary,
        categories: DD_CATEGORIES,
      },
    });
  } catch (error: unknown) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/dd-vault
 *
 * Initialize DD vault for a deal (creates all document entries based on programs)
 * Body:
 * - dealId: string (required)
 * - programs: ('NMTC' | 'HTC' | 'LIHTC')[] (required)
 */
/**
 * DELETE /api/dd-vault
 *
 * Reset/delete DD vault for a deal (delete all document entries)
 * Query params:
 * - dealId: string (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const dealId = searchParams.get("dealId");

    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");

    console.log(`[DD Vault DELETE] Resetting vault for dealId=${dealId}`);

    // Count existing documents first
    const { data: existing, error: countError } = await supabase
      .from("dd_documents")
      .select("id")
      .eq("deal_id", dealId);

    if (countError) {
      console.error("[DD Vault DELETE] Count error:", countError);
    }

    const existingCount = existing?.length || 0;

    // Delete all dd_documents for this deal
    const { error } = await supabase
      .from("dd_documents")
      .delete()
      .eq("deal_id", dealId);

    if (error) {
      console.error("[DD Vault DELETE] Delete error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to reset DD vault" },
        { status: 500 },
      );
    }

    console.log(
      `[DD Vault DELETE] Deleted ${existingCount} documents for dealId=${dealId}`,
    );

    return NextResponse.json({
      success: true,
      message: `DD vault reset - ${existingCount} document entries removed`,
      deletedCount: existingCount,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { dealId, programs } = body;

    if (!dealId || !programs || !Array.isArray(programs)) {
      return NextResponse.json(
        { error: "dealId and programs array are required" },
        { status: 400 },
      );
    }
    await verifyDealAccess(request, user, dealId, "edit");

    // Get categories applicable to the deal's programs
    const applicableCategories = getCategoriesForPrograms(programs);

    // Check if vault already exists for this deal
    const { data: existing, error: existingError } = await supabase
      .from("dd_documents")
      .select("id")
      .eq("deal_id", dealId)
      .limit(1);

    console.log(`[DD Vault POST] Checking existing for dealId=${dealId}:`, {
      found: existing?.length || 0,
      error: existingError?.message,
    });

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: "DD vault already exists for this deal",
          existingCount: existing.length,
        },
        { status: 409 },
      );
    }

    // Create DD document entries for each applicable category
    const ddDocuments = applicableCategories.map((cat) => ({
      deal_id: dealId,
      category: cat.category,
      status: "not_started",
      required: cat.defaultRequired,
      required_by: "all",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data: createdDocs, error } = await supabase
      .from("dd_documents")
      .insert(ddDocuments)
      .select();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        data: createdDocs,
        message: `DD vault initialized with ${createdDocs?.length || 0} document categories`,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
