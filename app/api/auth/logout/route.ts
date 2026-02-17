/**
 * tCredex API - Logout
 * POST /api/auth/logout
 * Clears auth cookies for Supabase-backed sessions.
 */

import { NextResponse } from 'next/server';

const COOKIE_NAMES = ['auth-token', 'tcredex_session'];

export async function POST() {
  const response = NextResponse.json({ success: true });

  COOKIE_NAMES.forEach(name => {
    response.cookies.set({
      name,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });
  });

  return response;
}
