import { NextResponse } from "next/server";

// Demo users that should exist in the database
const DEMO_USERS = [
  {
    email: "q@qgholding.us",
    name: "Michael Qualizza",
    type: "sponsor" as const,
    organization: "QG Holding",
  },
  {
    email: "demo.cde@tcredex.com",
    name: "Demo CDE User",
    type: "cde" as const,
    organization: "Demo Community Development Entity",
  },
  {
    email: "demo.investor@tcredex.com",
    name: "Demo Investor User",
    type: "investor" as const,
    organization: "Demo Investment Fund",
  },
  {
    email: "admin@tcredex.com",
    name: "System Administrator",
    type: "admin" as const,
    organization: "tCredex Platform",
  },
];

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    users: DEMO_USERS,
  });
}
