'use client';

import { IntakeData } from '@/types/intake';

interface EconomicBenefitsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

export function EconomicBenefits({ data, onChange }: EconomicBenefitsProps) {
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString();
  };

  const parseNumber = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  };

  // Calculate total impact score (simple weighted formula)
  const impactScore = Math.min(100, 
    (data.permanentJobsFTE || 0) * 2 +
    (data.constructionJobsFTE || 0) * 0.5 +
    ((data.commercialSqft || 0) / 1000) * 0.5 +
    ((data.communityFacilitySqft || 0) / 500) * 1 +
    (data.affordableHousingUnits || 0) * 5
  );

  return (
    <div className="space-y-6">
      {/* Jobs Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">👷</span>
          Job Creation
          <span className="text-indigo-400 text-xs font-normal">(Critical TC metric)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permanent Jobs */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Permanent Jobs (FTE) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(data.permanentJobsFTE)}
              onChange={(e) => onChange({ permanentJobsFTE: parseNumber(e.target.value) })}
              placeholder="0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-2xl font-bold text-gray-100 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
            />
            <p className="text-xs text-gray-500 mt-2">
              Full-time equivalent jobs created or retained post-construction
            </p>
            
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">Basis for job estimate</label>
              <input
                type="text"
                value={data.permanentJobsBasis || ''}
                onChange={(e) => onChange({ permanentJobsBasis: e.target.value })}
                placeholder="e.g., Tenant commitments, industry standards..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Construction Jobs */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Construction Jobs (FTE) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formatNumber(data.constructionJobsFTE)}
              onChange={(e) => onChange({ constructionJobsFTE: parseNumber(e.target.value) })}
              placeholder="0"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-2xl font-bold text-gray-100 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
            />
            <p className="text-xs text-gray-500 mt-2">
              FTE = Total construction hours ÷ 1,750
            </p>
            
            <div className="mt-3">
              <label className="block text-xs text-gray-400 mb-1">Basis for estimate</label>
              <input
                type="text"
                value={data.constructionJobsBasis || ''}
                onChange={(e) => onChange({ constructionJobsBasis: e.target.value })}
                placeholder="e.g., GC estimate, similar projects..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Jobs Value to LIC */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Value of Jobs to Low-Income Community
          </label>
          <textarea
            value={data.jobsValueToLIC || ''}
            onChange={(e) => onChange({ jobsValueToLIC: e.target.value })}
            placeholder="Describe how jobs benefit the LIC:&#10;• Hiring from local community&#10;• Living wage commitments&#10;• Benefits provided&#10;• Training programs&#10;• Career advancement opportunities"
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Commercial Space Section */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">🏢</span>
          Commercial / Retail Space
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Commercial Square Feet
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatNumber(data.commercialSqft)}
                onChange={(e) => onChange({ commercialSqft: parseNumber(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">sq ft</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Excludes housing units</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Commercial Value to Low-Income Community
          </label>
          <textarea
            value={data.commercialValueToLIC || ''}
            onChange={(e) => onChange({ commercialValueToLIC: e.target.value })}
            placeholder="Describe tenant types and community services:&#10;• Healthcare providers&#10;• Educational services&#10;• Grocery / food access&#10;• Financial services&#10;• Community services"
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Community Facility Section */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">🏛️</span>
          Community Facility
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Community Facility Sq Ft
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatNumber(data.communityFacilitySqft)}
                onChange={(e) => onChange({ communityFacilitySqft: parseNumber(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">sq ft</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Capacity (people served)
            </label>
            <input
              type="text"
              value={formatNumber(data.communityFacilityCapacity)}
              onChange={(e) => onChange({ communityFacilityCapacity: parseNumber(e.target.value) })}
              placeholder="0"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Basis for Community Facility Metrics
          </label>
          <textarea
            value={data.communityFacilityBasis || ''}
            onChange={(e) => onChange({ communityFacilityBasis: e.target.value })}
            placeholder="Describe the community facility:&#10;• Type of facility (healthcare, education, childcare, etc.)&#10;• Services provided&#10;• Target population&#10;• Operating hours"
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Housing Section */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">🏠</span>
          Housing (if applicable)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Total Housing Units
            </label>
            <input
              type="text"
              value={formatNumber(data.housingUnits)}
              onChange={(e) => onChange({ housingUnits: parseNumber(e.target.value) })}
              placeholder="0"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Affordable Housing Units
              <span className="text-purple-400 text-xs ml-2">LIHTC Related</span>
            </label>
            <input
              type="text"
              value={formatNumber(data.affordableHousingUnits)}
              onChange={(e) => onChange({ affordableHousingUnits: parseNumber(e.target.value) })}
              placeholder="0"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {(data.housingUnits || data.affordableHousingUnits) && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Housing Description
            </label>
            <textarea
              value={data.housingDescription || ''}
              onChange={(e) => onChange({ housingDescription: e.target.value })}
              placeholder="Describe housing:&#10;• Unit mix (1BR, 2BR, etc.)&#10;• AMI targeting&#10;• Affordability period&#10;• Target population"
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Need for Tax Credit Subsidy */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Need for Tax Credit Financing <span className="text-red-400">*</span>
        </h3>
        <textarea
          value={data.needForNMTC || ''}
          onChange={(e) => onChange({ needForNMTC: e.target.value })}
          placeholder="Why is tax credit financing needed for this project?&#10;&#10;• Financial gap analysis&#10;• Why conventional financing is insufficient&#10;• Impact of tax credits on project viability&#10;• Community benefit that wouldn't occur without tax credit subsidy"
          rows={5}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          This is a key factor in allocation decisions - be specific about the financing gap
        </p>
      </div>

      {/* Impact Score Preview */}
      {impactScore > 0 && (
        <div className="bg-gradient-to-r from-blue-900/20 to-emerald-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="text-blue-300 font-medium text-sm">Community Impact Preview</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.permanentJobsFTE && data.permanentJobsFTE > 0 && (
                    <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-medium">
                      {data.permanentJobsFTE.toLocaleString()} Permanent Jobs
                    </span>
                  )}
                  {data.constructionJobsFTE && data.constructionJobsFTE > 0 && (
                    <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs font-medium">
                      {data.constructionJobsFTE.toLocaleString()} Construction Jobs
                    </span>
                  )}
                  {data.commercialSqft && data.commercialSqft > 0 && (
                    <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs font-medium">
                      {data.commercialSqft.toLocaleString()} SF Commercial
                    </span>
                  )}
                  {data.affordableHousingUnits && data.affordableHousingUnits > 0 && (
                    <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs font-medium">
                      {data.affordableHousingUnits} Affordable Units
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">{Math.round(impactScore)}</div>
              <div className="text-xs text-gray-500">Impact Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EconomicBenefits;
