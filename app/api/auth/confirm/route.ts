import { NextRequest, NextResponse } from "next/server";

// Legacy confirmation endpoint: just redirect to signin with a flag/token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tcredex.com";
  const redirectUrl = new URL("/signin", baseUrl);
  redirectUrl.searchParams.set("confirmed", "1");
  if (token) {
    redirectUrl.searchParams.set("token", token);
  }
  return NextResponse.redirect(redirectUrl.toString());
}
