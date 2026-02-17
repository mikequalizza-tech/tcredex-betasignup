'use client';

import { ProgramType } from '../IntakeShell';

interface ProgramSelectorProps {
  programs: ProgramType[];
  onChange: (programs: ProgramType[]) => void;
  programLevel?: ('federal' | 'state')[];
  onLevelChange?: (levels: ('federal' | 'state')[]) => void;
}

const PROGRAMS: { id: ProgramType; label: string; description: string; color: string }[] = [
  { id: 'NMTC', label: 'New Markets Tax Credit', description: '39% credit over 7 years for low-income community investments', color: 'emerald' },
  { id: 'HTC', label: 'Historic Tax Credit', description: '20% credit for qualified rehabilitation of historic buildings', color: 'blue' },
  { id: 'LIHTC', label: 'Low-Income Housing Tax Credit', description: '9% or 4% credit for affordable rental housing development', color: 'purple' },
  { id: 'OZ', label: 'Opportunity Zone', description: 'Capital gains deferral and exclusion for designated areas', color: 'amber' },
];

export function ProgramSelector({ programs, onChange, programLevel = [], onLevelChange }: ProgramSelectorProps) {
  const toggleProgram = (programId: ProgramType) => {
    if (programs.includes(programId)) onChange(programs.filter(p => p !== programId));
    else onChange([...programs, programId]);
  };

  // Toggle program level (allows selecting both Federal AND State)
  const toggleLevel = (level: 'federal' | 'state') => {
    const currentLevels = programLevel || [];
    if (currentLevels.includes(level)) {
      onLevelChange?.(currentLevels.filter(l => l !== level));
    } else {
      onLevelChange?.([...currentLevels, level]);
    }
  };

  const isFederalSelected = programLevel?.includes('federal') ?? false;
  const isStateSelected = programLevel?.includes('state') ?? false;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Program Level</label>
        <p className="text-xs text-gray-500 mb-3">Select one or both - many deals layer federal and state credits</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => toggleLevel('federal')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 text-center transition-all ${isFederalSelected ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${isFederalSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-600'}`}>
                {isFederalSelected ? '✓' : ''}
              </span>
              <span className="font-medium">Federal</span>
            </div>
            <div className="text-xs opacity-75 mt-1">Federal-allocated credits</div>
          </button>
          <button type="button" onClick={() => toggleLevel('state')}
            className={`flex-1 px-4 py-3 rounded-lg border-2 text-center transition-all ${isStateSelected ? 'border-sky-500 bg-sky-900/30 text-sky-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs border ${isStateSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-600'}`}>
                {isStateSelected ? '✓' : ''}
              </span>
              <span className="font-medium">State</span>
            </div>
            <div className="text-xs opacity-75 mt-1">State-allocated credits</div>
          </button>
        </div>
        {isFederalSelected && isStateSelected && (
          <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300">✓ Federal + State selected - maximize your credit stack!</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Select Programs <span className="text-red-400">*</span></label>
        <p className="text-xs text-gray-500 mb-4">Select all programs you're seeking. Multiple programs can be layered.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROGRAMS.map((program) => {
            const isSelected = programs.includes(program.id);
            const colorClasses = {
              emerald: isSelected ? 'border-emerald-500 bg-emerald-900/30' : 'border-gray-700',
              blue: isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700',
              purple: isSelected ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700',
              amber: isSelected ? 'border-amber-500 bg-amber-900/30' : 'border-gray-700',
            };
            const textClasses = {
              emerald: isSelected ? 'text-emerald-300' : 'text-gray-200',
              blue: isSelected ? 'text-blue-300' : 'text-gray-200',
              purple: isSelected ? 'text-purple-300' : 'text-gray-200',
              amber: isSelected ? 'text-amber-300' : 'text-gray-200',
            };
            const badgeClasses = {
              emerald: 'bg-emerald-900/50 text-emerald-400',
              blue: 'bg-blue-900/50 text-blue-400',
              purple: 'bg-purple-900/50 text-purple-400',
              amber: 'bg-amber-900/50 text-amber-400',
            };

            return (
              <button key={program.id} type="button" onClick={() => toggleProgram(program.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:bg-gray-800/50 ${colorClasses[program.color as keyof typeof colorClasses]}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClasses[program.color as keyof typeof badgeClasses]}`}>{program.id}</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isSelected ? badgeClasses[program.color as keyof typeof badgeClasses] : 'bg-gray-700 text-gray-500'}`}>
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
                <div className={`font-medium mb-1 ${textClasses[program.color as keyof typeof textClasses]}`}>{program.label}</div>
                <p className="text-xs text-gray-500">{program.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {programs.length > 1 && (
        <div className="p-4 bg-indigo-900/30 border border-indigo-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 text-lg">💡</span>
            <div>
              <h4 className="font-medium text-indigo-300">Credit Stacking Detected</h4>
              <p className="text-sm text-indigo-400/80 mt-1">
                You've selected multiple programs: <strong>{programs.join(' + ')}</strong>. 
                Our platform will help optimize the capital stack across programs while ensuring compliance.
              </p>
            </div>
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Selected:</span>
            {programs.map((p) => (
              <span key={p} className={`px-2 py-1 rounded-full text-xs font-medium ${
                p === 'NMTC' ? 'bg-emerald-900/50 text-emerald-400' :
                p === 'HTC' ? 'bg-blue-900/50 text-blue-400' :
                p === 'LIHTC' ? 'bg-purple-900/50 text-purple-400' :
                'bg-amber-900/50 text-amber-400'
              }`}>{p}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgramSelector;
