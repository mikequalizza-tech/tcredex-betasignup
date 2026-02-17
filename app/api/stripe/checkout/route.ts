import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, feature, amount } = body;

    if (!userId || !feature || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: userId, feature, amount" },
        { status: 400 },
      );
    }

    const session = await createCheckoutSession({
      userId,
      feature,
      amount,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
