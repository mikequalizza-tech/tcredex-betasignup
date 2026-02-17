import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/** Untyped Supabase client for tables not yet in the generated Database type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedSupabaseClient = SupabaseClient<any, any, any>;

type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string;
};

// Lazy init - don't crash build if key missing
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
};

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const body = await req.text();

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        console.log("✅ Payment success:", metadata);

        const untypedSupabase = supabase as unknown as UntypedSupabaseClient;

        if (
          metadata.productType === "template" ||
          metadata.productType === "pack"
        ) {
          // Table 'document_purchases' not yet in DB schema
          const { error: updateError } = await untypedSupabase
            .from("document_purchases")
            .update({
              status: "completed",
              purchased_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("stripe_checkout_session_id", session.id);

          if (updateError) {
            console.error("Purchase update error:", updateError);
          }
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as SubscriptionWithPeriod;
        console.log("📝 Subscription updated:", subscription.id);

        // Table 'subscriptions' not yet in DB schema
        const { error } = await (supabase as unknown as UntypedSupabaseClient)
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000).toISOString()
              : null,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Subscription update error:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("🚫 Subscription canceled:", subscription.id);

        // Table 'subscriptions' not yet in DB schema
        const { error } = await (supabase as unknown as UntypedSupabaseClient)
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Subscription cancel error:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as InvoiceWithSubscription;
        console.log("❌ Invoice payment failed:", invoice.id);

        if (invoice.subscription) {
          // Table 'subscriptions' not yet in DB schema
          const { error } = await (supabase as unknown as UntypedSupabaseClient)
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (error) {
            console.error("Subscription past_due update error:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 },
    );
  }
}
