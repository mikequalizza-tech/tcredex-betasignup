/**
 * Geo/Census Tract Resolution Utilities
 * 
 * Core functions for address → census tract resolution
 */

export interface TractResolution {
  tract_id: string;
  state_fips?: string;
  county_fips?: string;
  tract_code?: string;
  lat?: number;
  lng?: number;
}

export interface TractEligibility {
  tract_id: string;
  eligible: boolean;
  poverty_rate: number | null;
  median_income_pct: number | null;
  unemployment: number | null;
  severely_distressed: boolean;
  programs: string[];
  classification: string;
}

export interface FullTractData extends TractResolution, TractEligibility {}

/**
 * Resolve an address to its census tract ID
 */
export async function resolveCensusTract(address: string): Promise<TractResolution> {
  try {
    const res = await fetch(
      `/api/geo/resolve-tract?address=${encodeURIComponent(address)}`
    );
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Unable to resolve census tract: ${errorText}`);
    }
    return await res.json() as TractResolution;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error resolving census tract');
  }
}

/**
 * Get eligibility data for a census tract
 */
export async function getTractEligibility(tractId: string): Promise<TractEligibility> {
  try {
    const res = await fetch(`/api/eligibility?tract=${encodeURIComponent(tractId)}`);
    if (!res.ok) {
      // Return default non-eligible data instead of throwing
      return {
        tract_id: tractId,
        eligible: false,
        poverty_rate: null,
        median_income_pct: null,
        unemployment: null,
        severely_distressed: false,
        programs: [],
        classification: 'Unknown'
      };
    }
    const data = await res.json();
    return {
      tract_id: tractId,
      eligible: data.eligible,
      poverty_rate: data.povertyRate,
      median_income_pct: data.medianIncomePct,
      unemployment: data.unemployment,
      severely_distressed: data.programs?.includes('Severely Distressed') || false,
      programs: data.programs || [],
      classification: data.details?.classification || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching tract eligibility:', error);
    return {
      tract_id: tractId,
      eligible: false,
      poverty_rate: null,
      median_income_pct: null,
      unemployment: null,
      severely_distressed: false,
      programs: [],
      classification: 'Unknown'
    };
  }
}

/**
 * Full pipeline: Address → Tract → Eligibility
 */
export async function resolveAddressToEligibility(address: string): Promise<FullTractData> {
  // Step 1: Resolve address to tract
  const tract = await resolveCensusTract(address);
  
  // Step 2: Get eligibility for that tract
  const eligibility = await getTractEligibility(tract.tract_id);
  
  return {
    ...tract,
    ...eligibility
  };
}

/**
 * Resolve coordinates to census tract (for map clicks)
 */
export async function resolveCoordinatesToTract(lat: number, lng: number): Promise<TractResolution> {
  try {
    const res = await fetch(
      `/api/geo/resolve-tract?lat=${lat}&lng=${lng}`
    );
    if (!res.ok) {
      throw new Error("Unable to resolve coordinates to census tract");
    }
    return await res.json() as TractResolution;
  } catch (error) {
    console.error('Error resolving coordinates:', error);
    throw error;
  }
}

/**
 * Get GeoJSON geometry for a tract (for map display)
 */
export async function getTractGeometry(tractId: string): Promise<GeoJSON.Feature | null> {
  const res = await fetch(`/api/geo/tract-geometry?tract=${encodeURIComponent(tractId)}`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

/**
 * Get GeoJSON for multiple tracts in a bounding box (for map view)
 */
export async function getTractsInBounds(
  bounds: { north: number; south: number; east: number; west: number },
  options?: { eligibleOnly?: boolean; limit?: number }
): Promise<GeoJSON.FeatureCollection> {
  const params = new URLSearchParams({
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString(),
    ...(options?.eligibleOnly && { eligibleOnly: 'true' }),
    ...(options?.limit && { limit: options.limit.toString() })
  });
  
  const res = await fetch(`/api/geo/tracts-in-bounds?${params}`);
  if (!res.ok) {
    throw new Error("Unable to fetch tracts in bounds");
  }
  return res.json();
}
