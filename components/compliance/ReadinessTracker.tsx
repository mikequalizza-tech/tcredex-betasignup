"use client";

import { useState } from "react";

interface ReadinessTrackerProps {
  dealId: string;
  initialData?: Record<string, boolean>;
  onUpdate?: (step: string, completed: boolean) => void;
}

const steps = [
  { key: "site_control", label: "Site Control" },
  { key: "phase1_esa", label: "Phase 1 ESA" },
  { key: "support_letter", label: "Community Support Letter" },
  { key: "financing_secured", label: "Financing Secured" },
  { key: "permits_approved", label: "Permits Approved" },
  { key: "title_clear", label: "Title Clear" },
];

export default function ReadinessTracker({
  dealId: _dealId,
  initialData = {},
  onUpdate,
}: ReadinessTrackerProps) {
  const [data, setData] = useState<Record<string, boolean>>(initialData);

  const handleToggle = async (step: string) => {
    const newValue = !data[step];
    setData((prev) => ({ ...prev, [step]: newValue }));
    onUpdate?.(step, newValue);
  };

  const completedCount = Object.values(data).filter(Boolean).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">
          Readiness Checklist
        </h3>
        <span className="text-sm text-gray-400">
          {completedCount}/{steps.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            progress === 100 ? "bg-green-500" : "bg-indigo-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data[key] || false}
              onChange={() => handleToggle(key)}
              className="w-4 h-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500"
            />
            <span
              className={`text-sm ${data[key] ? "text-gray-300" : "text-gray-500"}`}
            >
              {label}
            </span>
            {data[key] && <span className="text-green-400 text-sm">✓</span>}
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div className="p-3 bg-green-900/30 border border-green-600 rounded-lg">
          <p className="text-green-400 text-sm font-medium">
            ✓ Project is shovel-ready!
          </p>
        </div>
      )}
    </div>
  );
}
