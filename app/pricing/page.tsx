'use client';

import { useState } from 'react';

type ProgramType = 'NMTC' | 'HTC' | 'LIHTC' | 'OZ';

interface PricingResult {
  program: ProgramType;
  basePrice: number;
  adjustedPrice: number;
  adjustments: { factor: string; impact: number }[];
  totalCredit: number;
  netBenefit: number;
  notes: string[];
}

const PROGRAM_INFO: Record<ProgramType, { 
  name: string; 
  basePrice: number; 
  creditPercent: number;
  description: string;
  color: string;
}> = {
  NMTC: { 
    name: 'New Markets Tax Credit', 
    basePrice: 0.75, 
    creditPercent: 39,
    description: '39% credit over 7 years (5% yr 1-3, 6% yr 4-7)',
    color: 'emerald'
  },
  HTC: { 
    name: 'Historic Tax Credit', 
    basePrice: 0.90, 
    creditPercent: 20,
    description: '20% of Qualified Rehabilitation Expenditures',
    color: 'blue'
  },
  LIHTC: { 
    name: 'Low-Income Housing Tax Credit', 
    basePrice: 0.87, 
    creditPercent: 9,
    description: '9% annual credit for 10 years (~87% PV)',
    color: 'purple'
  },
  OZ: { 
    name: 'Opportunity Zone', 
    basePrice: 0.82, 
    creditPercent: 15,
    description: 'Capital gains deferral + 10-15% step-up',
    color: 'amber'
  },
};

export default function PricingCoachPage() {
  const [program, setProgram] = useState<ProgramType>('NMTC');
  const [allocation, setAllocation] = useState<string>('10000000');
  const [state, setState] = useState<string>('Missouri');
  const [tractType, setTractType] = useState<string>('QCT');
  const [dealStage, setDealStage] = useState<string>('predevelopment');
  const [sponsorExperience, setSponsorExperience] = useState<string>('experienced');
  const [result, setResult] = useState<PricingResult | null>(null);

  const calculatePricing = () => {
    const info = PROGRAM_INFO[program];
    let adjustedPrice = info.basePrice;
    const adjustments: { factor: string; impact: number }[] = [];

    // Tract type adjustment
    if (tractType === 'SD') {
      adjustedPrice += 0.02;
      adjustments.push({ factor: 'Severely Distressed Tract', impact: 0.02 });
    } else if (tractType === 'LIC') {
      adjustedPrice -= 0.01;
      adjustments.push({ factor: 'Low-Income Community (non-QCT)', impact: -0.01 });
    }

    // Deal stage adjustment
    if (dealStage === 'construction') {
      adjustedPrice += 0.02;
      adjustments.push({ factor: 'Construction Stage', impact: 0.02 });
    } else if (dealStage === 'predevelopment') {
      adjustedPrice -= 0.02;
      adjustments.push({ factor: 'Predevelopment Stage', impact: -0.02 });
    } else if (dealStage === 'operating') {
      adjustedPrice += 0.03;
      adjustments.push({ factor: 'Operating/Stabilized', impact: 0.03 });
    }

    // Sponsor experience
    if (sponsorExperience === 'first_time') {
      adjustedPrice -= 0.03;
      adjustments.push({ factor: 'First-Time Sponsor', impact: -0.03 });
    } else if (sponsorExperience === 'experienced') {
      adjustedPrice += 0.01;
      adjustments.push({ factor: 'Experienced Sponsor', impact: 0.01 });
    }

    // State adjustments (simplified)
    const highDemandStates = ['California', 'New York', 'Texas', 'Florida'];
    if (highDemandStates.includes(state)) {
      adjustedPrice += 0.01;
      adjustments.push({ factor: 'High-Demand State', impact: 0.01 });
    }

    // Deal size adjustment
    const allocationNum = parseFloat(allocation) || 0;
    if (allocationNum >= 20000000) {
      adjustedPrice += 0.02;
      adjustments.push({ factor: 'Large Deal Premium ($20M+)', impact: 0.02 });
    } else if (allocationNum < 5000000) {
      adjustedPrice -= 0.02;
      adjustments.push({ factor: 'Small Deal Discount (<$5M)', impact: -0.02 });
    }

    const totalCredit = allocationNum * (info.creditPercent / 100);
    const netBenefit = totalCredit * adjustedPrice;

    const notes: string[] = [];
    if (program === 'NMTC') {
      notes.push('Price reflects typical leverage loan structure');
      notes.push('Final pricing depends on CDE terms and investor appetite');
    } else if (program === 'HTC') {
      notes.push('Price assumes Part 2 approval from NPS');
      notes.push('State HTC may provide additional 10-25% credit');
    } else if (program === 'LIHTC') {
      notes.push('Price reflects 9% competitive credit');
      notes.push('4% bond deals typically price 2-3¢ lower');
    } else if (program === 'OZ') {
      notes.push('Pricing varies significantly by hold period');
      notes.push('10-year hold provides maximum benefit');
    }

    setResult({
      program,
      basePrice: info.basePrice,
      adjustedPrice: Math.min(Math.max(adjustedPrice, 0.65), 0.98),
      adjustments,
      totalCredit,
      netBenefit,
      notes,
    });
  };

  const formatCurrency = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Pricing Coach</h1>
        <p className="text-gray-400">Get estimated credit pricing based on your deal characteristics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Deal Parameters</h2>
            
            {/* Program Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Tax Credit Program</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PROGRAM_INFO) as ProgramType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProgram(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      program === p
                        ? `bg-${PROGRAM_INFO[p].color}-600 text-white`
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    style={program === p ? { 
                      backgroundColor: p === 'NMTC' ? '#059669' : p === 'HTC' ? '#2563eb' : p === 'LIHTC' ? '#9333ea' : '#d97706'
                    } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">{PROGRAM_INFO[program].description}</p>
            </div>

            {/* Allocation */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {program === 'HTC' ? 'QRE Amount' : program === 'LIHTC' ? 'Eligible Basis' : 'Allocation Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  value={allocation}
                  onChange={(e) => setAllocation(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="10,000,000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {parseFloat(allocation) ? formatCurrency(parseFloat(allocation)) : '$0'}
              </p>
            </div>

            {/* State */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option>Alabama</option><option>California</option><option>Colorado</option>
                <option>Florida</option><option>Georgia</option><option>Illinois</option>
                <option>Indiana</option><option>Iowa</option><option>Michigan</option>
                <option>Minnesota</option><option>Missouri</option><option>New York</option>
                <option>Ohio</option><option>Pennsylvania</option><option>Texas</option>
                <option>Virginia</option><option>Wisconsin</option>
              </select>
            </div>

            {/* Tract Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Census Tract Type</label>
              <select
                value={tractType}
                onChange={(e) => setTractType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="QCT">Qualified Census Tract (QCT)</option>
                <option value="SD">Severely Distressed</option>
                <option value="LIC">Low-Income Community</option>
                <option value="DDA">Difficult Development Area</option>
              </select>
            </div>

            {/* Deal Stage */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Deal Stage</label>
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="predevelopment">Predevelopment</option>
                <option value="entitlements">Entitlements Secured</option>
                <option value="construction">Under Construction</option>
                <option value="operating">Operating/Stabilized</option>
              </select>
            </div>

            {/* Sponsor Experience */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Sponsor Experience</label>
              <select
                value={sponsorExperience}
                onChange={(e) => setSponsorExperience(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="first_time">First-Time Sponsor</option>
                <option value="some">1-3 Prior Deals</option>
                <option value="experienced">4+ Prior Deals</option>
              </select>
            </div>

            <button
              onClick={calculatePricing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              Calculate Pricing
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Main Result Card */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-100">Estimated Pricing</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.program === 'NMTC' ? 'bg-emerald-900/50 text-emerald-400' :
                    result.program === 'HTC' ? 'bg-blue-900/50 text-blue-400' :
                    result.program === 'LIHTC' ? 'bg-purple-900/50 text-purple-400' :
                    'bg-amber-900/50 text-amber-400'
                  }`}>
                    {PROGRAM_INFO[result.program].name}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Credit Price</p>
                    <p className="text-3xl font-bold text-indigo-400">${result.adjustedPrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">per $1.00 credit</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Total Credit</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(result.totalCredit)}</p>
                    <p className="text-xs text-gray-500 mt-1">{PROGRAM_INFO[result.program].creditPercent}% of basis</p>
                  </div>
                  <div className="text-center p-4 bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-400 mb-1">Net Benefit</p>
                    <p className="text-3xl font-bold text-amber-400">{formatCurrency(result.netBenefit)}</p>
                    <p className="text-xs text-gray-500 mt-1">to project</p>
                  </div>
                </div>

                {/* Price Adjustments */}
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Price Adjustments</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Base Price ({result.program})</span>
                      <span className="text-gray-200">${result.basePrice.toFixed(2)}</span>
                    </div>
                    {result.adjustments.map((adj, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400">{adj.factor}</span>
                        <span className={adj.impact >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {adj.impact >= 0 ? '+' : ''}{adj.impact.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-800">
                      <span className="text-gray-200">Final Price</span>
                      <span className="text-indigo-400">${result.adjustedPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Important Notes</h3>
                <ul className="space-y-2">
                  {result.notes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-indigo-400 mt-1">•</span>
                      {note}
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-indigo-400 mt-1">•</span>
                    This is an estimate only — actual pricing varies by market conditions
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="bg-indigo-900/30 border border-indigo-800 rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Ready to Submit Your Deal?</h3>
                <p className="text-gray-400 mb-4">Get matched with CDEs and investors on the tCredex marketplace</p>
                <a
                  href="/deals/new"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                >
                  Start Intake Form
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Enter Deal Parameters</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Select your tax credit program and enter deal details to get an estimated credit price based on current market conditions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
