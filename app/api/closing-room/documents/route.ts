import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  handleAuthError,
  requireAuth,
  verifyDealAccess,
} from "@/lib/api/auth-middleware";
import Stripe from "stripe";

interface DocumentTemplateRow {
  program_type?: string | null;
  category?: string | null;
  template_name?: string | null;
  price_cents?: number | null;
  description?: string | null;
  [key: string]: unknown;
}

interface DocumentPackRow {
  price_cents: number;
  pack_name: string;
  stripe_price_id?: string | null;
  description?: string | null;
  program_types?: string[] | null;
}

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
};

// GET /api/closing-room/documents - List document templates
// GET /api/closing-room/documents?programType=NMTC
// GET /api/closing-room/documents?category=LOI
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    // Tables document_packs, document_templates, document_purchases not yet in DB schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdmin() as any;
    const { searchParams } = new URL(request.url);
    const programType = searchParams.get("programType");
    const category = searchParams.get("category");
    const packId = searchParams.get("packId");

    // Get document packs
    if (packId) {
      const { data: packData, error } = await supabase
        .from("document_packs")
        .select("*")
        .eq("id", packId)
        .single();
      const pack = packData as DocumentPackRow | null;

      if (error) {
        return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      }

      return NextResponse.json({ pack });
    }

    // Build query
    let query = supabase
      .from("document_templates")
      .select("*")
      .eq("is_active", true)
      .order("program_type")
      .order("category");

    if (programType) {
      query = query.eq("program_type", programType.toUpperCase());
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 },
      );
    }

    // Also get document packs
    const { data: packs, error: packsError } = await supabase
      .from("document_packs")
      .select("*")
      .eq("is_active", true)
      .order("price_cents");

    if (packsError) {
      console.error("Packs fetch error:", packsError);
    }

    const typedTemplates = (templates || []) as DocumentTemplateRow[];

    // Group templates by program
    const byProgram: Record<string, unknown[]> = {};
    for (const template of typedTemplates) {
      const programTypeKey = String(template.program_type || "UNKNOWN");
      if (!byProgram[programTypeKey]) {
        byProgram[programTypeKey] = [];
      }
      byProgram[programTypeKey].push(template);
    }

    return NextResponse.json({
      templates,
      byProgram,
      packs: packs || [],
      summary: {
        totalTemplates: typedTemplates.length,
        freeTemplates: typedTemplates.filter((t) => (t.price_cents || 0) === 0)
          .length,
        paidTemplates: typedTemplates.filter((t) => (t.price_cents || 0) > 0)
          .length,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/closing-room/documents - Purchase document template or pack
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    // Tables document_packs, document_templates, document_purchases not yet in DB schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdmin() as any;
    const stripe = getStripe();

    const body = await request.json();
    const { templateId, packId, dealId, returnUrl } = body;

    if (!templateId && !packId) {
      return NextResponse.json(
        { error: "templateId or packId required" },
        { status: 400 },
      );
    }

    if (dealId) {
      await verifyDealAccess(request, user, dealId, "view");
    }

    let priceInCents = 0;
    let productName = "";
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (packId) {
      // Purchasing a pack
      const { data: packData, error } = await supabase
        .from("document_packs")
        .select("*")
        .eq("id", packId)
        .single();
      const pack = packData as DocumentPackRow | null;

      if (error || !pack) {
        return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      }

      priceInCents = Number(pack.price_cents || 0);
      productName = pack.pack_name || "Document Pack";

      // Use Stripe price ID if exists, otherwise create line item
      if (pack.stripe_price_id) {
        lineItems = [{ price: pack.stripe_price_id, quantity: 1 }];
      } else {
        lineItems = [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: pack.pack_name || "Document Pack",
                description:
                  pack.description ||
                  `Document pack for ${pack.program_types?.join(", ")}`,
              },
              unit_amount: Number(pack.price_cents || 0),
            },
            quantity: 1,
          },
        ];
      }
    } else {
      // Purchasing single template
      const { data: templateData, error } = await supabase
        .from("document_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      const template = templateData as DocumentTemplateRow | null;

      if (error || !template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 },
        );
      }

      // Check if free
      if ((template.price_cents || 0) === 0) {
        // Free template - just record the "purchase" and return access
        const { data: _purchase, error: purchaseError } = await supabase
          .from("document_purchases")
          .insert({
            user_id: user.id,
            deal_id: dealId,
            template_id: templateId,
            amount_cents: 0,
            status: "completed",
            purchased_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (purchaseError) {
          console.error("Purchase record error:", purchaseError);
        }

        return NextResponse.json({
          success: true,
          free: true,
          templateId,
          message: "Free template access granted",
        });
      }

      priceInCents = Number(template.price_cents || 0);
      productName = template.template_name || "Document Template";

      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: template.template_name || "Document Template",
              description:
                template.description ||
                `${template.program_type} ${template.category} template`,
            },
            unit_amount: Number(template.price_cents || 0),
          },
          quantity: 1,
        },
      ];
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/closing-room/${dealId}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/closing-room/${dealId}?purchase=canceled`,
      metadata: {
        userId: user.id,
        dealId: dealId || "",
        templateId: templateId || "",
        packId: packId || "",
        productType: packId ? "pack" : "template",
      },
    });

    // Record pending purchase
    const { error: purchaseError } = await supabase
      .from("document_purchases")
      .insert({
        user_id: user.id,
        deal_id: dealId,
        template_id: templateId,
        pack_id: packId,
        stripe_checkout_session_id: session.id,
        amount_cents: priceInCents,
        status: "pending",
      });

    if (purchaseError) {
      console.error("Purchase record error:", purchaseError);
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      amount: priceInCents / 100,
      productName,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
