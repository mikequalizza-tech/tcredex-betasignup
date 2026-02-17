'use client';

type DealStage = 'intake' | 'matched' | 'term_sheet' | 'commitment' | 'closing_room' | 'closed' | 'compliance';

interface DealLifecycleTimelineProps {
  current: DealStage;
}

const stages: { key: DealStage; label: string }[] = [
  { key: 'intake', label: 'Intake' },
  { key: 'matched', label: 'Matched' },
  { key: 'term_sheet', label: 'Term Sheet' },
  { key: 'commitment', label: 'Commitment' },
  { key: 'closing_room', label: 'Closing' },
  { key: 'closed', label: 'Closed' },
  { key: 'compliance', label: 'Compliance' },
];

export default function DealLifecycleTimeline({ current }: DealLifecycleTimelineProps) {
  const currentIndex = stages.findIndex(s => s.key === current);
  const percent = ((currentIndex + 1) / stages.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-300">Deal Lifecycle</h4>
        <span className="text-xs text-gray-500">{Math.round(percent)}% complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between">
        {stages.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={stage.key} className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${
                isComplete ? 'bg-green-500' :
                isCurrent ? 'bg-indigo-500 ring-2 ring-indigo-300' :
                'bg-gray-600'
              }`} />
              <span className={`text-xs mt-1 ${
                isCurrent ? 'text-indigo-400 font-medium' :
                isComplete ? 'text-gray-400' :
                'text-gray-600'
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <span className="text-sm text-gray-400">Current: </span>
        <span className="text-sm text-indigo-400 font-medium">
          {stages.find(s => s.key === current)?.label}
        </span>
      </div>
    </div>
  );
}
