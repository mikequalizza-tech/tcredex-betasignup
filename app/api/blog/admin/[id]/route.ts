/**
 * Blog Admin — Single Post
 * PATCH /api/blog/admin/[id] — Update a blog post
 * DELETE /api/blog/admin/[id] — Delete a blog post
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const {
    title,
    content,
    summary,
    image_url,
    author,
    author_role,
    category,
    status,
  } = body;

  const admin = getSupabaseAdmin();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (title !== undefined) {
    updateData.title = title;
    updateData.slug = slugify(title);
  }
  if (content !== undefined) updateData.content = content;
  if (summary !== undefined) updateData.summary = summary;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (author !== undefined) updateData.author = author;
  if (author_role !== undefined) updateData.author_role = author_role;
  if (category !== undefined) updateData.category = category;

  // Handle status transitions
  if (status !== undefined) {
    updateData.status = status;
    if (status === "published") {
      // Check if already published (don't overwrite published_at)
      const { data: existing } = await admin
        .from("blog_posts")
        .select("published_at")
        .eq("id", id)
        .single();
      if (!(existing as { published_at: string | null } | null)?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
  }

  const { data, error } = await admin
    .from("blog_posts")
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[Blog Admin] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, post: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = getSupabaseAdmin();

  const { error } = await admin.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("[Blog Admin] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
