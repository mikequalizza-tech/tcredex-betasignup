"use client";

import { IntakeData } from "../IntakeShell";

interface SiteControlProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const SITE_CONTROL_OPTIONS = [
  {
    value: "Owned",
    label: "Owned",
    description: "Sponsor owns the property",
    points: 20,
  },
  {
    value: "Under Contract",
    label: "Under Contract",
    description: "Purchase agreement in place",
    points: 10,
  },
  {
    value: "LOI",
    label: "Letter of Intent",
    description: "LOI signed, not yet under contract",
    points: 5,
  },
  {
    value: "None",
    label: "No Site Control",
    description: "Site not yet identified or controlled",
    points: 0,
  },
];

export function SiteControl({ data, onChange }: SiteControlProps) {
  const selectedOption = SITE_CONTROL_OPTIONS.find(
    (o) => o.value === data.siteControl,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Site control is a key readiness indicator. Stronger site control =
        higher readiness score.
      </p>

      {/* Site Control Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SITE_CONTROL_OPTIONS.map((option) => {
          const isSelected = data.siteControl === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange({
                  siteControl: option.value as IntakeData["siteControl"],
                })
              }
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? "border-green-500 bg-green-900/20"
                  : "border-gray-700 hover:border-gray-600 bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-medium ${isSelected ? "text-green-400" : "text-gray-200"}`}
                >
                  {option.label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-green-800 text-green-300"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  +{option.points} pts
                </span>
              </div>
              <p className="text-xs text-gray-500">{option.description}</p>
            </button>
          );
        })}
      </div>

      {/* Additional Details */}
      {data.siteControl && data.siteControl !== "None" && (
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Site Control Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {data.siteControl === "Owned"
                  ? "Date Acquired"
                  : data.siteControl === "Under Contract"
                    ? "Contract Date"
                    : "LOI Date"}
              </label>
              <input
                type="date"
                value={data.siteControlDate || ""}
                onChange={(e) => onChange({ siteControlDate: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {data.siteControl === "Under Contract" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contract Expiration
                </label>
                <input
                  type="date"
                  value={data.contractExpiration || ""}
                  onChange={(e) =>
                    onChange({ contractExpiration: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoning & Entitlements */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Zoning & Entitlements
        </h3>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={data.zoningApproved || false}
              onChange={(e) => onChange({ zoningApproved: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-800"
            />
            <div>
              <span className="font-medium text-gray-200">Zoning Approved</span>
              <p className="text-xs text-gray-500">
                Property is properly zoned for intended use
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={data.entitlementsApproved || false}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({
                    entitlementsApproved: true,
                    entitlementsSubmitted: true,
                    entitlementsStarted: true,
                  });
                } else {
                  onChange({ entitlementsApproved: false });
                }
              }}
              className="mt-0.5 w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-800"
            />
            <div>
              <span className="font-medium text-gray-200">
                Entitlements Approved
              </span>
              <p className="text-xs text-gray-500">
                All necessary permits and approvals in place (+20 pts)
              </p>
            </div>
          </label>

          {!data.entitlementsApproved && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={data.entitlementsSubmitted || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange({
                      entitlementsSubmitted: true,
                      entitlementsStarted: true,
                    });
                  } else {
                    onChange({ entitlementsSubmitted: false });
                  }
                }}
                className="mt-0.5 w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-800"
              />
              <div>
                <span className="font-medium text-gray-200">
                  Entitlements Submitted
                </span>
                <p className="text-xs text-gray-500">
                  Applications filed, pending approval (+10 pts)
                </p>
              </div>
            </label>
          )}

          {!data.entitlementsApproved && !data.entitlementsSubmitted && (
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={data.entitlementsStarted || false}
                onChange={(e) =>
                  onChange({ entitlementsStarted: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-800"
              />
              <div>
                <span className="font-medium text-gray-200">
                  Entitlement Process Started
                </span>
                <p className="text-xs text-gray-500">
                  Pre-application meetings or initial filings (+5 pts)
                </p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Score Summary */}
      {selectedOption && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-green-400">
                Site Control Score
              </span>
              <p className="text-xs text-green-500">{selectedOption.label}</p>
            </div>
            <span className="text-2xl font-bold text-green-400">
              {selectedOption.points}/20
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SiteControl;
