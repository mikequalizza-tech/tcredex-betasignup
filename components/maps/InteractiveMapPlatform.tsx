"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/**
 * InteractiveMapPlatform - Deal & Tract Map
 * =========================================
 * Uses ONLY local Supabase data - NO external API calls
 * Source of Truth: census_tracts table (with geom column)
 * Joined with lihtc_qct_2025 for LIHTC QCT data
 *
 * Rendering Strategy:
 * - Zoom < 6: Show tract centroids as points (fast)
 * - Zoom >= 6: Show full tract polygons (detailed)
 */

export interface MapDeal {
  id: string;
  projectName: string;
  location: string;
  parent?: string;
  address?: string;
  censusTract?: string;
  projectCost: number;
  financingGap: number;
  fedNmtcReq?: number;
  stateNmtcReq?: number;
  htc?: number;
  povertyRate?: number;
  medianIncome?: number;
  unemployment?: number;
  shovelReady?: boolean;
  completionDate?: string;
  coordinates?: [number, number];
}

interface TractInfo {
  geoid: string;
  eligible: boolean;
  severelyDistressed: boolean;
  povertyRate?: number;
  medianIncome?: number;
  unemploymentRate?: number;
  programs: string[];
}

interface InteractiveMapPlatformProps {
  deals: MapDeal[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
  onTractClick?: (tract: TractInfo) => void;
  className?: string;
  centerLocation?: [number, number] | null;
  showTracts?: boolean;
}

const KNOWN_COORDINATES: Record<string, [number, number]> = {
  "Springfield, IL": [-89.6501, 39.7817],
  "Detroit, MI": [-83.0458, 42.3314],
  "Baltimore, MD": [-76.6122, 39.2904],
  "Cleveland, OH": [-81.6944, 41.4993],
  "Memphis, TN": [-90.049, 35.1495],
  "St. Louis, MO": [-90.1994, 38.627],
  "Chicago, IL": [-87.6298, 41.8781],
  "Houston, TX": [-95.3698, 29.7604],
  "Dallas, TX": [-96.797, 32.7767],
  "Phoenix, AZ": [-112.074, 33.4484],
  "Philadelphia, PA": [-75.1652, 39.9526],
  "New York, NY": [-74.006, 40.7128],
  "Los Angeles, CA": [-118.2437, 34.0522],
  "Atlanta, GA": [-84.388, 33.749],
  "Miami, FL": [-80.1918, 25.7617],
  "Denver, CO": [-104.9903, 39.7392],
  "Seattle, WA": [-122.3321, 47.6062],
  "Austin, TX": [-97.7431, 30.2672],
  "San Antonio, TX": [-98.4936, 29.4241],
  "New Orleans, LA": [-90.0715, 29.9511],
};

const MIN_POLYGON_ZOOM = 6;

function getCoordinatesForDeal(deal: MapDeal): [number, number] | null {
  if (deal.coordinates) return deal.coordinates;
  for (const [city, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (
      deal.location.toLowerCase().includes(city.toLowerCase().split(",")[0])
    ) {
      return coords;
    }
  }
  return null;
}

export default function InteractiveMapPlatform({
  deals,
  selectedDealId,
  onSelectDeal,
  onTractClick,
  className = "",
  centerLocation,
  showTracts = true,
}: InteractiveMapPlatformProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapboxModule = useRef<any>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isLoadingTracts = useRef(false);
  const initStarted = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [tractsLoading, setTractsLoading] = useState(false);
  const [tractCount, setTractCount] = useState(0);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Load tracts for viewport - uses new unified API
  const loadTractsForViewport = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map || !showTracts || isLoadingTracts.current) return;

    const zoom = map.getZoom();
    const bounds = map.getBounds();
    if (!bounds) return;

    isLoadingTracts.current = true;
    setTractsLoading(true);

    try {
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      const useCentroids = zoom < MIN_POLYGON_ZOOM;
      // Use simplified geometries at low zoom for performance
      const useSimplified = zoom < 6;

      const url = useCentroids
        ? `/api/map/tracts?centroids=true&bbox=${bbox}`
        : `/api/map/tracts?bbox=${bbox}${useSimplified ? "&simplified=true" : ""}`;

      const response = await fetch(url, {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tracts");

      const geojson = await response.json();

      if (!mapInstanceRef.current) return;

      // Update the appropriate source
      if (useCentroids) {
        const centroidSource = map.getSource(
          "tract-centroids",
        ) as mapboxgl.GeoJSONSource;
        if (centroidSource) {
          centroidSource.setData(geojson);
        }
        const polySource = map.getSource("tracts") as mapboxgl.GeoJSONSource;
        if (polySource) {
          polySource.setData({ type: "FeatureCollection", features: [] });
        }
      } else {
        const polySource = map.getSource("tracts") as mapboxgl.GeoJSONSource;
        if (polySource) {
          polySource.setData(geojson);
        }
        const centroidSource = map.getSource(
          "tract-centroids",
        ) as mapboxgl.GeoJSONSource;
        if (centroidSource) {
          centroidSource.setData({ type: "FeatureCollection", features: [] });
        }
      }

      setTractCount(geojson.features?.length || 0);
    } catch (_error) {
      // Silent error handling for production
    } finally {
      isLoadingTracts.current = false;
      setTractsLoading(false);
    }
  }, [showTracts]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (initStarted.current) return;
    initStarted.current = true;

    let mounted = true;
    let map: mapboxgl.Map | null = null;

    const initMap = async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (!mounted) return;

        mapboxModule.current = mapboxgl;
        mapboxgl.accessToken = mapboxToken;

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [-95.7129, 37.0902],
          zoom: 4,
          minZoom: 3,
          maxZoom: 18,
        });

        mapInstanceRef.current = map;

        map.addControl(new mapboxgl.NavigationControl(), "top-left");
        map.addControl(new mapboxgl.ScaleControl(), "bottom-left");

        map.on("load", () => {
          if (!mounted || !map) return;

          // Source for centroids (zoomed out)
          map.addSource("tract-centroids", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          // Source for polygons (zoomed in)
          map.addSource("tracts", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          // Layer: Centroid circles
          // Colors: OZ=Purple, LIHTC=Green, State NMTC=Blue, State HTC=Amber, Severely Distressed=Red
          map.addLayer({
            id: "tract-centroid-layer",
            type: "circle",
            source: "tract-centroids",
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                2,
                6,
                4,
              ],
              "circle-color": [
                "case",
                ["==", ["get", "severely_distressed"], true],
                "#dc2626", // Red for severely distressed
                ["==", ["get", "is_oz_designated"], true],
                "#a855f7", // Purple for Opportunity Zone
                ["==", ["get", "is_lihtc_qct"], true],
                "#22c55e", // Green for LIHTC QCT
                ["==", ["get", "has_state_nmtc"], true],
                "#3b82f6", // Blue for State NMTC
                ["==", ["get", "has_state_htc"], true],
                "#f59e0b", // Amber for State HTC
                "#6b7280", // Gray for no eligibility
              ],
              "circle-opacity": 0.7,
            },
          });

          // Layer: Polygon fills
          // Colors: OZ=Purple, LIHTC=Green, State NMTC=Blue, State HTC=Amber, Severely Distressed=Red
          map.addLayer({
            id: "tract-fills",
            type: "fill",
            source: "tracts",
            paint: {
              "fill-color": [
                "case",
                // Severely distressed takes priority
                [
                  "any",
                  ["==", ["get", "severelyDistressed"], true],
                  ["==", ["get", "severely_distressed"], true],
                ],
                "#dc2626", // Red
                // Opportunity Zone
                ["==", ["get", "is_oz_designated"], true],
                "#a855f7", // Purple
                // LIHTC QCT
                ["==", ["get", "is_lihtc_qct"], true],
                "#22c55e", // Green
                // State NMTC
                ["==", ["get", "has_state_nmtc"], true],
                "#3b82f6", // Blue
                // State HTC
                ["==", ["get", "has_state_htc"], true],
                "#f59e0b", // Amber
                // Default - not eligible
                "#e5e7eb", // Light gray
              ],
              "fill-opacity": [
                "case",
                // Higher opacity for eligible tracts
                ["==", ["get", "eligible"], true],
                0.5,
                0.2,
              ],
            },
          });

          // Layer: Polygon outlines
          // Matching border colors for each tax credit type
          map.addLayer({
            id: "tract-outlines",
            type: "line",
            source: "tracts",
            paint: {
              "line-color": [
                "case",
                // Severely distressed
                [
                  "any",
                  ["==", ["get", "severelyDistressed"], true],
                  ["==", ["get", "severely_distressed"], true],
                ],
                "#991b1b", // Dark red
                // Opportunity Zone
                ["==", ["get", "is_oz_designated"], true],
                "#7e22ce", // Dark purple
                // LIHTC QCT
                ["==", ["get", "is_lihtc_qct"], true],
                "#16a34a", // Dark green
                // State NMTC
                ["==", ["get", "has_state_nmtc"], true],
                "#2563eb", // Dark blue
                // State HTC
                ["==", ["get", "has_state_htc"], true],
                "#d97706", // Dark amber
                // Default
                "#d1d5db", // Gray
              ],
              "line-width": 1,
              "line-opacity": 0.8,
            },
          });

          setMapReady(true);
        });

        map.on("error", (e) => {
          console.error("[Map] Mapbox error:", e);
        });

        // Track zoom
        map.on("zoom", () => {
          if (mounted && map) {
            setCurrentZoom(map.getZoom());
          }
        });

        // Load tracts on move (debounced)
        let moveTimeout: NodeJS.Timeout | null = null;
        map.on("moveend", () => {
          if (moveTimeout) clearTimeout(moveTimeout);
          moveTimeout = setTimeout(() => {
            if (mounted && mapInstanceRef.current) {
              loadTractsForViewport();
            }
          }, 300);
        });

        // Tract hover
        map.on("mouseenter", "tract-fills", () => {
          if (map) map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "tract-fills", () => {
          if (map) map.getCanvas().style.cursor = "";
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        });

        // Tract hover popup
        map.on("mousemove", "tract-fills", (e) => {
          if (!e.features?.[0] || !map || !mapboxgl) return;
          const feature = e.features[0];
          const geoid = feature.properties?.GEOID || feature.properties?.geoid;
          const eligible =
            feature.properties?.eligible === true ||
            feature.properties?.eligible === "true" ||
            feature.properties?.is_nmtc_lic === true;

          if (!geoid) return;

          if (popupRef.current) popupRef.current.remove();

          let programs: string[] = [];
          try {
            programs = feature.properties?.programs
              ? JSON.parse(feature.properties.programs)
              : [];
          } catch {
            programs = [];
          }

          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15,
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 200px; font-family: system-ui;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 20px;">${eligible ? "✓" : "✗"}</span>
                  <span style="font-weight: 600; font-size: 14px; color: ${eligible ? "#4ade80" : "#f87171"};">
                    ${eligible ? "Tax Credit Eligible" : "Not Eligible"}
                  </span>
                </div>
                <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">
                  Census Tract: <span style="font-family: monospace; color: #d1d5db;">${geoid}</span>
                </p>
                ${
                  programs.length > 0
                    ? `
                  <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                    ${programs
                      .map(
                        (p: string) => `
                      <span style="padding: 3px 8px; font-size: 10px; font-weight: 600; border-radius: 9999px;
                        background: rgba(124, 58, 237, 0.2); color: #a78bfa; border: 1px solid rgba(124, 58, 237, 0.4);">
                        ${p}
                      </span>
                    `,
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
                ${
                  feature.properties?.povertyRate ||
                  feature.properties?.poverty_rate
                    ? `
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 10px; border-top: 1px solid #374151; font-size: 12px;">
                    <div>
                      <p style="color: #6b7280; font-size: 10px;">Poverty Rate</p>
                      <p style="font-weight: 600; color: #d1d5db;">${feature.properties?.povertyRate || feature.properties?.poverty_rate}%</p>
                    </div>
                    <div>
                      <p style="color: #6b7280; font-size: 10px;">Median Income</p>
                      <p style="font-weight: 600; color: #d1d5db;">${feature.properties?.medianIncomePct || feature.properties?.mfi_pct || "N/A"}% AMI</p>
                    </div>
                  </div>
                `
                    : ""
                }
                ${
                  feature.properties?.state_name
                    ? `
                  <p style="font-size: 10px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
                    ${feature.properties?.county_name ? feature.properties.county_name + ", " : ""}${feature.properties.state_name}
                  </p>
                `
                    : ""
                }
              </div>
            `,
            )
            .addTo(map);
        });

        // Tract click
        map.on("click", "tract-fills", (e) => {
          if (!e.features?.[0]) return;

          const geoid =
            e.features[0].properties?.GEOID || e.features[0].properties?.geoid;
          const eligible =
            e.features[0].properties?.eligible === true ||
            e.features[0].properties?.eligible === "true" ||
            e.features[0].properties?.is_nmtc_lic === true;
          const severelyDistressed =
            e.features[0].properties?.severelyDistressed === true ||
            e.features[0].properties?.severely_distressed === true;

          let programs: string[] = [];
          try {
            const progStr = e.features[0].properties?.programs;
            programs = progStr ? JSON.parse(progStr) : [];
          } catch {
            programs = [];
          }

          if (geoid && onTractClick) {
            onTractClick({
              geoid,
              eligible,
              severelyDistressed,
              programs,
              povertyRate: e.features[0].properties?.poverty_rate,
              medianIncome: e.features[0].properties?.mfi_pct,
            });
          }
        });
      } catch (error) {
        console.error("[Map] Init error:", error);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapboxToken, onTractClick, loadTractsForViewport]);

  // Load tracts when map is ready
  useEffect(() => {
    if (mapReady && showTracts) {
      const timer = setTimeout(() => {
        loadTractsForViewport();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mapReady, showTracts, loadTractsForViewport]);

  // Deal markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    deals.forEach((deal) => {
      const coords = getCoordinatesForDeal(deal);
      if (!coords) return;

      const isSelected = deal.id === selectedDealId;

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: ${isSelected ? "28px" : "20px"};
          height: ${isSelected ? "28px" : "20px"};
          background: ${isSelected ? "#818cf8" : "#6366f1"};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: all 0.2s;
          ${isSelected ? "box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.5);" : ""}
        ">
          ${
            deal.shovelReady
              ? `
            <div style="position: absolute; top: -4px; right: -4px;
              width: 12px; height: 12px; background: #4ade80;
              border: 2px solid white; border-radius: 50%;"></div>
          `
              : ""
          }
        </div>
      `;

      const marker = new mapboxgl.Marker(el).setLngLat(coords).addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectDeal(deal.id);
      });

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${deal.projectName}</h3>
          <p style="font-size: 12px; color: #818cf8; margin-bottom: 8px;">${deal.location}</p>
          <div style="font-size: 12px; display: grid; gap: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Cost:</span>
              <span>$${(deal.projectCost / 1000000).toFixed(1)}M</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Gap:</span>
              <span style="color: #fb923c;">$${(deal.financingGap / 1000000).toFixed(2)}M</span>
            </div>
          </div>
          ${
            deal.shovelReady
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
              <span style="color: #4ade80; font-size: 12px;">Shovel Ready</span>
            </div>
          `
              : ""
          }
        </div>
      `);

      el.addEventListener("mouseenter", () => {
        marker.setPopup(popup);
        popup.addTo(map);
      });
      el.addEventListener("mouseleave", () => popup.remove());

      markersRef.current.set(deal.id, marker);
    });
  }, [deals, selectedDealId, mapReady, onSelectDeal]);

  // Fly to selected deal
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !selectedDealId) return;

    const deal = deals.find((d) => d.id === selectedDealId);
    if (!deal) return;

    const coords = getCoordinatesForDeal(deal);
    if (!coords) return;

    map.flyTo({ center: coords, zoom: 12, duration: 1500 });
  }, [selectedDealId, deals, mapReady]);

  // Fly to search location
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !mapReady || !centerLocation) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="width: 24px; height: 24px; background: #ef4444;
        border: 3px solid white; border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
    `;

    searchMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat(centerLocation)
      .addTo(map);

    map.flyTo({ center: centerLocation, zoom: 12, duration: 1500 });
  }, [centerLocation, mapReady]);

  if (!mapboxToken) {
    return (
      <div
        className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}
      >
        <div className="text-center p-8">
          <p className="text-gray-400 mb-2">Map requires configuration</p>
          <p className="text-sm text-gray-600">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Zoom hint */}
      {showTracts && currentZoom < MIN_POLYGON_ZOOM && (
        <div className="absolute top-4 left-16 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
          <p className="text-xs text-gray-400">Zoom in to see tract polygons</p>
        </div>
      )}

      {/* Loading indicator */}
      {tractsLoading && (
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400">Loading tracts...</span>
        </div>
      )}

      {/* Tract count */}
      {showTracts &&
        currentZoom >= MIN_POLYGON_ZOOM &&
        tractCount > 0 &&
        !tractsLoading && (
          <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
            <span className="text-xs text-purple-400">{tractCount} tracts</span>
          </div>
        )}

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">
          Tax Credit Eligibility
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full border border-white"></div>
            <span className="text-xs text-gray-400">Active Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-indigo-500 rounded-full border border-white"></div>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-400">Shovel Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
            <span className="text-xs text-gray-400">Search Location</span>
          </div>
          {showTracts && currentZoom >= MIN_POLYGON_ZOOM && (
            <>
              <div className="w-full h-px bg-gray-700 my-2" />
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{
                    background: "rgba(220, 38, 38, 0.6)",
                    border: "1px solid #dc2626",
                  }}
                />
                <span className="text-xs text-gray-400">
                  Severely Distressed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{
                    background: "rgba(168, 85, 247, 0.6)",
                    border: "1px solid #a855f7",
                  }}
                />
                <span className="text-xs text-gray-400">Opportunity Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{
                    background: "rgba(34, 197, 94, 0.6)",
                    border: "1px solid #22c55e",
                  }}
                />
                <span className="text-xs text-gray-400">LIHTC QCT</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{
                    background: "rgba(59, 130, 246, 0.6)",
                    border: "1px solid #3b82f6",
                  }}
                />
                <span className="text-xs text-gray-400">State NMTC</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm"
                  style={{
                    background: "rgba(245, 158, 11, 0.6)",
                    border: "1px solid #f59e0b",
                  }}
                />
                <span className="text-xs text-gray-400">State HTC</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
          {deals.length} deals{" "}
          {showTracts &&
            currentZoom >= MIN_POLYGON_ZOOM &&
            tractCount > 0 &&
            `| ${tractCount} tracts`}
        </div>
      </div>

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
