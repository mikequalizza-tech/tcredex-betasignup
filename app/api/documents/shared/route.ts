/**
 * tCredex Documents API - Shared Documents
 * GET /api/documents/shared - List documents shared with the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireAuth } from "@/lib/api/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");

    // Fetch documents with their shares
    // No organizations table — documents don't have org FK, read org from deal's sponsor
    const dealIds =
      user.organizationType === "admin"
        ? null
        : await getAccessibleDealIds(
            supabase,
            user.organizationId,
            user.organizationType,
          );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("documents")
      .select(
        `
        *,
        deal:deals(id, project_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (dealIds !== null) {
      if (dealIds.length > 0) {
        query = query.in("deal_id", dealIds);
      } else {
        query = query.eq("uploaded_by", user.id);
      }
    }

    if (category && category !== "all") {
      query = query.eq("category", category as never);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error("Error fetching shared documents:", error);
      return NextResponse.json({ documents: [], total: 0 });
    }

    // Map to expected format
    interface DocumentRow {
      id: string;
      name: string | null;
      description: string | null;
      category: string | null;
      deal_id: string | null;
      organization_id: string | null;
      deal: { id: string; project_name: string } | null;
      version: number | null;
      file_size: number | null;
      mime_type: string | null;
      uploaded_by: string | null;
      uploaded_by_name: string | null;
      uploaded_by_email: string | null;
      created_at: string;
      updated_at: string | null;
      file_url: string | null;
      is_public: boolean | null;
      tags: string[] | null;
      status: string | null;
      required_for_closing: boolean | null;
    }
    const sharedDocs = (documents || []).map((doc: DocumentRow) => ({
      id: doc.id,
      name: doc.name || "Untitled Document",
      description: doc.description || "",
      category: doc.category || "other",
      entityType: doc.deal_id ? "deal" : "organization",
      entityId: doc.deal_id || doc.organization_id || "",
      entityName: doc.deal?.project_name || "Unknown",
      projectId: doc.deal_id,
      projectName: doc.deal?.project_name,
      dealId: doc.deal_id,
      dealName: doc.deal?.project_name,
      currentVersion: {
        id: doc.id,
        versionNumber: doc.version || 1,
        fileName: doc.name,
        fileSize: doc.file_size || 0,
        mimeType: doc.mime_type || "application/octet-stream",
        uploadedBy: {
          id: doc.uploaded_by || "",
          name: doc.uploaded_by_name || "Unknown",
          email: doc.uploaded_by_email || "",
        },
        uploadedAt: doc.created_at,
        checksum: "",
        storageUrl: doc.file_url || "",
      },
      versionCount: doc.version || 1,
      owner: {
        id: doc.uploaded_by || "",
        name: doc.uploaded_by_name || "Unknown",
        email: doc.uploaded_by_email || "",
      },
      organizationId: doc.organization_id || "",
      shares: [],
      isPublic: doc.is_public || false,
      lock: null,
      collaborators: [],
      tags: doc.tags || [],
      status: doc.status || "pending_review",
      requiredForClosing: doc.required_for_closing || false,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at || doc.created_at,
    }));

    return NextResponse.json({
      documents: sharedDocs,
      total: sharedDocs.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

async function getAccessibleDealIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  organizationType: "sponsor" | "cde" | "investor" | "admin",
): Promise<string[]> {
  if (organizationType === "sponsor") {
    const { data: sponsors } = await supabase
      .from("sponsors")
      .select("id")
      .eq("organization_id", organizationId);

    const sponsorIds = (sponsors || []).map((row: { id: string }) => row.id);
    if (sponsorIds.length === 0) return [];

    const { data: deals } = await supabase
      .from("deals")
      .select("id")
      .in("sponsor_id", sponsorIds);

    return (deals || []).map((row: { id: string }) => row.id);
  }

  if (organizationType === "investor") {
    const { data: investors } = await supabase
      .from("investors")
      .select("id")
      .eq("organization_id", organizationId);

    const investorIds = (investors || []).map((row: { id: string }) => row.id);
    if (investorIds.length === 0) return [];

    const { data: deals } = await supabase
      .from("deals")
      .select("id")
      .in("investor_id", investorIds);

    return (deals || []).map((row: { id: string }) => row.id);
  }

  if (organizationType === "cde") {
    const { data: cdes } = await supabase
      .from("cdes")
      .select("id")
      .eq("organization_id", organizationId);

    let cdeIds = (cdes || []).map((row: { id: string }) => row.id);

    if (cdeIds.length === 0) {
      const { data: mergedCdes } = await supabase
        .from("cdes_merged")
        .select("id")
        .eq("organization_id", organizationId);
      cdeIds = (mergedCdes || []).map((row: { id: string }) => row.id);
    }

    if (cdeIds.length === 0) return [];

    const { data: deals } = await supabase
      .from("deals")
      .select("id")
      .in("assigned_cde_id", cdeIds);

    return (deals || []).map((row: { id: string }) => row.id);
  }

  return [];
}
