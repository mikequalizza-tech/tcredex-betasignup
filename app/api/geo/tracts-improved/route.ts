/**
 * Improved Tract Geometry API with Fallback Data
 * Provides census tract geometries with local fallback when TigerWeb is unavailable
 */

import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/utils/logger";

interface GeoJSONFeature {
  type: string;
  geometry: { type: string; coordinates: unknown } | null;
  properties?: Record<string, unknown>;
}

interface GeoJSON {
  type: string;
  features: GeoJSONFeature[];
  error?: { message?: string };
  _fallback?: boolean;
  _note?: string;
}

// Cache for tract geometries (in-memory, resets on deploy)
const tractCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// TigerWeb ACS 2021 - Layer 8 = Tracts
const TIGERWEB_TRACTS_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query";

// Fallback sample tracts for major cities when TigerWeb is unavailable
const FALLBACK_TRACTS = {
  type: "FeatureCollection",
  features: [
    // St. Louis, MO sample tract
    {
      type: "Feature",
      properties: {
        GEOID: "29510118600",
        NAME: "1186",
        STATE: "29",
        COUNTY: "510",
        TRACT: "118600",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-90.262, 38.627],
            [-90.252, 38.627],
            [-90.252, 38.637],
            [-90.262, 38.637],
            [-90.262, 38.627],
          ],
        ],
      },
    },
    // Chicago, IL sample tract
    {
      type: "Feature",
      properties: {
        GEOID: "17031320100",
        NAME: "3201",
        STATE: "17",
        COUNTY: "031",
        TRACT: "320100",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-87.6398, 41.8781],
            [-87.6298, 41.8781],
            [-87.6298, 41.8881],
            [-87.6398, 41.8881],
            [-87.6398, 41.8781],
          ],
        ],
      },
    },
    // Detroit, MI sample tract
    {
      type: "Feature",
      properties: {
        GEOID: "26163534800",
        NAME: "5348",
        STATE: "26",
        COUNTY: "163",
        TRACT: "534800",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-83.0558, 42.3314],
            [-83.0358, 42.3314],
            [-83.0358, 42.3514],
            [-83.0558, 42.3514],
            [-83.0558, 42.3314],
          ],
        ],
      },
    },
  ],
};

async function fetchFromTigerWeb(params: URLSearchParams): Promise<GeoJSON> {
  const fullUrl = `${TIGERWEB_TRACTS_URL}?${params.toString()}`;
  logger.info("Fetching from TigerWeb", { url: fullUrl }, "GeoTracts");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(fullUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "tCredex/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`TigerWeb responded with ${response.status}`);
    }

    const text = await response.text();
    let geojson;

    try {
      geojson = JSON.parse(text);
    } catch {
      logger.error(
        "Failed to parse TigerWeb response",
        { response: text.substring(0, 500) },
        "GeoTracts",
      );
      throw new Error("Invalid JSON response from TigerWeb");
    }

    // Check for API error
    if (geojson.error) {
      logger.error("TigerWeb API error", geojson.error, "GeoTracts");
      throw new Error(
        `TigerWeb error: ${geojson.error.message || "Unknown error"}`,
      );
    }

    // Validate GeoJSON structure
    if (
      !geojson ||
      geojson.type !== "FeatureCollection" ||
      !Array.isArray(geojson.features)
    ) {
      logger.warn("Invalid GeoJSON structure from TigerWeb", null, "GeoTracts");
      throw new Error("Invalid GeoJSON structure");
    }

    // Filter invalid geometries
    geojson.features = geojson.features.filter(
      (f: GeoJSONFeature) =>
        f && f.geometry && f.geometry.type && f.geometry.coordinates,
    );

    logger.info(
      `Successfully fetched ${geojson.features.length} tracts from TigerWeb`,
      null,
      "GeoTracts",
    );
    return geojson;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function getFallbackTracts(
  bbox?: string,
): GeoJSON & { _fallback?: boolean; _note?: string } {
  if (!bbox) {
    return FALLBACK_TRACTS;
  }

  // Filter fallback tracts by bbox if provided
  const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);

  const filteredFeatures = FALLBACK_TRACTS.features.filter((feature) => {
    if (!feature.geometry || feature.geometry.type !== "Polygon") return false;

    // Simple bbox check - get first coordinate of polygon
    const coords = feature.geometry.coordinates[0][0];
    const [lng, lat] = coords;

    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  });

  return {
    type: "FeatureCollection",
    features: filteredFeatures,
    _fallback: true,
    _note: "Using fallback data - TigerWeb unavailable",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get("bbox");
  const state = searchParams.get("state");
  const geoid = searchParams.get("geoid");
  const limit = parseInt(searchParams.get("limit") || "200");
  const fallback = searchParams.get("fallback") === "true";

  try {
    // Option 1: Get by bounding box
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);

      if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
        return NextResponse.json(
          { error: "Invalid bbox format. Use: minLng,minLat,maxLng,maxLat" },
          { status: 400 },
        );
      }

      const cacheKey = `bbox:${bbox}`;
      const cached = tractCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      // Try TigerWeb first, fallback to sample data if it fails
      let geojson;

      if (!fallback) {
        try {
          const params = new URLSearchParams({
            geometry: `${minLng},${minLat},${maxLng},${maxLat}`,
            geometryType: "esriGeometryEnvelope",
            inSR: "4326",
            spatialRel: "esriSpatialRelIntersects",
            outFields: "GEOID,NAME,STATE,COUNTY,TRACT",
            returnGeometry: "true",
            outSR: "4326",
            f: "geojson",
            resultRecordCount: String(limit),
          });

          geojson = await fetchFromTigerWeb(params);
        } catch (error) {
          logger.warn(
            "TigerWeb failed, using fallback data",
            { error: String(error) },
            "GeoTracts",
          );
          geojson = getFallbackTracts(bbox);
        }
      } else {
        geojson = getFallbackTracts(bbox);
      }

      tractCache.set(cacheKey, { data: geojson, timestamp: Date.now() });
      return NextResponse.json(geojson);
    }

    // Option 2: Get by state FIPS
    if (state) {
      const stateFips = state.padStart(2, "0");
      const cacheKey = `state:${stateFips}`;
      const cached = tractCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      let geojson;

      if (!fallback) {
        try {
          const params = new URLSearchParams({
            where: `STATE='${stateFips}'`,
            outFields: "GEOID,NAME,STATE,COUNTY,TRACT",
            returnGeometry: "true",
            outSR: "4326",
            f: "geojson",
            resultRecordCount: String(limit),
          });

          geojson = await fetchFromTigerWeb(params);
        } catch (error) {
          logger.warn(
            "TigerWeb failed for state query, using fallback",
            { error: String(error) },
            "GeoTracts",
          );
          geojson = getFallbackTracts();
        }
      } else {
        geojson = getFallbackTracts();
      }

      tractCache.set(cacheKey, { data: geojson, timestamp: Date.now() });
      return NextResponse.json(geojson);
    }

    // Option 3: Get single tract by GEOID
    if (geoid) {
      const cleanGeoid = geoid.replace(/[-\s]/g, "");
      const cacheKey = `geoid:${cleanGeoid}`;
      const cached = tractCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data);
      }

      let geojson;

      if (!fallback) {
        try {
          const params = new URLSearchParams({
            where: `GEOID='${cleanGeoid}'`,
            outFields: "GEOID,NAME,STATE,COUNTY,TRACT",
            returnGeometry: "true",
            outSR: "4326",
            f: "geojson",
          });

          geojson = await fetchFromTigerWeb(params);
        } catch (error) {
          logger.warn(
            "TigerWeb failed for GEOID query, using fallback",
            { error: String(error) },
            "GeoTracts",
          );
          geojson = getFallbackTracts();
        }
      } else {
        geojson = getFallbackTracts();
      }

      tractCache.set(cacheKey, { data: geojson, timestamp: Date.now() });
      return NextResponse.json(geojson);
    }

    // No valid params - return usage info
    return NextResponse.json(
      {
        error: "Missing required parameter",
        usage: {
          bbox: "/api/geo/tracts-improved?bbox=-90.5,38.5,-89.5,39.5",
          state: "/api/geo/tracts-improved?state=29",
          geoid: "/api/geo/tracts-improved?geoid=29189010100",
          fallback: "Add &fallback=true to use sample data",
        },
        fallback_available: true,
      },
      { status: 400 },
    );
  } catch (error) {
    logger.error("Tract API error", error, "GeoTracts");

    // Return fallback data on any error
    const fallbackData = getFallbackTracts(bbox || undefined);
    return NextResponse.json({
      ...fallbackData,
      _error: "Primary service unavailable, using fallback data",
      _details: String(error),
    });
  }
}
