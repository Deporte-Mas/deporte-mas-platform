import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();

    // Environment configuration - check multiple ways to determine mode
    const devModeEnv = Deno.env.get('VITE_DEV_MODE');
    const nodeEnv = Deno.env.get('NODE_ENV');
    const supabaseEnv = Deno.env.get('SUPABASE_ENVIRONMENT');

    // Determine if we're in development mode
    const devMode = devModeEnv === 'true' ||
                   nodeEnv === 'development' ||
                   supabaseEnv === 'development' ||
                   (!devModeEnv && !nodeEnv && !supabaseEnv); // Default to dev if not specified

    console.log(`Webhook running in ${devMode ? 'development' : 'production'} mode`);

    const stripeSecretKey = devMode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    const stripe = new Stripe(stripeSecretKey!);

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );

    console.log(`Processing ${event.type}`);

    // Initialize Supabase client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Store webhook event for idempotency and debugging
    const { error: eventError } = await supabase
      .from('stripe_events')
      .upsert({
        id: event.id,
        type: event.type,
        data: event.data,
        processed: false
      }, {
        onConflict: 'id'
      });

    if (eventError) {
      console.error('Error storing webhook event:', eventError);
    }

    // Handle different event types
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase);
          break;
        case "customer.subscription.created":
          await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
          break;
        // Note: Payment tracking removed - Stripe handles this via API
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await supabase
        .from('stripe_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', event.id);

    } catch (processError) {
      console.error('Error processing webhook event:', processError);

      // Mark event as failed
      await supabase
        .from('stripe_events')
        .update({
          processing_error: processError.message,
          processed_at: new Date().toISOString()
        })
        .eq('id', event.id);

      throw processError;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any) {
  const customerData = {
    email: session.customer_details?.email,
    name: session.customer_details?.name,
    phone: session.customer_details?.phone,
    country: session.customer_details?.address?.country,
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    customerId: session.customer as string,
    subscriptionId: session.subscription as string,
    metadata: session.metadata,
  };

  console.log("Customer data from checkout:", customerData);

  // Update existing user with Stripe customer info (don't create new users here)
  if (customerData.email) {
    const { error } = await supabase
      .from('users')
      .update({
        name: customerData.name,
        phone: customerData.phone,
        country: customerData.country,
        stripe_customer_id: customerData.customerId,
        subscription_started_at: new Date().toISOString(), // First subscription
        updated_at: new Date().toISOString()
      })
      .eq('email', customerData.email);

    if (error) {
      console.error('Error updating user with Stripe info:', error);
      // If user doesn't exist, they need to sign up first
      console.log('User may need to create account first before subscribing');
    }
  }

  // Note: Subscription cache will be populated by subscription.created webhook

  // Send to integrations in parallel
  await Promise.allSettled([
    sendToZapier(customerData),
    sendToMetaCAPI(customerData),
  ]);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  console.log("Subscription created:", subscription.id);

  // Update subscription cache using helper function
  const { error } = await supabase
    .rpc('update_subscription_cache', {
      p_stripe_subscription_id: subscription.id,
      p_stripe_customer_id: subscription.customer as string,
      p_status: subscription.status,
      p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      p_cancel_at_period_end: subscription.cancel_at_period_end,
      p_stripe_updated_at: new Date(subscription.created * 1000).toISOString()
    });

  if (error) {
    console.error('Error updating subscription cache:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  console.log("Subscription updated:", subscription.id);

  // Update subscription cache using helper function
  const { error } = await supabase
    .rpc('update_subscription_cache', {
      p_stripe_subscription_id: subscription.id,
      p_stripe_customer_id: subscription.customer as string,
      p_status: subscription.status,
      p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      p_cancel_at_period_end: subscription.cancel_at_period_end,
      p_stripe_updated_at: new Date(subscription.created * 1000).toISOString()
    });

  if (error) {
    console.error('Error updating subscription cache:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  console.log("Subscription cancelled:", subscription.id);

  // Update subscription cache to canceled status - this will trigger cascade effects
  const { error } = await supabase
    .rpc('update_subscription_cache', {
      p_stripe_subscription_id: subscription.id,
      p_stripe_customer_id: subscription.customer as string,
      p_status: 'canceled',
      p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      p_cancel_at_period_end: true,
      p_stripe_updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating subscription cache to canceled:', error);
  }
}

// Payment tracking functions removed - Stripe API provides all payment data
// No need to store payment details locally, only subscription status matters

async function sendToZapier(customerData: any) {
  try {
    const zapierUrl = Deno.env.get("ZAPIER_WEBHOOK_URL");
    if (!zapierUrl) return;

    const response = await fetch(zapierUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        country: customerData.country,
        amount: customerData.amount / 100, // Convert to dollars
        currency: customerData.currency.toUpperCase(),
        customerId: customerData.customerId,
        subscriptionId: customerData.subscriptionId,
      }),
    });

    console.log("Zapier webhook sent:", response.status);
  } catch (error) {
    console.error("Zapier webhook failed:", error);
  }
}

async function sendToMetaCAPI(customerData: any) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) return;

    const metadata = customerData.metadata || {};
    const nameParts = customerData.name?.split(' ') || [];

    const response = await fetch(`${supabaseUrl}/functions/v1/facebook-conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        event_name: "Subscribe",
        event_id: `subscribe_${customerData.subscriptionId}`,
        action_source: "website",
        event_source_url: metadata['last_url'],
        fbp: metadata['_fbp'],
        fbc: metadata['_fbc'],
        user_data: {
          email: customerData.email,
          phone: customerData.phone,
          fn: nameParts[0],
          ln: nameParts.slice(1).join(' '),
        },
        custom_data: {
          value: customerData.amount / 100,
          currency: customerData.currency.toUpperCase(),
          content_name: metadata['product_name'] || 'Deporte+ Club',
          subscription_id: customerData.subscriptionId,
          country: customerData.country,
        },
      }),
    });

    console.log("Meta CAPI event sent:", response.status);
  } catch (error) {
    console.error("Meta CAPI failed:", error);
  }
}