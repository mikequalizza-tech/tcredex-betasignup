/**
 * Blog Admin — Publish + Email
 * POST /api/blog/admin/[id]/publish — Publish a blog post and send email to beta_signups
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { email } from "@/lib/email/send";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
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

  // Update post to published
  const { data: post, error: updateError } = await admin
    .from("blog_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !post) {
    console.error("[Blog Publish] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 },
    );
  }

  const blogPost = post as {
    title: string;
    slug: string;
    summary: string | null;
    author: string;
    image_url: string | null;
  };

  // Send email to all beta_signups (best-effort)
  let emailsSent = 0;
  let emailsFailed = 0;
  try {
    const { data: signups } = await admin
      .from("beta_signups")
      .select("email, name");

    if (signups && signups.length > 0) {
      const blogUrl = `https://tcredex.com/blog/${blogPost.slug}`;

      for (const signup of signups as {
        email: string;
        name: string | null;
      }[]) {
        try {
          await email.blogAnnouncement(
            signup.email,
            blogPost.title,
            blogPost.summary || "",
            blogPost.author,
            blogPost.image_url || "",
            blogUrl,
          );
          emailsSent++;
        } catch {
          emailsFailed++;
        }
      }
    }
  } catch (emailErr) {
    console.error("[Blog Publish] Email send error:", emailErr);
  }

  return NextResponse.json({
    success: true,
    post,
    emails: { sent: emailsSent, failed: emailsFailed },
  });
}
