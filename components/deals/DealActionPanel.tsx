"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Deal } from "@/lib/data/deals";
import { calculateReadiness } from "@/lib/intake/readinessScore";

export type ActionModalType =
  | "interest"
  | "loi"
  | "commitment"
  | "request-info"
  | "verbal-loi"
  | "loi-accepted"
  | "commitment-accepted"
  | "send-message"
  | null;

interface DealActionPanelProps {
  deal: Deal;
  dealId: string;
  isOwner: boolean;
  orgType: "sponsor" | "cde" | "investor" | string;
  isAuthenticated: boolean;
  interestSubmitted?: boolean;
  messageDeclined?: boolean; // True if sponsor declined/ignored a message from this org
  onOpenModal: (type: ActionModalType) => void;
  onViewPhotos?: () => void;
  onSelectFeaturedImage?: () => void;
  onRunAutoMatch?: () => void;
  autoMatchLoading?: boolean;
}

/**
 * DealActionPanel - Consolidated action buttons by role
 *
 * Role-based visibility:
 * - Sponsor: Edit Deal, View All Photos, Select Featured Image, Deal Card PDF, Project Profile PDF
 * - CDE: Request More Info, Send Message (1 chance), Verbal LOI, Produce LOI, LOI Accepted
 * - Investor: Request More Info, Send Message (1 chance), Verbal LOI, Produce Commitment, Commitment Accepted
 *
 * Tier-based gating:
 * - Tier 1: Deal Card only
 * - Tier 2+: Deal Card + Project Profile
 * - Tier 3: Full DD Vault access
 */
export default function DealActionPanel({
  deal,
  dealId,
  isOwner,
  orgType,
  isAuthenticated,
  interestSubmitted = false,
  messageDeclined = false,
  onOpenModal,
  onViewPhotos,
  onSelectFeaturedImage,
  onRunAutoMatch,
  autoMatchLoading = false,
}: DealActionPanelProps) {
  const isCDE = orgType === "cde";
  const isInvestor = orgType === "investor";
  const isCDEorInvestor = isCDE || isInvestor;

  // Calculate tier dynamically based on readiness score
  // Tier 1: Basic (readiness < 60%)
  // Tier 2: Standard (readiness >= 60%) - Project Profile available
  // Tier 3: Premium (readiness >= 80% AND has DD docs) - Full DD Vault
  const tier = useMemo(() => {
    try {
      const draftData = (deal.draftData as Record<string, unknown>) || {};
      const intakeData = (deal.intake_data as Record<string, unknown>) || {};
      const mergedData = { ...draftData, ...intakeData };

      if (Object.keys(mergedData).length === 0) return deal.tier || 1;

      const result = calculateReadiness(mergedData);
      const readiness = result?.percentage || 0;

      // Check for DD docs completion (simplified check)
      const ddCompletion = deal.dd_completion || 0;

      if (readiness >= 80 && ddCompletion >= 80) return 3;
      if (readiness >= 60) return 2;
      return 1;
    } catch {
      return deal.tier || 1;
    }
  }, [deal]);

  // Check if Project Profile is available (Tier 2+)
  const projectProfileAvailable = tier >= 2;

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <Link
          href={`/signin?redirect=/deals/${dealId}`}
          className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
        >
          Sign In to Connect
        </Link>
        <p className="text-xs text-gray-500 text-center">
          Sign in or register to view full details and contact the sponsor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* === SPONSOR ACTIONS === */}
      {isOwner && (
        <>
          {/* Edit Deal */}
          <Link
            href={`/intake?draftId=${dealId}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            Edit Deal
          </Link>

          {/* Run AutoMatch */}
          {onRunAutoMatch && (
            <button
              onClick={onRunAutoMatch}
              disabled={autoMatchLoading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-wait text-white font-medium rounded-lg transition-colors"
            >
              {autoMatchLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Run AutoMatch
                </>
              )}
            </button>
          )}

          {/* View Funding Sources - Path to Closing */}
          <Link
            href={`/deals/${dealId}/sources`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Funding Sources
          </Link>

          {/* Contact CDEs / Investors */}
          <button
            onClick={() => onOpenModal("interest")}
            className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-lg transition-colors"
          >
            Contact CDEs / Investors
          </button>
        </>
      )}

      {/* === CDE/INVESTOR ACTIONS === */}
      {!isOwner && isCDEorInvestor && (
        <>
          {/* Express Interest */}
          <button
            onClick={() => onOpenModal("interest")}
            disabled={interestSubmitted}
            className={`block w-full py-3 text-center font-semibold rounded-lg transition-colors ${
              interestSubmitted
                ? "bg-green-600 text-white cursor-default"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {interestSubmitted ? "✓ Interest Submitted" : "Express Interest"}
          </button>

          {/* Request More Info */}
          <button
            onClick={() => onOpenModal("request-info")}
            className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium rounded-lg transition-colors"
          >
            Request More Info
          </button>

          {/* Send Message (1 chance - anti-stalking) */}
          {!messageDeclined && (
            <button
              onClick={() => onOpenModal("send-message")}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Send Message
            </button>
          )}

          {/* Verbal LOI */}
          <button
            onClick={() => onOpenModal("verbal-loi")}
            className="flex items-center justify-center gap-2 w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Verbal LOI
          </button>

          {/* Create LOI (CDE only) */}
          {isCDE && (
            <button
              onClick={() => onOpenModal("loi")}
              className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-medium rounded-lg transition-colors"
            >
              Produce LOI
            </button>
          )}

          {/* Create Commitment (Investor only) */}
          {isInvestor && (
            <button
              onClick={() => onOpenModal("commitment")}
              className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-medium rounded-lg transition-colors"
            >
              Produce Commitment
            </button>
          )}
        </>
      )}

      {/* === COMMON ACTIONS (All Roles) === */}
      <div className="border-t border-gray-700 pt-3 mt-3">
        {/* View All Photos */}
        {onViewPhotos && (
          <button
            onClick={onViewPhotos}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors mb-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            View All Photos
          </button>
        )}

        {/* Select Featured Image (Sponsor only) */}
        {isOwner && onSelectFeaturedImage && (
          <button
            onClick={onSelectFeaturedImage}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors mb-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            Select Featured Image
          </button>
        )}

        {/* Deal Card PDF (Always available) */}
        <Link
          href={`/deals/${dealId}/card`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors mb-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Deal Card (PDF)
        </Link>

        {/* Project Profile PDF (Tier 2+ only) */}
        {projectProfileAvailable ? (
          <Link
            href={`/deals/${dealId}/profile`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
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
            Project Profile (PDF)
          </Link>
        ) : (
          <div className="relative">
            <button
              disabled
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-800/50 text-gray-500 font-medium rounded-lg cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Project Profile (PDF)
            </button>
            <div className="absolute inset-x-0 -bottom-8 text-xs text-amber-400 text-center">
              Tier 2+ required. Request more info from Sponsor.
            </div>
          </div>
        )}
      </div>

      {/* Tier indicator */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Deal Tier</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((t) => (
              <div
                key={t}
                className={`w-6 h-1.5 rounded-full ${
                  t <= tier
                    ? tier >= 3
                      ? "bg-emerald-500"
                      : tier >= 2
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    : "bg-gray-700"
                }`}
              />
            ))}
            <span className="ml-2 font-medium text-gray-400">Tier {tier}</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {tier === 1 &&
            "Deal Card ready - complete more info for Project Profile"}
          {tier === 2 && "Project Profile available - add DD docs for Tier 3"}
          {tier === 3 && "Due Diligence ready - full closing package available"}
        </p>
      </div>
    </div>
  );
}
