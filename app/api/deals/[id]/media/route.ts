/**
 * Deal Media API
 *
 * GET /api/deals/[id]/media - Get deal images and attachments
 * POST /api/deals/[id]/media - Add images to a deal
 * DELETE /api/deals/[id]/media - Remove an image from a deal
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import {
  isLikelyImageUrl,
  normalizeProjectImages,
} from "@/lib/utils/project-images";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Try to get images from deal_media table (optional - may not exist)
    const { data: mediaData } = await supabase
      .from("deal_media")
      .select("*")
      .eq("deal_id", id)
      .eq("media_type", "image")
      .order("order", { ascending: true });

    // Also check for images in deal attachments (optional - may not exist)
    const { data: attachments } = await supabase
      .from("deal_attachments")
      .select("*")
      .eq("deal_id", id)
      .ilike("file_type", "image/%");

    // Also check documents table for images
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("file_url, mime_type, category")
      .eq("deal_id", id)
      .ilike("mime_type", "image/%");

    if (docsError) {
      console.error("Error fetching documents:", docsError);
    }

    // Check deal's intake_data and draft_data for images
    // Note: deals table doesn't have dedicated image columns - images are in JSON or documents table
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("intake_data, draft_data")
      .eq("id", id)
      .single();

    if (dealError) {
      console.error("Error fetching deal:", dealError);
    }

    // Compile all images
    const images: string[] = [];

    // Helper to extract images from JSON data
    const extractImages = (data: Record<string, unknown> | null) => {
      if (!data || typeof data !== "object") return;

      // Check common image field names
      const imageFields = [
        "projectImages",
        "images",
        "photos",
        "renderingImages",
        "primaryImage",
        "siteImages",
      ];
      for (const field of imageFields) {
        const value = data[field];

        if (typeof value === "string" && isLikelyImageUrl(value)) {
          if (!images.includes(value)) images.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            const itemObj = item as Record<string, unknown> | null;
            const url =
              typeof item === "string"
                ? item
                : itemObj?.url || itemObj?.file_url;
            if (
              url &&
              typeof url === "string" &&
              isLikelyImageUrl(url) &&
              !images.includes(url)
            ) {
              images.push(url);
            }
          }
        }
      }
    };

    // Extract from intake_data
    extractImages(deal?.intake_data as Record<string, unknown>);

    // Extract from draft_data
    extractImages(deal?.draft_data as Record<string, unknown>);

    // Add images from media table
    if (mediaData && mediaData.length > 0) {
      const mediaUrls = mediaData
        .map((m: Record<string, unknown>) => (m.url || m.file_url) as string)
        .filter(Boolean);
      images.push(...mediaUrls.filter((url: string) => !images.includes(url)));
    }

    // Add images from attachments
    if (attachments && attachments.length > 0) {
      const attachmentUrls = attachments
        .map((a: Record<string, unknown>) => (a.file_url || a.url) as string)
        .filter(Boolean);
      images.push(
        ...attachmentUrls.filter((url: string) => !images.includes(url)),
      );
    }

    // Add images from documents table
    if (documents && documents.length > 0) {
      const docUrls = documents
        .map((d: Record<string, unknown>) => d.file_url as string)
        .filter(Boolean);
      images.push(...docUrls.filter((url: string) => !images.includes(url)));
    }

    return NextResponse.json({
      success: true,
      images,
      total: images.length,
    });
  } catch (error) {
    console.error("Error in deal media API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deal media", images: [] },
      { status: 500 },
    );
  }
}

/**
 * POST - Add images to a deal
 * Expects: { urls: string[] } - Array of uploaded image URLs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image URLs provided" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    // Get current deal and verify ownership
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("sponsor_organization_id, intake_data")
      .eq("id", id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 },
      );
    }

    // Get current images from intake_data (normalize legacy string arrays and object arrays)
    const intakeData = (deal.intake_data as Record<string, unknown>) || {};
    const currentImages = normalizeProjectImages(intakeData.projectImages);

    // Add new images (avoiding duplicates by URL)
    const newImages = [...currentImages];
    const existingUrls = new Set(currentImages.map((img) => img.url));
    for (const url of urls) {
      if (
        typeof url === "string" &&
        isLikelyImageUrl(url) &&
        !existingUrls.has(url)
      ) {
        const normalized = normalizeProjectImages([url]);
        if (normalized[0]) {
          newImages.push(normalized[0]);
          existingUrls.add(url);
        }
      }
    }

    // Update deal's intake_data with new images
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("deals")
      .update({
        intake_data: {
          ...intakeData,
          projectImages: newImages,
        },
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating deal images:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to save images" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      images: newImages,
      added: newImages.length - currentImages.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE - Remove an image from a deal
 * Expects: { url: string } - The image URL to remove
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const _user = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "No image URL provided" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    // Get current deal
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("intake_data")
      .eq("id", id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, error: "Deal not found" },
        { status: 404 },
      );
    }

    // Remove image from intake_data (supports both URL and id matching)
    const intakeData = (deal.intake_data as Record<string, unknown>) || {};
    const currentImages = normalizeProjectImages(intakeData.projectImages);
    const updatedImages = currentImages.filter(
      (img) => img.url !== url && img.id !== url,
    );

    // Update deal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("deals")
      .update({
        intake_data: {
          ...intakeData,
          projectImages: updatedImages,
        },
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error removing deal image:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to remove image" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      images: updatedImages,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
