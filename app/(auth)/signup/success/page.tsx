"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Mail, ArrowRight, Building2 } from "lucide-react";

interface SignupSuccessData {
  email: string;
  name: string;
  role: string;
  organizationName: string;
}

function SignupSuccessContent() {
  const router = useRouter();
  const [successData, setSuccessData] = useState<SignupSuccessData | null>(
    null,
  );
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Get success data from sessionStorage
    const stored = sessionStorage.getItem("signup_success");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSuccessData(data);
        // Clear it so it doesn't show again on refresh
        sessionStorage.removeItem("signup_success");
      } catch (e) {
        console.error("Failed to parse signup success data:", e);
      }
    } else {
      // No success data - redirect to signup
      router.push("/signup");
    }
  }, [router]);

  const handleContinue = () => {
    setRedirecting(true);
    // Redirect based on role
    const destination =
      successData?.role === "sponsor"
        ? "/dashboard"
        : successData?.role === "cde"
          ? "/dashboard/pipeline"
          : "/deals";
    router.push(destination);
  };

  if (!successData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel =
    successData.role === "sponsor"
      ? "Project Sponsor"
      : successData.role === "cde"
        ? "CDE / Allocatee"
        : "Investor";

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Success Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-8">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Account Created Successfully!
            </h1>
            <p className="text-gray-400">
              Welcome to tCredex, {successData.name}!
            </p>
          </div>

          {/* Success Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">
                    {successData.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Organization:</span>
                  <span className="text-white font-medium">
                    {successData.organizationName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white font-medium">{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Email Verification Notice */}
            <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-indigo-200 mb-1">
                    Check Your Email
                  </h3>
                  <p className="text-xs text-indigo-300/80 mb-2">
                    We've sent two emails to{" "}
                    <strong>{successData.email}</strong>:
                  </p>
                  <ul className="text-xs text-indigo-300/80 space-y-1 ml-4 list-disc">
                    <li>
                      <strong>Account Verification Email</strong> - Please
                      verify your email address
                    </li>
                    <li>
                      <strong>Welcome to tCredex</strong> - Get started with
                      your account
                    </li>
                  </ul>
                  <p className="text-xs text-indigo-300/80 mt-2">
                    <em>
                      Note: Email verification is currently optional, but we
                      recommend verifying your email for account security.
                    </em>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              disabled={redirecting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {redirecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <Link
              href="/dashboard/teams"
              className="block w-full py-2.5 px-4 text-center bg-emerald-700/50 hover:bg-emerald-600/50 text-emerald-200 font-medium rounded-lg transition-colors border border-emerald-600/50 flex items-center justify-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Set Up Organization Profile
            </Link>

            <Link
              href="/signin"
              className="block w-full py-2.5 px-4 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors border border-gray-700"
            >
              Sign In Instead
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Need help?{" "}
            <Link
              href="/support"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupSuccessContent />
    </Suspense>
  );
}
