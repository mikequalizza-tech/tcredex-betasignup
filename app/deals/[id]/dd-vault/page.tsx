"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  FolderOpen,
  Upload,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { fetchApi, apiPost, apiDelete } from "@/lib/api/fetch-utils";
import {
  DD_CATEGORIES,
  type DDDocument,
  type DDVaultSummary,
  getStatusColor,
  getStatusLabel,
} from "@/lib/types/dd-vault";

interface DealBasic {
  id: string;
  project_name: string;
  programs?: string[] | string; // Can be array or JSON string
  programType?: string;
  program_type?: string; // snake_case from DB
}

export default function DDVaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const dealId = resolvedParams.id;
  const router = useRouter();

  const [deal, setDeal] = useState<DealBasic | null>(null);
  const [documents, setDocuments] = useState<DDDocument[]>([]);
  const [summary, setSummary] = useState<DDVaultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData is defined below and uses only dealId which is in deps
  }, [dealId]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load deal info
      const dealResult = await fetchApi<DealBasic>(`/api/deals/${dealId}`);
      if (dealResult.success && dealResult.data) {
        setDeal(dealResult.data);
      }

      // Load DD vault
      console.log(`[DD Vault] Loading vault for dealId=${dealId}`);
      const vaultResult = await fetchApi<{
        data: DDDocument[];
        summary: DDVaultSummary;
      }>(`/api/dd-vault?dealId=${dealId}&includeSummary=true`);

      console.log("[DD Vault] Load result:", {
        success: vaultResult.success,
        docsCount: vaultResult.data?.data?.length || 0,
        error: vaultResult.error,
      });

      if (vaultResult.success && vaultResult.data) {
        setDocuments(vaultResult.data.data || []);
        setSummary(vaultResult.data.summary || null);
      }
    } catch (err) {
      console.error("Error loading DD vault:", err);
      setError("Failed to load DD vault");
    } finally {
      setLoading(false);
    }
  }

  async function initializeVault() {
    if (!deal) return;

    setInitializing(true);
    setError(null);

    try {
      // Determine programs from deal - handle various field names and formats
      let programs: string[] = [];

      // Try to get programs array
      if (deal.programs) {
        if (Array.isArray(deal.programs)) {
          programs = deal.programs;
        } else if (typeof deal.programs === "string") {
          // Could be a JSON string or a single program
          try {
            const parsed = JSON.parse(deal.programs);
            programs = Array.isArray(parsed) ? parsed : [deal.programs];
          } catch {
            programs = [deal.programs];
          }
        }
      }

      // Fallback to programType or program_type (single program)
      if (programs.length === 0) {
        const singleProgram = deal.programType || deal.program_type;
        if (singleProgram) {
          programs = [singleProgram];
        }
      }

      // Default to NMTC if nothing found
      if (programs.length === 0) {
        programs = ["NMTC"];
        console.warn(
          "[DD Vault] No programs found on deal, defaulting to NMTC",
        );
      }

      console.log("[DD Vault] Initializing with programs:", programs);

      const result = await apiPost<{ data: DDDocument[]; message: string }>(
        "/api/dd-vault",
        { dealId, programs },
      );

      if (result.success) {
        // Reload the vault data
        await loadData();
      } else if (result.error?.includes("already exists")) {
        // Vault exists but we couldn't load it - try reloading
        console.log("[DD Vault] Vault already exists, reloading data...");
        await loadData();
        // After reload, check if we still have no documents - this indicates a data issue
        // The documents state won't be updated yet since loadData is async
        // So we need to check differently
        const recheckResult = await fetchApi<{
          data: DDDocument[];
          summary: DDVaultSummary;
        }>(`/api/dd-vault?dealId=${dealId}&includeSummary=true`);
        if (!recheckResult.data?.data?.length) {
          setError(
            'DD Vault records exist but cannot be loaded. Try "Reset Vault" below.',
          );
        }
      } else {
        console.error("[DD Vault] Init failed:", result.error);
        setError(result.error || "Failed to initialize vault");
      }
    } catch (err) {
      console.error("[DD Vault] Error initializing vault:", err);
      setError("Failed to initialize vault. Please check console for details.");
    } finally {
      setInitializing(false);
    }
  }

  async function resetVault() {
    if (
      !confirm(
        "This will delete all DD vault entries for this deal. The vault can be re-initialized after. Continue?",
      )
    ) {
      return;
    }

    setResetting(true);
    setError(null);

    try {
      console.log(`[DD Vault] Resetting vault for dealId=${dealId}`);
      const result = await apiDelete<{ message: string; deletedCount: number }>(
        `/api/dd-vault?dealId=${dealId}`,
      );

      if (result.success) {
        console.log("[DD Vault] Reset successful:", result.data);
        // Clear documents and reload
        setDocuments([]);
        setSummary(null);
        // After a short delay, try to reload to show the initialize screen
        await loadData();
      } else {
        console.error("[DD Vault] Reset failed:", result.error);
        setError(result.error || "Failed to reset vault");
      }
    } catch (err) {
      console.error("[DD Vault] Error resetting vault:", err);
      setError("Failed to reset vault. Please check console for details.");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-4" />
            <div className="h-64 bg-gray-900 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Vault not initialized
  if (documents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Due Diligence Vault
              </h1>
              {deal && <p className="text-gray-400">{deal.project_name}</p>}
            </div>
          </div>

          {/* Initialize Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center max-w-lg mx-auto">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              DD Vault Not Initialized
            </h2>
            <p className="text-gray-400 mb-6">
              Initialize the due diligence vault to track all required documents
              for this deal. Document requirements are based on the selected
              programs.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={initializeVault}
              disabled={initializing || resetting}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              {initializing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <FolderOpen className="w-5 h-5" />
                  Initialize DD Vault
                </>
              )}
            </button>

            {/* Reset option for broken state */}
            {error && error.includes("exist") && (
              <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-3">
                  Having trouble? Try resetting the vault to fix data issues.
                </p>
                <button
                  onClick={resetVault}
                  disabled={resetting || initializing}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  {resetting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Reset Vault
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Group documents by category
  const getCategoryLabel = (category: string) => {
    const meta = DD_CATEGORIES.find((c) => c.category === category);
    return meta?.label || category.replace(/_/g, " ");
  };

  const getCategoryDescription = (category: string) => {
    const meta = DD_CATEGORIES.find((c) => c.category === category);
    return meta?.description || "";
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Due Diligence Vault
              </h1>
              {deal && <p className="text-gray-400">{deal.project_name}</p>}
            </div>
          </div>

          <button
            onClick={loadData}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{summary.total}</p>
              <p className="text-sm text-gray-500">Total Documents</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {summary.greenCount}
              </p>
              <p className="text-sm text-gray-500">Complete</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-400">
                {summary.yellowCount}
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-rose-900/30 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-rose-400">
                {summary.redCount}
              </p>
              <p className="text-sm text-gray-500">Needs Action</p>
            </div>
          </div>
        )}

        {/* Completion Progress */}
        {summary && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                Required Documents Progress
              </span>
              <span className="text-sm font-semibold text-white">
                {summary.requiredComplete} / {summary.requiredTotal} (
                {summary.completionPercentage}%)
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.completionPercentage >= 80
                    ? "bg-emerald-500"
                    : summary.completionPercentage >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${summary.completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="space-y-3">
          {documents.map((doc) => {
            const statusColor = getStatusColor(doc.status);
            const colorClasses = {
              green: "border-emerald-500/30 bg-emerald-900/10",
              yellow: "border-amber-500/30 bg-amber-900/10",
              red: "border-rose-500/30 bg-rose-900/10",
              gray: "border-gray-700 bg-gray-900/50",
            };
            const statusTextColors = {
              green: "text-emerald-400",
              yellow: "text-amber-400",
              red: "text-rose-400",
              gray: "text-gray-400",
            };

            return (
              <div
                key={doc.id}
                className={`border rounded-xl p-4 ${colorClasses[statusColor]}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {getCategoryLabel(doc.category)}
                      </h3>
                      {doc.required && (
                        <span className="px-1.5 py-0.5 bg-purple-900/50 rounded text-[10px] text-purple-300 font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {getCategoryDescription(doc.category)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${statusTextColors[statusColor]}`}
                    >
                      {getStatusLabel(doc.status)}
                    </span>

                    {doc.status === "not_started" && (
                      <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1">
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    )}

                    <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-sm text-gray-400 mt-2 pl-4 border-l-2 border-gray-700">
                    {doc.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
