"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import logger from "@/lib/utils/logger";

// =============================================================================
// TYPES
// =============================================================================

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

interface ImprovedInteractiveMapProps {
  deals: MapDeal[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
  onTractClick?: (tract: TractInfo) => void;
  className?: string;
  centerLocation?: [number, number] | null;
  showTracts?: boolean;
  useFallbackData?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

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

const TRACT_FILL_COLOR = "#f97316";
const TRACT_FILL_OPACITY = 0.25;
const TRACT_LINE_COLOR = "#f97316";
const TRACT_LINE_WIDTH = 1.5;
const MIN_TRACT_ZOOM = 6;

// =============================================================================
// HELPERS
// =============================================================================

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

// =============================================================================
// COMPONENT
// =============================================================================

export default function ImprovedInteractiveMap({
  deals,
  selectedDealId,
  onSelectDeal,
  onTractClick,
  className = "",
  centerLocation,
  showTracts = true,
  useFallbackData = false,
}: ImprovedInteractiveMapProps) {
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
  const [tractError, setTractError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ==========================================================================
  // LOAD TRACTS FOR VIEWPORT
  // ==========================================================================
  const loadTractsForViewport = useCallback(async () => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !showTracts) return;
    if (isLoadingTracts.current) return;

    const zoom = map.getZoom();
    if (zoom < MIN_TRACT_ZOOM) {
      setTractCount(0);
      setTractError(null);
      return;
    }

    isLoadingTracts.current = true;
    setTractsLoading(true);
    setTractError(null);

    try {
      const bounds = map.getBounds();
      if (!bounds) return;

      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

      // Try improved API first, then fallback to original
      let apiUrl = `/api/geo/tracts-improved?bbox=${bbox}&limit=300`;
      if (useFallbackData) {
        apiUrl += "&fallback=true";
      }

      logger.info(
        "Loading tracts for viewport",
        { bbox, useFallbackData },
        "ImprovedMap",
      );

      let response = await fetch(apiUrl);
      let geojson;

      if (!response.ok) {
        // Fallback to original API
        logger.warn(
          "Improved API failed, trying original",
          null,
          "ImprovedMap",
        );
        response = await fetch(`/api/geo/tracts?bbox=${bbox}&limit=300`);

        if (!response.ok) {
          throw new Error(`Both APIs failed: ${response.status}`);
        }
      }

      geojson = await response.json();

      // Verify map still exists
      if (!mapInstanceRef.current) return;

      if (
        !geojson ||
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
      ) {
        throw new Error("Invalid GeoJSON response");
      }

      // Check if using fallback data
      if (geojson._fallback || geojson._error) {
        setUsingFallbackData(true);
        if (geojson._error) {
          setTractError(geojson._error);
        }
      } else {
        setUsingFallbackData(false);
      }

      logger.info(
        `Loaded ${geojson.features.length} tracts`,
        { fallback: !!geojson._fallback },
        "ImprovedMap",
      );
      setTractCount(geojson.features.length);

      // Update the source data
      const source = map.getSource("tracts") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      }
    } catch (error) {
      logger.error("Error loading tracts", error, "ImprovedMap");
      setTractError(
        `Failed to load tract data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setTractCount(0);
    } finally {
      isLoadingTracts.current = false;
      setTractsLoading(false);
    }
  }, [showTracts, useFallbackData]);

  // ==========================================================================
  // INITIALIZE MAP (runs once)
  // ==========================================================================
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
          logger.info("Mapbox map loaded successfully", null, "ImprovedMap");

          // Add tract source (empty initially)
          map.addSource("tracts", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          // Add tract fill layer
          map.addLayer({
            id: "tract-fills",
            type: "fill",
            source: "tracts",
            paint: {
              "fill-color": TRACT_FILL_COLOR,
              "fill-opacity": TRACT_FILL_OPACITY,
            },
          });

          // Add tract outline layer
          map.addLayer({
            id: "tract-outlines",
            type: "line",
            source: "tracts",
            paint: {
              "line-color": TRACT_LINE_COLOR,
              "line-width": TRACT_LINE_WIDTH,
              "line-opacity": 0.8,
            },
          });

          setMapReady(true);
        });

        // Track zoom
        map.on("zoom", () => {
          if (mounted && map) {
            setCurrentZoom(map.getZoom());
          }
        });

        // Load tracts on move end (debounced naturally by mapbox)
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
        map.on("mousemove", "tract-fills", async (e) => {
          if (!e.features?.[0] || !map || !mapboxgl) return;
          const geoid = e.features[0].properties?.GEOID;
          if (!geoid) return;

          if (popupRef.current) popupRef.current.remove();

          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15,
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `
              <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 160px;">
                <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">Census Tract</div>
                <div style="font-size: 14px; font-weight: 600; font-family: monospace;">${geoid}</div>
                ${usingFallbackData ? '<div style="font-size: 10px; color: #fbbf24; margin-top: 4px;">Sample Data</div>' : ""}
              </div>
            `,
            )
            .addTo(map);
        });

        // Tract click
        map.on("click", "tract-fills", (e) => {
          if (!e.features?.[0]) return;
          const geoid = e.features[0].properties?.GEOID;
          if (geoid && onTractClick) {
            onTractClick({
              geoid,
              eligible: true,
              severelyDistressed: false,
              programs: ["NMTC"],
            });
          }
        });
      } catch (error) {
        logger.error("Map initialization error", error, "ImprovedMap");
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
  }, [mapboxToken, onTractClick, loadTractsForViewport, usingFallbackData]);

  // ==========================================================================
  // LOAD TRACTS WHEN MAP IS READY
  // ==========================================================================
  useEffect(() => {
    if (mapReady && showTracts) {
      // Small delay to ensure everything is settled
      const timer = setTimeout(() => {
        loadTractsForViewport();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mapReady, showTracts, loadTractsForViewport]);

  // ==========================================================================
  // DEAL MARKERS (same as original)
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !mapReady) return;

    // Clear existing markers
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
            <div style="
              position: absolute; top: -4px; right: -4px;
              width: 12px; height: 12px;
              background: #4ade80; border: 2px solid white; border-radius: 50%;
            "></div>
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

      // Popup on hover
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
              <span>${(deal.projectCost / 1000000).toFixed(1)}M</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Gap:</span>
              <span style="color: #fb923c;">${(deal.financingGap / 1000000).toFixed(2)}M</span>
            </div>
          </div>
          ${
            deal.shovelReady
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
              <span style="color: #4ade80; font-size: 12px;">✓ Shovel Ready</span>
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

  // ==========================================================================
  // FLY TO SELECTED DEAL (same as original)
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !selectedDealId) return;

    const deal = deals.find((d) => d.id === selectedDealId);
    if (!deal) return;

    const coords = getCoordinatesForDeal(deal);
    if (!coords) return;

    map.flyTo({ center: coords, zoom: 12, duration: 1500 });
  }, [selectedDealId, deals, mapReady]);

  // ==========================================================================
  // FLY TO SEARCH LOCATION (same as original)
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !mapReady || !centerLocation) return;

    // Remove old search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // Create pulsing marker
    const el = document.createElement("div");
    el.innerHTML = `
      <div class="search-pulse" style="
        width: 24px; height: 24px;
        background: #ef4444; border: 3px solid white; border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `;

    searchMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat(centerLocation)
      .addTo(map);

    map.flyTo({ center: centerLocation, zoom: 12, duration: 1500 });
  }, [centerLocation, mapReady]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

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
      {showTracts && currentZoom < MIN_TRACT_ZOOM && (
        <div className="absolute top-4 left-16 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
          <p className="text-xs text-gray-400">
            <span className="text-orange-400">🗺️</span> Zoom in to see census
            tract polygons
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {tractsLoading && (
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400">Loading tracts...</span>
        </div>
      )}

      {/* Error indicator */}
      {tractError && !tractsLoading && (
        <div className="absolute top-4 right-4 bg-red-900/90 rounded-lg px-3 py-2 border border-red-700 z-10 max-w-xs">
          <p className="text-xs text-red-300">⚠️ {tractError}</p>
          <button
            onClick={() => loadTractsForViewport()}
            className="text-xs text-red-200 underline mt-1 hover:text-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Fallback data indicator */}
      {usingFallbackData && !tractError && (
        <div className="absolute top-4 right-4 bg-yellow-900/90 rounded-lg px-3 py-2 border border-yellow-700 z-10">
          <p className="text-xs text-yellow-300">📍 Using sample tract data</p>
        </div>
      )}

      {/* Tract count indicator */}
      {showTracts &&
        currentZoom >= MIN_TRACT_ZOOM &&
        tractCount > 0 &&
        !tractsLoading &&
        !tractError && (
          <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
            <span className="text-xs text-orange-400">
              {tractCount} tracts {usingFallbackData ? "(sample)" : ""}
            </span>
          </div>
        )}

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">Legend</p>
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
          {showTracts && currentZoom >= MIN_TRACT_ZOOM && (
            <>
              <div className="w-full h-px bg-gray-700 my-2" />
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: TRACT_FILL_COLOR, opacity: 0.5 }}
                ></div>
                <span className="text-xs text-gray-400">Census Tract</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
          {deals.length} deals • Zoom {currentZoom.toFixed(0)}
          {usingFallbackData && (
            <span className="text-yellow-400"> • Sample Data</span>
          )}
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
