/**
 * Deal Media Upload API
 * POST - Upload logo or hero image for deals
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";

const supabase = getSupabaseAdmin();
const BUCKET_NAME = "deal-media";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB — real estate project photos can be large
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Auto-create storage bucket if it doesn't exist
let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: { name: string }) => b.name === BUCKET_NAME);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    if (error && !error.message?.includes("already exists")) {
      console.error("[deal-media] Bucket creation error:", error);
    }
  }
  bucketEnsured = true;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dealId = formData.get("dealId");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof dealId === "string" && dealId) {
      await verifyDealAccess(request, user, dealId, "edit");
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB" },
        { status: 400 },
      );
    }

    // Ensure storage bucket exists
    await ensureBucket();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const folder =
      typeof dealId === "string" && dealId
        ? `deals/${dealId}`
        : `users/${user.id}`;
    const filename = `${folder}/${timestamp}-${randomId}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[deal-media] Storage upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file", details: error.message },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log("[deal-media] Upload success:", urlData.publicUrl);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
