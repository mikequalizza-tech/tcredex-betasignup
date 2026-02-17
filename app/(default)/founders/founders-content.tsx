"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FoundersContentWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FoundersContent />
    </Suspense>
  );
}

function FoundersContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get("ref") ?? null;
  const utmSource = searchParams?.get("utm_source") ?? null;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [memberCode, setMemberCode] = useState("");

  // Launch date countdown (set your target date)
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const launchDate = new Date("2025-02-15T00:00:00"); // Set your launch date

    const timer = setInterval(() => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/founders/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company,
          role,
          referral_code: referralCode,
          utm_source: utmSource,
          tracking_cookie: getCookie("tcredex_track"),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setMemberCode(data.founder_code);
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (_err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (isSubmitted) {
    return (
      <section className="relative min-h-screen">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-indigo-900/20" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center">
            {/* Checkmark */}
            <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-green-400"
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

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome, Founder Member! 🎉
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              You're in. Your first deal closes at just 1% fee.
            </p>

            {/* Referral Code Card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-md mx-auto mb-8">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                Your Referral Code
              </p>
              <p className="text-3xl font-mono font-bold text-indigo-400 mb-4">
                {memberCode}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                Share this code. For every 2 signups that use your code, you
                unlock another deal at 1% fee.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://tcredex.com/r/${memberCode}`,
                  );
                  alert("Link copied!");
                }}
                className="btn bg-indigo-600 hover:bg-indigo-500 text-white w-full"
              >
                Copy Referral Link
              </button>
            </div>

            <p className="text-gray-500">
              Check your email for confirmation and early access updates.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Registration Form
  return (
    <section className="relative min-h-screen">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-indigo-900/20" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-400 text-sm font-medium">
              Pre-Launch • Limited Spots
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Become a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Founder Member
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Join the waitlist and lock in exclusive Founder benefits. The old
            boys' network had their run. Now it's your turn.
          </p>

          {/* Referral notice */}
          {referralCode && (
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 mb-8">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-green-400 text-sm">
                Referred by {referralCode}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Benefits */}
          <div>
            {/* Countdown */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8">
              <p className="text-gray-400 text-sm uppercase tracking-wider mb-4 text-center">
                Launching In
              </p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.minutes, label: "Min" },
                  { value: countdown.seconds, label: "Sec" },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits List */}
            <h2 className="text-2xl font-bold text-white mb-6">
              Founder Benefits
            </h2>

            <div className="space-y-4">
              {[
                {
                  icon: "💰",
                  title: "1% Fee on Your First Deal",
                  description:
                    "Standard marketplace fee is 3%. Founders pay just 1% on their first closed deal.",
                },
                {
                  icon: "🔗",
                  title: "Referral Rewards",
                  description:
                    "For every 2 people you refer who sign up, you unlock another deal at 1% fee. No limit.",
                },
                {
                  icon: "🚀",
                  title: "Early Access",
                  description:
                    "Be first to test new features. Direct line to the product team.",
                },
                {
                  icon: "🏆",
                  title: "Founder Badge",
                  description:
                    'Permanent "Founder Member" badge on your profile. CDEs and investors notice.',
                },
                {
                  icon: "📊",
                  title: "Priority Matching",
                  description:
                    "AutoMatch AI gives Founder deals a boost in CDE matching algorithms.",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl"
                >
                  <span className="text-2xl">{benefit.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Proof */}
            <div className="mt-8 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-gray-900"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="text-white font-semibold">
                    127+ founders
                  </span>{" "}
                  have joined the waitlist
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">
              Reserve Your Spot
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="John Martinez"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Work Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Company / Organization
                </label>
                <input
                  type="text"
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Martinez Development Corp"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  I am a...
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select your role</option>
                  <option value="sponsor">Project Sponsor / Developer</option>
                  <option value="cde">CDE / CDFI Representative</option>
                  <option value="investor">Investor / Fund Manager</option>
                  <option value="consultant">Tax Credit Consultant</option>
                  <option value="attorney">Attorney / Legal</option>
                  <option value="accountant">CPA / Accountant</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Reserving...
                  </span>
                ) : (
                  "Join as Founder Member →"
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By joining, you agree to our{" "}
                <Link href="/terms" className="text-indigo-400 hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-indigo-400 hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">Already have an account?</p>
          <Link
            href="/signin"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Sign in →
          </Link>
        </div>
      </div>
    </section>
  );
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}
