"use client";

import {
  useState,
  useEffect,
  useCallback,
  Suspense,
  type ComponentProps,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";
import { IntakeShell, IntakeData } from "@/components/intake-v4";
import { DealCardPreview } from "@/components/deals";
import {
  generateDealFromIntake,
  validateForDealCard,
  DealCardGeneratorResult,
} from "@/lib/deals";
import { Deal, ProgramType } from "@/lib/data/deals";
import { fetchDealById } from "@/lib/supabase/queries";
import { OrganizationType } from "@/types/intake";

// Convert boolean/string ownership field to 'Yes' | 'No' | undefined
function toYesNo(
  val: boolean | string | undefined | null,
): "Yes" | "No" | undefined {
  if (val === undefined || val === null) return undefined;
  if (val === true) return "Yes";
  if (val === false) return "No";
  if (typeof val === "string") {
    const lower = val.toLowerCase();
    if (lower === "true" || lower === "yes" || lower === "1") return "Yes";
    if (lower === "false" || lower === "no" || lower === "0") return "No";
  }
  return undefined;
}

// Normalize organization type to match IntakeData OrganizationType
function normalizeOrgType(
  orgType: string | undefined,
): OrganizationType | undefined {
  if (!orgType) return undefined;
  const normalized = orgType.toLowerCase();
  switch (normalized) {
    case "for-profit":
    case "forprofit":
      return "For-profit";
    case "non-profit":
    case "nonprofit":
      return "Non-profit";
    case "not-for-profit":
    case "notforprofit":
      return "Not-for-profit";
    case "government":
      return "Government";
    case "tribal":
      return "Tribal";
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Helpers for safe localStorage + payload size management
// ---------------------------------------------------------------------------

/** Strip large binary data (base64 images, blob URLs) from IntakeData before storage */
function stripLargeData(data: IntakeData): IntakeData {
  const stripped = { ...data };

  // Remove base64 content from project images — keep metadata only
  if (stripped.projectImages?.length) {
    stripped.projectImages = stripped.projectImages.map((img) => ({
      ...img,
      url: img.url?.startsWith("data:") ? "" : img.url,
    }));
  }

  // Remove blob: URLs from DD documents — they're invalid after page reload anyway
  if (stripped.documents?.length) {
    stripped.documents = stripped.documents.map((doc) => ({
      ...doc,
      url: doc.url?.startsWith("blob:") ? "" : doc.url,
    }));
  }

  return stripped;
}

/** Safely write to localStorage, handling QuotaExceededError gracefully */
function safeSaveToLocalStorage(key: string, data: IntakeData): void {
  try {
    localStorage.setItem(key, JSON.stringify(stripLargeData(data)));
  } catch {
    // Still too big — drop images and documents entirely
    try {
      const minimal = { ...data };
      delete minimal.projectImages;
      delete minimal.documents;
      localStorage.setItem(key, JSON.stringify(minimal));
    } catch {
      console.warn("[Intake] localStorage full — skipping local backup");
    }
  }
}

interface DraftInfo {
  id: string;
  project_name: string;
  updated_at: string;
  draft_data?: IntakeData;
  intake_data?: IntakeData;
  readiness_score?: number;
  status?: string;
  // Fields used for fallback reconstruction when JSONB is empty
  city?: string;
  state?: string;
  programs?: string[];
  total_project_cost?: number;
  nmtc_financing_requested?: number;
  census_tract?: string;
  address?: string;
  zip_code?: string;
}

// Step 2: Show draft options if draft exists
function DraftPrompt({
  draft,
  email,
  onContinue,
  onStartFresh,
}: {
  draft: DraftInfo;
  email: string;
  onContinue: () => void;
  onStartFresh: () => void;
}) {
  const updatedAt = new Date(draft.updated_at);
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome back!</h2>
          <p className="text-gray-400 text-sm">You have an unfinished draft</p>
        </div>

        {/* Draft Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white">
              {draft.project_name || "Untitled Project"}
            </h3>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              Progress:{" "}
              <span className="text-indigo-400">
                {draft.readiness_score || 0}%
              </span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Continue Draft
          </button>

          <button
            onClick={onStartFresh}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors border border-gray-700"
          >
            Start Fresh (delete draft)
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Signed in as {email}
        </p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Access Denied Component
function AccessDenied({ orgType }: { orgType: string | undefined }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          Sponsor Access Only
        </h1>
        <p className="text-gray-400 mb-6">
          Only Project Sponsors can submit deals.
          {orgType === "cde" &&
            " As a CDE, you can review and match with submitted deals in your Pipeline."}
          {orgType === "investor" &&
            " As an Investor, you can browse and invest in deals."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/deals"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Browse Deals
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function IntakeLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Inner component that uses useSearchParams
function IntakePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams?.get("dealId") ?? null; // Edit mode for submitted deals
  const draftId = searchParams?.get("draftId") ?? null; // Continue specific draft directly (skip prompt)

  const {
    orgType,
    isLoading: authLoading,
    isAuthenticated,
    organizationId,
    userEmail: authEmail,
    userName: _userName,
    orgName,
  } = useCurrentUser();
  const [step, setStep] = useState<"loading" | "draft-prompt" | "form">(
    "loading",
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [existingDraft, setExistingDraft] = useState<DraftInfo | null>(null);
  const [initialData, setInitialData] = useState<
    Partial<IntakeData> | undefined
  >(undefined);
  const [saveToast, setSaveToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);

  // Preview state
  const [previewResult, setPreviewResult] =
    useState<DealCardGeneratorResult | null>(null);
  const [currentData, setCurrentData] = useState<IntakeData | null>(null);

  // Sponsor data for pre-population (fetched from /api/organization)
  // Stores the full org record so it can be passed to IntakeShell -> SponsorDetails
  const [sponsorData, setSponsorData] = useState<Record<
    string,
    string | number | boolean | null | undefined
  > | null>(null);

  // Fetch sponsor data for pre-population
  useEffect(() => {
    const fetchSponsorData = async () => {
      if (!organizationId || orgType !== "sponsor") return;

      try {
        const response = await fetch(`/api/organization?id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.organization) {
            setSponsorData(data.organization);
          }
        }
      } catch (error) {
        console.error("[Intake] Failed to fetch sponsor data:", error);
      }
    };

    if (isAuthenticated && !authLoading && organizationId) {
      fetchSponsorData();
    }
  }, [isAuthenticated, authLoading, organizationId, orgType]);

  // Check for edit mode (dealId in URL)
  useEffect(() => {
    const loadDealForEdit = async () => {
      if (!dealId) return;

      try {
        const deal = await fetchDealById(dealId);

        if (!deal) {
          setEditLoadError("Deal not found");
          return;
        }

        // Verify ownership
        if (deal.sponsorOrganizationId !== organizationId) {
          setEditLoadError("You do not have permission to edit this deal");
          return;
        }

        setEditingDeal(deal);
        setIsEditMode(true);

        // Convert Deal to IntakeData format
        const intakeData: Partial<IntakeData> = {
          projectName: deal.projectName,
          projectDescription: deal.description || "",
          city: deal.city,
          state: deal.state,
          censusTract: deal.censusTract || "",
          totalProjectCost: deal.projectCost || 0,
          nmtcFinancingRequested: deal.allocation,
          communityBenefit: deal.communityImpact || "",
          // Add more field mappings as needed
        };

        setInitialData(intakeData);
        setStep("form");
      } catch (error) {
        console.error("[Intake] Failed to load deal for editing:", error);
        setEditLoadError("Failed to load deal");
      }
    };

    if (dealId && isAuthenticated && !authLoading) {
      loadDealForEdit();
    }
  }, [dealId, isAuthenticated, authLoading, organizationId]);

  // Hydrate email from authenticated user (preferred) or local fallback and fetch draft
  useEffect(() => {
    // Always call the hook, but conditionally execute logic inside
    if (dealId) {
      // Skip draft check in edit mode for submitted deals
      return;
    }

    if (authLoading) {
      // Wait for auth to finish
      return;
    }

    const skipDraftCheck = searchParams?.get("new") === "true"; // Skip if user explicitly wants new deal

    const hydrateAndLoadDraft = async () => {
      if (!organizationId) {
        setStep("form");
        return;
      }

      setUserEmail(authEmail || null);

      // If user explicitly wants a new deal, skip draft check
      if (skipDraftCheck) {
        setStep("form");
        return;
      }

      try {
        // If a specific draftId is provided, load that draft directly without showing prompt
        // Use fetchApi utility for consistent error handling and credentials
        const { fetchApi } = await import("@/lib/api/fetch-utils");

        const draftQuery = draftId
          ? `/api/drafts?id=${encodeURIComponent(draftId)}`
          : `/api/drafts?orgId=${encodeURIComponent(organizationId)}`;

        const result = await fetchApi<{ draft: DraftInfo }>(draftQuery);

        if (!result.success || !result.data) {
          console.error("[Intake] Draft fetch failed:", result.error);
          setStep("form");
          return;
        }

        const draftResult = result.data;

        // Type guard: ensure draftResult has the expected structure
        if (!draftResult || typeof draftResult !== "object") {
          console.error(
            "[Intake] Invalid draft result structure:",
            draftResult,
          );
          setStep("form");
          return;
        }

        if (draftResult.draft) {
          // Robust draft data extraction with multiple fallbacks
          let draftData: Partial<IntakeData> | null = null;

          // Try draft_data first
          if (draftResult.draft.draft_data) {
            if (typeof draftResult.draft.draft_data === "string") {
              try {
                draftData = JSON.parse(draftResult.draft.draft_data);
              } catch (e) {
                console.warn("[Intake] Failed to parse draft_data string:", e);
              }
            } else if (
              typeof draftResult.draft.draft_data === "object" &&
              Object.keys(draftResult.draft.draft_data).length > 0
            ) {
              draftData = draftResult.draft.draft_data;
            }
          }

          // Fallback to intake_data if draft_data is empty/invalid
          if (
            !draftData ||
            (typeof draftData === "object" &&
              Object.keys(draftData).length === 0)
          ) {
            if (draftResult.draft.intake_data) {
              if (typeof draftResult.draft.intake_data === "string") {
                try {
                  draftData = JSON.parse(draftResult.draft.intake_data);
                } catch (e) {
                  console.warn(
                    "[Intake] Failed to parse intake_data string:",
                    e,
                  );
                }
              } else if (
                typeof draftResult.draft.intake_data === "object" &&
                Object.keys(draftResult.draft.intake_data).length > 0
              ) {
                draftData = draftResult.draft.intake_data;
              }
            }
          }

          // Last resort: try to reconstruct from deal fields if JSONB is empty
          if (
            !draftData ||
            (typeof draftData === "object" &&
              Object.keys(draftData).length === 0)
          ) {
            if (
              draftResult.draft.project_name ||
              draftResult.draft.city ||
              draftResult.draft.state
            ) {
              draftData = {
                projectName: draftResult.draft.project_name || "",
                city: draftResult.draft.city || "",
                state: draftResult.draft.state || "",
                programs: (draftResult.draft.programs || []) as ProgramType[],
                totalProjectCost: draftResult.draft.total_project_cost || 0,
                nmtcFinancingRequested:
                  draftResult.draft.nmtc_financing_requested || 0,
                censusTract: draftResult.draft.census_tract || "",
                address: draftResult.draft.address || "",
                zipCode: draftResult.draft.zip_code || "",
              };
            }
          }

          if (
            draftData &&
            typeof draftData === "object" &&
            Object.keys(draftData).length > 0
          ) {
            setExistingDraft(draftResult.draft);
            setInitialData(draftData);

            // If draftId was specified, go directly to form (user already chose to continue from pipeline)
            // Otherwise show the prompt so user can choose
            setStep(draftId ? "form" : "draft-prompt");
          } else {
            console.warn(
              "[Intake] Draft found but no valid data after all fallbacks:",
              draftResult.draft,
            );
            // Draft exists but has no data - show form anyway (user can start fresh)
            setExistingDraft(draftResult.draft);
            setInitialData(undefined);
            setStep("form");
          }
        } else {
          console.log("[Intake] No draft found");
          setStep("form");
        }
      } catch (error) {
        console.error("[Intake] Failed to check for draft:", error);
        setStep("form");
      }
    };

    hydrateAndLoadDraft();
  }, [authEmail, authLoading, dealId, draftId, organizationId, searchParams]);

  // Continue with existing draft
  const handleContinueDraft = useCallback(() => {
    if (existingDraft) {
      // Use smart fallback: prefer draft_data if it has content, otherwise use intake_data
      const draftDataHasContent =
        existingDraft.draft_data &&
        typeof existingDraft.draft_data === "object" &&
        Object.keys(existingDraft.draft_data).length > 0;

      const draftData = draftDataHasContent
        ? existingDraft.draft_data
        : existingDraft.intake_data || existingDraft.draft_data;

      if (
        draftData &&
        typeof draftData === "object" &&
        Object.keys(draftData).length > 0
      ) {
        setInitialData(draftData);
      }
    }
    setStep("form");
  }, [existingDraft]);

  // Start fresh (delete draft)
  const handleStartFresh = useCallback(async () => {
    if (organizationId) {
      try {
        await fetch(`/api/drafts?orgId=${encodeURIComponent(organizationId)}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("[Intake] Failed to delete draft:", error);
      }
    }
    setInitialData(undefined);
    setExistingDraft(null);
    setStep("form");
  }, [organizationId]);

  // Save draft
  const handleSave = useCallback(
    async (data: IntakeData, readinessScore: number, tier: number) => {
      if (!organizationId) {
        setSaveToast({
          type: "error",
          message: "Missing organization. Please sign in again.",
        });
        setTimeout(() => setSaveToast(null), 3000);
        return;
      }

      try {
        // Strip base64 images / blob URLs to keep API payload under size limits
        const slimData = stripLargeData(data);

        const response = await fetch("/api/drafts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            data: slimData,
            readinessScore,
            tier,
            dealId: existingDraft?.id,
          }),
        });
        const result = await response.json();

        console.log("[Intake] Save response:", {
          ok: response.ok,
          status: response.status,
          result,
        });

        // Safe localStorage backup (handles QuotaExceededError)
        safeSaveToLocalStorage("tcredex_draft", data);

        if (!response.ok || !result?.success) {
          const errorMsg =
            result?.error ||
            result?.message ||
            `HTTP ${response.status}: Save failed`;
          console.error("[Intake] Save API error:", {
            status: response.status,
            statusText: response.statusText,
            result,
            errorMsg,
          });
          throw new Error(errorMsg);
        }

        setSaveToast({
          type: "success",
          message: "Draft saved to your account",
        });
        setExistingDraft(result.draft ?? existingDraft);

        // Use smart fallback: prefer draft_data if it has content, otherwise use intake_data
        if (result.draft) {
          const draftDataHasContent =
            result.draft.draft_data &&
            typeof result.draft.draft_data === "object" &&
            Object.keys(result.draft.draft_data).length > 0;

          const draftData = draftDataHasContent
            ? result.draft.draft_data
            : result.draft.intake_data || result.draft.draft_data;

          setInitialData(draftData || data);
        } else {
          setInitialData(data);
        }

        setTimeout(() => setSaveToast(null), 3000);
      } catch (error) {
        console.error("[Intake] Save failed - Full error:", error);
        console.error("[Intake] Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          organizationId,
          dataKeys: Object.keys(data),
          timestamp: new Date().toISOString(),
        });

        // Safe localStorage fallback (handles QuotaExceededError)
        safeSaveToLocalStorage("tcredex_draft", data);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setSaveToast({
          type: "error",
          message: `Save failed: ${errorMessage}. Saved locally; will sync when online`,
        });

        setTimeout(() => setSaveToast(null), 8000);
      }
    },
    [existingDraft, organizationId],
  );

  // Submit
  const handleSubmit = useCallback(
    async (data: IntakeData, _readinessScore: number, _tier: number) => {
      const validation = validateForDealCard(data);

      if (!validation.isValid) {
        alert(
          `Please fix the following errors:\n\n${validation.errors.join("\n")}`,
        );
        return;
      }

      const result = generateDealFromIntake(data);
      setCurrentData(data);
      setPreviewResult(result);
    },
    [],
  );

  const handleClosePreview = useCallback(() => setPreviewResult(null), []);
  const handleEditFromPreview = useCallback(() => setPreviewResult(null), []);

  const handleSubmitToDeals = useCallback(
    async (deal: Deal) => {
      try {
        // Strip large binary data before sending to API
        const slimIntakeData = currentData
          ? stripLargeData(currentData)
          : currentData;
        const response = await fetch("/api/intake", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakeData: slimIntakeData,
            saveOnly: false,
            dealId: existingDraft?.id || undefined,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Clear draft
          if (organizationId) {
            await fetch(
              `/api/drafts?orgId=${encodeURIComponent(organizationId)}`,
              { method: "DELETE" },
            );
          }
          localStorage.removeItem("tcredex_draft");

          alert(
            `🎉 Deal "${deal.projectName}" submitted!\n\nDeal ID: ${result.dealId}`,
          );
          setPreviewResult(null);
          router.push("/deals");
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error("Submit failed:", error);
        alert("Failed to submit. Please try again.");
      }
    },
    [currentData, existingDraft, organizationId, router],
  );

  // Stable hook to ensure consistent hook count across all renders
  // This prevents React from detecting hook order violations
  useEffect(() => {
    // Empty effect - ensures hook is always called in same position
  }, []);

  // ========================================
  // ROLE-BASED ACCESS CONTROL
  // ========================================

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Edit mode error
  if (editLoadError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Cannot Edit Deal
          </h1>
          <p className="text-gray-400 mb-6">{editLoadError}</p>
          <Link
            href="/deals"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  // If authenticated but NOT a sponsor, block access
  // Note: We allow non-authenticated users to start the form (they'll login/register later)
  if (isAuthenticated && orgType !== "sponsor") {
    return <AccessDenied orgType={orgType} />;
  }

  // ========================================
  // RENDER BASED ON STEP
  // ========================================

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (step === "draft-prompt" && existingDraft) {
    return (
      <DraftPrompt
        draft={existingDraft}
        email={userEmail || "your account"}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    );
  }

  // Form step
  return (
    <>
      {saveToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm border ${
            saveToast.type === "success"
              ? "bg-emerald-900/80 border-emerald-600 text-emerald-100"
              : "bg-amber-900/80 border-amber-600 text-amber-100"
          }`}
        >
          {saveToast.message}
        </div>
      )}

      {/* Edit Mode Header */}
      {isEditMode && editingDeal && (
        <div className="bg-amber-900/30 border-b border-amber-500/30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <div>
                <p className="text-amber-200 font-medium">
                  Editing: {editingDeal.projectName}
                </p>
                <p className="text-amber-300/70 text-xs">
                  Project name cannot be changed after submission
                </p>
              </div>
            </div>
            <Link
              href={`/deals/${dealId}`}
              className="px-3 py-1.5 text-sm text-amber-200 hover:text-white border border-amber-500/50 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      )}

      <IntakeShell
        initialData={{
          ...initialData,
          // Pre-populate sponsor fields from organization data
          // Ownership fields may be boolean (true/false) or string ("true"/"false"/"Yes"/"No")
          ...(sponsorData && {
            organizationType: normalizeOrgType(
              sponsorData.organization_type as string | undefined,
            ),
            lowIncomeOwned: toYesNo(
              sponsorData.low_income_owned as boolean | string | undefined,
            ),
            womanOwned: toYesNo(
              sponsorData.woman_owned as boolean | string | undefined,
            ),
            minorityOwned: toYesNo(
              sponsorData.minority_owned as boolean | string | undefined,
            ),
            veteranOwned: toYesNo(
              sponsorData.veteran_owned as boolean | string | undefined,
            ),
          }),
        }}
        sponsorData={
          sponsorData as ComponentProps<typeof IntakeShell>["sponsorData"]
        }
        onSave={handleSave}
        onSubmit={handleSubmit}
        isEditMode={isEditMode}
        lockedProjectName={isEditMode ? editingDeal?.projectName : undefined}
        organizationName={orgName}
        organizationType={orgType}
      />

      {previewResult && (
        <DealCardPreview
          result={previewResult}
          onClose={handleClosePreview}
          onEdit={handleEditFromPreview}
          onSubmit={handleSubmitToDeals}
        />
      )}
    </>
  );
}

// Main Page - wraps content in Suspense for useSearchParams
export default function IntakePage() {
  return (
    <Suspense fallback={<IntakeLoadingFallback />}>
      <IntakePageContent />
    </Suspense>
  );
}
