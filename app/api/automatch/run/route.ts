/**
 * Manual AutoMatch Trigger API
 *
 * POST /api/automatch/run - Run AutoMatch for a specific deal
 * This endpoint allows sponsors to manually trigger AutoMatch for their deals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { getApiBaseUrl } from '@/lib/api/config';

const API_BASE = getApiBaseUrl();

/**
 * POST /api/automatch/run
 * Manually run AutoMatch for a deal and save matches
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { dealId, minScore, maxResults, notifyMatches } = body || {};

    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resp = await fetch(`${API_BASE}/automatch/run/${dealId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ minScore, maxResults, notifyMatches }),
      cache: 'no-store',
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json(data || { error: 'Failed to run automatch' }, { status: resp.status });
    }

    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error('[AutoMatch/run] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
