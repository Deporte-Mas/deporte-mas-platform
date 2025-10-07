import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000  // 30 seconds
};

// Retry utility function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = RETRY_CONFIG,
  attempt: number = 1
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (attempt >= config.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      config.baseDelay * Math.pow(2, attempt - 1),
      config.maxDelay
    );

    console.log(`Retry attempt ${attempt} after ${delay}ms delay`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(operation, config, attempt + 1);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced webhook signature validation
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Webhook validation failed: No Stripe signature found");
      return new Response(JSON.stringify({
        error: "No Stripe signature found",
        code: "MISSING_SIGNATURE"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const body = await req.text();

    // Validate webhook secret is configured
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook validation failed: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({
        error: "Webhook secret not configured",
        code: "MISSING_WEBHOOK_SECRET"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Environment configuration - check VITE_DEV_MODE
    // This should be set in Supabase Dashboard secrets to match frontend environment
    const devMode = Deno.env.get('VITE_DEV_MODE') === 'true';

    console.log(`Webhook running in ${devMode ? 'development' : 'production'} mode`);

    const stripeSecretKey = devMode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    // Validate Stripe secret key is available
    if (!stripeSecretKey) {
      console.error(`Webhook validation failed: Missing Stripe ${devMode ? 'test' : 'live'} secret key`);
      return new Response(JSON.stringify({
        error: "Stripe secret key not configured",
        code: "MISSING_STRIPE_KEY"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Enhanced webhook signature verification with detailed error handling
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (signatureError) {
      console.error("Webhook signature verification failed:", signatureError);
      return new Response(JSON.stringify({
        error: "Webhook signature verification failed",
        code: "INVALID_SIGNATURE",
        details: signatureError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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
        processed: false,
        retry_count: 0,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (eventError) {
      console.error('Error storing webhook event:', eventError);
    }

    // Check if event was already processed to prevent duplicate processing
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('processed, retry_count')
      .eq('id', event.id)
      .single();

    if (existingEvent?.processed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different event types with retry logic
    const processEvent = async (): Promise<void> => {
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
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return; // No processing needed for unhandled events
      }
    };

    try {
      // Process event with retry logic
      await retryWithBackoff(async () => {
        // Update retry count
        const currentRetryCount = existingEvent?.retry_count || 0;
        await supabase
          .from('stripe_events')
          .update({
            retry_count: currentRetryCount + 1,
            last_retry_at: new Date().toISOString()
          })
          .eq('id', event.id);

        await processEvent();
      });

      // Mark event as processed successfully
      await supabase
        .from('stripe_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', event.id);

    } catch (processError) {
      console.error('Error processing webhook event after retries:', processError);

      // Mark event as failed after all retries exhausted
      await supabase
        .from('stripe_events')
        .update({
          processing_error: processError.message,
          failed_at: new Date().toISOString()
        })
        .eq('id', event.id);

      // Don't throw error to prevent Stripe from retrying
      // Return success but log the failure for monitoring
      console.error(`Webhook processing failed for event ${event.id} after ${RETRY_CONFIG.maxRetries} retries`);
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

  // Send to integrations in parallel with retry logic
  const integrationResults = await Promise.allSettled([
    retryWithBackoff(() => sendToZapier(customerData)),
    retryWithBackoff(() => sendToMetaCAPI(customerData)),
  ]);

  // Log any integration failures
  integrationResults.forEach((result, index) => {
    const integrationName = index === 0 ? 'Zapier' : 'Meta CAPI';
    if (result.status === 'rejected') {
      console.error(`${integrationName} integration failed after retries:`, result.reason);
    }
  });
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
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
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