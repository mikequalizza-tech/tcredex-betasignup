"use client";

import { IntakeData } from "@/types/intake";
import Link from "next/link";

// Sponsor organization data from API
interface SponsorOrgData {
  organization_name?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  year_founded?: number;
  description?: string;
  organization_type?: string;
  low_income_owned?: boolean | string;
  woman_owned?: boolean | string;
  minority_owned?: boolean | string;
  veteran_owned?: boolean | string;
}

interface SponsorDetailsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
  organizationType?: string; // From user's org - if set, fields are read-only
  isPrePopulated?: boolean; // Whether sponsor data was pre-populated from org settings
  sponsorData?: SponsorOrgData | null; // Full sponsor organization data
}

const ORGANIZATION_TYPES = [
  "For-profit",
  "Non-profit",
  "Not-for-profit",
  "Government",
  "Tribal",
];

// Helper to check if a YesNo value is 'Yes' (case-insensitive)
const isYes = (val: string | undefined): boolean => {
  return val?.toLowerCase() === "yes";
};

// Helper to check if a boolean/string ownership field is truthy
// Handles: true, "true", "yes", "Yes", 1, "1"
const isOwnershipTrue = (val: boolean | string | undefined | null): boolean => {
  if (val === true) return true;
  if (typeof val === "string") {
    const lower = val.toLowerCase();
    return lower === "true" || lower === "yes" || lower === "1";
  }
  return false;
};

export function SponsorDetails({
  data,
  onChange,
  organizationType: _organizationType,
  isPrePopulated,
  sponsorData,
}: SponsorDetailsProps) {
  // If sponsor data is loaded, show it as read-only
  const hasOrgData = !!sponsorData;

  // If any ownership field has a value, treat as pre-populated (read-only)
  const hasPrePopulatedOwnership =
    isPrePopulated ||
    hasOrgData ||
    data.organizationType !== undefined ||
    data.lowIncomeOwned !== undefined ||
    data.womanOwned !== undefined ||
    data.minorityOwned !== undefined ||
    data.veteranOwned !== undefined;

  // Format address from sponsor data
  const formatAddress = () => {
    if (!sponsorData) return null;
    const parts = [
      sponsorData.address,
      sponsorData.city,
      sponsorData.state && sponsorData.zip_code
        ? `${sponsorData.state} ${sponsorData.zip_code}`
        : sponsorData.state || sponsorData.zip_code,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className="space-y-6">
      {/* Organization Info Card - Read-only display from org settings */}
      {hasOrgData && sponsorData && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">
                  {sponsorData.organization_name || "Organization"}
                </h3>
                {sponsorData.organization_type && (
                  <span className="text-xs text-gray-400">
                    {sponsorData.organization_type}
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/teams"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Edit
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          {/* Content Grid */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Contact */}
            {(sponsorData.primary_contact_name ||
              sponsorData.primary_contact_email ||
              sponsorData.primary_contact_phone) && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Primary Contact
                </p>
                {sponsorData.primary_contact_name && (
                  <p className="text-sm text-gray-200">
                    {sponsorData.primary_contact_name}
                  </p>
                )}
                {sponsorData.primary_contact_email && (
                  <p className="text-sm text-gray-400">
                    {sponsorData.primary_contact_email}
                  </p>
                )}
                {sponsorData.primary_contact_phone && (
                  <p className="text-sm text-gray-400">
                    {sponsorData.primary_contact_phone}
                  </p>
                )}
              </div>
            )}

            {/* Address */}
            {formatAddress() && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Address
                </p>
                <p className="text-sm text-gray-300">{formatAddress()}</p>
              </div>
            )}

            {/* Website */}
            {sponsorData.website && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Website
                </p>
                <a
                  href={
                    sponsorData.website.startsWith("http")
                      ? sponsorData.website
                      : `https://${sponsorData.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  {sponsorData.website}
                </a>
              </div>
            )}

            {/* Year Founded */}
            {sponsorData.year_founded && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Year Founded
                </p>
                <p className="text-sm text-gray-300">
                  {sponsorData.year_founded}
                </p>
              </div>
            )}
          </div>

          {/* Certifications Row */}
          {(isOwnershipTrue(sponsorData.low_income_owned) ||
            isOwnershipTrue(sponsorData.woman_owned) ||
            isOwnershipTrue(sponsorData.minority_owned) ||
            isOwnershipTrue(sponsorData.veteran_owned)) && (
            <div className="px-5 py-3 bg-gray-800/50 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Certifications
              </p>
              <div className="flex flex-wrap gap-2">
                {isOwnershipTrue(sponsorData.low_income_owned) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 rounded text-xs">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Low-Income Community
                  </span>
                )}
                {isOwnershipTrue(sponsorData.woman_owned) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/30 text-purple-300 border border-purple-500/30 rounded text-xs">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Woman-Owned
                  </span>
                )}
                {isOwnershipTrue(sponsorData.minority_owned) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-900/30 text-amber-300 border border-amber-500/30 rounded text-xs">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Minority-Owned
                  </span>
                )}
                {isOwnershipTrue(sponsorData.veteran_owned) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded text-xs">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Veteran-Owned
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback: Pre-populated notice if no full org data but fields are set */}
      {!hasOrgData && hasPrePopulatedOwnership && (
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-indigo-300 font-medium text-sm">
                Organization Info Pre-Filled
              </p>
              <p className="text-xs text-indigo-400/80 mt-1">
                These fields are populated from your organization settings.{" "}
                <Link
                  href="/dashboard/teams"
                  className="underline hover:text-indigo-300"
                >
                  Edit in Organization Settings →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organization Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Organization Type <span className="text-red-400">*</span>
        </label>
        {hasPrePopulatedOwnership && data.organizationType ? (
          <div className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 cursor-not-allowed flex items-center justify-between">
            <span className="capitalize">
              {data.organizationType?.replace("-", " ") || "Not specified"}
            </span>
            <span className="text-xs text-gray-500">From org settings</span>
          </div>
        ) : (
          <select
            value={data.organizationType || ""}
            onChange={(e) =>
              onChange({
                organizationType: e.target
                  .value as IntakeData["organizationType"],
              })
            }
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select organization type...</option>
            {ORGANIZATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Low-Income Owned/Controlled */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Is the organization owned or controlled by Low-Income Community
          residents?
          <span className="text-indigo-400 text-xs ml-2">
            CDE Priority Factor
          </span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          &gt;50% of board members or ownership from Low-Income Community
        </p>
        {hasPrePopulatedOwnership && data.lowIncomeOwned !== undefined ? (
          <div
            className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${
              isYes(data.lowIncomeOwned)
                ? "bg-green-900/30 text-green-300 border border-green-500/50"
                : "bg-gray-800/50 text-gray-400 border border-gray-600/50"
            }`}
          >
            {isYes(data.lowIncomeOwned) ? "✓ Yes" : "No"}
            <span className="text-xs text-gray-500 ml-2">
              (from org settings)
            </span>
          </div>
        ) : (
          <div className="flex gap-3">
            {["Yes", "No", "Don't Know"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange({
                    lowIncomeOwned: option as IntakeData["lowIncomeOwned"],
                  })
                }
                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.lowIncomeOwned === option
                    ? option === "Yes"
                      ? "border-green-500 bg-green-900/30 text-green-300"
                      : "border-indigo-500 bg-indigo-900/30 text-indigo-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ownership Certifications */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Ownership Certifications
          {hasPrePopulatedOwnership ? (
            <span className="text-indigo-400 text-xs ml-2 font-normal">
              (from organization settings)
            </span>
          ) : (
            <span className="text-gray-500 text-xs ml-2 font-normal">
              (Optional - may improve matching)
            </span>
          )}
        </h3>

        {hasPrePopulatedOwnership ? (
          // Read-only display as badges
          <div className="flex flex-wrap gap-3">
            {isYes(data.womanOwned) && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 text-purple-300 border border-purple-500/50 rounded-lg text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Woman-Owned
              </span>
            )}
            {isYes(data.minorityOwned) && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 text-amber-300 border border-amber-500/50 rounded-lg text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Minority-Owned
              </span>
            )}
            {isYes(data.veteranOwned) && (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 text-blue-300 border border-blue-500/50 rounded-lg text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Veteran-Owned
              </span>
            )}
            {/* Show "None" if no certifications */}
            {!isYes(data.womanOwned) &&
              !isYes(data.minorityOwned) &&
              !isYes(data.veteranOwned) && (
                <span className="text-gray-500 text-sm">
                  No ownership certifications set
                </span>
              )}
          </div>
        ) : (
          // Editable checkboxes
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Woman-Owned */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.womanOwned === "Yes"}
                  onChange={(e) =>
                    onChange({ womanOwned: e.target.checked ? "Yes" : "No" })
                  }
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    Woman-Owned
                  </span>
                  <p className="text-xs text-gray-500">≥51% woman ownership</p>
                </div>
              </label>
            </div>

            {/* Minority-Owned or Controlled */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.minorityOwned === "Yes"}
                  onChange={(e) =>
                    onChange({ minorityOwned: e.target.checked ? "Yes" : "No" })
                  }
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    Minority-Owned or Controlled
                  </span>
                  <p className="text-xs text-gray-500">
                    ≥51% minority ownership or board control
                  </p>
                </div>
              </label>
            </div>

            {/* Veteran-Owned */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.veteranOwned === "Yes"}
                  onChange={(e) =>
                    onChange({ veteranOwned: e.target.checked ? "Yes" : "No" })
                  }
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    Veteran-Owned
                  </span>
                  <p className="text-xs text-gray-500">
                    ≥51% veteran ownership
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Person Completing Form */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Form Preparer
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Person Completing Form
            </label>
            <input
              type="text"
              value={data.personCompletingForm || ""}
              onChange={(e) =>
                onChange({ personCompletingForm: e.target.value })
              }
              placeholder="Name of person completing this form"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contact Name (if different)
            </label>
            <input
              type="text"
              value={data.contactName || ""}
              onChange={(e) => onChange({ contactName: e.target.value })}
              placeholder="Primary contact for questions"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* CDE Matching Note */}
      {(isYes(data.lowIncomeOwned) ||
        isYes(data.womanOwned) ||
        isYes(data.minorityOwned) ||
        isYes(data.veteranOwned)) && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-emerald-300 font-medium text-sm">
                Enhanced CDE Matching
              </p>
              <p className="text-xs text-emerald-400/80 mt-1">
                Your ownership certifications will be highlighted to CDEs with
                matching investment priorities. Many CDEs specifically target
                projects with diverse or community-based ownership.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SponsorDetails;
