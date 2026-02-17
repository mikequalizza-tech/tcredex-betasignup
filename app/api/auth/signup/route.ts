import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
 * 
 * Legacy signup endpoint that delegates to the unified /api/auth/register endpoint.
 * This exists for backward compatibility with frontend forms that may still call /signup.
 * 
 * The register endpoint handles:
 * - Creating Supabase auth user
 * - Creating organization record
 * - Creating user profile with role
 * - Sending confirmation emails
 * 
 * @see /api/auth/register for the complete registration implementation
 */
export async function POST(request: NextRequest) {
  // Forward the request body to the register endpoint
  const registerUrl = new URL('/api/auth/register', request.url);
  const body = await request.json();
  const response = await fetch(registerUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  // Create the response with the same data and status
  const nextResponse = NextResponse.json(data, { status: response.status });

  // Forward all Set-Cookie headers from the register endpoint to the browser
  // This is critical - the register endpoint sets auth cookies that need to reach the browser
  const setCookieHeaders = response.headers.getSetCookie();
  for (const cookie of setCookieHeaders) {
    nextResponse.headers.append('Set-Cookie', cookie);
  }

  return nextResponse;
}
