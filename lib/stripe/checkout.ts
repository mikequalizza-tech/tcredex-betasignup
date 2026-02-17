import Stripe from "stripe";

// Initialize Stripe with lazy loading
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export interface CheckoutSessionParams {
  userId: string;
  feature: string;
  amount: number;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionParams {
  userId: string;
  priceId: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

/**
 * Create a one-time payment checkout session
 */
export async function createCheckoutSession(params: CheckoutSessionParams) {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: params.feature,
            description: `tCredex - ${params.feature}`,
          },
          unit_amount: Math.round(params.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url:
      params.successUrl ||
      `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl || `${baseUrl}/payment/cancel`,
    metadata: {
      userId: params.userId,
      feature: params.feature,
      ...params.metadata,
    },
  });

  return session;
}

/**
 * Create a subscription checkout session
 */
export async function createSubscriptionSession(params: SubscriptionParams) {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url:
      params.successUrl ||
      `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl || `${baseUrl}/payment/cancel`,
    metadata: {
      userId: params.userId,
      ...params.metadata,
    },
  };

  // Add trial period if specified
  if (params.trialDays) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialDays,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Retrieve a checkout session
 */
export async function retrieveSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer", "subscription"],
  });
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  metadata?: Record<string, string>,
) {
  const stripe = getStripe();
  return stripe.customers.create({
    email,
    metadata,
  });
}

/**
 * Get or create a Stripe customer by email
 */
export async function getOrCreateCustomer(
  email: string,
  metadata?: Record<string, string>,
) {
  const stripe = getStripe();

  // Search for existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return createCustomer(email, metadata);
}

/**
 * Create a billing portal session for subscription management
 */
export async function createPortalSession(
  customerId: string,
  returnUrl?: string,
) {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${baseUrl}/dashboard/settings`,
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  atPeriodEnd = true,
) {
  const stripe = getStripe();

  if (atPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Construct webhook event (for verifying Stripe webhooks)
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
