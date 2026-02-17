import { NextRequest, NextResponse } from "next/server";

// Delegate onboarding to unified /api/auth/register logic
export async function POST(request: NextRequest) {
  const registerUrl = new URL("/api/auth/register", request.url);
  const body = await request.json();
  const response = await fetch(registerUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
