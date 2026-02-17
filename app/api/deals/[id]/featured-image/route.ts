/**
 * Deal Featured Image API
 *
 * GET /api/deals/[id]/featured-image - Get the featured image ID for a deal
 * PUT /api/deals/[id]/featured-image - Set the featured image for a deal
 *
 * Only the deal owner (sponsor) can set the featured image.
 * The featured image is used as:
 * - Hero image on Deal Page
 * - Header image on Project Profile PDF
 * - Thumbnail on Deal Card
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  requireAuth,
  handleAuthError,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import { normalizeProjectImages } from "@/lib/utils/project-images";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Get deal's intake_data
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

    const intakeData = (deal.intake_data as Record<string, unknown>) || {};
    const projectImages = normalizeProjectImages(intakeData.projectImages);
    const requestedFeaturedId = intakeData.featuredImageId as
      | string
      | undefined;

    // If we have a featured image ID, find the corresponding image
    let featuredImage = null;
    if (requestedFeaturedId) {
      featuredImage = projectImages.find(
        (img) =>
          img.id === requestedFeaturedId || img.url === requestedFeaturedId,
      );
    }

    // Fall back to first image if no featured image set
    if (!featuredImage && projectImages.length > 0) {
      featuredImage = projectImages[0];
    }

    const featuredImageId = featuredImage?.id || null;

    return NextResponse.json({
      success: true,
      featuredImageId,
      featuredImage,
    });
  } catch (error) {
    console.error("Error in featured image GET:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch featured image" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    if (user.organizationType !== "sponsor") {
      return NextResponse.json(
        { success: false, error: "Only sponsors can set featured images" },
        { status: 403 },
      );
    }
    const { id } = await params;
    const body = await request.json();
    const { imageId } = body;

    if (!imageId || typeof imageId !== "string") {
      return NextResponse.json(
        { success: false, error: "No image ID provided" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    await verifyDealAccess(request, user, id, "edit");

    // Get current deal intake data
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

    // Verify the image exists in projectImages
    const intakeData = (deal.intake_data as Record<string, unknown>) || {};
    const projectImages = normalizeProjectImages(intakeData.projectImages);
    const featuredImage = projectImages.find(
      (img) => img.id === imageId || img.url === imageId,
    );
    if (!featuredImage) {
      return NextResponse.json(
        { success: false, error: "Image not found in project images" },
        { status: 400 },
      );
    }

    // Update deal's intake_data with the featured image ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("deals")
      .update({
        intake_data: {
          ...intakeData,
          projectImages,
          featuredImageId: featuredImage.id,
        },
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating featured image:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to set featured image" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      featuredImageId: featuredImage.id,
      featuredImage,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
