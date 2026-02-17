"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  author: string;
  author_role: string | null;
  category: string | null;
  status: "draft" | "published";
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export default function BlogManagerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/blog/admin");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePublish = async (postId: string) => {
    if (
      !confirm(
        "Publish this post and send email notifications to all subscribers?",
      )
    )
      return;
    setPublishing(postId);
    try {
      const res = await fetch(`/api/blog/admin/${postId}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Published! ${data.emails?.sent || 0} emails sent.`);
        fetchPosts();
      } else {
        alert("Failed to publish");
      }
    } catch {
      alert("Error publishing post");
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(postId);
    try {
      const res = await fetch(`/api/blog/admin/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPosts();
      } else {
        alert("Failed to delete");
      }
    } catch {
      alert("Error deleting post");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Blog Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage blog posts. Publishing sends email notifications
            to all subscribers.
          </p>
        </div>
        <Link
          href="/dashboard/blog/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Post
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No blog posts yet
          </p>
          <Link
            href="/dashboard/blog/new"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Author
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {post.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {post.author}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {post.category || "Insights"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {post.status === "published" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(post.published_at || post.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/blog/new?edit=${post.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Edit
                      </Link>
                      {post.status === "draft" && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          disabled={publishing === post.id}
                          className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 disabled:opacity-50"
                        >
                          {publishing === post.id ? "Publishing..." : "Publish"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                      >
                        {deleting === post.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
