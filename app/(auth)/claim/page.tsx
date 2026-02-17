"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-20">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 shadow-xl backdrop-blur-sm text-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ClaimPageInner />
    </Suspense>
  );
}

function ClaimPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step 1: Code entry
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [validating, setValidating] = useState(false);

  // Step 2: Set password (after code validated)
  const [orgInfo, setOrgInfo] = useState<{
    orgName: string;
    contactName: string;
    contactEmail: string;
    targetType: string;
    dealId: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-validate if code comes from URL (?code=XXXXXXXX)
  const validateCode = useCallback(async (codeToValidate: string) => {
    const clean = codeToValidate.replace(/[-\s]/g, "").toUpperCase();
    if (clean.length < 8) return;

    setValidating(true);
    setCodeError("");

    try {
      const res = await fetch(`/api/claim?code=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.error || "Invalid code");
        setValidating(false);
        return;
      }

      setOrgInfo(data);
    } catch {
      setCodeError("Network error. Please try again.");
    }
    setValidating(false);
  }, []);

  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      validateCode(urlCode);
    }
  }, [searchParams, validateCode]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode(code);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivateError("");

    if (password.length < 6) {
      setActivateError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setActivateError("Passwords do not match");
      return;
    }

    setActivating(true);

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.replace(/[-\s]/g, "").toUpperCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActivateError(data.error || "Failed to create account");
        setActivating(false);
        return;
      }

      setSuccess(true);

      // Redirect to deal page after brief delay
      setTimeout(() => {
        router.push(data.redirectTo || "/dashboard");
      }, 1500);
    } catch {
      setActivateError("Network error. Please try again.");
      setActivating(false);
    }
  };

  // Format code as XXXX-XXXX for display
  const handleCodeChange = (value: string) => {
    const clean = value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8);
    setCode(clean);
    setCodeError("");
  };

  const displayCode =
    code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 shadow-xl backdrop-blur-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <a href="/" className="inline-block">
            <span className="text-3xl font-extrabold">
              <span className="text-purple-400">t</span>
              <span className="text-blue-400">Credex</span>
              <span className="text-blue-400 text-2xl">.com</span>
            </span>
          </a>
          <p className="mt-2 text-sm text-gray-400">
            AI-Powered Tax Credit Marketplace
          </p>
        </div>

        {success ? (
          /* Success State */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">
              Welcome to tCredex!
            </h2>
            <p className="mt-2 text-gray-400">
              Your account has been created. Redirecting you now...
            </p>
          </div>
        ) : !orgInfo ? (
          /* Step 1: Enter Claim Code */
          <div>
            <h2 className="mb-2 text-center text-xl font-bold text-white">
              Enter Your Claim Code
            </h2>
            <p className="mb-6 text-center text-sm text-gray-400">
              Enter the 8-character code from your email invitation
            </p>

            <form onSubmit={handleCodeSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value={displayCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="XXXX-XXXX"
                  className="w-full rounded-xl border-2 border-gray-700 bg-gray-800 px-6 py-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  maxLength={9}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {codeError && (
                <p className="mb-4 text-center text-sm text-red-400">
                  {codeError}
                </p>
              )}

              <button
                type="submit"
                disabled={code.length < 8 || validating}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {validating ? "Validating..." : "Continue"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500">
              Don&apos;t have a code?{" "}
              <a href="/signup" className="text-indigo-400 hover:underline">
                Sign up here
              </a>
            </p>
          </div>
        ) : (
          /* Step 2: Set Password */
          <div>
            <div className="mb-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
              <p className="text-sm text-indigo-300">Welcome!</p>
              <p className="mt-1 text-lg font-bold text-white">
                {orgInfo.orgName}
              </p>
              {orgInfo.contactName && (
                <p className="text-sm text-gray-400">{orgInfo.contactName}</p>
              )}
            </div>

            <h2 className="mb-2 text-center text-xl font-bold text-white">
              Set Your Password
            </h2>
            <p className="mb-6 text-center text-sm text-gray-400">
              Create a password for{" "}
              <strong className="text-gray-300">{orgInfo.contactEmail}</strong>
            </p>

            <form onSubmit={handleActivate}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActivateError("");
                  }}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                  minLength={6}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setActivateError("");
                  }}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  minLength={6}
                />
              </div>

              {activateError && (
                <p className="mb-4 text-center text-sm text-red-400">
                  {activateError}
                </p>
              )}

              <button
                type="submit"
                disabled={!password || !confirmPassword || activating}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activating ? "Creating Account..." : "Activate Account"}
              </button>
            </form>

            <button
              onClick={() => {
                setOrgInfo(null);
                setCode("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-300"
            >
              ← Enter a different code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
