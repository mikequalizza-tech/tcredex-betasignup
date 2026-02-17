"use client";

import Link from "next/link";
import { Deal, ProgramType } from "@/lib/data/deals";

interface DealCardProps {
  deal: Deal;
  onRequestMemo?: (dealId: string) => void;
  memoRequested?: boolean;
  visibilityTier?: "public" | "expanded" | "full";
  compact?: boolean;
}

const PROGRAM_BADGE_COLORS: Record<ProgramType, string> = {
  NMTC: "bg-emerald-600 text-white",
  HTC: "bg-blue-600 text-white",
  LIHTC: "bg-purple-600 text-white",
  OZ: "bg-amber-500 text-black",
};

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || amount === 0) return "N/A";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const formatIncome = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return "N/A";
  // If it's a percentage (like MFI %), show as percent
  if (amount <= 200) return `${amount.toFixed(1)}%`;
  // Otherwise format as currency
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(1)}%`;
};

const formatDate = (date: string | undefined | null) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

// Generate short Deal ID like D12345
const _generateDealId = (id: string) => {
  const num = id.replace(/\D/g, "").slice(0, 5).padStart(5, "0");
  return `D${num}`;
};

// Generate project number like tcredex.com_File_2025-084
const generateProjectNumber = (id: string, submittedDate?: string) => {
  const year = submittedDate
    ? new Date(submittedDate).getFullYear()
    : new Date().getFullYear();
  const num = id.replace(/\D/g, "").slice(0, 3).padStart(3, "0");
  return `tcredex.com_File_${year}-${num}`;
};

export default function DealCard({
  deal,
  onRequestMemo,
  memoRequested,
  visibilityTier: _visibilityTier = "public",
  compact = false,
}: DealCardProps) {
  const programType = deal.programType || "NMTC";
  const isNMTC = programType === "NMTC";
  const isHTC = programType === "HTC";

  // Compact mode for home page - simplified card format
  if (compact) {
    return (
      <div className="w-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
        {/* Hero Image or Gradient */}
        <div
          className={`h-32 bg-gradient-to-br ${
            programType === "NMTC"
              ? "from-emerald-900/50 to-teal-900/30"
              : programType === "HTC"
                ? "from-blue-900/50 to-indigo-900/30"
                : programType === "LIHTC"
                  ? "from-purple-900/50 to-indigo-900/30"
                  : "from-amber-900/50 to-orange-900/30"
          } flex items-center justify-center`}
        >
          <span className="text-5xl opacity-50">
            {programType === "NMTC"
              ? "🏗️"
              : programType === "HTC"
                ? "🏛️"
                : programType === "LIHTC"
                  ? "🏘️"
                  : "📍"}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Program Badge */}
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${PROGRAM_BADGE_COLORS[programType]}`}
          >
            {programType}
          </span>

          {/* Project Name */}
          <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 mb-1">
            {deal.projectName || "Untitled Project"}
          </h3>

          {/* Location */}
          <p className="text-gray-400 text-sm mb-3">
            {deal.city}, {deal.state}
          </p>

          {/* Key Metrics */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase">Allocation</p>
              <p className="text-lg font-bold text-emerald-400">
                {formatCurrency(deal.allocation)}
              </p>
            </div>
            {deal.tractSeverelyDistressed && (
              <span className="px-2 py-1 bg-red-900/50 rounded text-xs text-red-300">
                Severely Distressed
              </span>
            )}
          </div>

          {/* View Button */}
          <Link
            href={`/deals/${deal.id}`}
            className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm text-center transition-colors"
          >
            View Deal
          </Link>
        </div>
      </div>
    );
  }

  // Full Deal Card - Matches template exactly
  return (
    <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* tCredex Deal Card Header (matches template sidebar-header) */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-center py-3 px-4">
        <div className="font-bold text-lg tracking-wide">tCredex</div>
        <div className="text-sm font-medium opacity-90">Deal Card</div>
      </div>

      {/* Project Name + City/State + Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-lg leading-tight">
              {deal.projectName || "Untitled"}
            </h2>
            <p className="text-gray-400 text-sm">
              {deal.city}, {deal.state}
            </p>
          </div>
          {/* tCredex Logo Icon - Inline SVG (will render in PDF) */}
          <svg
            className="flex-shrink-0 w-12 h-12"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="100"
              height="100"
              rx="20"
              fill="url(#tcredex_gradient)"
            />
            <path d="M35 25H65V75H50V40H35V25Z" fill="white" />
            <path d="M25 65L45 45H35V65H25Z" fill="white" />
            <defs>
              <linearGradient
                id="tcredex_gradient"
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0000FF" />
                <stop offset="1" stopColor="#8000FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Content - Simple field rows */}
      <div className="p-4 space-y-1.5 text-sm">
        {/* Parent */}
        <div className="flex justify-between">
          <span className="text-gray-500">Parent:</span>
          <span className="text-white font-medium">
            {deal.sponsorName || "N/A"}
          </span>
        </div>

        {/* Address */}
        <div className="flex justify-between">
          <span className="text-gray-500">Address:</span>
          <span className="text-white">{deal.address || "N/A"}</span>
        </div>

        {/* Census Tract */}
        <div className="flex justify-between">
          <span className="text-gray-500">Census Tract:</span>
          <span className="text-white font-mono">
            {deal.censusTract || "N/A"}
          </span>
        </div>

        {/* Poverty Rate */}
        <div className="flex justify-between">
          <span className="text-gray-500">Poverty Rate:</span>
          <span className="text-white">{formatPercent(deal.povertyRate)}</span>
        </div>

        {/* Median Income */}
        <div className="flex justify-between">
          <span className="text-gray-500">Median Income:</span>
          <span className="text-white">{formatIncome(deal.medianIncome)}</span>
        </div>

        {/* Unemployment */}
        <div className="flex justify-between">
          <span className="text-gray-500">Unemployment:</span>
          <span className="text-white">{formatPercent(deal.unemployment)}</span>
        </div>

        {/* Spacer */}
        <div className="h-2" />

        {/* Project Cost - Cyan */}
        <div className="flex justify-between">
          <span className="text-gray-500">Project Cost:</span>
          <span className="text-cyan-400 font-semibold">
            {formatCurrency(deal.projectCost)}
          </span>
        </div>

        {/* Fed NMTC Request */}
        {isNMTC && (
          <div className="flex justify-between">
            <span className="text-gray-500">Fed NMTC Req:</span>
            <span className="text-white font-semibold">
              {formatCurrency(deal.allocation)}
            </span>
          </div>
        )}

        {/* State NMTC Request */}
        {isNMTC && (
          <div className="flex justify-between">
            <span className="text-gray-500">State NMTC Req:</span>
            <span className="text-white">
              {formatCurrency(deal.stateNMTCAllocation || 0)}
            </span>
          </div>
        )}

        {/* HTC */}
        {(isHTC || deal.htcAmount) && (
          <div className="flex justify-between">
            <span className="text-gray-500">HTC:</span>
            <span className="text-white">
              {formatCurrency(deal.htcAmount || deal.allocation)}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="h-2" />

        {/* Shovel Ready - Green Yes ✓ or Orange No */}
        <div className="flex justify-between">
          <span className="text-gray-500">Shovel Ready:</span>
          {deal.shovelReady ? (
            <span className="text-green-400 font-semibold">Yes ✓</span>
          ) : (
            <span className="text-orange-400 font-semibold">No</span>
          )}
        </div>

        {/* Completion */}
        <div className="flex justify-between">
          <span className="text-gray-500">Completion:</span>
          <span className="text-white">{formatDate(deal.completionDate)}</span>
        </div>

        {/* Financing Gap - Orange */}
        <div className="flex justify-between">
          <span className="text-gray-500">Financing Gap:</span>
          <span className="text-orange-400 font-semibold">
            {formatCurrency(deal.financingGap)}
          </span>
        </div>

        {/* Sources (if available) */}
        {deal.sources && deal.sources.length > 0 && (
          <>
            <div className="h-2" />
            <div className="text-gray-500 text-xs uppercase tracking-wide underline">
              Sources:
            </div>
            <div className="text-white text-xs leading-relaxed">
              {deal.sources.map((s) => s.name).join(", ")}
            </div>
            <div className="text-gray-400 text-xs italic">
              Total:{" "}
              {formatCurrency(
                deal.totalSources ||
                  deal.sources.reduce((sum, s) => sum + s.amount, 0),
              )}
            </div>
          </>
        )}

        {/* Uses (if available) */}
        {deal.uses && deal.uses.length > 0 && (
          <>
            <div className="h-1" />
            <div className="text-gray-500 text-xs uppercase tracking-wide underline">
              Uses:
            </div>
            <div className="text-white text-xs leading-relaxed">
              {deal.uses.map((u) => u.name).join(", ")}
            </div>
            <div className="text-gray-400 text-xs italic">
              Total:{" "}
              {formatCurrency(
                deal.totalUses ||
                  deal.uses.reduce((sum, u) => sum + u.amount, 0),
              )}
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="h-2" />

        {/* Deal ID - tCredex format */}
        <div className="flex justify-between">
          <span className="text-gray-500">Project #:</span>
          <span className="text-white font-mono text-xs">
            {generateProjectNumber(deal.id, deal.submittedDate)}
          </span>
        </div>
      </div>

      {/* Contact Footer (matches template sidebar-footer) */}
      <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700 text-xs">
        <div className="flex items-center justify-between">
          <div className="text-gray-400">
            <div className="font-medium text-gray-300">Contact:</div>
            <div>tCredex.com</div>
            <div>Info@tCredex.com</div>
          </div>
          {/* Small tCredex logo */}
          <svg
            className="w-10 h-10"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="100"
              height="100"
              rx="20"
              fill="url(#tcredex_gradient_footer)"
            />
            <path d="M35 25H65V75H50V40H35V25Z" fill="white" />
            <path d="M25 65L45 45H35V65H25Z" fill="white" />
            <defs>
              <linearGradient
                id="tcredex_gradient_footer"
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0000FF" />
                <stop offset="1" stopColor="#8000FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Action Button - Purple Gradient */}
      <div className="p-4 pt-2">
        {memoRequested ? (
          <button
            disabled
            className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg text-sm"
          >
            ✓ Interest Expressed
          </button>
        ) : onRequestMemo ? (
          <button
            onClick={() => onRequestMemo(deal.id)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-lg text-sm transition-all"
          >
            Express Interest
          </button>
        ) : (
          <Link
            href={`/deals/${deal.id}`}
            className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-lg text-sm text-center transition-all"
          >
            View Deal Details
          </Link>
        )}
      </div>
    </div>
  );
}
