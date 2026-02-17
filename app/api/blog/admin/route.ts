/**
 * Blog Admin API
 * GET  /api/blog/admin — List all posts (drafts + published)
 * POST /api/blog/admin — Create a new blog post
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Blog Admin] List error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }

  return NextResponse.json({ posts: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 },
    );
  }

  const slug = slugify(title);
  const postStatus = status || "draft";

  const admin = getSupabaseAdmin();
  const insertData: Record<string, unknown> = {
    title,
    slug,
    content,
    summary: summary || null,
    image_url: image_url || null,
    author: author || "tCredex Team",
    author_role: author_role || null,
    category: category || "Insights",
    status: postStatus,
    created_by: user.id,
  };

  if (postStatus === "published") {
    insertData.published_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("blog_posts")
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error("[Blog Admin] Create error:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A post with this title already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, post: data });
}
