"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect to Universal Intake Form
 *
 * The old 4-step wizard has been replaced with the comprehensive
 * IntakeShell component at /intake. This redirect ensures all
 * paths to "new project" go to the same place.
 */
export default function NewProjectRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/intake");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-400">Redirecting to Intake Form...</p>
      </div>
    </div>
  );
}
