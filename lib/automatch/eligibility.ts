// tCredex v1.6 - QALICB Eligibility Engine

export interface QALICBInput {
  gross_income_test: boolean; // 50%+ gross income from active conduct in LIC
  tangible_property_test: boolean; // 40%+ tangible property used in LIC
  services_test: boolean; // 40%+ employee services performed in LIC
  collectibles_test: boolean; // No collectibles
  financial_property_test: boolean; // No nonqualified financial property
  prohibited_business: boolean; // Not a prohibited business type
  active_business: boolean; // Active conduct of trade or business
}

export interface EligibilityResult {
  eligible: boolean;
  passed_tests: string[];
  failed_tests: string[];
  recommendations: string[];
}

export function isQALICBEligible(input: QALICBInput): boolean {
  const basicTests =
    input.gross_income_test &&
    input.tangible_property_test &&
    input.services_test &&
    input.collectibles_test &&
    input.financial_property_test;

  const businessStatus = input.active_business && !input.prohibited_business;

  return basicTests && businessStatus;
}

export function getDetailedEligibility(input: QALICBInput): EligibilityResult {
  const tests = [
    {
      key: "gross_income_test",
      label: "Gross Income Test (50%)",
      passed: input.gross_income_test,
    },
    {
      key: "tangible_property_test",
      label: "Tangible Property Test (40%)",
      passed: input.tangible_property_test,
    },
    {
      key: "services_test",
      label: "Services Test (40%)",
      passed: input.services_test,
    },
    {
      key: "collectibles_test",
      label: "No Collectibles",
      passed: input.collectibles_test,
    },
    {
      key: "financial_property_test",
      label: "No Nonqualified Financial Property",
      passed: input.financial_property_test,
    },
    {
      key: "active_business",
      label: "Active Business",
      passed: input.active_business,
    },
    {
      key: "prohibited_business",
      label: "Not Prohibited Business",
      passed: !input.prohibited_business,
    },
  ];

  const passed_tests = tests.filter((t) => t.passed).map((t) => t.label);
  const failed_tests = tests.filter((t) => !t.passed).map((t) => t.label);

  const recommendations: string[] = [];

  if (!input.gross_income_test) {
    recommendations.push(
      "Increase business activity within the Low-Income Community to meet 50% gross income threshold",
    );
  }
  if (!input.tangible_property_test) {
    recommendations.push(
      "Relocate or acquire more tangible property within the LIC to meet 40% threshold",
    );
  }
  if (!input.services_test) {
    recommendations.push(
      "Hire employees or relocate service operations to within the LIC",
    );
  }
  if (input.prohibited_business) {
    recommendations.push(
      "Review business classification - certain business types are prohibited from NMTC",
    );
  }

  return {
    eligible: isQALICBEligible(input),
    passed_tests,
    failed_tests,
    recommendations,
  };
}

// Prohibited business types for NMTC
export const PROHIBITED_BUSINESSES = [
  "Residential rental property",
  "Massage parlor",
  "Hot tub facility",
  "Suntan facility",
  "Racetrack or gambling facility",
  "Golf course",
  "Country club",
  "Liquor store",
  "Certain farming businesses",
] as const;
