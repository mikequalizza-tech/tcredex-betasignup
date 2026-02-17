'use client';

import { useMemo } from 'react';
import { calculateReadiness, getTierDisplay } from '@/lib/intake/readinessScore';
import { IntakeData } from '@/types/intake';

interface CompletenessScoreProps {
  draftData: Record<string, unknown> | IntakeData | null | undefined;
  variant?: 'full' | 'compact' | 'card';
  showMissingFields?: boolean;
  className?: string;
}

/**
 * C-Score / Completeness Score Component
 *
 * Displays how complete the intake form is, NOT deal quality scoring.
 * This is the primary metric sponsors should focus on.
 */
export function CompletenessScore({
  draftData,
  variant = 'full',
  showMissingFields = true,
  className = ''
}: CompletenessScoreProps) {
  const readinessResult = useMemo(() => {
    if (!draftData) {
      return {
        totalScore: 0,
        maxScore: 100,
        percentage: 0,
        tier: 'early' as const,
        breakdown: [],
        missingRequired: [],
        completedFields: 0,
        totalFields: 0,
      };
    }
    return calculateReadiness(draftData as Record<string, unknown>);
  }, [draftData]);

  const tierDisplay = getTierDisplay(readinessResult.tier);

  // Compact variant - just shows score badge
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className={`px-3 py-1.5 rounded-lg ${tierDisplay.bgColor} ${tierDisplay.textColor} font-bold`}>
          {readinessResult.percentage}%
        </div>
        <span className="text-xs text-gray-400">{tierDisplay.label}</span>
      </div>
    );
  }

  // Card variant - for stat card display
  if (variant === 'card') {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">C-Score</p>
        <p className={`text-xl font-bold ${tierDisplay.textColor}`}>
          {readinessResult.percentage}%
        </p>
        <p className={`text-xs mt-1 ${tierDisplay.textColor}`}>
          {tierDisplay.label}
        </p>
      </div>
    );
  }

  // Full variant - detailed breakdown
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Completeness Score
            <span className="text-xs font-normal text-gray-400">(C-Score)</span>
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            How much of your intake form is complete
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${tierDisplay.textColor}`}>
            {readinessResult.percentage}%
          </div>
          <div className={`text-sm font-medium ${tierDisplay.textColor}`}>
            {tierDisplay.label}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              readinessResult.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
              readinessResult.percentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' :
              readinessResult.percentage >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
              'bg-gradient-to-r from-gray-500 to-gray-400'
            }`}
            style={{ width: `${readinessResult.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{readinessResult.completedFields} of {readinessResult.totalFields} fields</span>
          <span>{tierDisplay.description}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-6 py-4 border-t border-gray-800">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Section Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {readinessResult.breakdown.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${
                item.status === 'complete' ? 'border-green-500/30 bg-green-900/20' :
                item.status === 'partial' ? 'border-amber-500/30 bg-amber-900/20' :
                'border-gray-700 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${
                  item.status === 'complete' ? 'text-green-400' :
                  item.status === 'partial' ? 'text-amber-400' :
                  'text-gray-400'
                }`}>
                  {item.status === 'complete' ? '✓' : item.status === 'partial' ? '◐' : '○'}
                </span>
                <span className={`text-xs font-bold ${
                  item.status === 'complete' ? 'text-green-400' :
                  item.status === 'partial' ? 'text-amber-400' :
                  'text-gray-500'
                }`}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
              <p className="text-xs text-gray-300 truncate" title={item.label}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Fields */}
      {showMissingFields && readinessResult.missingRequired.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-800 bg-amber-900/10">
          <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Missing Required Fields ({readinessResult.missingRequired.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {readinessResult.missingRequired.slice(0, 10).map((field, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-amber-900/30 border border-amber-500/30 text-amber-300 text-xs rounded"
              >
                {field}
              </span>
            ))}
            {readinessResult.missingRequired.length > 10 && (
              <span className="px-2 py-1 text-amber-400 text-xs">
                +{readinessResult.missingRequired.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tier Progress Indicator */}
      <div className="px-6 py-4 border-t border-gray-800">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Deal Stage Progress</h4>
        <div className="flex items-center gap-2">
          {[
            { name: 'Early', min: 0, max: 39 },
            { name: 'Developing', min: 40, max: 59 },
            { name: 'Advanced', min: 60, max: 79 },
            { name: 'Shovel-Ready', min: 80, max: 100 },
          ].map((stage, _idx) => {
            const isActive = readinessResult.percentage >= stage.min && readinessResult.percentage <= stage.max;
            const isPassed = readinessResult.percentage > stage.max;
            return (
              <div key={stage.name} className="flex-1">
                <div className={`h-2 rounded-full ${
                  isPassed ? 'bg-green-500' :
                  isActive ? tierDisplay.textColor.replace('text-', 'bg-') :
                  'bg-gray-700'
                }`} />
                <p className={`text-xs mt-1 text-center ${
                  isActive ? tierDisplay.textColor : 'text-gray-500'
                }`}>
                  {stage.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CompletenessScore;
