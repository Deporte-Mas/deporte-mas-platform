import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment configuration
    const devMode = Deno.env.get('VITE_DEV_MODE') === 'true';
    const stripeSecretKey = devMode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey);
    const { returnUrl, metadata = {}, planType = 'monthly' } = await req.json();

    if (!returnUrl) {
      throw new Error('Return URL is required');
    }

    // Product configuration based on plan type and environment
    const getProductConfig = (plan: string, isDev: boolean) => {
      if (isDev) {
        // Test product IDs (replace with actual test IDs from Stripe)
        return plan === 'annual'
          ? { priceId: "price_TEST_ANNUAL_ID", productId: "prod_TEST_ANNUAL_ID" }
          : { priceId: "price_TEST_MONTHLY_ID", productId: "prod_TEST_MONTHLY_ID" };
      } else {
        // Live product IDs (replace with actual live IDs from Stripe)
        return plan === 'annual'
          ? { priceId: "price_LIVE_ANNUAL_ID", productId: "prod_LIVE_ANNUAL_ID" }
          : { priceId: "price_LIVE_MONTHLY_ID", productId: "prod_LIVE_MONTHLY_ID" };
      }
    };

    const { priceId, productId } = getProductConfig(planType, devMode);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planType === 'annual' ? 'subscription' : 'subscription',
      return_url: returnUrl,

      // Data collection
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: true },

      // Payment methods
      payment_method_types: ['card', 'link'],

      // Metadata for tracking
      metadata: {
        product_name: 'Deporte+ Club Subscription',
        plan_type: planType,
        ...metadata
      },

      // Subscription configuration
      subscription_data: {
        metadata: {
          product_name: 'Deporte+ Club Subscription',
          plan_type: planType,
          ...metadata
        },
      },

      custom_text: {
        submit: { message: 'Pago procesado de forma segura por Stripe' }
      },

      // Customer portal configuration
      customer_creation: 'always',
    });

    // Optional: Send InitiateCheckout event to Meta CAPI
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/facebook-conversion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          event_name: 'InitiateCheckout',
          custom_data: {
            content_type: 'product',
            content_ids: [productId],
            value: planType === 'annual' ? 180 : 20,
            currency: 'USD'
          },
          metadata
        }),
      });
    } catch (error) {
      console.error('Failed to send InitiateCheckout event:', error);
    }

    return new Response(JSON.stringify({
      clientSecret: session.client_secret,
      sessionId: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});