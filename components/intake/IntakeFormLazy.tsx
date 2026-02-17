"use client";

import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { IntakeData } from "@/types/intake";

// Lazy load the heavy intake components
const IntakeShell = lazy(() =>
  import("@/components/intake-v4").then((m) => ({ default: m.IntakeShell })),
);

interface IntakeFormLazyProps {
  initialData?: Partial<IntakeData>;
  onSave?: (data: IntakeData, readinessScore: number) => Promise<void>;
  onSubmit?: (data: IntakeData, readinessScore: number) => Promise<void>;
  projectId?: string;
}

export default function IntakeFormLazy({
  initialData,
  onSave,
  onSubmit,
  projectId,
}: IntakeFormLazyProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading intake form...</span>
          </div>
        }
      >
        <IntakeShell
          initialData={initialData}
          onSave={onSave}
          onSubmit={onSubmit}
          projectId={projectId}
        />
      </Suspense>
    </div>
  );
}
