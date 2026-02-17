"use client";

import Link from "next/link";
import {
  InvestorCard as InvestorCardType,
  INVESTOR_TYPE_LABELS,
} from "@/lib/types/investor";
import { ProgramType } from "@/lib/data/deals";

interface InvestorCardProps {
  investor: InvestorCardType;
  onContact?: (investorId: string) => void;
  contacted?: boolean;
  compact?: boolean;
}

const PROGRAM_BADGE_COLORS: Record<ProgramType, string> = {
  NMTC: "bg-emerald-900/50 text-emerald-300",
  HTC: "bg-blue-900/50 text-blue-300",
  LIHTC: "bg-purple-900/50 text-purple-300",
  OZ: "bg-amber-900/50 text-amber-300",
};

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || amount === 0) return "N/A";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600 text-white",
  inactive: "bg-gray-600 text-white",
  pending: "bg-amber-500 text-black",
};

export default function InvestorCard({
  investor,
  onContact,
  contacted,
  compact = false,
}: InvestorCardProps) {
  const hasMatchScore = investor.matchScore !== undefined;

  return (
    <div className="w-full max-w-sm bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Investor
            </p>
            <h2 className="font-bold text-white text-base leading-tight truncate">
              {investor.organizationName}
            </h2>
            {investor.investorType && (
              <p className="text-[10px] text-gray-400">
                {INVESTOR_TYPE_LABELS[investor.investorType] ||
                  investor.investorType}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">tC</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[investor.status] || "bg-gray-600 text-white"}`}
            >
              {investor.status === "active"
                ? "Active"
                : investor.status === "pending"
                  ? "Pending"
                  : "Inactive"}
            </span>
          </div>
        </div>

        {/* Match Score */}
        {hasMatchScore && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${investor.matchScore! >= 80 ? "bg-green-500" : investor.matchScore! >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${investor.matchScore}%` }}
              />
            </div>
            <span
              className={`text-sm font-bold ${investor.matchScore! >= 80 ? "text-green-400" : investor.matchScore! >= 60 ? "text-amber-400" : "text-red-400"}`}
            >
              {investor.matchScore}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 text-xs">
        {/* Contact Info */}
        {investor.primaryContactName && (
          <div className="flex justify-between">
            <span className="text-gray-500">Contact:</span>
            <span className="text-gray-300 truncate ml-2">
              {investor.primaryContactName}
            </span>
          </div>
        )}

        {/* Investment Range */}
        <div className="bg-gray-800/50 rounded px-2 py-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
            Investment Capacity
          </p>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">Range:</span>
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(investor.minInvestment)} -{" "}
              {formatCurrency(investor.maxInvestment)}
            </span>
          </div>
          {investor.craMotivated && (
            <div className="mt-1">
              <span className="px-1.5 py-0.5 bg-green-900/50 rounded text-[10px] text-green-300 font-semibold">
                CRA Motivated
              </span>
            </div>
          )}
        </div>

        {/* Target Credit Types */}
        {investor.targetCreditTypes &&
          investor.targetCreditTypes.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                Target Programs
              </p>
              <div className="flex flex-wrap gap-1">
                {investor.targetCreditTypes.map((type) => (
                  <span
                    key={type}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PROGRAM_BADGE_COLORS[type]}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Target States */}
        {investor.targetStates && investor.targetStates.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
              Target States
            </p>
            <div className="flex flex-wrap gap-1">
              {investor.targetStates.slice(0, 8).map((state) => (
                <span
                  key={state}
                  className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300"
                >
                  {state}
                </span>
              ))}
              {investor.targetStates.length > 8 && (
                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                  +{investor.targetStates.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Target Sectors */}
        {!compact &&
          investor.targetSectors &&
          investor.targetSectors.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                Target Sectors
              </p>
              <div className="flex flex-wrap gap-1">
                {investor.targetSectors.slice(0, 4).map((sector) => (
                  <span
                    key={sector}
                    className="px-1.5 py-0.5 bg-indigo-900/50 rounded text-[10px] text-indigo-300"
                  >
                    {sector}
                  </span>
                ))}
                {investor.targetSectors.length > 4 && (
                  <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                    +{investor.targetSectors.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Track Record */}
        {(Boolean(investor.totalInvestments && investor.totalInvestments > 0) ||
          Boolean(investor.totalInvested && investor.totalInvested > 0)) && (
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              Track Record
            </p>
            <div className="space-y-0.5 text-[11px]">
              {Boolean(
                investor.totalInvestments && investor.totalInvestments > 0,
              ) && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Investments:</span>
                  <span className="text-gray-300">
                    {investor.totalInvestments}
                  </span>
                </div>
              )}
              {Boolean(
                investor.totalInvested && investor.totalInvested > 0,
              ) && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Deployed:</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCurrency(investor.totalInvested)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accredited Badge */}
        {investor.accredited && (
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-blue-900/50 rounded text-[10px] text-blue-300">
              Accredited Investor
            </span>
          </div>
        )}

        {/* Match Reasons */}
        {hasMatchScore &&
          investor.matchReasons &&
          investor.matchReasons.length > 0 && (
            <div className="bg-green-900/20 border border-green-800/50 rounded px-2 py-1.5">
              <p className="text-[10px] text-green-400 uppercase tracking-wide mb-0.5">
                Match Reasons
              </p>
              {investor.matchReasons.slice(0, 3).map((reason, i) => (
                <p key={i} className="text-[11px] text-green-300">
                  ✓ {reason}
                </p>
              ))}
            </div>
          )}
      </div>

      {/* Contact Footer */}
      <div className="px-3 py-2 border-t border-gray-800 text-center">
        <p className="text-[10px] text-gray-500">Contact</p>
        <p className="text-xs text-indigo-400">tCredex.com</p>
        <p className="text-xs text-gray-400">Info@tCredex.com</p>
      </div>

      {/* Action Button */}
      <div className="p-3 pt-1">
        {contacted ? (
          <button
            disabled
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg text-xs"
          >
            ✓ Contacted
          </button>
        ) : investor.status === "active" && onContact ? (
          <button
            onClick={() => onContact(investor.id)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
          >
            Contact Investor
          </button>
        ) : (
          <Link
            href={`/investors/${investor.id}`}
            className="block w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg text-xs text-center transition-colors"
          >
            View Investor Profile
          </Link>
        )}
      </div>
    </div>
  );
}
