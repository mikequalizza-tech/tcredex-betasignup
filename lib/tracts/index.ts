/**
 * NMTC Census Tract Data Module
 *
 * This module provides access to NMTC eligibility data for 85,395 US census tracts.
 * Data source: CDFI Fund 2016-2020 ACS Low-Income Community Data
 *
 * Key statistics:
 * - Total tracts: 85,395
 * - Eligible tracts: 35,167 (41.2%)
 * - States/territories: 52
 *
 * Usage:
 * ```typescript
 * import { lookupTract, getTractsByState, searchTracts } from '@/lib/tracts';
 *
 * // Single lookup
 * const tract = await lookupTract('17031010100');
 *
 * // Get all tracts for a state
 * const ilTracts = await getTractsByState('IL');
 *
 * // Search with criteria
 * const distressed = await searchTracts({ severelyDistressed: true, limit: 50 });
 * ```
 */

export {
  lookupTract,
  lookupTracts,
  getTractsByState,
  getTractsByCounty,
  searchTracts,
  getTractStats,
  isDataLoaded,
  preloadTractData,
  STATE_FIPS,
  STATE_ABBR_TO_NAME,
  type TractEligibilityData,
} from "./tractData";
