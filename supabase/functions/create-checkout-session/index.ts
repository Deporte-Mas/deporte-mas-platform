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
    // Environment configuration - check VITE_DEV_MODE
    // This should be set in Supabase Dashboard secrets to match frontend environment
    const devMode = Deno.env.get('VITE_DEV_MODE') === 'true';

    console.log(`Running in ${devMode ? 'development' : 'production'} mode`);

    const stripeSecretKey = devMode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error(`Stripe ${devMode ? 'test' : 'live'} secret key not configured`);
    }

    const stripe = new Stripe(stripeSecretKey);
    const { returnUrl, metadata = {}, planType = 'monthly' } = await req.json();

    if (!returnUrl) {
      throw new Error('Return URL is required');
    }

    // Product configuration based on plan type and environment
    const getProductConfig = (plan: string, isDev: boolean) => {
      if (isDev) {
        // Test environment price IDs
        const testPriceIds = {
          monthly: Deno.env.get('STRIPE_TEST_PRICE_MONTHLY'),
          annual: Deno.env.get('STRIPE_TEST_PRICE_ANNUAL')
        };
        const testProductIds = {
          monthly: Deno.env.get('STRIPE_TEST_PRODUCT_MONTHLY'),
          annual: Deno.env.get('STRIPE_TEST_PRODUCT_ANNUAL')
        };

        if (!testPriceIds[plan] || !testProductIds[plan]) {
          throw new Error(`Missing Stripe test ${plan} price or product ID in environment variables`);
        }

        return {
          priceId: testPriceIds[plan],
          productId: testProductIds[plan]
        };
      } else {
        // Production environment price IDs
        const livePriceIds = {
          monthly: Deno.env.get('STRIPE_LIVE_PRICE_MONTHLY'),
          annual: Deno.env.get('STRIPE_LIVE_PRICE_ANNUAL')
        };
        const liveProductIds = {
          monthly: Deno.env.get('STRIPE_LIVE_PRODUCT_MONTHLY'),
          annual: Deno.env.get('STRIPE_LIVE_PRODUCT_ANNUAL')
        };

        if (!livePriceIds[plan] || !liveProductIds[plan]) {
          throw new Error(`Missing Stripe live ${plan} price or product ID in environment variables`);
        }

        return {
          priceId: livePriceIds[plan],
          productId: liveProductIds[plan]
        };
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
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
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