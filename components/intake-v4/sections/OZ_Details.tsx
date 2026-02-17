"use client";

import { IntakeData } from "../IntakeShell";

interface OZ_DetailsProps {
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

export function OZ_Details({ data, onChange }: OZ_DetailsProps) {
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

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-700">
          <strong>Opportunity Zone (OZ)</strong> investments provide capital
          gains deferral and potential exclusion for investments held 10+ years
          in designated census tracts.
        </p>
      </div>

      {/* Investment Timeline */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Investment Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.ozInvestmentDate || ""}
              onChange={(e) => updateField("ozInvestmentDate", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Date capital gains were/will be invested into QOF
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Gain Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="text"
                value={formatCurrency(data.ozGainAmount)}
                onChange={(e) =>
                  updateField("ozGainAmount", parseCurrency(e.target.value))
                }
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Amount of capital gain being deferred
            </p>
          </div>
        </div>
      </div>

      {/* Substantial Improvement */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Substantial Improvement Test
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          For existing properties, improvements must exceed original basis
          within 30 months
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="ozPropertyType"
              checked={data.ozPropertyType === "new"}
              onChange={() => {
                updateField("ozPropertyType", "new");
                updateField("substantialImprovement", true);
              }}
              className="mt-0.5 w-4 h-4 border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="font-medium text-gray-900">
                New Construction
              </span>
              <p className="text-xs text-gray-500">
                Ground-up development on vacant land (substantial improvement
                N/A)
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="ozPropertyType"
              checked={data.ozPropertyType === "existing"}
              onChange={() => updateField("ozPropertyType", "existing")}
              className="mt-0.5 w-4 h-4 border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="font-medium text-gray-900">
                Existing Property
              </span>
              <p className="text-xs text-gray-500">
                Rehabilitation of existing building (must meet substantial
                improvement)
              </p>
            </div>
          </label>
        </div>

        {data.ozPropertyType === "existing" && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={data.substantialImprovement || false}
                onChange={(e) =>
                  updateField("substantialImprovement", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Meets Substantial Improvement Test
                </span>
                <p className="text-xs text-gray-500">
                  Improvements will exceed original basis within 30 months
                </p>
              </div>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Original Basis
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(data.ozOriginalBasis)}
                    onChange={(e) =>
                      updateField(
                        "ozOriginalBasis",
                        parseCurrency(e.target.value),
                      )
                    }
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Planned Improvements
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(data.ozImprovementAmount)}
                    onChange={(e) =>
                      updateField(
                        "ozImprovementAmount",
                        parseCurrency(e.target.value),
                      )
                    }
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {data.ozOriginalBasis && data.ozImprovementAmount && (
              <div
                className={`mt-3 p-2 rounded text-sm ${
                  data.ozImprovementAmount > data.ozOriginalBasis
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {data.ozImprovementAmount > data.ozOriginalBasis
                  ? "✓ Improvements exceed original basis"
                  : "✗ Improvements must exceed original basis"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Holding Period */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Intended Holding Period
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Longer holding periods provide greater tax benefits
        </p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { years: 5, benefit: "10% basis step-up", color: "gray" },
            { years: 7, benefit: "15% basis step-up", color: "amber" },
            { years: 10, benefit: "Gain exclusion", color: "green" },
          ].map((option) => (
            <button
              key={option.years}
              type="button"
              onClick={() => updateField("holdingPeriod", option.years)}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                data.holdingPeriod === option.years
                  ? option.color === "green"
                    ? "border-green-500 bg-green-50"
                    : option.color === "amber"
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-400 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span
                className={`text-2xl font-bold ${
                  data.holdingPeriod === option.years
                    ? option.color === "green"
                      ? "text-green-700"
                      : option.color === "amber"
                        ? "text-amber-700"
                        : "text-gray-700"
                    : "text-gray-700"
                }`}
              >
                {option.years}+
              </span>
              <p className="text-xs text-gray-500">years</p>
              <p
                className={`text-xs mt-1 ${
                  data.holdingPeriod === option.years
                    ? option.color === "green"
                      ? "text-green-600"
                      : option.color === "amber"
                        ? "text-amber-600"
                        : "text-gray-600"
                    : "text-gray-400"
                }`}
              >
                {option.benefit}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Benefits Summary */}
      {data.holdingPeriod && data.ozGainAmount && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="text-sm font-medium text-amber-700 mb-3">
            Estimated Tax Benefits
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-amber-600">Original Gain Deferred</span>
              <span className="font-medium text-amber-700">
                ${formatCurrency(data.ozGainAmount)}
              </span>
            </div>

            {data.holdingPeriod >= 5 && (
              <div className="flex justify-between">
                <span className="text-amber-600">5-Year Step-Up (10%)</span>
                <span className="font-medium text-green-700">
                  -${formatCurrency(Math.round(data.ozGainAmount * 0.1))}
                </span>
              </div>
            )}

            {data.holdingPeriod >= 7 && (
              <div className="flex justify-between">
                <span className="text-amber-600">7-Year Step-Up (+5%)</span>
                <span className="font-medium text-green-700">
                  -${formatCurrency(Math.round(data.ozGainAmount * 0.05))}
                </span>
              </div>
            )}

            {data.holdingPeriod >= 10 && (
              <div className="flex justify-between border-t border-amber-200 pt-2 mt-2">
                <span className="text-amber-700 font-medium">
                  10-Year Gain Exclusion
                </span>
                <span className="font-bold text-green-700">
                  100% of NEW gains
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OZ_Details;
