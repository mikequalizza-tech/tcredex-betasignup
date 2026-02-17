"use client";

import Link from "next/link";
import { CDEDealCard } from "@/lib/types/cde";

interface CDECardProps {
  cde: CDEDealCard;
  onRequestMatch?: (cdeId: string) => void;
  matchRequested?: boolean;
  compact?: boolean;
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || amount === 0) return "N/A";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const _formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null) return "N/A";
  return `${value}%`;
};

const _formatDate = (date: string | undefined | null) => {
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

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600 text-white",
  "fully-deployed": "bg-gray-600 text-white",
  "pending-allocation": "bg-amber-500 text-black",
};

export default function CDECard({
  cde,
  onRequestMatch,
  matchRequested,
  compact = false,
}: CDECardProps) {
  const hasMatchScore = cde.matchScore !== undefined;

  return (
    <div className="w-full max-w-sm bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              CDE
            </p>
            <h2 className="font-bold text-white text-base leading-tight truncate">
              {cde.organizationName}
            </h2>
            {cde.controllingEntity && (
              <p className="text-[10px] text-gray-400 truncate">
                Parent: {cde.controllingEntity}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">tC</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[cde.status] || "bg-gray-600 text-white"}`}
            >
              {cde.status === "active"
                ? "Active"
                : cde.status === "fully-deployed"
                  ? "Deployed"
                  : "Pending"}
            </span>
          </div>
        </div>

        {/* Match Score */}
        {hasMatchScore && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cde.matchScore! >= 80 ? "bg-green-500" : cde.matchScore! >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${cde.matchScore}%` }}
              />
            </div>
            <span
              className={`text-sm font-bold ${cde.matchScore! >= 80 ? "text-green-400" : cde.matchScore! >= 60 ? "text-amber-400" : "text-red-400"}`}
            >
              {cde.matchScore}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 text-xs">
        {/* Contact */}
        {cde.contactName && (
          <div className="flex justify-between">
            <span className="text-gray-400 truncate">
              Contact: <span className="text-gray-300">{cde.contactName}</span>
            </span>
          </div>
        )}

        {/* Allocation — Per-Round Breakdown */}
        <div className="bg-gray-800/50 rounded px-2 py-1.5">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Allocation
            </p>
            <span className="text-emerald-400 font-semibold text-xs">
              {formatCurrency(cde.remainingAllocation)} avail
            </span>
          </div>
          {cde.yearAllocations && cde.yearAllocations.length > 0 ? (
            <div className="space-y-1.5">
              {cde.yearAllocations
                .slice()
                .sort((a, b) => b.year - a.year)
                .map((ya) => (
                  <div
                    key={ya.year}
                    className="bg-gray-900/60 rounded px-1.5 py-1"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[10px] font-semibold text-indigo-300">
                        Round {ya.year}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {ya.allocationType || "Federal"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div>
                        <p className="text-gray-500">Awarded</p>
                        <p className="text-gray-300">
                          {formatCurrency(ya.totalAllocation)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Deployed</p>
                        <p className="text-gray-300">
                          {formatCurrency(ya.amountFinalized)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Remaining</p>
                        <p className="text-emerald-400 font-semibold">
                          {formatCurrency(ya.amountRemaining)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              {/* Totals row when multiple rounds */}
              {cde.yearAllocations.length > 1 && (
                <div className="border-t border-gray-700 pt-1 grid grid-cols-3 gap-1 text-[10px]">
                  <div>
                    <p className="text-gray-500">
                      {cde.yearAllocations.length} Rounds
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Awarded</p>
                    <p className="text-gray-300">
                      {formatCurrency(cde.totalAllocation)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Remaining</p>
                    <p className="text-emerald-400 font-semibold">
                      {formatCurrency(cde.remainingAllocation)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="text-gray-300">
                  {formatCurrency(cde.totalAllocation)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining:</span>
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(cde.remainingAllocation)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Deal Size */}
        <div className="flex justify-between">
          <span className="text-gray-500">Deal Size:</span>
          <span className="text-gray-300">
            {formatCurrency(cde.dealSizeRange?.min)} -{" "}
            {formatCurrency(cde.dealSizeRange?.max)}
          </span>
        </div>

        {/* Service Area */}
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
            Service Area
          </p>
          {cde.serviceArea && (
            <p className="text-gray-300 text-[11px] mb-1">{cde.serviceArea}</p>
          )}
          {cde.serviceAreaType && (
            <span className="px-1.5 py-0.5 bg-indigo-900/50 rounded text-[10px] text-indigo-300 mr-1">
              {cde.serviceAreaType}
            </span>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {cde.primaryStates?.slice(0, 6).map((state) => (
              <span
                key={state}
                className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300"
              >
                {state}
              </span>
            ))}
            {cde.primaryStates && cde.primaryStates.length > 6 && (
              <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                +{cde.primaryStates.length - 6}
              </span>
            )}
          </div>
        </div>

        {/* Focus & Preferences */}
        <div className="bg-gray-800/50 rounded px-2 py-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
            Focus & Preferences
          </p>
          <div className="flex flex-wrap gap-1">
            {cde.urbanFocus && (
              <span className="px-1.5 py-0.5 bg-blue-900/50 rounded text-[10px] text-blue-300">
                Urban
              </span>
            )}
            {cde.ruralFocus && (
              <span className="px-1.5 py-0.5 bg-green-900/50 rounded text-[10px] text-green-300">
                Rural
              </span>
            )}
            {cde.minorityFocus && (
              <span className="px-1.5 py-0.5 bg-purple-900/50 rounded text-[10px] text-purple-300">
                Minority
              </span>
            )}
            {cde.utsFocus && (
              <span className="px-1.5 py-0.5 bg-amber-900/50 rounded text-[10px] text-amber-300">
                Underserved
              </span>
            )}
            {cde.nativeAmericanFocus && (
              <span className="px-1.5 py-0.5 bg-orange-900/50 rounded text-[10px] text-orange-300">
                Native American
              </span>
            )}
            {cde.smallDealFund && (
              <span className="px-1.5 py-0.5 bg-cyan-900/50 rounded text-[10px] text-cyan-300">
                Small Deals
              </span>
            )}
            {cde.ownerOccupiedPreferred && (
              <span className="px-1.5 py-0.5 bg-pink-900/50 rounded text-[10px] text-pink-300">
                Owner-Occupied
              </span>
            )}
          </div>
          {Boolean(cde.nonMetroCommitment && cde.nonMetroCommitment > 0) && (
            <p className="text-[11px] text-gray-400 mt-1">
              Non-Metro: {cde.nonMetroCommitment}%
            </p>
          )}
          {/* Tribal Area Indicator */}
          {cde.tribalData?.aian && (
            <p className="text-[11px] text-orange-400 mt-1">
              Serves AIAN Areas
            </p>
          )}
        </div>

        {/* Entity Preferences */}
        <div className="flex justify-between">
          <span className="text-gray-500">Entity Pref:</span>
          <span className="text-gray-300">
            {cde.nonprofitPreferred
              ? "Non-Profit Preferred"
              : cde.forprofitAccepted
                ? "For-Profit OK"
                : "Non-Profit Only"}
          </span>
        </div>

        {/* Market Focus */}
        {(cde.predominantFinancing || cde.predominantMarket) && (
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              Market
            </p>
            {cde.predominantFinancing && (
              <p className="text-[11px] text-gray-300">
                Financing: {cde.predominantFinancing}
              </p>
            )}
            {cde.predominantMarket && (
              <p className="text-[11px] text-gray-300 line-clamp-2">
                Market: {cde.predominantMarket}
              </p>
            )}
          </div>
        )}

        {/* Target Sectors */}
        {!compact && cde.targetSectors && cde.targetSectors.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
              Target Sectors
            </p>
            <div className="flex flex-wrap gap-1">
              {cde.targetSectors.slice(0, 4).map((sector) => (
                <span
                  key={sector}
                  className="px-1.5 py-0.5 bg-indigo-900/50 rounded text-[10px] text-indigo-300"
                >
                  {sector}
                </span>
              ))}
              {cde.targetSectors.length > 4 && (
                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                  +{cde.targetSectors.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Requirements */}
        {(cde.requireSeverelyDistressed ||
          (cde.minDistressPercentile && cde.minDistressPercentile > 0)) && (
          <div className="bg-amber-900/20 border border-amber-800/30 rounded px-2 py-1.5">
            <p className="text-[10px] text-amber-400 uppercase tracking-wide mb-1">
              Requirements
            </p>
            <div className="space-y-0.5 text-[11px]">
              {cde.requireSeverelyDistressed && (
                <p className="text-amber-300">Severely Distressed Required</p>
              )}
              {Boolean(
                cde.minDistressPercentile && cde.minDistressPercentile > 0,
              ) && (
                <p className="text-amber-300">
                  Min Distress: {cde.minDistressPercentile}th percentile
                </p>
              )}
            </div>
          </div>
        )}

        {/* Innovative Activities */}
        {!compact && cde.innovativeActivities && (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
              Special Programs
            </p>
            <p className="text-[11px] text-gray-300 line-clamp-2">
              {cde.innovativeActivities}
            </p>
          </div>
        )}

        {/* Match Reasons */}
        {hasMatchScore && cde.matchReasons && cde.matchReasons.length > 0 && (
          <div className="bg-green-900/20 border border-green-800/50 rounded px-2 py-1.5">
            <p className="text-[10px] text-green-400 uppercase tracking-wide mb-0.5">
              Match Reasons
            </p>
            {cde.matchReasons.slice(0, 3).map((reason, i) => (
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
        {matchRequested ? (
          <button
            disabled
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg text-xs"
          >
            ✓ Match Requested
          </button>
        ) : cde.status === "active" && onRequestMatch ? (
          <button
            onClick={() => onRequestMatch(cde.id)}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
          >
            Submit Project
          </button>
        ) : (
          <Link
            href={`/cde/${cde.id}`}
            className="block w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-lg text-xs text-center transition-colors"
          >
            View CDE Profile
          </Link>
        )}
      </div>
    </div>
  );
}
