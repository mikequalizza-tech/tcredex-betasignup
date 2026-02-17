import { NextResponse } from "next/server";

// Placeholder pricing data - replace with actual database/API call
const pricingData = {
  notes: "All plans include access to our AI-powered matching platform.",
  plans: [
    {
      name: "Starter",
      price: 0,
      features: [
        "Access to marketplace",
        "Basic deal matching",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: 499,
      features: [
        "Everything in Starter",
        "Advanced AI matching",
        "Priority support",
        "Custom reports",
      ],
    },
    {
      name: "Enterprise",
      price: -1, // Custom pricing
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
      ],
    },
  ],
};

export async function GET() {
  // In production, fetch from database or external API
  return NextResponse.json(pricingData);
}
