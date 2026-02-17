"use client";

import React, { useState, useEffect } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface DealLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface DealMapProps {
  center?: DealLocation;
  zoom?: number;
  markers?: DealLocation[];
  height?: string;
  className?: string;
}

export default function DealMap({
  center = { latitude: 39.8283, longitude: -98.5795 },
  zoom = 4,
  markers = [],
  height = "100%",
  className = "",
}: DealMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selectedMarker, setSelectedMarker] = useState<DealLocation | null>(
    null,
  );
  const [isMounted, setIsMounted] = useState(false);

  const [viewState, setViewState] = useState({
    latitude: center.latitude,
    longitude: center.longitude,
    zoom: zoom,
  });

  // Hydration guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update view when props change
  useEffect(() => {
    setViewState({
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: zoom,
    });
  }, [center.latitude, center.longitude, zoom]);

  // Show placeholder during SSR
  if (!isMounted) {
    return (
      <div
        className={`rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div
        className={`rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-gray-400 mb-2">
            Map requires NEXT_PUBLIC_MAPBOX_TOKEN
          </p>
          <p className="text-gray-500 text-sm">
            Add your Mapbox token to .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-md ${className}`}
      style={{ height }}
    >
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-right" />

        {/* Center marker (searched location) */}
        {center.name && (
          <Marker
            longitude={center.longitude}
            latitude={center.latitude}
            anchor="bottom"
          >
            <div
              className="relative cursor-pointer"
              onClick={() => setSelectedMarker(center)}
            >
              <div className="w-6 h-6 bg-indigo-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
          </Marker>
        )}

        {/* Deal markers */}
        {markers.map((loc, idx) => (
          <Marker
            key={idx}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
          >
            <div
              className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
              onClick={() => setSelectedMarker(loc)}
            />
          </Marker>
        ))}

        {/* Popup */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.longitude}
            latitude={selectedMarker.latitude}
            anchor="bottom"
            onClose={() => setSelectedMarker(null)}
            closeOnClick={false}
          >
            <div className="text-gray-900 text-sm font-medium">
              {selectedMarker.name || "Location"}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
