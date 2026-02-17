"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Mapbox
const TractMap = dynamic(() => import("@/components/TractMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function TractMapPage() {
  return <TractMap />;
}
