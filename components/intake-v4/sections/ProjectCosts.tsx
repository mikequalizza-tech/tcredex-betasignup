'use client';

import { IntakeData } from '../IntakeShell';
import { ProgramType } from '@/types/intake';

interface ProjectCostsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

export function ProjectCosts({ data, onChange }: ProjectCostsProps) {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return '';
    return value.toLocaleString();
  };

  const parseCurrency = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''));
    return isNaN(num) ? undefined : num;
  };

  // Calculate totals
  const totalCost = (data.landCost || 0) + (data.constructionCost || 0) + (data.softCosts || 0);
  const gap = data.totalProjectCost ? data.totalProjectCost - totalCost : 0;

  return (
    <div className="space-y-6">
      {/* Total Project Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Total Project Cost <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="text"
            value={formatCurrency(data.totalProjectCost)}
            onChange={(e) => onChange({ totalProjectCost: parseCurrency(e.target.value) })}
            placeholder="0"
            className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Total all-in project cost including land, construction, and soft costs</p>
      </div>

      {/* Cost Breakdown */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Cost Breakdown (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Land / Acquisition
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.landCost)}
                onChange={(e) => onChange({ landCost: parseCurrency(e.target.value) })}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Construction (Hard Costs)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.constructionCost)}
                onChange={(e) => onChange({ constructionCost: parseCurrency(e.target.value) })}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Soft Costs
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={formatCurrency(data.softCosts)}
                onChange={(e) => onChange({ softCosts: parseCurrency(e.target.value) })}
                placeholder="0"
                className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Architecture, legal, financing fees, etc.</p>
          </div>
        </div>

        {/* Summary */}
        {totalCost > 0 && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Breakdown Total:</span>
              <span className="font-medium text-gray-100">${formatCurrency(totalCost)}</span>
            </div>
            {data.totalProjectCost && Math.abs(gap) > 1 && (
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Difference:</span>
                <span className={`font-medium ${gap > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  {gap > 0 ? '+' : ''}${formatCurrency(gap)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financing Gap */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Financing Gap</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Financing Gap (Amount Seeking) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrency(data.financingGap)}
              onChange={(e) => onChange({ financingGap: parseCurrency(e.target.value) })}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">The financing gap that tax credit equity will help fill</p>
        </div>
      </div>

      {/* Requested Allocation - Show for applicable programs */}
      {data.programs && data.programs.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {(() => {
              const programNames: Record<ProgramType, string> = {
                'NMTC': 'Requested NMTC Allocation',
                'HTC': 'Requested HTC Credit Amount',
                'LIHTC': 'Requested LIHTC Allocation',
                'OZ': 'OZ Investment Amount',
                'Brownfield': 'Brownfield Credit Amount'
              };
              if (data.programs.length === 1) {
                return programNames[data.programs[0]] || 'Requested Allocation';
              }
              return 'Requested Tax Credit Allocation';
            })()}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrency(data.requestedAllocation)}
              onChange={(e) => onChange({ requestedAllocation: parseCurrency(e.target.value) })}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Qualified Equity Investment (QEI) amount being requested</p>
        </div>
      )}
    </div>
  );
}

export default ProjectCosts;
