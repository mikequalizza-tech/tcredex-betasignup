'use client';

import { useState } from 'react';
import DealCard from '@/components/DealCard';
import { Deal } from '@/lib/data/deals';
import { generateDealSummary, generateDealJSON, DealCardGeneratorResult } from '@/lib/deals';

interface DealCardPreviewProps {
  result: DealCardGeneratorResult;
  onClose?: () => void;
  onSubmit?: (deal: Deal) => void;
  onEdit?: () => void;
}

export default function DealCardPreview({
  result,
  onClose,
  onSubmit,
  onEdit,
}: DealCardPreviewProps) {
  const { deal, completeness, warnings } = result;
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopySummary = async () => {
    const summary = generateDealSummary(deal);
    await navigator.clipboard.writeText(summary);
    setCopySuccess('summary');
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleCopyJSON = async () => {
    const json = generateDealJSON(deal);
    await navigator.clipboard.writeText(json);
    setCopySuccess('json');
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const tierColors = {
    1: 'bg-indigo-500',
    2: 'bg-emerald-500',
    3: 'bg-amber-500',
  };

  const tierLabels = {
    1: 'DealCard Ready',
    2: 'Profile Ready',
    3: 'Due Diligence Ready',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">DealCard Preview</h2>
            <p className="text-sm text-gray-400 mt-1">
              Review your generated DealCard before submitting to the marketplace
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: DealCard */}
            <div>
              <DealCard deal={deal} />
            </div>

            {/* Right: Status & Actions */}
            <div className="space-y-6">
              {/* Completeness */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300">Completeness</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${tierColors[completeness.tier]}`}>
                    Tier {completeness.tier}: {tierLabels[completeness.tier]}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Overall Progress</span>
                    <span className="text-white font-medium">{completeness.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${tierColors[completeness.tier]}`}
                      style={{ width: `${completeness.percentage}%` }}
                    />
                  </div>
                </div>

                {completeness.missingFields.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Missing recommended fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {completeness.missingFields.map((field) => (
                        <span key={field} className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/30">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                    <span>⚠️</span> Warnings
                  </h3>
                  <ul className="space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="text-xs text-yellow-300/80">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Export Options */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Export</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {copySuccess === 'summary' ? (
                      <><span>✓</span> Copied!</>
                    ) : (
                      <><span>📋</span> Copy Summary</>
                    )}
                  </button>
                  <button
                    onClick={handleCopyJSON}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {copySuccess === 'json' ? (
                      <><span>✓</span> Copied!</>
                    ) : (
                      <><span>{'{}'}</span> Copy JSON</>
                    )}
                  </button>
                </div>
              </div>

              {/* Deal Info */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Deal Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Deal ID:</span>
                    <span className="font-mono text-xs text-gray-300">{deal.id}</span>
                  </div>
                  {deal.censusTract && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Census Tract:</span>
                      <span className="font-mono text-xs text-gray-300">{deal.censusTract}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shovel Ready:</span>
                    <span className={deal.shovelReady ? 'text-green-400' : 'text-gray-500'}>
                      {deal.shovelReady ? 'Yes ✓' : 'No'}
                    </span>
                  </div>
                  {deal.coordinates && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coordinates:</span>
                      <span className="font-mono text-xs text-gray-300">
                        {deal.coordinates[1].toFixed(4)}, {deal.coordinates[0].toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Edit Form
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            )}
            {onSubmit && (
              <button
                onClick={() => onSubmit(deal)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>Submit to Marketplace</span>
                <span>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
