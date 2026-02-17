'use client';

import React, { useState } from 'react';

/**
 * Map Debug Page
 * 
 * Use this page to diagnose eligibility API issues.
 * Navigate to: /admin/map-debug
 */

interface DebugResult {
  debug?: boolean;
  eligible?: boolean;
  input?: string;
  variants?: string[];
  tableRowCount?: number;
  matchedVariant?: string | null;
  tractFound?: boolean;
  sampleGeoids?: Array<{ value: string; type: string; length: number }>;
  tractData?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function MapDebugPage() {
  const [tractId, setTractId] = useState('01001020100');
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEligibility = async (debug = true) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/eligibility?tract=${tractId}&debug=${debug}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔍 Map Eligibility Debug</h1>
        
        {/* Input Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Census Tract</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={tractId}
              onChange={(e) => setTractId(e.target.value)}
              placeholder="Enter GEOID (e.g., 01001020100)"
              className="flex-1 px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => testEligibility(true)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test (Debug)'}
            </button>
            <button
              onClick={() => testEligibility(false)}
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50"
            >
              Test (Normal)
            </button>
          </div>

          {/* Quick Test Tracts */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-gray-400">Quick tests:</span>
            {[
              '01001020100',
              '1001020100',
              '29189010100',
              '06037100100',
              '6037100100',
            ].map((id) => (
              <button
                key={id}
                onClick={() => setTractId(id)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Results
              {result.eligible ? (
                <span className="text-green-400 text-sm px-2 py-1 bg-green-900/50 rounded">✓ ELIGIBLE</span>
              ) : (
                <span className="text-red-400 text-sm px-2 py-1 bg-red-900/50 rounded">✗ NOT ELIGIBLE</span>
              )}
            </h2>

            {/* Key Diagnostics */}
            {result.debug && (
              <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded">
                <h3 className="text-yellow-400 font-semibold mb-3">🔧 Debug Info</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Input Tract:</p>
                    <p className="font-mono">{result.input ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Table Row Count:</p>
                    <p className="font-mono">{result.tableRowCount ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Matched Variant:</p>
                    <p className="font-mono text-green-400">{result.matchedVariant ?? 'None'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tract Found:</p>
                    <p className={result.tractFound ? 'text-green-400' : 'text-red-400'}>
                      {result.tractFound ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Search Variants */}
                {result.variants && (
                  <div className="mt-4">
                    <p className="text-gray-400 mb-1">Search Variants Tried:</p>
                    <div className="flex gap-2 flex-wrap">
                      {result.variants.map((v, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample GEOIDs from DB */}
                {result.sampleGeoids && (
                  <div className="mt-4">
                    <p className="text-gray-400 mb-1">Sample GEOIDs in Database:</p>
                    <div className="space-y-1">
                      {result.sampleGeoids.map((s, i) => (
                        <div key={i} className="flex gap-4 text-xs">
                          <span className="font-mono">{s.value}</span>
                          <span className="text-gray-500">type: {s.type}</span>
                          <span className="text-gray-500">len: {s.length}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tract Data Details */}
                {result.tractData && (
                  <div className="mt-4">
                    <p className="text-gray-400 mb-2">Tract Data Found:</p>
                    <div className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-48">
                      <pre>{JSON.stringify(result.tractData, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full JSON Response */}
            <div>
              <h3 className="text-gray-400 font-semibold mb-2">Full Response:</h3>
              <div className="bg-gray-900 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-sm text-gray-500">
          <h3 className="font-semibold text-gray-400 mb-2">Troubleshooting Guide:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Table Row Count = 0:</strong> Data not imported to Supabase</li>
            <li><strong>Tract Found = No:</strong> GEOID format mismatch (leading zeros issue)</li>
            <li><strong>is_nmtc_lic = null:</strong> Column missing or wrong name in database</li>
            <li><strong>is_nmtc_lic = &quot;NO&quot;:</strong> Tract exists but not NMTC eligible</li>
            <li><strong>is_nmtc_lic = &quot;YES&quot; but eligible = false:</strong> String comparison issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
