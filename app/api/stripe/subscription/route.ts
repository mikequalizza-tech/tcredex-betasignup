/**
 * Stripe Subscription API
 * POST - Create subscription checkout session
 * GET - Get subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionSession, getSubscription } from '@/lib/stripe/checkout';

// Subscription tiers with Stripe price IDs
// TODO: Replace with your actual Stripe price IDs from dashboard
const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
    features: ['5 deals/month', 'Basic analytics', 'Email support'],
  },
  professional: {
    name: 'Professional',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
    features: ['25 deals/month', 'Advanced analytics', 'Priority support', 'API access'],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    features: ['Unlimited deals', 'Custom analytics', 'Dedicated support', 'Custom integrations'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, tier, email, trialDays } = body;

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tier' },
        { status: 400 }
      );
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    if (!tierConfig) {
      return NextResponse.json(
        { error: `Invalid tier: ${tier}. Valid options: ${Object.keys(SUBSCRIPTION_TIERS).join(', ')}` },
        { status: 400 }
      );
    }

    const session = await createSubscriptionSession({
      userId,
      priceId: tierConfig.priceId,
      customerEmail: email,
      trialDays: trialDays || 14, // Default 14-day trial
      metadata: {
        tier,
        tierName: tierConfig.name,
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription checkout' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing subscriptionId parameter' },
        { status: 400 }
      );
    }

    const subscription = await getSubscription(subscriptionId);

    // Type assertion for Stripe subscription object
    const sub = subscription as {
      id: string;
      status: string;
      current_period_end?: number;
      cancel_at_period_end?: boolean;
    };

    return NextResponse.json({
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
