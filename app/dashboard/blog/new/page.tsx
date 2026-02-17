"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  "Insights",
  "NMTC",
  "HTC",
  "LIHTC",
  "Opportunity Zones",
  "Housing Finance",
  "State Credits",
  "Platform Updates",
  "Industry News",
];

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [category, setCategory] = useState("Insights");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  // Load existing post for editing
  const loadPost = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/blog/admin");
      if (res.ok) {
        const data = await res.json();
        interface BlogPostRow {
          id: string;
          title: string;
          author: string;
          author_role: string | null;
          category: string | null;
          summary: string | null;
          content: string;
          image_url: string | null;
        }
        const post = (data.posts as BlogPostRow[])?.find(
          (p: BlogPostRow) => p.id === id,
        );
        if (post) {
          setTitle(post.title);
          setAuthor(post.author);
          setAuthorRole(post.author_role || "");
          setCategory(post.category || "Insights");
          setSummary(post.summary || "");
          setContent(post.content);
          setImageUrl(post.image_url || "");
        }
      }
    } catch {
      console.error("Failed to load post for editing");
    } finally {
      setLoadingEdit(false);
    }
  }, []);

  useEffect(() => {
    if (editId) {
      loadPost(editId);
    }
  }, [editId, loadPost]);

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    const isPublish = status === "published";
    if (isPublish) (setSaving(false), setPublishing(true));
    else (setSaving(true), setPublishing(false));

    try {
      const body = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim() || null,
        image_url: imageUrl.trim() || null,
        author: author.trim() || "tCredex Team",
        author_role: authorRole.trim() || null,
        category,
        status,
      };

      let res: Response;

      if (editId) {
        // Update existing post
        res = await fetch(`/api/blog/admin/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        // If publishing via edit, also trigger the publish endpoint for emails
        if (isPublish) {
          const publishRes = await fetch(`/api/blog/admin/${editId}/publish`, {
            method: "POST",
          });
          if (publishRes.ok) {
            const publishData = await publishRes.json();
            alert(
              `Published! ${publishData.emails?.sent || 0} notification emails sent.`,
            );
          }
        }
      } else {
        // Create new post
        res = await fetch("/api/blog/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok && isPublish) {
          const createData = await res.json();
          if (createData.post?.id) {
            const publishRes = await fetch(
              `/api/blog/admin/${createData.post.id}/publish`,
              { method: "POST" },
            );
            if (publishRes.ok) {
              const publishData = await publishRes.json();
              alert(
                `Published! ${publishData.emails?.sent || 0} notification emails sent.`,
              );
            }
          }
          router.push("/dashboard/blog");
          return;
        }
      }

      if (res.ok) {
        if (status === "draft") {
          alert("Draft saved!");
        }
        router.push("/dashboard/blog");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save");
      }
    } catch {
      alert("Error saving post");
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading post...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editId ? "Edit Post" : "New Blog Post"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Write in Markdown. Publishing sends email notifications.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/blog")}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Understanding 9% LIHTC Tax Credits"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Author + Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="tCredex Team"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Author Role
            </label>
            <input
              type="text"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              placeholder="e.g., Tax Credit Analyst"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hero Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (optional hero image)"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Brief summary for the blog listing and email preview..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content * (Markdown supported)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="Write your blog post content here... Markdown is supported."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-mono text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving || publishing}
            className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving || publishing}
            className="px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium text-sm disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish & Notify"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
          Loading...
        </div>
      }
    >
      <BlogEditorContent />
    </Suspense>
  );
}
