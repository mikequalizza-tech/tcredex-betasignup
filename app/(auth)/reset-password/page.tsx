"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "sent" | "update" | "success">(
    "email",
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if user arrived via password reset magic link (they'll have an active session)
  useEffect(() => {
    const supabase = createClient();

    // Listen for PASSWORD_RECOVERY event (fires when user clicks reset link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep("update");
      }
    });

    // Also check if already in a recovery session (page reload after clicking link)
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // If URL has recovery-related hash params, show update form
        const hash = window.location.hash;
        if (
          hash.includes("type=recovery") ||
          window.location.search.includes("type=recovery")
        ) {
          setStep("update");
        }
      }
    }
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  // Step 1: Send password reset email
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?redirect=/reset-password`,
      });
      if (error) throw error;
      setStep("sent");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please check your email address.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Update password (user arrived from magic link, now authenticated)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setStep("success");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try again.",
      );
    } finally {
      setIsLoading(false);
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
            <h1 className="text-xl font-semibold text-white">Reset Password</h1>
          </div>
          <p className="text-sm text-gray-400">
            {step === "email" &&
              "Enter your email to receive a password reset link"}
            {step === "sent" && "Check your inbox for the reset link"}
            {step === "update" && "Enter your new password"}
            {step === "success" && "Your password has been updated"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Enter email */}
          {step === "email" && (
            <form onSubmit={handleSendReset} className="space-y-4">
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
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}

          {/* Step 2: Email sent confirmation */}
          {step === "sent" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-indigo-900/50 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-indigo-400"
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
              <p className="text-gray-300 mb-2">Check your email</p>
              <p className="text-sm text-gray-500 mb-4">
                We sent a password reset link to{" "}
                <span className="text-gray-300 font-medium">{email}</span>.
                Click the link in the email to set your new password.
              </p>
              <button
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Didn&apos;t receive it? Try again
              </button>
            </div>
          )}

          {/* Step 3: Enter new password (arrived from magic link) */}
          {step === "update" && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-900/50 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-300 mb-4">
                Your password has been updated successfully.
              </p>
              <Link
                href="/signin"
                className="inline-block py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "email" || step === "sent") && (
          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800">
            <p className="text-sm text-center text-gray-400">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
