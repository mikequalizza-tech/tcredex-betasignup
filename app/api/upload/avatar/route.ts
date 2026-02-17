/**
 * Avatar Upload API
 * POST - Upload user profile photo
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleAuthError, requireAuth } from "@/lib/api/auth-middleware";

const supabase = getSupabaseAdmin();
const BUCKET_NAME = "avatars";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

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
      console.error("[avatar] Bucket creation error:", error);
    }
  }
  bucketEnsured = true;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, GIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 1MB" },
        { status: 400 },
      );
    }

    await ensureBucket();

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${user.id}/avatar.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload (upsert to replace existing avatar)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("[avatar] Storage upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload avatar" },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    // Append cache-buster so browser picks up the new image
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("[avatar] DB update error:", updateError);
    }

    return NextResponse.json({ url: avatarUrl });
  } catch (error) {
    return handleAuthError(error);
  }
}
