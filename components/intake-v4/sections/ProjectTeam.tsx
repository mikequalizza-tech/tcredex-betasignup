'use client';

import { IntakeData } from '@/types/intake';

interface ProjectTeamProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
  organizationType?: string;
}

interface TeamRole {
  field: keyof IntakeData;
  label: string;
  required: boolean;
  category: 'development' | 'operations' | 'nmtc';
  placeholder: string;
}

const TEAM_ROLES: TeamRole[] = [
  // Development Team
  { field: 'architect', label: 'Architect', required: false, category: 'development', placeholder: 'Firm or individual name' },
  { field: 'generalContractor', label: 'General Contractor', required: false, category: 'development', placeholder: 'GC firm name' },
  { field: 'constructionManager', label: 'Construction Manager', required: false, category: 'development', placeholder: 'CM firm name (if applicable)' },
  { field: 'ownersRepresentative', label: "Owner's Representative", required: true, category: 'development', placeholder: 'Name or firm' },
  
  // Operations Team
  { field: 'leasingAgent', label: 'Leasing Agent', required: false, category: 'operations', placeholder: 'Leasing firm or agent' },
  { field: 'propertyManager', label: 'Property Manager', required: false, category: 'operations', placeholder: 'PM company' },
  { field: 'accountantReporting', label: 'Accountant (Reporting)', required: false, category: 'operations', placeholder: 'CPA firm' },
  { field: 'complianceReporter', label: 'Compliance Reporter', required: false, category: 'operations', placeholder: 'Compliance firm or contact' },
  { field: 'fundraiser', label: 'Fundraiser / Capital Advisor', required: false, category: 'operations', placeholder: 'If applicable' },
  
  // Tax Credit Specialists Team
  { field: 'nmtcConsultant', label: 'Tax Credit Consultant', required: false, category: 'nmtc', placeholder: 'Tax credit advisory firm' },
  { field: 'nmtcAttorney', label: 'Tax Credit Attorney', required: false, category: 'nmtc', placeholder: 'Legal counsel for tax credits' },
  { field: 'nmtcAccountantModeler', label: 'Tax Credit Accountant / Modeler', required: false, category: 'nmtc', placeholder: 'Financial modeling firm' },
];

// Helper functions
const getRolesByCategory = (category: string) => 
  TEAM_ROLES.filter(role => role.category === category);

// CategorySection component - defined OUTSIDE to prevent recreation
function CategorySection({ 
  category, 
  title, 
  icon,
  data,
  onChange,
}: { 
  category: 'development' | 'operations' | 'nmtc';
  title: string;
  icon: string;
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
}) {
  const roles = getRolesByCategory(category);
  const filledCount = roles.filter(role => data[role.field]).length;
  const totalCount = roles.length;

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          filledCount === totalCount ? 'bg-green-900/50 text-green-300' : 
          filledCount > 0 ? 'bg-yellow-900/50 text-yellow-300' : 
          'bg-gray-700 text-gray-400'
        }`}>
          {filledCount}/{totalCount}
        </span>
      </div>
      <div className="p-4 space-y-4">
        {roles.map((role) => (
          <div key={role.field as string}>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {role.label}
              {role.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={(data[role.field] as string) || ''}
              onChange={(e) => onChange({ [role.field]: e.target.value || undefined })}
              placeholder={role.placeholder}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Format organization type for display
const formatOrgType = (type?: string) => {
  if (!type) return null;
  const types: Record<string, string> = {
    'sponsor': 'Project Sponsor / Developer',
    'cde': 'Community Development Entity (CDE)',
    'investor': 'Investor',
    'nonprofit': 'Non-Profit Organization',
    'forprofit': 'For-Profit Corporation',
    'government': 'Government Entity',
    'tribal': 'Tribal Entity',
  };
  return types[type.toLowerCase()] || type;
};

export function ProjectTeam({ data, onChange, organizationType }: ProjectTeamProps) {

  const totalFilled = TEAM_ROLES.filter(role => data[role.field]).length;
  const requiredFilled = TEAM_ROLES.filter(role => role.required && data[role.field]).length;
  const requiredTotal = TEAM_ROLES.filter(role => role.required).length;

  return (
    <div className="space-y-6">
      {/* Organization Type - Static field */}
      {organizationType && (
        <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">Organization Type</label>
          <div className="text-gray-100 font-medium">
            {formatOrgType(organizationType)}
          </div>
          <p className="text-xs text-gray-500 mt-1">From your organization profile</p>
        </div>
      )}

      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            Team members can be updated as they're confirmed. Enter "TBD" or "N/A" if not yet determined.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-400">{totalFilled}/{TEAM_ROLES.length}</div>
          <div className="text-xs text-gray-500">Team Roles Filled</div>
        </div>
      </div>

      {/* Required indicator */}
      {requiredFilled < requiredTotal && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
          <span className="text-amber-400">⚠️</span>
          <span className="text-sm text-amber-300">
            {requiredTotal - requiredFilled} required team member{requiredTotal - requiredFilled > 1 ? 's' : ''} not yet specified
          </span>
        </div>
      )}

      {/* Team Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategorySection 
          category="development" 
          title="Development Team" 
          icon="🏗️"
          data={data}
          onChange={onChange}
        />
        <CategorySection 
          category="operations" 
          title="Operations Team" 
          icon="📋"
          data={data}
          onChange={onChange}
        />
        <CategorySection 
          category="nmtc" 
          title="Tax Credit Specialists" 
          icon="💼"
          data={data}
          onChange={onChange}
        />
      </div>

      {/* Team Completeness Note */}
      {totalFilled >= 5 && (
        <div className="bg-gradient-to-r from-indigo-900/20 to-emerald-900/20 border border-indigo-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-indigo-300 font-medium text-sm">Strong Project Team</p>
              <p className="text-xs text-gray-400 mt-1">
                Having experienced team members identified increases CDE confidence in project execution.
                CDEs review sponsor track record and team qualifications as part of due diligence.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tip for tax credit specialists */}
      {(data.programs?.includes('NMTC') || data.programs?.includes('LIHTC') || data.programs?.includes('HTC')) && !data.nmtcConsultant && !data.nmtcAttorney && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-gray-300 font-medium text-sm">Tax Credit Team Recommendation</p>
              <p className="text-xs text-gray-400 mt-1">
                Tax credit transactions are complex. Most sponsors engage specialized tax credit consultants 
                and attorneys. If you need referrals, tCredex can connect you with experienced professionals.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectTeam;
