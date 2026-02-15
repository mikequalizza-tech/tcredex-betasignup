'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Deal } from '@/lib/data/deals';
import { startTimer, endTimer, mapPerformance } from '@/lib/performance/monitor';

/**
 * HomeMapWithTracts - THE Community Tax Credit Source of Truth Map
 * =================================================================
 * Uses ONLY local Supabase data - NO external API calls
 * Source of Truth: tract_geometries + master_tax_credit_sot (via tract_map_layer view)
 *
 * Rendering Strategy:
 * - Zoom < 8: Vector tiles for instant full-US rendering (85K+ tracts)
 * - Zoom >= 8: GeoJSON polygons for detailed view with all program data
 *
 * Performance Optimization:
 * - Pre-warm WebGL context before map initialization
 * - Use requestAnimationFrame for smooth rendering
 * - Aggressive canvas forcing on visibility change
 * - Fallback static image while loading
 *
 * Color Scheme:
 * - Purple (has_any_tax_credit = true): Tract qualifies for at least one program
 * - Gray (has_any_tax_credit = false): Tract has no eligible programs
 * - GREEN/RED: Only shown AFTER address search (green=eligible, red=not eligible)
 *
 * Leveling the playing field - no more old boys network gatekeeping this data.
 */

// Pre-warm WebGL context to avoid first-render delay
const _preWarmWebGL = (container: HTMLElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  canvas.style.position = 'absolute';
  canvas.style.opacity = '0';
  canvas.style.pointerEvents = 'none';
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
  if (gl) {
    // Force WebGL to initialize
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.flush();
  }

  // Clean up after a short delay
  setTimeout(() => canvas.remove(), 100);
};

interface TractData {
  geoid: string;
  eligible: boolean;
  programs: string[];
  povertyRate?: number;
  medianIncomePct?: number;
  geometry?: GeoJSON.Geometry;
}

interface DealPin {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'nmtc' | 'lihtc' | 'oz';
  projectCost?: number;
}

interface HomeMapWithTractsProps {
  height?: string;
  className?: string;
  onTractSelect?: (tract: TractData | null) => void;
  searchedLocation?: { lat: number; lng: number; tract?: string; address?: string } | null;
  deals?: Deal[];
  allocations?: any[];
}

const PIN_COLORS: Record<string, string> = {
  nmtc: '#22c55e',
  lihtc: '#3b82f6',
  oz: '#a855f7',
  search: '#ef4444',
  searchEligible: '#22c55e',
  searchNotEligible: '#ef4444',
};

// Zoom threshold for switching between vector tiles and GeoJSON polygons
const VECTOR_TILE_MAX_ZOOM = 8;

export default function HomeMapWithTracts({
  height = '500px',
  className = '',
  onTractSelect,
  searchedLocation,
  deals: initialDeals,
  allocations: _allocations,
}: HomeMapWithTractsProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isLoadingTracts = useRef(false);
  const previousSearchRef = useRef<{ lat: number; lng: number; tract?: string; address?: string } | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [_loadingTract, setLoadingTract] = useState(false);
  const [tractCount, setTractCount] = useState(0);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Use IntersectionObserver to detect when map container is visible
  useEffect(() => {
    if (!mapContainer.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setMapVisible(true);
            // Force render when map becomes visible
            if (map.current) {
              map.current.resize();
              map.current.triggerRepaint();
            }
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of map is visible
    );

    observer.observe(mapContainer.current);

    return () => observer.disconnect();
  }, []);

  // Load tracts for current viewport
  // Strategy:
  // - Zoom < VECTOR_TILE_MAX_ZOOM: Vector tiles handle rendering (fast full-US)
  // - Zoom >= VECTOR_TILE_MAX_ZOOM: Load GeoJSON for detailed program data
  const loadTractsForViewport = useCallback(async () => {
    if (!map.current || isLoadingTracts.current) return;

    const zoom = map.current.getZoom();
    const bounds = map.current.getBounds();
    if (!bounds) return;

    startTimer('tract_load', { zoom, mode: zoom < VECTOR_TILE_MAX_ZOOM ? 'vector' : 'geojson' });

    // At low zoom, vector tiles handle everything - no GeoJSON needed
    if (zoom < VECTOR_TILE_MAX_ZOOM) {
      // Clear GeoJSON source when using vector tiles
      const polySource = map.current.getSource('tract-polygons') as mapboxgl.GeoJSONSource;
      if (polySource) {
        polySource.setData({ type: 'FeatureCollection', features: [] });
      }
      setTractCount(0);
      endTimer('tract_load');
      return;
    }

    isLoadingTracts.current = true;

    try {
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      const url = `/api/map/tracts?bbox=${bbox}`;

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'public, max-age=300' // 5 minute cache
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tracts');

      const geojson = await response.json();

      if (!map.current) return;

      // Update polygon source
      const polySource = map.current.getSource('tract-polygons') as mapboxgl.GeoJSONSource;
      if (polySource) {
        polySource.setData(geojson);
      }

      setTractCount(geojson.features?.length || 0);
      
      const duration = endTimer('tract_load');
      if (duration) {
        mapPerformance.trackTractLoad(geojson.features?.length || 0, duration, 'geojson');
      }

    } catch (_error) {
      // Silent error handling for production
      endTimer('tract_load');
    } finally {
      isLoadingTracts.current = false;
    }
  }, []);

  // Initialize map with optimized settings
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapVisible) return;

    if (!mapboxToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Create map with optimized settings
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      preserveDrawingBuffer: false, // Better performance
      antialias: false, // Better performance on mobile
      refreshExpiredTiles: false,
      fadeDuration: 100, // Minimal fade for better UX
      trackResize: true,
      renderWorldCopies: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Simple render forcing on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && map.current) {
        map.current.resize();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    map.current.on('load', () => {
      setMapLoaded(true);
      if (!map.current) return;

      // =================================================================
      // VECTOR TILE SOURCE - Fast full-US rendering at low zoom
      // =================================================================
      map.current.addSource('tract-tiles', {
        type: 'vector',
        tiles: [
          `${window.location.origin}/api/tiles/{z}/{x}/{y}`
        ],
        minzoom: 0,
        maxzoom: 14,
      });

      // Layer: Vector tile fills (low zoom - purple=eligible, gray=not)
      map.current.addLayer({
        id: 'tract-tile-fills',
        type: 'fill',
        source: 'tract-tiles',
        'source-layer': 'tracts',
        maxzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'e'], 1], '#a855f7',  // Purple for eligible
            '#6b7280'                             // Gray for not eligible
          ],
          'fill-opacity': 0.5
        }
      });

      // Layer: Vector tile outlines
      map.current.addLayer({
        id: 'tract-tile-outlines',
        type: 'line',
        source: 'tract-tiles',
        'source-layer': 'tracts',
        maxzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'e'], 1], '#7c3aed',  // Dark purple
            '#4b5563'                             // Dark gray
          ],
          'line-width': 0.5,
          'line-opacity': 0.6
        }
      });

      // =================================================================
      // GEOJSON SOURCE - Detailed view at high zoom
      // =================================================================
      map.current.addSource('tract-polygons', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Source for searched/highlighted tract
      map.current.addSource('searched-tract', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Layer: GeoJSON polygon fills (high zoom - purple=eligible, gray=not)
      // Same simple two-color scheme as vector tiles
      map.current.addLayer({
        id: 'tract-polygon-fills',
        type: 'fill',
        source: 'tract-polygons',
        minzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'has_any_tax_credit'], true], '#a855f7',  // Purple for eligible
            '#6b7280'                                                  // Gray for not eligible
          ],
          'fill-opacity': 0.5
        }
      });

      // Layer: GeoJSON polygon outlines
      map.current.addLayer({
        id: 'tract-polygon-outlines',
        type: 'line',
        source: 'tract-polygons',
        minzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'has_any_tax_credit'], true], '#7c3aed',  // Dark purple
            '#4b5563'                                                  // Dark gray
          ],
          'line-width': 1,
          'line-opacity': 0.8
        }
      });

      // Layer: Searched tract highlight
      map.current.addLayer({
        id: 'searched-tract-fill',
        type: 'fill',
        source: 'searched-tract',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'has_any_tax_credit'], true], '#22c55e',
            '#ef4444'
          ],
          'fill-opacity': 0.7
        }
      });

      map.current.addLayer({
        id: 'searched-tract-outline',
        type: 'line',
        source: 'searched-tract',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3
        }
      });

      // Hover popup for vector tiles (low zoom)
      map.current.on('mousemove', 'tract-tile-fills', (e) => {
        if (!map.current || !e.features?.[0]) return;
        map.current.getCanvas().style.cursor = 'pointer';

        if (popupRef.current) popupRef.current.remove();

        const props = e.features[0].properties;
        if (!props) return;

        const eligible = props.e === 1;
        const stackScore = props.s || 0;

        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background: #1f2937; color: white; padding: 10px; border-radius: 8px; font-family: system-ui; min-width: 160px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 14px;">${eligible ? '✓' : '✗'}</span>
                <span style="font-weight: 600; font-size: 13px; color: ${eligible ? '#a78bfa' : '#9ca3af'};">
                  ${eligible ? 'Has Tax Credits' : 'Not Eligible'}
                </span>
              </div>
              <p style="font-size: 11px; color: #9ca3af;">
                Tract: <span style="font-family: monospace; color: #d1d5db;">${props.geoid}</span>
              </p>
              ${stackScore > 0 ? `
                <p style="font-size: 10px; color: #a78bfa; margin-top: 4px;">
                  ${stackScore} program${stackScore > 1 ? 's' : ''} available
                </p>
              ` : ''}
              <p style="font-size: 9px; color: #6b7280; margin-top: 6px;">
                Zoom in for details
              </p>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseleave', 'tract-tile-fills', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      // Hover popup for GeoJSON polygons (high zoom - detailed info)
      map.current.on('mousemove', 'tract-polygon-fills', (e) => {
        if (!map.current || !e.features?.[0]) return;
        map.current.getCanvas().style.cursor = 'pointer';

        if (popupRef.current) popupRef.current.remove();

        const props = e.features[0].properties;
        if (!props) return;

        const eligible = props.has_any_tax_credit === true || props.has_any_tax_credit === 'true';
        let programs: string[] = [];
        try {
          programs = props.programs ? JSON.parse(props.programs) : [];
        } catch { /* ignore */ }

        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; font-family: system-ui; min-width: 180px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">${eligible ? '✓' : '✗'}</span>
                <span style="font-weight: 600; font-size: 14px; color: ${eligible ? '#a78bfa' : '#9ca3af'};">
                  ${eligible ? 'Tax Credit Eligible' : 'Not Eligible'}
                </span>
              </div>
              <p style="font-size: 12px; color: #9ca3af; margin-bottom: 6px;">
                Tract: <span style="font-family: monospace; color: #d1d5db;">${props.geoid || props.GEOID}</span>
              </p>
              ${programs.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                  ${programs.map((p: string) => `
                    <span style="padding: 2px 6px; font-size: 10px; background: rgba(124, 58, 237, 0.2); color: #a78bfa; border-radius: 4px;">${p}</span>
                  `).join('')}
                </div>
              ` : ''}
              ${props.poverty_rate ? `
                <div style="font-size: 11px; color: #9ca3af;">
                  Poverty: ${props.poverty_rate}% | MFI: ${props.mfi_pct || 'N/A'}%
                </div>
              ` : ''}
              ${props.state_name ? `
                <p style="font-size: 10px; color: #6b7280; margin-top: 6px;">
                  ${props.county_name ? props.county_name + ', ' : ''}${props.state_name}
                </p>
              ` : ''}
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseleave', 'tract-polygon-fills', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      // Click to select tract
      map.current.on('click', 'tract-polygon-fills', (e) => {
        const props = e.features?.[0]?.properties;
        if (props?.geoid && onTractSelect) {
          let programs: string[] = [];
          try {
            programs = props.programs ? JSON.parse(props.programs) : [];
          } catch { /* ignore */ }

          onTractSelect({
            geoid: props.geoid,
            eligible: props.eligible === true || props.eligible === 'true',
            programs,
            povertyRate: props.poverty_rate,
            medianIncomePct: props.mfi_pct,
          });
        }
      });

      // Load tracts on map move (debounced)
      let moveTimeout: NodeJS.Timeout | null = null;
      map.current.on('moveend', () => {
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
          loadTractsForViewport();
        }, 300);
      });

      // Initial load
      loadTractsForViewport();

      // TEMPORARILY DISABLED: Add deal markers (will be post-MVP feature)
      // Clear any existing deal markers to ensure clean map
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      
      // if (initialDeals && initialDeals.length > 0) {
      //   addDealMarkers(initialDeals);
      // } else {
      //   fetchDeals().then(addDealMarkers).catch(console.error);
      // }
    });

    return () => {
      // Clean up event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);

      // Clean up search marker
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }

      // Clean up popup
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, mapVisible, loadTractsForViewport, onTractSelect, initialDeals]);

  // Add deal markers
  const _addDealMarkers = useCallback((deals: Deal[]) => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const pins: DealPin[] = deals
      .filter(d => d.coordinates)
      .map(d => ({
        id: d.id,
        name: d.projectName,
        coordinates: d.coordinates!,
        type: d.programType.toLowerCase() as any,
        projectCost: d.projectCost || d.allocation * 5
      }));

    pins.forEach((deal) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 18px; height: 18px;
          background: ${PIN_COLORS[deal.type] || PIN_COLORS.search};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `;
      const marker = new mapboxgl.Marker(el)
        .setLngLat(deal.coordinates)
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, []);

  // Handle searched location
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchedLocation) return;

    const { lat, lng, tract, address } = searchedLocation;
    const previousSearch = previousSearchRef.current;

    // MapSection sets searchedLocation twice (lat/lng, then tract).
    // Skip the second pass when only tract was added for the same coordinate.
    const isTractOnlyUpdate =
      !!previousSearch &&
      previousSearch.lat === lat &&
      previousSearch.lng === lng &&
      !previousSearch.address &&
      !address &&
      !previousSearch.tract &&
      !!tract;

    previousSearchRef.current = { lat, lng, tract, address };

    if (isTractOnlyUpdate) {
      return;
    }

    map.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1500 });

    // Remove existing marker and popup
    if (searchMarkerRef.current) searchMarkerRef.current.remove();
    if (popupRef.current) popupRef.current.remove();

    // Fetch and highlight the searched tract
    const fetchSearchedTract = async () => {
      setLoadingTract(true);
      try {
        // Fetch tract geometry for polygon highlight
        const tractUrl = tract
          ? `/api/map/tracts?geoid=${tract}`
          : `/api/map/tracts?lat=${lat}&lng=${lng}`;

        const tractResponse = await fetch(tractUrl);
        const tractData = await tractResponse.json();

        // Only fetch eligibility here when we have an address (for HTC/property matching).
        // Tract-only responses are already available from /api/map/tracts.
        const eligibilityUrl = address
          ? `/api/eligibility?address=${encodeURIComponent(address)}`
          : null;

        let eligibilityData: {
          programs?: string[];
          htc?: { eligible: boolean; buildings: Array<{ property_name: string; street_address: string }> };
          federal?: { htc_eligible?: boolean };
        } | null = null;

        try {
          if (eligibilityUrl) {
            const eligibilityResponse = await fetch(eligibilityUrl);
            if (eligibilityResponse.ok) {
              eligibilityData = await eligibilityResponse.json();
            }
          }
        } catch (e) {
          console.error('[Map] Eligibility fetch error:', e);
        }

        if (tractData.features?.length > 0 && map.current) {
          const feature = tractData.features[0];
          const props = feature.properties || {};

          // Check tract-based eligibility OR HTC property-based eligibility
          const tractEligible = props.has_any_tax_credit === true || props.eligible === true;
          const htcEligible = eligibilityData?.htc?.eligible === true || eligibilityData?.federal?.htc_eligible === true;
          const isEligible = tractEligible || htcEligible;

          // Update source for polygon highlight
          const source = map.current.getSource('searched-tract') as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData(tractData);
          }

          // Create marker with eligibility-based color (small dot)
          const markerColor = isEligible ? PIN_COLORS.searchEligible : PIN_COLORS.searchNotEligible;
          const el = document.createElement('div');
          el.innerHTML = `<div style="width:12px;height:12px;background:${markerColor};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`;

          searchMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current);

          // Use programs from eligibility API if available (includes HTC), otherwise build from tract props
          let programs: string[] = [];
          if (eligibilityData?.programs && eligibilityData.programs.length > 0) {
            programs = eligibilityData.programs;
          } else {
            // Fallback: Build programs list from tract properties
            if (props.is_nmtc_eligible || props.severely_distressed) {
              programs.push('Federal NMTC');
              if (props.has_state_nmtc) programs.push('State NMTC');
            }
            if (props.is_qct || props.is_lihtc_qct) programs.push('LIHTC QCT');
            if (props.is_dda) programs.push('DDA (30% Boost)');
            if (props.is_oz || props.is_oz_designated) programs.push('Opportunity Zone');
          }

          // Create results popup
          popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: [0, -20],
            maxWidth: '320px',
          })
            .setLngLat([lng, lat])
            .setHTML(`
              <div style="background: #111827; color: white; padding: 16px; border-radius: 12px; font-family: system-ui; min-width: 280px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #374151;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isEligible ? '#22c55e' : '#ef4444'}; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 20px; color: white;">${isEligible ? '✓' : '✗'}</span>
                  </div>
                  <div>
                    <div style="font-weight: 700; font-size: 16px; color: ${isEligible ? '#22c55e' : '#ef4444'};">
                      ${isEligible ? 'TAX CREDIT ELIGIBLE' : 'NOT ELIGIBLE'}
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; font-family: monospace;">
                      Tract: ${props.geoid || props.GEOID || 'Unknown'}
                    </div>
                  </div>
                </div>

                ${isEligible && programs.length > 0 ? `
                  <div style="margin-bottom: 12px;">
                    <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px;">Available Programs</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${programs.map(p => `<span style="background: #1f2937; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #a78bfa;">${p}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}

                ${eligibilityData?.htc?.eligible && eligibilityData.htc.buildings?.length > 0 ? `
                  <div style="margin-bottom: 12px; padding: 10px; background: #14532d20; border-radius: 6px; border: 1px solid #166534;">
                    <div style="font-size: 11px; color: #86efac; text-transform: uppercase; margin-bottom: 6px;">Historic Property Found</div>
                    <div style="font-size: 13px; color: #22c55e; font-weight: 600;">${eligibilityData.htc.buildings[0].property_name}</div>
                    <div style="font-size: 11px; color: #9ca3af;">${eligibilityData.htc.buildings[0].street_address || ''}</div>
                    <div style="font-size: 10px; color: #6b7280; margin-top: 4px;">National Register of Historic Places - 20% Federal HTC</div>
                  </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  ${props.mfi_pct !== undefined && props.mfi_pct !== null ? `
                    <div style="background: #1f2937; padding: 8px; border-radius: 6px;">
                      <div style="font-size: 10px; color: #6b7280; text-transform: uppercase;">MFI %</div>
                      <div style="font-size: 18px; font-weight: 600; color: #60a5fa;">${typeof props.mfi_pct === 'number' ? props.mfi_pct.toFixed(1) : props.mfi_pct}%</div>
                    </div>
                  ` : ''}
                  ${props.poverty_rate !== undefined && props.poverty_rate !== null ? `
                    <div style="background: #1f2937; padding: 8px; border-radius: 6px;">
                      <div style="font-size: 10px; color: #6b7280; text-transform: uppercase;">Poverty Rate</div>
                      <div style="font-size: 18px; font-weight: 600; color: #f59e0b;">${typeof props.poverty_rate === 'number' ? props.poverty_rate.toFixed(1) : props.poverty_rate}%</div>
                    </div>
                  ` : ''}
                </div>

                ${!isEligible ? `
                  <div style="margin-top: 12px; padding: 8px; background: #7f1d1d20; border-radius: 6px; border: 1px solid #7f1d1d;">
                    <p style="font-size: 11px; color: #fca5a5; margin: 0;">
                      This location does not qualify for tract-based or historic tax credit programs.
                    </p>
                  </div>
                ` : ''}
              </div>
            `)
            .addTo(map.current);

          // Call onTractSelect callback with tract data
          if (onTractSelect) {
            onTractSelect({
              geoid: props.geoid || props.GEOID,
              eligible: isEligible,
              programs: programs,
              medianIncomePct: props.mfi_pct,
              povertyRate: props.poverty_rate,
            });
          }
        } else if (map.current) {
          // No tract found - show error marker (small gray dot)
          const el = document.createElement('div');
          el.innerHTML = `<div style="width:12px;height:12px;background:#6b7280;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`;

          searchMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current);
        }
      } catch (e) {
        console.error('[Map] Error fetching searched tract:', e);
      } finally {
        setLoadingTract(false);
      }
    };

    fetchSearchedTract();
  }, [searchedLocation, mapLoaded, onTractSelect]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      {/* Static map placeholder - shows immediately while interactive map loads */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10">
          {/* High-res static map from Mapbox with purple overlay to hint at tract colors */}
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-98.5795,39.8283,3.5,0/1280x720@2x?access_token=${mapboxToken}`}
            alt="US Tax Credit Eligibility Map"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Purple tint overlay to hint at tax credit data */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
              mixBlendMode: 'screen'
            }}
          />
          {/* Gradient fade at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

          {/* Loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-gray-900/80 rounded-xl px-6 py-4 backdrop-blur-sm border border-purple-500/30">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white font-medium">Loading Tax Credit Map</p>
              <p className="text-gray-400 text-xs mt-1">85,000+ census tracts nationwide</p>
            </div>
          </div>
        </div>
      )}

      <div ref={mapContainer} className="w-full h-full" />

      {/* Tract count */}
      {mapLoaded && tractCount > 0 && (
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
          <span className="text-xs text-purple-400">{tractCount} tracts</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">Census Tract Eligibility</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(168, 85, 247, 0.6)', border: '1px solid #a855f7' }} />
            <span className="text-xs text-gray-400">Has Tax Credits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(107, 114, 128, 0.6)', border: '1px solid #6b7280' }} />
            <span className="text-xs text-gray-400">Not Eligible</span>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-2 pt-2">
          <p className="text-[10px] text-gray-500 mb-1">After Address Search:</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(34, 197, 94, 0.7)', border: '1px solid #22c55e' }} />
            <span className="text-xs text-gray-400">Eligible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.7)', border: '1px solid #ef4444' }} />
            <span className="text-xs text-gray-400">Not Eligible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
