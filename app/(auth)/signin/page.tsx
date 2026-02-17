"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      if (magicLinkMode) {
        // Magic link sign-in (passwordless)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          },
        });
        if (error) {
          setError(error.message);
          setIsSubmitting(false);
          return;
        }
        setMagicLinkSent(true);
        setIsSubmitting(false);
        return;
      }

      // Password sign-in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setIsSubmitting(false);
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/brand/tcredex-icon.svg"
              alt="tCredex"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <h1 className="text-xl font-semibold text-white">
              Sign in to tCredex
            </h1>
          </div>
          <p className="text-sm text-gray-400">
            Access your tax credit marketplace dashboard
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {magicLinkSent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-900/30 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                We sent a sign-in link to{" "}
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-xs text-gray-500">
                Click the link in your email to sign in. It expires in 1 hour.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkMode(false);
                }}
                className="mt-4 text-sm text-indigo-400 hover:text-indigo-300"
              >
                Use password instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              {!magicLinkMode && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <Link
                      href="/reset-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your password"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {magicLinkMode ? "Sending link..." : "Signing in..."}
                  </>
                ) : magicLinkMode ? (
                  "Send Magic Link"
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMagicLinkMode(!magicLinkMode)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {magicLinkMode
                    ? "Use password instead"
                    : "Sign in with magic link (no password)"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800 space-y-3">
          <p className="text-sm text-center text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href={
                redirectTo !== "/dashboard"
                  ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
                  : "/signup"
              }
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Sign up
            </Link>
          </p>

          {/* Sponsor/Partner callout */}
          <div className="pt-2 border-t border-gray-700">
            <p className="text-xs text-center text-gray-500">
              Interested in sponsoring or advertising on tCredex?{" "}
              <Link
                href="/contact"
                className="text-indigo-400/80 hover:text-indigo-300"
              >
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
