"use client";

import CDECard from "@/components/CDECard";
import { CDEDealCard } from "@/lib/types/cde";

// Sample CDE data for preview
const sampleCDE: CDEDealCard & {
  controllingEntity?: string;
  headquartersCity?: string;
  headquartersState?: string;
  totalAllocation?: number;
  allocationType?: string;
  nonprofitPreferred?: boolean;
  minorityFocus?: boolean;
  utsFocus?: boolean;
  lihtcExperience?: boolean;
  ozExperience?: boolean;
  qctRequired?: boolean;
  minJobsCreated?: number;
  maxTimeToClose?: number;
  nonMetroCommitment?: number;
  stackedDealsPreferred?: boolean;
  predominantMarket?: string;
} = {
  id: "sample-cde-1",
  organizationName: "Midwest Community Capital",
  controllingEntity: "First National Bank",
  headquartersCity: "Chicago",
  headquartersState: "IL",
  missionSnippet:
    "Dedicated to financing community facilities, healthcare, and economic development in underserved urban and rural communities across the Midwest.",
  remainingAllocation: 45000000,
  totalAllocation: 75000000,
  allocationType: "Federal",
  allocationDeadline: "2026-12-31",
  primaryStates: ["IL", "IN", "WI", "MI", "OH", "MN", "IA"],
  targetSectors: [
    "Healthcare",
    "Community Facilities",
    "Manufacturing",
    "Mixed-Use",
  ],
  impactPriorities: [
    "job-creation",
    "healthcare-access",
    "community-services",
    "rural-development",
  ],
  dealSizeRange: { min: 5000000, max: 25000000 },
  ruralFocus: true,
  urbanFocus: true,
  minorityFocus: true,
  utsFocus: false,
  requireSeverelyDistressed: false,
  htcExperience: true,
  lihtcExperience: false,
  ozExperience: true,
  smallDealFund: false,
  nonprofitPreferred: true,
  stackedDealsPreferred: true,
  qctRequired: false,
  minJobsCreated: 10,
  maxTimeToClose: 6,
  nonMetroCommitment: 30,
  predominantMarket: "Real Estate",
  matchScore: 85,
  matchReasons: [
    "Geographic match: IL project in service area",
    "Sector match: Healthcare facility",
    "Deal size within range ($12M)",
  ],
  status: "active",
  lastUpdated: "2026-01-15",
};

const sampleCDE2: CDEDealCard & {
  controllingEntity?: string;
  headquartersCity?: string;
  headquartersState?: string;
  totalAllocation?: number;
  allocationType?: string;
  nonprofitPreferred?: boolean;
  minorityFocus?: boolean;
  utsFocus?: boolean;
  lihtcExperience?: boolean;
  ozExperience?: boolean;
  qctRequired?: boolean;
  minJobsCreated?: number;
  maxTimeToClose?: number;
  nonMetroCommitment?: number;
  stackedDealsPreferred?: boolean;
  predominantMarket?: string;
} = {
  id: "sample-cde-2",
  organizationName: "Gulf Coast Development Fund",
  controllingEntity: "Regional Bank Corp",
  headquartersCity: "Houston",
  headquartersState: "TX",
  missionSnippet:
    "Supporting economic revitalization in hurricane-impacted communities through targeted investments in small business and workforce development.",
  remainingAllocation: 18000000,
  totalAllocation: 50000000,
  allocationType: "Federal",
  allocationDeadline: "2026-06-30",
  primaryStates: ["TX", "LA", "MS", "AL", "FL"],
  targetSectors: [
    "Small Business",
    "Workforce Development",
    "Retail",
    "Food Access",
  ],
  impactPriorities: [
    "small-business-support",
    "job-creation",
    "food-access",
    "minority-owned-business",
  ],
  dealSizeRange: { min: 1000000, max: 8000000 },
  ruralFocus: true,
  urbanFocus: false,
  minorityFocus: true,
  utsFocus: true,
  requireSeverelyDistressed: true,
  htcExperience: false,
  lihtcExperience: false,
  ozExperience: false,
  smallDealFund: true,
  nonprofitPreferred: false,
  stackedDealsPreferred: false,
  qctRequired: true,
  nonMetroCommitment: 60,
  predominantMarket: "Operating Business",
  matchScore: 62,
  matchReasons: [
    "Geographic match: LA project in service area",
    "Small deal fund accepts $3M request",
  ],
  status: "active",
  lastUpdated: "2026-01-20",
};

export default function CDECardPreview() {
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">CDE Card Preview</h1>
        <p className="text-gray-400 mb-8">
          Preview of the CDECard component with all matchable fields from
          cdes_merged
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* High match score CDE */}
          <div>
            <p className="text-sm text-green-400 mb-2">High Match (85%)</p>
            <CDECard cde={sampleCDE as CDEDealCard} />
          </div>

          {/* Medium match score CDE */}
          <div>
            <p className="text-sm text-amber-400 mb-2">Medium Match (62%)</p>
            <CDECard cde={sampleCDE2 as CDEDealCard} />
          </div>

          {/* Without match score */}
          <div>
            <p className="text-sm text-gray-400 mb-2">
              No Match Score (Browse mode)
            </p>
            <CDECard
              cde={
                {
                  ...sampleCDE,
                  matchScore: undefined,
                  matchReasons: undefined,
                } as CDEDealCard
              }
            />
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
                <li>• Parent/Controlling Entity</li>
                <li>• Headquarters (City, State)</li>
                <li>• Status (Active/Deployed/Pending)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">Allocation</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Total Allocation</li>
                <li>• Available Allocation</li>
                <li>• Allocation Type (Federal/State)</li>
                <li>• Deployment Deadline</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">
                Deal Preferences
              </h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Deal Size Range (Min-Max)</li>
                <li>• Service Area (States)</li>
                <li>• Target Sectors</li>
                <li>• Market Focus</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">
                Focus & Experience
              </h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Urban/Rural Focus</li>
                <li>• Minority/Underserved Focus</li>
                <li>• Small Deal Fund</li>
                <li>• Program Experience (NMTC/HTC/LIHTC/OZ)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">Requirements</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Severely Distressed Required</li>
                <li>• QCT Required</li>
                <li>• Min Jobs Created</li>
                <li>• Max Time to Close</li>
                <li>• Non-Metro Commitment %</li>
              </ul>
            </div>
            <div>
              <h3 className="text-indigo-400 font-medium mb-2">Matching</h3>
              <ul className="space-y-1 text-gray-400">
                <li>• Match Score (0-100%)</li>
                <li>• Match Reasons</li>
                <li>• Non-Profit Preferred</li>
                <li>• Stacked Deals Preferred</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
