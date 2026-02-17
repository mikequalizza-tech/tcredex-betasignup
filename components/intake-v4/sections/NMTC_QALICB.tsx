"use client";

import { useState, useCallback } from "react";
import { IntakeData } from "@/types/intake";

interface NMTC_QALICBProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

const PROHIBITED_BUSINESSES = [
  { id: "excludedMassageParlor", label: "Massage parlor (sexual)" },
  { id: "excludedHotTub", label: "Hot tub facility" },
  { id: "excludedSuntan", label: "Suntan facility" },
  { id: "excludedCountryClub", label: "Country club" },
  { id: "excludedGambling", label: "Gambling facility" },
  { id: "excludedAlcoholSales", label: "Liquor store (>5% gross receipts)" },
  { id: "excludedGolfCourse", label: "Golf course" },
  { id: "excludedFarming", label: "Farm (raises/harvests products)" },
  { id: "excludedIntangibles", label: "Primarily holds intangibles" },
];

// TestSection - defined OUTSIDE to prevent recreation
function TestSection({
  id,
  title,
  children,
  testNum,
  isExpanded,
  onToggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  testNum?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3 bg-gray-800/50 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {testNum && (
            <span className="w-8 h-8 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs font-bold">
              {testNum}
            </span>
          )}
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}

// PercentSlider - defined OUTSIDE to prevent recreation
function PercentSlider({
  field,
  threshold,
  label,
  description,
  value,
  onChange,
}: {
  field: string;
  threshold: number;
  label: string;
  description: string;
  value: number;
  onChange: (field: string, value: number) => void;
}) {
  const passes = value >= threshold;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            passes
              ? "bg-green-900/50 text-green-300"
              : "bg-gray-700 text-gray-400"
          }`}
        >
          {passes ? "PASS" : `NEEDS ${threshold}%+`}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(field, parseInt(e.target.value))}
          className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
            passes ? "accent-green-500" : "accent-gray-500"
          }`}
          style={{
            background: `linear-gradient(to right, ${passes ? "#22c55e" : "#6b7280"} ${value}%, #374151 ${value}%)`,
          }}
        />
        <span className="w-16 text-right font-mono font-bold text-gray-100">
          {value}%
        </span>
      </div>
    </div>
  );
}

// YesNoToggle - defined OUTSIDE to prevent recreation
function YesNoToggle({
  field,
  label,
  yesIsGood = true,
  value,
  onChange,
}: {
  field: string;
  label: string;
  yesIsGood?: boolean;
  value: boolean | undefined;
  onChange: (field: string, value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(field, true)}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            value === true
              ? yesIsGood
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(field, false)}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            value === false
              ? !yesIsGood
                ? "bg-green-600 text-white"
                : "bg-yellow-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

export function NMTC_QALICB({ data, onChange }: NMTC_QALICBProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>("core");

  // Stable handler for slider changes
  const handleSliderChange = useCallback(
    (field: string, value: number) => {
      onChange({ [field]: value });
    },
    [onChange],
  );

  // Stable handler for yes/no changes
  const handleYesNoChange = useCallback(
    (field: string, value: boolean) => {
      onChange({ [field]: value });
    },
    [onChange],
  );

  // Stable handler for section toggle
  const handleSectionToggle = useCallback((id: string) => {
    setExpandedTest((prev) => (prev === id ? null : id));
  }, []);

  // Calculate test results
  const coreTestsPass = [
    (data.qalicbGrossIncome ?? 0) >= 50,
    (data.qalicbTangibleProperty ?? 0) >= 40,
    (data.qalicbEmployeeServices ?? 0) >= 40,
    data.isProhibitedBusiness === false,
  ];

  const corePassCount = coreTestsPass.filter(Boolean).length;
  const allCorePass = corePassCount === 4;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div
        className={`p-4 rounded-lg border ${
          allCorePass
            ? "bg-green-900/20 border-green-500/30"
            : "bg-amber-900/20 border-amber-500/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`text-sm font-medium ${allCorePass ? "text-green-300" : "text-amber-300"}`}
            >
              {allCorePass
                ? "✓ Core QALICB Tests Pass"
                : `${corePassCount}/4 Core Tests Pass`}
            </span>
            <p
              className={`text-xs ${allCorePass ? "text-green-400/70" : "text-amber-400/70"}`}
            >
              {allCorePass
                ? "Project appears NMTC eligible"
                : "Complete all core tests"}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-3xl font-bold ${allCorePass ? "text-green-400" : "text-amber-400"}`}
            >
              {corePassCount}/4
            </span>
          </div>
        </div>
      </div>

      {/* Core Tests */}
      <TestSection
        id="core"
        title="Core QALICB Tests (Required)"
        testNum="1-4"
        isExpanded={expandedTest === "core"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-6">
          <PercentSlider
            field="qalicbGrossIncome"
            threshold={50}
            label="Gross Income Test"
            description="≥50% of gross income from active business in LIC"
            value={(data.qalicbGrossIncome as number) ?? 0}
            onChange={handleSliderChange}
          />

          <PercentSlider
            field="qalicbTangibleProperty"
            threshold={40}
            label="Tangible Property Test"
            description="≥40% of tangible property used in LIC"
            value={(data.qalicbTangibleProperty as number) ?? 0}
            onChange={handleSliderChange}
          />

          <PercentSlider
            field="qalicbEmployeeServices"
            threshold={40}
            label="Employee Services Test"
            description="≥40% of employee services performed in LIC"
            value={(data.qalicbEmployeeServices as number) ?? 0}
            onChange={handleSliderChange}
          />

          {/* Prohibited Business */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-gray-300">
                  Prohibited Business Test
                </span>
                <p className="text-xs text-gray-500">
                  Business is not a prohibited type
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  data.isProhibitedBusiness === false
                    ? "bg-green-900/50 text-green-300"
                    : data.isProhibitedBusiness === true
                      ? "bg-red-900/50 text-red-300"
                      : "bg-gray-700 text-gray-400"
                }`}
              >
                {data.isProhibitedBusiness === false
                  ? "PASS"
                  : data.isProhibitedBusiness === true
                    ? "FAIL"
                    : "PENDING"}
              </span>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => onChange({ isProhibitedBusiness: false })}
                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.isProhibitedBusiness === false
                    ? "border-green-500 bg-green-900/30 text-green-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                ✓ Not Prohibited
              </button>
              <button
                type="button"
                onClick={() => onChange({ isProhibitedBusiness: true })}
                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.isProhibitedBusiness === true
                    ? "border-red-500 bg-red-900/30 text-red-300"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                ✗ Is Prohibited
              </button>
            </div>

            <details className="bg-gray-800/50 rounded-lg p-3">
              <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-300">
                View prohibited business types
              </summary>
              <div className="mt-3 space-y-2">
                {PROHIBITED_BUSINESSES.map((biz) => (
                  <label
                    key={biz.id}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <input
                      type="checkbox"
                      checked={
                        (data[biz.id as keyof IntakeData] as boolean) || false
                      }
                      onChange={(e) => {
                        onChange({ [biz.id]: e.target.checked });
                        if (e.target.checked) {
                          onChange({ isProhibitedBusiness: true });
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500"
                    />
                    <span
                      className={
                        data[biz.id as keyof IntakeData] ? "text-red-400" : ""
                      }
                    >
                      {biz.label}
                    </span>
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>
      </TestSection>

      {/* Collectibles Test */}
      <TestSection
        id="collectibles"
        title="Collectibles Test"
        testNum="11"
        isExpanded={expandedTest === "collectibles"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-3">
          <YesNoToggle
            field="holdsCollectibles"
            label="Does the business hold collectibles?"
            yesIsGood={false}
            value={data.holdsCollectibles as boolean | undefined}
            onChange={handleYesNoChange}
          />
          {data.holdsCollectibles && (
            <>
              <YesNoToggle
                field="collectiblesUnder5Pct"
                label="Are collectibles <5% of total assets?"
                yesIsGood={true}
                value={data.collectiblesUnder5Pct as boolean | undefined}
                onChange={handleYesNoChange}
              />
              <YesNoToggle
                field="collectibles7YrRepresentation"
                label="Will collectibles remain <5% for 7 years?"
                yesIsGood={true}
                value={
                  data.collectibles7YrRepresentation as boolean | undefined
                }
                onChange={handleYesNoChange}
              />
            </>
          )}
          <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-800/50 rounded">
            Collectibles include art, antiques, gems, stamps, coins, alcoholic
            beverages for investment.
          </p>
        </div>
      </TestSection>

      {/* Non-Qualified Financial Property Test */}
      <TestSection
        id="nqfp"
        title="Non-Qualified Financial Property (NQFP) Test"
        testNum="12"
        isExpanded={expandedTest === "nqfp"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-3">
          <YesNoToggle
            field="holdsNQFP"
            label="Does the business hold non-qualified financial property?"
            yesIsGood={false}
            value={data.holdsNQFP as boolean | undefined}
            onChange={handleYesNoChange}
          />
          {data.holdsNQFP && (
            <>
              <YesNoToggle
                field="nqfpUnder5Pct"
                label="Is NQFP <5% of total assets?"
                yesIsGood={true}
                value={data.nqfpUnder5Pct as boolean | undefined}
                onChange={handleYesNoChange}
              />
              <YesNoToggle
                field="nqfp7YrRepresentation"
                label="Will NQFP remain <5% for 7 years?"
                yesIsGood={true}
                value={data.nqfp7YrRepresentation as boolean | undefined}
                onChange={handleYesNoChange}
              />
            </>
          )}
          <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-800/50 rounded">
            NQFP includes debt, stock, partnership interests, options, futures,
            foreign currency, and notional principal contracts.
          </p>
        </div>
      </TestSection>

      {/* 7-Year Operation */}
      <TestSection
        id="operation"
        title="LIC Reasonable Expectation (7-Year Test)"
        testNum="13"
        isExpanded={expandedTest === "operation"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-3">
          <YesNoToggle
            field="intends7YrOperation"
            label="Does the business intend to operate for at least 7 years?"
            yesIsGood={true}
            value={data.intends7YrOperation as boolean | undefined}
            onChange={handleYesNoChange}
          />
          <YesNoToggle
            field="leasingLandBuildings"
            label="Will the business lease (rather than own) land/buildings?"
            yesIsGood={false}
            value={data.leasingLandBuildings as boolean | undefined}
            onChange={handleYesNoChange}
          />
          {data.leasingLandBuildings && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Lease years remaining
              </label>
              <input
                type="number"
                value={data.leaseYearsRemaining || ""}
                onChange={(e) =>
                  onChange({
                    leaseYearsRemaining: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="Years"
                min="0"
                className="w-32 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100"
              />
              {data.leaseYearsRemaining && data.leaseYearsRemaining < 7 && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ Lease should extend at least 7 years
                </p>
              )}
            </div>
          )}
          <YesNoToggle
            field="expansionPlans7Yr"
            label="Are there expansion plans outside the LIC within 7 years?"
            yesIsGood={false}
            value={data.expansionPlans7Yr as boolean | undefined}
            onChange={handleYesNoChange}
          />
        </div>
      </TestSection>

      {/* Active Conduct */}
      <TestSection
        id="active"
        title="Active Trade or Business Test"
        testNum="15"
        isExpanded={expandedTest === "active"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-3">
          <YesNoToggle
            field="activePrimarilyRental"
            label="Is this primarily a rental real estate project?"
            yesIsGood={false}
            value={data.activePrimarilyRental as boolean | undefined}
            onChange={handleYesNoChange}
          />
          <YesNoToggle
            field="currentlyGeneratingRevenue"
            label="Is the business currently generating revenue?"
            yesIsGood={true}
            value={data.currentlyGeneratingRevenue as boolean | undefined}
            onChange={handleYesNoChange}
          />
          {!data.currentlyGeneratingRevenue && (
            <YesNoToggle
              field="revenueStart3YrExpectation"
              label="Is revenue expected to start within 3 years?"
              yesIsGood={true}
              value={data.revenueStart3YrExpectation as boolean | undefined}
              onChange={handleYesNoChange}
            />
          )}
          <YesNoToggle
            field="revenueContinuationExpectation"
            label="Is revenue expected to continue for the compliance period?"
            yesIsGood={true}
            value={data.revenueContinuationExpectation as boolean | undefined}
            onChange={handleYesNoChange}
          />
        </div>
      </TestSection>

      {/* Related Party */}
      <TestSection
        id="related"
        title="Related Party Test"
        testNum="16"
        isExpanded={expandedTest === "related"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-3">
          <YesNoToggle
            field="commonMgmtOwnershipTCredex"
            label="Common management/ownership with CDE or investor?"
            yesIsGood={false}
            value={data.commonMgmtOwnershipTCredex as boolean | undefined}
            onChange={handleYesNoChange}
          />
          <YesNoToggle
            field="postCloseCommonMgmt"
            label="Will there be common management post-closing?"
            yesIsGood={false}
            value={data.postCloseCommonMgmt as boolean | undefined}
            onChange={handleYesNoChange}
          />
          <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-800/50 rounded">
            Related party transactions require additional disclosure and may
            affect credit pricing.
          </p>
        </div>
      </TestSection>

      {/* Rental Income */}
      <TestSection
        id="rental"
        title="Rental Income Disclosure"
        testNum="17"
        isExpanded={expandedTest === "rental"}
        onToggle={handleSectionToggle}
      >
        <div className="space-y-3">
          <YesNoToggle
            field="derivesRentalIncome"
            label="Does the project derive rental income?"
            yesIsGood={true}
            value={data.derivesRentalIncome as boolean | undefined}
            onChange={handleYesNoChange}
          />
          {data.derivesRentalIncome && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Rental Property Listing
              </label>
              <textarea
                value={data.rentalPropertyListing || ""}
                onChange={(e) =>
                  onChange({ rentalPropertyListing: e.target.value })
                }
                placeholder="List all properties with addresses and rental income..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 text-sm"
              />
            </div>
          )}
        </div>
      </TestSection>

      {/* Leverage Structure */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          NMTC Leverage Structure
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Select your expected financing structure
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              value: "standard",
              label: "Standard Leverage",
              desc: "Bank provides leverage loan",
            },
            {
              value: "self-leverage",
              label: "Self-Leverage",
              desc: "Sponsor provides leverage",
            },
            { value: "hybrid", label: "Hybrid", desc: "Combination structure" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange({
                  leverageStructure:
                    option.value as IntakeData["leverageStructure"],
                })
              }
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                data.leverageStructure === option.value
                  ? "border-emerald-500 bg-emerald-900/30"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <span
                className={`font-medium text-sm ${
                  data.leverageStructure === option.value
                    ? "text-emerald-300"
                    : "text-gray-300"
                }`}
              >
                {option.label}
              </span>
              <p className="text-xs text-gray-500">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NMTC_QALICB;
