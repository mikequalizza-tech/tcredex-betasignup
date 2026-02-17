"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

// Set Mapbox token only if available
if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

interface TractProperties {
  geoid: string;
  state: string;
  county: string;
  nmtc_lic: boolean;
  lihtc_qct: boolean;
  oz: boolean;
  state_nmtc: string | null;
  state_lihtc: string | null;
  stackability: string | null;
  stack_count: number;
}

export default function TractMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTract, setSelectedTract] = useState<TractProperties | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTracts = async (map: mapboxgl.Map) => {
    const bounds = map.getBounds();
    if (!bounds) return;
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/tracts/geojson?bbox=${bbox}`);
      const geojson = await res.json();
      
      const source = map.getSource("tracts") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      }
    } catch (err) {
      console.error("Failed to load tracts:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.warn('TractMap: NEXT_PUBLIC_MAPBOX_TOKEN not set');
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Empty source initially
      map.addSource("tracts", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Stack count color layer
      map.addLayer({
        id: "tract-fill",
        type: "fill",
        source: "tracts",
        paint: {
          "fill-color": [
            "match",
            ["get", "stack_count"],
            0, "#9E9E9E",   // Gray - not eligible
            1, "#F4E04D",   // Yellow - one program
            2, "#F59E0B",   // Orange - two programs  
            3, "#7C3AED",   // Purple - triple stack
            "#CCCCCC"
          ],
          "fill-opacity": 0.6,
        },
      });

      // Tract outlines
      map.addLayer({
        id: "tract-outline",
        type: "line",
        source: "tracts",
        paint: {
          "line-color": "#374151",
          "line-width": 0.5,
        },
      });

      // Hover highlight
      map.addLayer({
        id: "tract-hover",
        type: "fill",
        source: "tracts",
        paint: {
          "fill-color": "#3B82F6",
          "fill-opacity": 0.4,
        },
        filter: ["==", ["get", "geoid"], ""],
      });

      // Load tracts on zoom/pan
      map.on("moveend", () => {
        if (map.getZoom() >= 8) {
          loadTracts(map);
        }
      });

      // Initial load if zoomed in enough
      if (map.getZoom() >= 8) {
        loadTracts(map);
      }

      // Hover effect
      map.on("mousemove", "tract-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features?.length) {
          const geoid = e.features[0].properties?.geoid;
          map.setFilter("tract-hover", ["==", ["get", "geoid"], geoid]);
        }
      });

      map.on("mouseleave", "tract-fill", () => {
        map.getCanvas().style.cursor = "";
        map.setFilter("tract-hover", ["==", ["get", "geoid"], ""]);
      });

      // Click to select
      map.on("click", "tract-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        // GeoJSON properties may come as strings
        const parsed: TractProperties = {
          geoid: props?.geoid || "",
          state: props?.state || "",
          county: props?.county || "",
          nmtc_lic: props?.nmtc_lic === true || props?.nmtc_lic === "true",
          lihtc_qct: props?.lihtc_qct === true || props?.lihtc_qct === "true",
          oz: props?.oz === true || props?.oz === "true",
          state_nmtc: props?.state_nmtc || null,
          state_lihtc: props?.state_lihtc || null,
          stackability: props?.stackability || null,
          stack_count: Number(props?.stack_count) || 0,
        };
        setSelectedTract(parsed);
      });
    });

    return () => map.remove();
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded shadow">
          Loading tracts...
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded shadow text-sm">
        Zoom to level 8+ to see tracts
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Eligibility Stack</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#7C3AED" }} />
            <span>Triple (NMTC + LIHTC + OZ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#F59E0B" }} />
            <span>Double (2 programs)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#F4E04D" }} />
            <span>Single (1 program)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#9E9E9E" }} />
            <span>Not eligible</span>
          </div>
        </div>
      </div>

      {/* Selected tract sidebar */}
      {selectedTract && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded shadow w-80">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold">Tract {selectedTract.geoid}</h3>
            <button 
              onClick={() => setSelectedTract(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {selectedTract.county}, {selectedTract.state}
          </p>

          <div className="space-y-2 text-sm">
            <h4 className="font-medium text-gray-700">Federal Programs</h4>
            <div className="flex items-center gap-2">
              <span className={selectedTract.nmtc_lic ? "text-green-600" : "text-gray-400"}>
                {selectedTract.nmtc_lic ? "✓" : "✗"}
              </span>
              <span>NMTC Low-Income Community</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={selectedTract.lihtc_qct ? "text-green-600" : "text-gray-400"}>
                {selectedTract.lihtc_qct ? "✓" : "✗"}
              </span>
              <span>LIHTC Qualified Census Tract</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={selectedTract.oz ? "text-green-600" : "text-gray-400"}>
                {selectedTract.oz ? "✓" : "✗"}
              </span>
              <span>Opportunity Zone</span>
            </div>

            <h4 className="font-medium text-gray-700 mt-3">State Programs</h4>
            <div className="flex items-center gap-2">
              <span className={selectedTract.state_nmtc === "Y" ? "text-green-600" : "text-gray-400"}>
                {selectedTract.state_nmtc === "Y" ? "✓" : selectedTract.state_nmtc === "TBD" ? "?" : "✗"}
              </span>
              <span>State NMTC</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={selectedTract.state_lihtc === "Y" ? "text-green-600" : "text-gray-400"}>
                {selectedTract.state_lihtc === "Y" ? "✓" : "✗"}
              </span>
              <span>State LIHTC</span>
            </div>
            
            {selectedTract.stackability && (
              <div className="mt-2 pt-2 border-t">
                <span className="text-gray-600">Stackability: </span>
                <span className="font-medium">{selectedTract.stackability}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
