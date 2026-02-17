// tCredex v1.6 - SAM.gov Debarment Checker

export interface DebarmentCheckResult {
  entity_name: string;
  checked_at: string;
  is_debarred: boolean;
  exclusion_type?: string;
  exclusion_date?: string;
  source: string;
}

/**
 * Check SAM.gov for entity exclusion status
 * Note: Requires SAM.gov API key in environment
 */
export async function checkSAMDebarment(name: string): Promise<DebarmentCheckResult> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  
  if (!apiKey) {
    console.warn('SAM.gov API key not configured');
    return {
      entity_name: name,
      checked_at: new Date().toISOString(),
      is_debarred: false,
      source: 'unchecked - no API key'
    };
  }

  try {
    const response = await fetch(
      `https://api.sam.gov/entity-information/v3/exclusions?api_key=${apiKey}&q=${encodeURIComponent(name)}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`SAM.gov API error: ${response.status}`);
    }
    
    const data = await response.json();
    const hasActiveExclusion = data.results?.some(
      (r: { exclusionStatus: string }) => r.exclusionStatus === 'Active'
    ) || false;
    
    const activeExclusion = data.results?.find(
      (r: { exclusionStatus: string }) => r.exclusionStatus === 'Active'
    );
    
    return {
      entity_name: name,
      checked_at: new Date().toISOString(),
      is_debarred: hasActiveExclusion,
      exclusion_type: activeExclusion?.exclusionType,
      exclusion_date: activeExclusion?.exclusionDate,
      source: 'sam.gov'
    };
  } catch (error) {
    console.error('SAM.gov check failed:', error);
    return {
      entity_name: name,
      checked_at: new Date().toISOString(),
      is_debarred: false,
      source: 'error - check failed'
    };
  }
}

/**
 * Batch check multiple entities
 */
export async function batchCheckDebarment(
  names: string[]
): Promise<DebarmentCheckResult[]> {
  const results = await Promise.all(
    names.map(name => checkSAMDebarment(name))
  );
  return results;
}
