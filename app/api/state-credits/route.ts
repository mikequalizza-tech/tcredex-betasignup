/**
 * State Credits API
 * GET /api/state-credits?state=MO&programs=NMTC,HTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { matchEligibleCredits, getStateCredits, CreditProgram } from '@/lib/credits/stateCreditMatcher';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state');
  const programsParam = searchParams.get('programs');

  if (!state) {
    return NextResponse.json(
      { error: 'Missing required parameter: state' },
      { status: 400 }
    );
  }

  try {
    let credits;

    if (programsParam) {
      // Filter by specific programs
      const programs = programsParam.split(',').map(p => p.trim()) as CreditProgram[];
      credits = await matchEligibleCredits({ state, programs });
    } else {
      // Return all state credits
      credits = await getStateCredits(state);
    }

    return NextResponse.json({
      state,
      count: credits.length,
      credits,
    });
  } catch (error) {
    console.error('[API /state-credits] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state credits' },
      { status: 500 }
    );
  }
}
