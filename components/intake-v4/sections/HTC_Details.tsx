"use client";

import { IntakeData } from "../IntakeShell";

interface HTC_DetailsProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

export function HTC_Details({ data, onChange }: HTC_DetailsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "";
    return value.toLocaleString();
  };

  const parseCurrency = (value: string) => {
    const num = parseInt(value.replace(/,/g, ""));
    return isNaN(num) ? undefined : num;
  };

  // HTC Type multi-select handler
  const htcTypes = data.htcTypes || [];

  const toggleHTCType = (type: "federal" | "state") => {
    const current = htcTypes;
    if (current.includes(type)) {
      updateField(
        "htcTypes",
        current.filter((t: string) => t !== type),
      );
    } else {
      updateField("htcTypes", [...current, type]);
    }
  };

  const hasFederalHTC = htcTypes.includes("federal");
  const hasStateHTC = htcTypes.includes("state");

  // Calculate credit estimates
  const federalCredit =
    data.qreAmount && hasFederalHTC ? data.qreAmount * 0.2 : 0;
  const stateCredit =
    data.qreAmount && hasStateHTC && data.stateHTCRate
      ? Math.round(data.qreAmount * (data.stateHTCRate / 100))
      : 0;
  const totalCredit = federalCredit + stateCredit;

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Historic Tax Credit (HTC)</strong> provides tax credits for
          qualified rehabilitation expenditures (QREs) on certified historic
          structures. Federal and State credits can be stacked.
        </p>
      </div>

      {/* HTC Type Selection - Multi-Select */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          HTC Type <span className="text-red-500">*</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Select all that apply — Federal and State can be combined
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Federal HTC */}
          <button
            type="button"
            onClick={() => toggleHTCType("federal")}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              hasFederalHTC
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  hasFederalHTC
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}
              >
                {hasFederalHTC && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <span
                  className={`font-semibold ${hasFederalHTC ? "text-blue-700" : "text-gray-900"}`}
                >
                  Federal HTC
                </span>
                <p className="text-xs text-gray-500">20% of QRE</p>
              </div>
            </div>
          </button>

          {/* State HTC */}
          <button
            type="button"
            onClick={() => toggleHTCType("state")}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              hasStateHTC
                ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  hasStateHTC
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {hasStateHTC && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div>
                <span
                  className={`font-semibold ${hasStateHTC ? "text-green-700" : "text-gray-900"}`}
                >
                  State HTC
                </span>
                <p className="text-xs text-gray-500">
                  Varies by state (10-25%+)
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Selection indicator */}
        {htcTypes.length > 0 && (
          <div className="mt-3 flex gap-2">
            {hasFederalHTC && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                ✓ Federal 20%
              </span>
            )}
            {hasStateHTC && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                ✓ State HTC
              </span>
            )}
            {hasFederalHTC && hasStateHTC && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                🔥 Stacked Credits
              </span>
            )}
          </div>
        )}
      </div>

      {htcTypes.length > 0 && (
        <>
          {/* Historic Status */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Historic Status <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Building must be listed or contributing to a historic district
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "listed",
                  label: "Individually Listed",
                  desc: "On National Register of Historic Places",
                },
                {
                  value: "contributing",
                  label: "Contributing Structure",
                  desc: "In a registered historic district",
                },
                {
                  value: "pending",
                  label: "Pending Nomination",
                  desc: "National Register nomination in progress",
                },
                {
                  value: "none",
                  label: "Not Historic",
                  desc: "Does not qualify for HTC",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("historicStatus", option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    data.historicStatus === option.value
                      ? option.value === "none"
                        ? "border-red-500 bg-red-50"
                        : "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`font-medium text-sm ${
                      data.historicStatus === option.value
                        ? option.value === "none"
                          ? "text-red-700"
                          : "text-blue-700"
                        : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </span>
                  <p className="text-xs text-gray-500">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {data.historicStatus && data.historicStatus !== "none" && (
            <>
              {/* Part 1 / Part 2 Status - Only show for Federal */}
              {hasFederalHTC && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    NPS Application Status (Federal)
                  </h3>

                  <div className="space-y-4">
                    {/* Part 1 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Part 1 - Evaluation of Significance
                      </label>
                      <div className="flex gap-2">
                        {[
                          {
                            value: "approved",
                            label: "Approved",
                            color: "green",
                          },
                          {
                            value: "submitted",
                            label: "Submitted",
                            color: "amber",
                          },
                          {
                            value: "not_started",
                            label: "Not Started",
                            color: "gray",
                          },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateField("part1Status", option.value)
                            }
                            className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              data.part1Status === option.value
                                ? option.color === "green"
                                  ? "border-green-500 bg-green-50 text-green-700"
                                  : option.color === "amber"
                                    ? "border-amber-500 bg-amber-50 text-amber-700"
                                    : "border-gray-400 bg-gray-50 text-gray-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Confirms the building is a certified historic structure
                      </p>
                    </div>

                    {/* Part 2 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Part 2 - Description of Rehabilitation
                      </label>
                      <div className="flex gap-2">
                        {[
                          {
                            value: "approved",
                            label: "Approved",
                            color: "green",
                          },
                          {
                            value: "submitted",
                            label: "Submitted",
                            color: "amber",
                          },
                          {
                            value: "not_started",
                            label: "Not Started",
                            color: "gray",
                          },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateField("part2Status", option.value)
                            }
                            className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                              data.part2Status === option.value
                                ? option.color === "green"
                                  ? "border-green-500 bg-green-50 text-green-700"
                                  : option.color === "amber"
                                    ? "border-amber-500 bg-amber-50 text-amber-700"
                                    : "border-gray-400 bg-gray-50 text-gray-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Describes the proposed rehabilitation work
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* State HTC Details */}
              {hasStateHTC && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    State HTC Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={data.stateHTCState || ""}
                        onChange={(e) =>
                          updateField("stateHTCState", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select state...</option>
                        <option value="Virginia">Virginia (25%)</option>
                        <option value="Maryland">Maryland (20%)</option>
                        <option value="Missouri">Missouri (25%)</option>
                        <option value="Ohio">Ohio (25%)</option>
                        <option value="Georgia">Georgia (25%)</option>
                        <option value="Louisiana">Louisiana (25%)</option>
                        <option value="North Carolina">
                          North Carolina (15%)
                        </option>
                        <option value="Texas">Texas (25%)</option>
                        <option value="Wisconsin">Wisconsin (20%)</option>
                        <option value="Other">Other State</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State Credit Rate{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={data.stateHTCRate || ""}
                          onChange={(e) =>
                            updateField(
                              "stateHTCRate",
                              parseFloat(e.target.value) || undefined,
                            )
                          }
                          placeholder="25"
                          className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QRE Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Qualified Rehabilitation Expenditures (QRE)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated QRE Amount{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        value={formatCurrency(data.qreAmount)}
                        onChange={(e) =>
                          updateField(
                            "qreAmount",
                            parseCurrency(e.target.value),
                          )
                        }
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Hard costs for rehabilitation work
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Estimated Credits
                    </label>
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                      <span className="text-lg font-bold text-gray-900">
                        ${formatCurrency(totalCredit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Credit Summary */}
      {htcTypes.length > 0 &&
        data.historicStatus &&
        data.historicStatus !== "none" &&
        data.qreAmount && (
          <div
            className={`p-4 rounded-lg border ${
              hasFederalHTC && hasStateHTC
                ? "bg-gradient-to-r from-blue-50 to-green-50 border-purple-200"
                : hasFederalHTC
                  ? "bg-blue-50 border-blue-200"
                  : "bg-green-50 border-green-200"
            }`}
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              {hasFederalHTC && hasStateHTC && <span>🔥</span>}
              Credit Summary
              {hasFederalHTC && hasStateHTC && (
                <span className="text-xs font-normal text-purple-600">
                  (Stacked)
                </span>
              )}
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {hasFederalHTC && (
                <div>
                  <span className="text-blue-600">Federal HTC (20%)</span>
                  <p className="font-bold text-blue-700 text-lg">
                    ${formatCurrency(federalCredit)}
                  </p>
                </div>
              )}
              {hasStateHTC && (
                <div>
                  <span className="text-green-600">
                    State HTC ({data.stateHTCRate || "?"}%)
                  </span>
                  <p className="font-bold text-green-700 text-lg">
                    ${formatCurrency(stateCredit)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-600 font-semibold">
                  Total Credits
                </span>
                <p className="font-bold text-gray-900 text-xl">
                  ${formatCurrency(totalCredit)}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default HTC_Details;
