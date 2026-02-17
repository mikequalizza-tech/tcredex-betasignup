/**
 * Tax Credit Streams Calculator
 * =============================
 * Defines credit schedules for all 5 tax credit programs and provides
 * cash-on-cash return calculations for indicative pricing.
 *
 * NOTE: Full DCF/IRR models are done by 3rd party accountants.
 * tCredex shows simple Cash-on-Cash returns based on credit price.
 *
 * Tax Credit Economics (IRS Code - these don't change):
 * - LIHTC 9%: 9% per year × 10 years = 90% of eligible basis
 * - LIHTC 4%: 4% per year × 10 years = 40% of eligible basis (with Tax Exempt Bonds)
 * - NMTC: Years 1-3 @ 5%, Years 4-7 @ 6% = 39% of QEI
 * - HTC: 20% total ÷ 5 years = 4% per year (post-TCJA)
 * - DDA: 30% basis boost for projects in Difficult Development Areas
 */

export type CreditProgram = 'NMTC' | 'HTC' | 'LIHTC_9' | 'LIHTC_4' | 'OZ' | 'BROWNFIELD';

/**
 * Credit stream schedule for each program
 * Array index = year (0-indexed), value = credit % for that year
 */
export const CREDIT_SCHEDULES: Record<CreditProgram, number[]> = {
  // NMTC: 5% for years 1-3, 6% for years 4-7 = 39% total
  NMTC: [0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.06],

  // HTC: 20% total over 5 years = 4% per year (post-TCJA)
  HTC: [0.04, 0.04, 0.04, 0.04, 0.04],

  // LIHTC 9%: 9% per year for 10 years = 90% total
  LIHTC_9: [0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09],

  // LIHTC 4%: 4% per year for 10 years = 40% total (with Tax Exempt Bonds)
  LIHTC_4: [0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],

  // OZ: No annual credits - capital gains deferral/exclusion at exit
  // Showing as empty since pricing is exit-based, not annual credit stream
  OZ: [],

  // Brownfield: State-specific, typically one-time credit
  // Varies by state - using placeholder of single year
  BROWNFIELD: [1.0], // 100% of qualified cleanup costs (state-dependent)
};

/**
 * Total credit percentage for each program
 */
export const TOTAL_CREDITS: Record<CreditProgram, number> = {
  NMTC: 0.39,      // 39%
  HTC: 0.20,       // 20%
  LIHTC_9: 0.90,   // 90%
  LIHTC_4: 0.40,   // 40%
  OZ: 0.15,        // ~15% effective (varies based on hold period)
  BROWNFIELD: 1.0, // 100% of qualified costs (state-dependent)
};

/**
 * Market price ranges (cents per dollar of credit)
 * These are indicative ranges - actual prices depend on deal quality
 */
export const MARKET_PRICE_RANGES: Record<CreditProgram, { low: number; mid: number; high: number }> = {
  NMTC: { low: 0.75, mid: 0.80, high: 0.85 },
  HTC: { low: 0.88, mid: 0.92, high: 0.96 },
  LIHTC_9: { low: 0.88, mid: 0.93, high: 0.98 },
  LIHTC_4: { low: 0.85, mid: 0.90, high: 0.95 },
  OZ: { low: 0.85, mid: 0.90, high: 0.95 },
  BROWNFIELD: { low: 0.70, mid: 0.80, high: 0.90 }, // State dependent
};

/**
 * DDA (Difficult Development Area) basis boost
 * Projects in DDAs get 30% more in eligible basis
 */
export const DDA_BOOST = 0.30;

export interface CreditPricingInput {
  program: CreditProgram;
  eligibleBasis: number;      // Eligible basis amount ($)
  creditPrice: number;        // Price per dollar of credit (e.g., 0.80)
  isDDA?: boolean;            // Is project in a DDA?
  qei?: number;               // For NMTC: Qualified Equity Investment amount
}

export interface CreditPricingResult {
  program: CreditProgram;
  totalCredits: number;           // Total credit amount ($)
  totalCreditPercent: number;     // Total credit as % of basis
  investmentAmount: number;       // What investor pays ($)
  cashOnCash: number;             // Cash-on-cash return (%)
  creditSchedule: { year: number; amount: number }[];
  basisBoost?: number;            // DDA boost amount if applicable
}

/**
 * Calculate credit pricing metrics
 *
 * @example
 * // $10M NMTC deal at $0.80 price
 * const result = calculateCreditPricing({
 *   program: 'NMTC',
 *   eligibleBasis: 10_000_000,
 *   creditPrice: 0.80,
 *   qei: 10_000_000
 * });
 * // result.totalCredits = $3,900,000 (39% of $10M)
 * // result.investmentAmount = $3,120,000 ($3.9M × 0.80)
 * // result.cashOnCash = 48.75% (39% / 0.80)
 */
export function calculateCreditPricing(input: CreditPricingInput): CreditPricingResult {
  const { program, eligibleBasis, creditPrice, isDDA, qei } = input;

  // Get base credit percentage
  let totalCreditPercent = TOTAL_CREDITS[program];
  let basis = eligibleBasis;
  let basisBoost: number | undefined;

  // Apply DDA boost for LIHTC programs
  if (isDDA && (program === 'LIHTC_9' || program === 'LIHTC_4')) {
    basisBoost = eligibleBasis * DDA_BOOST;
    basis = eligibleBasis * (1 + DDA_BOOST);
  }

  // For NMTC, use QEI if provided
  const creditBasis = program === 'NMTC' && qei ? qei : basis;

  // Calculate total credits
  const totalCredits = creditBasis * totalCreditPercent;

  // Calculate investment amount (what investor pays)
  const investmentAmount = totalCredits * creditPrice;

  // Calculate cash-on-cash return
  // CoC = Total Credit % / Price = effective return on investment
  const cashOnCash = totalCreditPercent / creditPrice;

  // Build credit schedule
  const schedule = CREDIT_SCHEDULES[program];
  const creditSchedule = schedule.map((pct, idx) => ({
    year: idx + 1,
    amount: creditBasis * pct,
  }));

  return {
    program,
    totalCredits,
    totalCreditPercent,
    investmentAmount,
    cashOnCash,
    creditSchedule,
    basisBoost,
  };
}

/**
 * Get indicative price range for a program
 */
export function getPriceRange(program: CreditProgram): { low: number; mid: number; high: number } {
  return MARKET_PRICE_RANGES[program];
}

/**
 * Format cash-on-cash as percentage string
 */
export function formatCashOnCash(coc: number): string {
  return `${(coc * 100).toFixed(1)}%`;
}

/**
 * Format credit price as cents
 */
export function formatCreditPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Get human-readable program name
 */
export function getProgramDisplayName(program: CreditProgram): string {
  const names: Record<CreditProgram, string> = {
    NMTC: 'New Markets Tax Credit',
    HTC: 'Historic Tax Credit',
    LIHTC_9: 'LIHTC 9%',
    LIHTC_4: 'LIHTC 4%',
    OZ: 'Opportunity Zone',
    BROWNFIELD: 'Brownfield',
  };
  return names[program];
}

/**
 * Calculate quick indicative pricing for display
 * Shows what investor would see at different price points
 */
export function getIndicativePricing(program: CreditProgram, basis: number, isDDA = false): {
  low: CreditPricingResult;
  mid: CreditPricingResult;
  high: CreditPricingResult;
} {
  const range = MARKET_PRICE_RANGES[program];

  return {
    low: calculateCreditPricing({ program, eligibleBasis: basis, creditPrice: range.low, isDDA }),
    mid: calculateCreditPricing({ program, eligibleBasis: basis, creditPrice: range.mid, isDDA }),
    high: calculateCreditPricing({ program, eligibleBasis: basis, creditPrice: range.high, isDDA }),
  };
}

/**
 * For stacked deals: Calculate combined credits from multiple programs
 */
export function calculateStackedCredits(
  programs: { program: CreditProgram; basis: number; price: number; isDDA?: boolean }[]
): {
  totalCredits: number;
  totalInvestment: number;
  programs: CreditPricingResult[];
  blendedCashOnCash: number;
} {
  const results = programs.map(p =>
    calculateCreditPricing({
      program: p.program,
      eligibleBasis: p.basis,
      creditPrice: p.price,
      isDDA: p.isDDA,
    })
  );

  const totalCredits = results.reduce((sum, r) => sum + r.totalCredits, 0);
  const totalInvestment = results.reduce((sum, r) => sum + r.investmentAmount, 0);
  const blendedCashOnCash = totalCredits / totalInvestment;

  return {
    totalCredits,
    totalInvestment,
    programs: results,
    blendedCashOnCash,
  };
}
