/**
 * Debarment Checker
 * Validates entities against SAM.gov exclusion list
 */

export interface DebarmentResult {
  name: string;
  isDebarred: boolean;
  checkedAt: string;
  details?: string;
}

export async function checkSAM(name: string): Promise<DebarmentResult> {
  const apiKey = process.env.SAM_GOV_API_KEY;

  if (!apiKey) {
    console.warn("SAM.gov API key not configured");
    return {
      name,
      isDebarred: false,
      checkedAt: new Date().toISOString(),
      details: "API key not configured - manual verification required",
    };
  }

  try {
    const response = await fetch(
      `https://api.sam.gov/entity-information/v3/exclusions?api_key=${apiKey}&q=${encodeURIComponent(name)}`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      throw new Error(`SAM.gov API error: ${response.status}`);
    }

    const data = await response.json();
    const isDebarred =
      data.results?.some(
        (r: { exclusionStatus?: string }) => r.exclusionStatus === "Active",
      ) || false;

    return {
      name,
      isDebarred,
      checkedAt: new Date().toISOString(),
      details: isDebarred ? "Active exclusion found" : "No exclusions found",
    };
  } catch (error) {
    console.error("SAM.gov check failed:", error);
    return {
      name,
      isDebarred: false,
      checkedAt: new Date().toISOString(),
      details: `Check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function checkMultiple(
  names: string[],
): Promise<DebarmentResult[]> {
  return Promise.all(names.map(checkSAM));
}
