/**
 * Vector Tile API - Fast Full-US Tract Rendering
 * Uses PostGIS ST_AsMVT to generate Mapbox Vector Tiles (MVT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  statement_timeout: 5000,
});

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zStr, x: xStr, y: yStr } = await params;
  const z = parseInt(zStr);
  const x = parseInt(xStr);
  const y = parseInt(yStr);

  if (isNaN(z) || isNaN(x) || isNaN(y) || z < 0 || z > 20) {
    return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT get_vector_tile($1, $2, $3) as mvt',
        [z, x, y]
      );

      const mvt = result.rows[0]?.mvt;

      if (!mvt || mvt.length === 0) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Content-Type': 'application/x-protobuf',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      return new NextResponse(mvt, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Content-Encoding': 'identity',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '57014') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Content-Type': 'application/x-protobuf',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
    console.error('[Tiles] Error generating tile:', error);
    return NextResponse.json({ error: 'Tile generation failed' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
