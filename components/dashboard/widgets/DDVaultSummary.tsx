"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api/fetch-utils";
import type { DDVaultSummary, DDDocument } from "@/lib/types/dd-vault";
import { getStatusColor } from "@/lib/types/dd-vault";

interface DDVaultSummaryWidgetProps {
  dealId: string;
  dealName?: string;
  className?: string;
}

/**
 * Widget showing DD Vault completion status for a deal
 * Displays green/yellow/red indicator with completion percentage
 */
export default function DDVaultSummaryWidget({
  dealId,
  dealName,
  className = "",
}: DDVaultSummaryWidgetProps) {
  const [summary, setSummary] = useState<DDVaultSummary | null>(null);
  const [documents, setDocuments] = useState<DDDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVault() {
      if (!dealId) return;

      setLoading(true);
      try {
        const result = await fetchApi<{
          data: DDDocument[];
          summary: DDVaultSummary;
        }>(`/api/dd-vault?dealId=${dealId}&includeSummary=true`);

        if (result.success) {
          setDocuments(result.data?.data || []);
          setSummary(result.data?.summary || null);
        }
      } catch (err) {
        setError("Failed to load DD vault");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadVault();
  }, [dealId]);

  if (loading) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-32 bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary || documents.length === 0) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Due Diligence Vault
          </h3>
        </div>
        <div className="text-center py-6">
          <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-3">DD Vault not initialized</p>
          <Link
            href={`/deals/${dealId}/dd-vault`}
            className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Initialize Vault
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          Due Diligence
          {dealName && (
            <span className="text-gray-500 font-normal">• {dealName}</span>
          )}
        </h3>
        <Link
          href={`/deals/${dealId}/dd-vault`}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Completion Circle */}
      <div className="flex items-center gap-4 mb-4">
        <CompletionGauge percentage={summary.completionPercentage} />
        <div className="flex-1">
          <p className="text-lg font-bold text-white">
            {summary.requiredComplete} / {summary.requiredTotal}
          </p>
          <p className="text-xs text-gray-500">Required documents complete</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatusIndicator
          icon={CheckCircle}
          count={summary.greenCount}
          label="Complete"
          color="emerald"
        />
        <StatusIndicator
          icon={Clock}
          count={summary.yellowCount}
          label="In Progress"
          color="amber"
        />
        <StatusIndicator
          icon={AlertCircle}
          count={summary.redCount}
          label="Needs Action"
          color="rose"
        />
      </div>

      {/* Recent Documents */}
      <div className="border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Recent Activity
        </p>
        <div className="space-y-1.5">
          {documents
            .filter((d) => d.status !== "not_started")
            .slice(0, 3)
            .map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          {documents.filter((d) => d.status !== "not_started").length === 0 && (
            <p className="text-xs text-gray-500 py-2">
              No document activity yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CompletionGauge({ percentage }: { percentage: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const color =
    percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative" style={{ width: 72, height: 72 }}>
      <svg className="transform -rotate-90" width={72} height={72}>
        <circle
          cx={36}
          cy={36}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-700"
        />
        <circle
          cx={36}
          cy={36}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{percentage}%</span>
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  icon: React.ElementType;
  count: number;
  label: string;
  color: "emerald" | "amber" | "rose";
}

function StatusIndicator({
  icon: Icon,
  count,
  label,
  color,
}: StatusIndicatorProps) {
  const colorClasses = {
    emerald: "text-emerald-400 bg-emerald-900/30",
    amber: "text-amber-400 bg-amber-900/30",
    rose: "text-rose-400 bg-rose-900/30",
  };

  return (
    <div className={`rounded-lg p-2 ${colorClasses[color].split(" ")[1]}`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${colorClasses[color].split(" ")[0]}`} />
        <span
          className={`text-lg font-bold ${colorClasses[color].split(" ")[0]}`}
        >
          {count}
        </span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function DocumentRow({ document }: { document: DDDocument }) {
  const statusColor = getStatusColor(document.status);
  const colorClasses = {
    green: "text-emerald-400",
    yellow: "text-amber-400",
    red: "text-rose-400",
    gray: "text-gray-400",
  };

  const categoryLabels: Record<string, string> = {
    pro_forma: "Pro Forma",
    sources_and_uses: "Sources & Uses",
    site_control: "Site Control",
    environmental_phase1: "Phase I ESA",
    appraisal: "Appraisal",
    title_commitment: "Title",
    construction_contract: "GC Contract",
    qalicb_certification: "QALICB",
    part1_approval: "NPS Part 1",
    allocation_letter: "Allocation",
  };

  return (
    <div className="flex items-center justify-between py-1 px-2 bg-gray-800/30 rounded">
      <span className="text-xs text-gray-300">
        {categoryLabels[document.category] ||
          document.category.replace(/_/g, " ")}
      </span>
      <span className={`text-xs capitalize ${colorClasses[statusColor]}`}>
        {document.status.replace(/_/g, " ")}
      </span>
    </div>
  );
}
