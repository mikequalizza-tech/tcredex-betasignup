"use client";

import { useState } from "react";
import { getDetailedEligibility, PROHIBITED_BUSINESSES } from "@/lib/automatch";
import type { QALICBInput, EligibilityResult } from "@/lib/automatch";

interface EligibilityPanelProps {
  initialData?: Partial<QALICBInput>;
  onResult?: (result: EligibilityResult) => void;
}

export default function EligibilityPanel({
  initialData,
  onResult,
}: EligibilityPanelProps) {
  const [inputs, setInputs] = useState<QALICBInput>({
    gross_income_test: initialData?.gross_income_test ?? false,
    tangible_property_test: initialData?.tangible_property_test ?? false,
    services_test: initialData?.services_test ?? false,
    collectibles_test: initialData?.collectibles_test ?? true,
    financial_property_test: initialData?.financial_property_test ?? true,
    prohibited_business: initialData?.prohibited_business ?? false,
    active_business: initialData?.active_business ?? true,
  });

  const result = getDetailedEligibility(inputs);

  const handleChange = (key: keyof QALICBInput, value: boolean) => {
    const newInputs = { ...inputs, [key]: value };
    setInputs(newInputs);
    onResult?.(getDetailedEligibility(newInputs));
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={`p-4 rounded-xl border ${
          result.eligible
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${result.eligible ? "bg-emerald-500" : "bg-red-500"}`}
          />
          <span
            className={`font-bold text-lg ${result.eligible ? "text-emerald-400" : "text-red-400"}`}
          >
            {result.eligible ? "QALICB ELIGIBLE" : "NOT ELIGIBLE"}
          </span>
        </div>
      </div>

      {/* Tests */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-300">Eligibility Tests</h3>

        {[
          {
            key: "gross_income_test",
            label: "Gross Income Test (50%+ in LIC)",
          },
          {
            key: "tangible_property_test",
            label: "Tangible Property Test (40%+ in LIC)",
          },
          { key: "services_test", label: "Services Test (40%+ in LIC)" },
          { key: "collectibles_test", label: "No Collectibles" },
          {
            key: "financial_property_test",
            label: "No Nonqualified Financial Property",
          },
          { key: "active_business", label: "Active Trade or Business" },
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={inputs[key as keyof QALICBInput] as boolean}
              onChange={(e) =>
                handleChange(key as keyof QALICBInput, e.target.checked)
              }
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-indigo-500"
            />
            <span className="text-sm text-gray-300">{label}</span>
          </label>
        ))}

        <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <input
            type="checkbox"
            checked={inputs.prohibited_business}
            onChange={(e) =>
              handleChange("prohibited_business", e.target.checked)
            }
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-red-500"
          />
          <span className="text-sm text-red-400">Prohibited Business Type</span>
        </label>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-amber-400">Recommendations</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prohibited Businesses Reference */}
      <details className="text-xs">
        <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
          View Prohibited Business Types
        </summary>
        <ul className="mt-2 text-gray-500 space-y-1 pl-4">
          {PROHIBITED_BUSINESSES.map((biz, i) => (
            <li key={i}>• {biz}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
