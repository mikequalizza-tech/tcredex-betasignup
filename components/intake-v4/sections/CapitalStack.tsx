'use client';

import { IntakeData } from '../IntakeShell';

interface CapitalStackProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}

export function CapitalStack({ data, onChange }: CapitalStackProps) {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return '';
    return value.toLocaleString();
  };

  const parseCurrency = (value: string) => {
    const num = parseInt(value.replace(/,/g, ''));
    return isNaN(num) ? undefined : num;
  };

  // Calculate totals
  const totalSources = (data.equityAmount || 0) + (data.debtAmount || 0) + (data.grantAmount || 0) + (data.otherAmount || 0);
  const committedPct = data.totalProjectCost && data.totalProjectCost > 0 
    ? Math.round((totalSources / data.totalProjectCost) * 100)
    : 0;

  // Update committed percentage when sources change
  const handleSourceChange = (field: keyof IntakeData, value: number | undefined) => {
    // Calculate new total with updated field
    const newValues = {
      equityAmount: data.equityAmount || 0,
      debtAmount: data.debtAmount || 0,
      grantAmount: data.grantAmount || 0,
      otherAmount: data.otherAmount || 0,
      [field]: value || 0,
    };
    const newTotal = newValues.equityAmount + newValues.debtAmount + newValues.grantAmount + newValues.otherAmount;
    const newPct = data.totalProjectCost && data.totalProjectCost > 0 
      ? Math.round((newTotal / data.totalProjectCost) * 100)
      : 0;
    
    onChange({ [field]: value, committedCapitalPct: newPct });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Identify your capital sources. This affects your readiness score and helps CDEs/Investors understand your financing position.
      </p>

      {/* Capital Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Equity (Committed)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrency(data.equityAmount)}
              onChange={(e) => handleSourceChange('equityAmount', parseCurrency(e.target.value))}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Owner/sponsor equity contribution</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Senior Debt (Committed)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrency(data.debtAmount)}
              onChange={(e) => handleSourceChange('debtAmount', parseCurrency(e.target.value))}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Bank loan or other senior debt</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Grants / Subsidies
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrency(data.grantAmount)}
              onChange={(e) => handleSourceChange('grantAmount', parseCurrency(e.target.value))}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">CDBG, foundation grants, etc.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Other Sources
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrency(data.otherAmount)}
              onChange={(e) => handleSourceChange('otherAmount', parseCurrency(e.target.value))}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Other committed sources</p>
        </div>
      </div>

      {/* Stack Summary */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Capital Stack Summary</h3>
        
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Committed Capital</span>
              <span className={`font-bold ${
                committedPct >= 80 ? 'text-green-400' :
                committedPct >= 60 ? 'text-amber-400' : 'text-gray-400'
              }`}>
                {committedPct}%
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  committedPct >= 80 ? 'bg-green-500' :
                  committedPct >= 60 ? 'bg-amber-500' : 'bg-gray-500'
                }`}
                style={{ width: `${Math.min(committedPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>60% (min)</span>
              <span>80% (target)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-700">
            <div>
              <span className="text-xs text-gray-500">Total Sources</span>
              <p className="font-semibold text-gray-100">${formatCurrency(totalSources)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Gap to Fill</span>
              <p className="font-semibold text-gray-100">
                ${formatCurrency(Math.max(0, (data.totalProjectCost || 0) - totalSources))}
              </p>
            </div>
          </div>
        </div>

        {/* Scoring hints */}
        <div className="mt-4 text-xs text-gray-500">
          <p className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${committedPct >= 80 ? 'bg-green-500' : 'bg-gray-600'}`} />
            80%+ committed = 25 points (full score)
          </p>
          <p className="flex items-center gap-2 mt-1">
            <span className={`w-3 h-3 rounded-full ${committedPct >= 60 ? 'bg-amber-500' : 'bg-gray-600'}`} />
            60%+ committed = 15 points
          </p>
        </div>
      </div>
    </div>
  );
}

export default CapitalStack;
