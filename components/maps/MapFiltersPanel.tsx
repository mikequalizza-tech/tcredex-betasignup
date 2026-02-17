"use client";

import { useState } from "react";
import { MapFilters, defaultMapFilters, LAYER_COLORS } from "@/lib/map/filters";

interface MapFiltersPanelProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  className?: string;
}

export default function MapFiltersPanel({
  filters,
  onChange,
  className = "",
}: MapFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggle = (key: keyof MapFilters) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const updateRange = (key: keyof MapFilters, value: number) => {
    onChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onChange(defaultMapFilters);
  };

  return (
    <div
      className={`bg-gray-900/95 rounded-xl border border-gray-700 shadow-xl ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span className="font-semibold text-gray-200">Map Filters</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Program Layers */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Program Layers
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.show_nmtc}
                  onChange={() => toggle("show_nmtc")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: LAYER_COLORS.nmtc.eligible }}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  NMTC Eligible Tracts
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.show_lihtc}
                  onChange={() => toggle("show_lihtc")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: LAYER_COLORS.lihtc.qct }}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  LIHTC QCT Areas
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.show_htc}
                  onChange={() => toggle("show_htc")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: LAYER_COLORS.htc.eligible }}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  HTC Eligible Areas
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.show_oz}
                  onChange={() => toggle("show_oz")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: LAYER_COLORS.oz.active }}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Opportunity Zones
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.show_brownfield}
                  onChange={() => toggle("show_brownfield")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: LAYER_COLORS.brownfield.certified }}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Brownfield Sites
                </span>
              </label>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-700" />

          {/* Distress Filters */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Distress Filters
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.severely_distressed_only}
                  onChange={() => toggle("severely_distressed_only")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500 focus:ring-offset-gray-900"
                />
                <div
                  className="w-3 h-3 rounded"
                  style={{
                    backgroundColor: LAYER_COLORS.nmtc.severelyDistressed,
                  }}
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Severely Distressed Only
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.qct_only}
                  onChange={() => toggle("qct_only")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Qualified Census Tracts
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.underserved_states_only}
                  onChange={() => toggle("underserved_states_only")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-600 focus:ring-amber-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Underserved States Only
                </span>
              </label>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-700" />

          {/* Deal Filters */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Deal Display
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.show_deal_pins}
                  onChange={() => toggle("show_deal_pins")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Show Deal Pins
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.shovel_ready_only}
                  onChange={() => toggle("shovel_ready_only")}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-600 focus:ring-green-500 focus:ring-offset-gray-900"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Shovel Ready Only
                </span>
              </label>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-700" />

          {/* Poverty Rate Slider */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Poverty Rate: {filters.min_poverty_rate}% -{" "}
              {filters.max_poverty_rate}%
            </p>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.max_poverty_rate}
                onChange={(e) =>
                  updateRange("max_poverty_rate", parseInt(e.target.value))
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span className="text-indigo-400">≥20% = Eligible</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full mt-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
