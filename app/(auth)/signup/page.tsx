"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type OrgType = "sponsor" | "cde" | "investor" | "consultant";

const scheduleAnchors: Record<OrgType, string> = {
  sponsor: "#schedule-sponsor",
  cde: "#schedule-cde",
  investor: "#schedule-investor",
  consultant: "#schedule-consultant",
};

const scheduleNames: Record<OrgType, string> = {
  sponsor: "Schedule A (Sponsors)",
  cde: "Schedule B (CDEs)",
  investor: "Schedule C (Investors)",
  consultant: "Schedule D (Consultants)",
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignUp />
    </Suspense>
  );
}

function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Referral params from allocation request email magic link
  const refType = searchParams.get("ref"); // 'cde' | 'sponsor' | 'investor'
  const refOrgId = searchParams.get("org"); // existing organization_id from cdes_merged
  const refDealId = searchParams.get("deal"); // deal they're being invited to review
  const isReferral = !!(refType && refOrgId);

  const [step, setStep] = useState(isReferral ? 2 : 1); // Skip role selection for referrals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [orgType, setOrgType] = useState<OrgType | "">(
    isReferral && refType ? (refType as OrgType) : "",
  );
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [referralLoading, setReferralLoading] = useState(isReferral);

  // For referrals, fetch the existing org name so the user sees it pre-filled
  useEffect(() => {
    if (!isReferral || !refOrgId) return;
    setReferralLoading(true);
    fetch(`/api/cdes/lookup?org=${refOrgId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setOrgName(data.name);
        if (data?.contactEmail) setEmail(data.contactEmail);
        if (data?.contactName) setName(data.contactName);
      })
      .catch(() => {
        /* org name will just be empty */
      })
      .finally(() => setReferralLoading(false));
  }, [isReferral, refOrgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("You must accept the Platform Terms to continue");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call registration API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          name,
          organizationName: orgName,
          role: orgType === "consultant" ? "sponsor" : orgType,
          // Referral: link to existing CDE org instead of creating new
          existingOrgId: isReferral ? refOrgId : undefined,
          referralDealId: isReferral ? refDealId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Create local session with API response
      const session = {
        role: orgType,
        email: email.toLowerCase(),
        name,
        orgName,
        organizationId: data.user?.organizationId,
        organizationType: data.user?.organizationType,
        userId: data.user?.id,
        entityId: data.user?.entityId,
        registeredAt: new Date().toISOString(),
        termsAcceptedAt: new Date().toISOString(),
        showWelcomeModal: true,
      };

      localStorage.setItem("tcredex_session", JSON.stringify(session));

      // Store success data for welcome page
      sessionStorage.setItem(
        "signup_success",
        JSON.stringify({
          email: email.toLowerCase(),
          name,
          role: orgType,
          organizationName: orgName,
          referralDealId: refDealId || undefined,
        }),
      );

      // Referral: redirect straight to the deal instead of success page
      if (refDealId) {
        router.push(`/deals/${refDealId}`);
      } else {
        router.push("/signup/success");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const orgTypes = [
    {
      id: "sponsor" as OrgType,
      name: "Project Sponsor / Developer",
      description: "I have projects seeking tax credit financing",
      icon: "🏗️",
      color: "green",
    },
    {
      id: "cde" as OrgType,
      name: "Community Development Entity",
      description: "I allocate NMTC or manage tax credit transactions",
      icon: "🏛️",
      color: "purple",
    },
    {
      id: "investor" as OrgType,
      name: "Tax Credit Investor",
      description:
        "I invest in tax credit transactions for CRA or tax benefits",
      icon: "💰",
      color: "blue",
    },
    {
      id: "consultant" as OrgType,
      name: "Consultant / Advisor",
      description: "I advise clients on tax credit transactions",
      icon: "📋",
      color: "amber",
    },
  ];

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Header */}
          <div className="pb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Create your tCredex account
            </h1>
            <p className="mt-4 text-indigo-200/65">
              Join the tax credit marketplace connecting sponsors, CDEs, and
              investors.
            </p>
          </div>

          {/* Progress steps */}
          <div className="mx-auto max-w-[500px] mb-8">
            <div className="flex items-center justify-center gap-4">
              <div
                className={`flex items-center gap-2 ${step >= 1 ? "text-indigo-400" : "text-gray-500"}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-500"}`}
                >
                  1
                </span>
                <span className="text-sm hidden sm:inline">Account Type</span>
              </div>
              <div
                className={`w-12 h-px ${step >= 2 ? "bg-indigo-500" : "bg-gray-700"}`}
              />
              <div
                className={`flex items-center gap-2 ${step >= 2 ? "text-indigo-400" : "text-gray-500"}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-500"}`}
                >
                  2
                </span>
                <span className="text-sm hidden sm:inline">Your Details</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-auto max-w-[500px] mb-6 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Step 1: Select Organization Type */}
          {step === 1 && (
            <div className="mx-auto max-w-[500px]">
              <h2 className="text-lg font-semibold text-gray-200 mb-4 text-center">
                What best describes you?
              </h2>
              <div className="space-y-3">
                {orgTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setOrgType(type.id);
                      setStep(2);
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:bg-gray-800/50 ${
                      orgType === type.id
                        ? type.color === "green"
                          ? "border-green-500 bg-green-900/20"
                          : type.color === "purple"
                            ? "border-purple-500 bg-purple-900/20"
                            : type.color === "amber"
                              ? "border-amber-500 bg-amber-900/20"
                              : "border-blue-500 bg-blue-900/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{type.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-200">
                          {type.name}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center text-sm text-indigo-200/65">
                Already have an account?{" "}
                <Link
                  className="font-medium text-indigo-500 hover:text-indigo-400"
                  href={
                    refDealId
                      ? `/signin?redirect=/deals/${refDealId}`
                      : "/signin"
                  }
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === 2 && (
            <form className="mx-auto max-w-[500px]" onSubmit={handleSubmit}>
              {!isReferral && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to account type
                </button>
              )}

              {/* Referral banner */}
              {isReferral && refDealId && (
                <div className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg mb-6">
                  <p className="text-sm text-indigo-300 font-medium">
                    You&apos;ve been invited to review a project on tCredex
                  </p>
                  <p className="text-xs text-indigo-400/70 mt-1">
                    Create your account to view the deal and manage allocation
                    requests.
                  </p>
                </div>
              )}

              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-6">
                <p className="text-sm text-gray-400">Registering as:</p>
                <p className="font-medium text-gray-200">
                  {orgTypes.find((t) => t.id === orgType)?.name}
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-indigo-200/65"
                    htmlFor="orgName"
                  >
                    Organization Name
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    className={`form-input w-full ${isReferral && orgName ? "opacity-70 cursor-not-allowed" : ""}`}
                    placeholder={
                      referralLoading ? "Loading..." : "Acme Development Corp"
                    }
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    readOnly={isReferral && !!orgName}
                    required
                  />
                  {isReferral && orgName && (
                    <p className="text-xs text-indigo-400/60 mt-1">
                      Pre-filled from your CDFI Fund allocation record
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-indigo-200/65"
                    htmlFor="name"
                  >
                    Your Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input w-full"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-indigo-200/65"
                    htmlFor="email"
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input w-full"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-indigo-200/65"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-input w-full"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-indigo-200/65"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input w-full"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Terms Acceptance Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                    />
                    <span className="text-sm text-gray-300">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        tCredex Platform Terms
                      </Link>{" "}
                      and the applicable{" "}
                      <Link
                        href={`/terms${orgType ? scheduleAnchors[orgType] : ""}`}
                        target="_blank"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {orgType
                          ? scheduleNames[orgType]
                          : "Role-Specific Schedule"}
                      </Link>
                      , and understand that tCredex provides informational tools
                      only and does not provide investment, legal, or tax
                      advice.
                    </span>
                  </label>
                  <p className="mt-2 ml-7 text-xs text-gray-500">
                    Designed to support professional judgment, not replace it.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                View our{" "}
                <Link
                  href="/privacy"
                  className="text-indigo-400 hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
