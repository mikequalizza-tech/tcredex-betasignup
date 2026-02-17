/**
 * tCredex Admin API - AutoMatch Operations
 * POST /api/admin/automatch - Run batch matching
 *
 * This route proxies to the NestJS backend AutoMatch service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { handleAuthError, requireSystemAdmin } from '@/lib/api/auth-middleware';
import { getApiBaseUrl } from '@/lib/api/config';

const API_BASE = getApiBaseUrl();

export async function POST(request: NextRequest) {
  try {
    await requireSystemAdmin(request);
    const body = await request.json();
    const { action, dealId, dealIds, minScore, maxResults } = body;
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unwrapBackendData = <T = Record<string, unknown>>(payload: unknown): T => {
      if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return ((payload as Record<string, unknown>).data as T) || ({} as T);
      }
      return (payload as T) || ({} as T);
    };

    switch (action) {
      case 'batch': {
        if (!Array.isArray(dealIds) || dealIds.length === 0) {
          return NextResponse.json(
            { error: 'dealIds[] is required for batch action' },
            { status: 400 }
          );
        }

        // Call backend batch endpoint
        const resp = await fetch(`${API_BASE}/automatch/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ dealIds, minScore, maxResults }),
          cache: 'no-store',
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          return NextResponse.json(data || { error: 'Batch matching failed' }, { status: resp.status });
        }

        const result = unwrapBackendData<{ processed?: number; matches?: number }>(data);

        return NextResponse.json({
          success: true,
          action: 'batch',
          processed: result.processed || 0,
          matchesFound: result.matches || 0,
          timestamp: new Date().toISOString(),
        });
      }

      case 'single': {
        if (!dealId) {
          return NextResponse.json(
            { error: 'dealId required for single action' },
            { status: 400 }
          );
        }

        // Call backend single deal endpoint
        const resp = await fetch(`${API_BASE}/automatch/run/${dealId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ notifyMatches: true, maxResults: 20 }),
          cache: 'no-store',
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          return NextResponse.json(data || { error: 'Matching failed' }, { status: resp.status });
        }

        const result = unwrapBackendData<{
          dealId?: string;
          projectName?: string;
          matches?: Array<Record<string, unknown>>;
          timestamp?: string;
        }>(data);

        return NextResponse.json({
          success: true,
          action: 'single',
          dealId: result.dealId,
          projectName: result.projectName,
          matchesFound: result.matches?.length || 0,
          topMatches: (result.matches || []).slice(0, 5),
          timestamp: result.timestamp || new Date().toISOString(),
        });
      }

      case 'scan': {
        // Call backend scan endpoint (finds all deals and matches)
        const resp = await fetch(`${API_BASE}/automatch/scan`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          return NextResponse.json(data || { error: 'Scan failed' }, { status: resp.status });
        }

        const result = unwrapBackendData<Record<string, unknown>>(data);

        return NextResponse.json({
          success: true,
          action: 'scan',
          ...result,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: batch, single, scan' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleAuthError(error);
  }
}
