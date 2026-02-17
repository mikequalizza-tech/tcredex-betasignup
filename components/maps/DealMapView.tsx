"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Deal } from "@/lib/data/deals";

interface DealMapViewProps {
  deals: Deal[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
}

// Approximate coordinates for demo deals
const dealCoordinates: Record<string, [number, number]> = {
  D12345: [-89.6501, 39.7817], // Springfield, IL
  D12346: [-83.0458, 42.3314], // Detroit, MI
  D12347: [-76.6122, 39.2904], // Baltimore, MD
  D12348: [-81.6944, 41.4993], // Cleveland, OH
  D12349: [-90.049, 35.1495], // Memphis, TN
  D12350: [-90.1994, 38.627], // St. Louis, MO
};

export default function DealMapView({
  deals,
  selectedDealId,
  onSelectDeal,
}: DealMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!mapboxToken) {
      console.warn("Mapbox token not configured");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.current.on("load", () => {
      setMapLoaded(true);

      // Add state boundaries layer for visual effect
      if (map.current) {
        map.current.addSource("states", {
          type: "geojson",
          data: "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json",
        });

        map.current.addLayer({
          id: "state-fills",
          type: "fill",
          source: "states",
          paint: {
            "fill-color": "#1e3a5f",
            "fill-opacity": 0.3,
          },
        });

        map.current.addLayer({
          id: "state-borders",
          type: "line",
          source: "states",
          paint: {
            "line-color": "#4a5568",
            "line-width": 1,
          },
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update markers when deals change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each deal
    deals.forEach((deal) => {
      const coords = dealCoordinates[deal.id];
      if (!coords) return;

      const isSelected = deal.id === selectedDealId;

      // Create marker element
      const el = document.createElement("div");
      el.className = "deal-marker";
      el.innerHTML = `
        <div class="w-4 h-4 rounded-full ${isSelected ? "bg-indigo-400 ring-4 ring-indigo-400/30" : "bg-indigo-500"} 
          border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform">
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current!);

      // Add click handler
      el.addEventListener("click", () => {
        onSelectDeal(deal.id);
      });

      // Add popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: "deal-popup",
      }).setHTML(`
        <div class="bg-gray-900 text-white p-3 rounded-lg min-w-[200px]">
          <h3 class="font-semibold text-sm">${deal.projectName}</h3>
          <p class="text-xs text-indigo-400">${deal.city}, ${deal.state}</p>
          <div class="mt-2 text-xs">
            <span class="text-gray-400">Cost:</span> 
            <span class="text-white">$${((deal.projectCost || 0) / 1000000).toFixed(1)}M</span>
          </div>
          <div class="text-xs">
            <span class="text-gray-400">Gap:</span> 
            <span class="text-orange-400">$${((deal.financingGap || 0) / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      `);

      marker.setPopup(popup);
      markersRef.current.push(marker);
    });

    // If a deal is selected, fly to it
    if (selectedDealId && dealCoordinates[selectedDealId]) {
      map.current.flyTo({
        center: dealCoordinates[selectedDealId],
        zoom: 10,
        duration: 1000,
      });
    }
  }, [deals, selectedDealId, mapLoaded, onSelectDeal]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-gray-400 mb-4">
          Map requires NEXT_PUBLIC_MAPBOX_TOKEN
        </div>
        <p className="text-sm text-gray-600 max-w-md text-center">
          Add your Mapbox access token to .env.local to enable the interactive
          map. Get a free token at mapbox.com
        </p>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
}
