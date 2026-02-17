"use client";

import InvestorCard from "@/components/InvestorCard";
import { InvestorCard as InvestorCardType } from "@/lib/types/investor";

// Sample Investor data for preview
const sampleInvestor1: InvestorCardType = {
  id: "sample-investor-1",
  organizationName: "First National Community Bank",
  investorType: "bank",
  primaryContactName: "Sarah Mitchell",
  primaryContactEmail: "smitchell@fncb.com",
  primaryContactPhone: "(312) 555-0100",
  craMotivated: true,
  accredited: true,
  minInvestment: 5000000,
  maxInvestment: 25000000,
  targetCreditTypes: ["NMTC", "HTC"],
  targetStates: ["IL", "IN", "WI", "MI", "OH", "MN", "IA", "MO"],
  targetSectors: [
    "Healthcare",
    "Community Facilities",
    "Manufacturing",
    "Mixed-Use",
  ],
  totalInvestments: 45,
  totalInvested: 380000000,
  status: "active",
  matchScore: 92,
  matchReasons: [
    "CRA assessment area match: IL",
    "Program match: NMTC",
    "Sector match: Healthcare",
    "Investment size within range",
  ],
  lastUpdated: "2026-01-20",
};

const sampleInvestor2: InvestorCardType = {
  id: "sample-investor-2",
  organizationName: "Pacific Coast Insurance",
  investorType: "insurance",
  primaryContactName: "Michael Chen",
  craMotivated: false,
  accredited: true,
  minInvestment: 10000000,
  maxInvestment: 50000000,
  targetCreditTypes: ["NMTC", "LIHTC", "OZ"],
  targetStates: ["CA", "OR", "WA", "AZ", "NV"],
  targetSectors: ["Affordable Housing", "Clean Energy", "Healthcare"],
  totalInvestments: 28,
  totalInvested: 520000000,
  status: "active",
  matchScore: 75,
  matchReasons: ["Program match: NMTC", "Sector partial match"],
  lastUpdated: "2026-01-18",
};

const sampleInvestor3: InvestorCardType = {
  id: "sample-investor-3",
  organizationName: "Midwest CDFI Partners",
  investorType: "cdfi",
  primaryContactName: "Jennifer Williams",
  craMotivated: true,
  accredited: true,
  minInvestment: 1000000,
  maxInvestment: 8000000,
  targetCreditTypes: ["NMTC"],
  targetStates: ["IL", "IN", "OH", "MI"],
  targetSectors: ["Small Business", "Community Facilities", "Food Access"],
  totalInvestments: 65,
  totalInvested: 125000000,
  status: "active",
  lastUpdated: "2026-01-15",
};

export default function InvestorCardPreview() {
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">
          Investor Card Preview
        </h1>
        <p className="text-gray-400 mb-8">
          Preview of the InvestorCard component for AutoMatch funnel
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* High match score - Bank CRA motivated */}
          <div>
            <p className="text-sm text-green-400 mb-2">
              High Match (92%) - CRA Motivated Bank
            </p>
            <InvestorCard investor={sampleInvestor1} />
          </div>

          {/* Medium match score - Insurance company */}
          <div>
            <p className="text-sm text-amber-400 mb-2">
              Medium Match (75%) - Insurance Company
            </p>
            <InvestorCard investor={sampleInvestor2} />
          </div>

          {/* No match score - CDFI Browse mode */}
          <div>
            <p className="text-sm text-gray-400 mb-2">
              No Match Score (Browse) - CDFI
            </p>
            <InvestorCard investor={sampleInvestor3} />
          </div>
        </div>

        <div className="mt-12 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-4">
            Fields Displayed
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">Organization</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Organization Name</li>
                <li>• Investor Type (Bank, Insurance, CDFI, etc.)</li>
                <li>• Primary Contact Name</li>
                <li>• Status (Active/Pending/Inactive)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">
                Investment Capacity
              </h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Min Investment</li>
                <li>• Max Investment</li>
                <li>• CRA Motivated Flag</li>
                <li>• Accredited Investor Status</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">
                Target Preferences
              </h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Target Credit Types (NMTC/HTC/LIHTC/OZ)</li>
                <li>• Target States</li>
                <li>• Target Sectors</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">Track Record</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Total Investments (count)</li>
                <li>• Total Invested ($)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">Matching</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Match Score (0-100%)</li>
                <li>• Match Reasons</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
          <h2 className="text-lg font-semibold text-indigo-300 mb-2">
            AutoMatch Relevance
          </h2>
          <p className="text-gray-300 text-sm">
            The InvestorCard displays all fields needed for AI AutoMatch to
            connect deals with capital sources:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-400">
            <li>
              • <span className="text-green-400">CRA Motivation</span> - Banks
              seeking CRA credit match with eligible census tracts
            </li>
            <li>
              • <span className="text-emerald-400">Target Programs</span> -
              Match investor program preferences with deal program types
            </li>
            <li>
              • <span className="text-blue-400">Geographic Alignment</span> -
              Target states match with project location
            </li>
            <li>
              • <span className="text-purple-400">Sector Match</span> - Target
              sectors align with project type
            </li>
            <li>
              • <span className="text-amber-400">Investment Capacity</span> -
              Deal size fits within min/max range
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
