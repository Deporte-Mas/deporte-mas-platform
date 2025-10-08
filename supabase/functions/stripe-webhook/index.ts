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

    // Environment configuration - check VITE_DEV_MODE
    // This should be set in Supabase Dashboard secrets to match frontend environment
    const devMode = Deno.env.get('VITE_DEV_MODE') === 'true';

    console.log(`Webhook running in ${devMode ? 'development' : 'production'} mode`);

    // Select appropriate webhook secret and Stripe key based on dev mode
    const webhookSecret = devMode
      ? Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET")
      : Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const stripeSecretKey = devMode
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
      : Deno.env.get('STRIPE_SECRET_KEY');

    // Validate webhook secret is configured
    if (!webhookSecret) {
      console.error(`Webhook validation failed: STRIPE_${devMode ? 'TEST_' : ''}WEBHOOK_SECRET not configured`);
      return new Response(JSON.stringify({
        error: "Webhook secret not configured",
        code: "MISSING_WEBHOOK_SECRET"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

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

    console.log(`Processing ${event.type} [${devMode ? 'TEST' : 'LIVE'} mode]`);

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
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase, devMode);
          break;
        case "invoice.paid":
          await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase, stripe, devMode);
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase, devMode);
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase, devMode);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, supabase: any, isTestMode = false) {
  console.log(`[${isTestMode ? 'TEST' : 'LIVE'}] Checkout completed:`, session.id);

  // Extract customer details from checkout session
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const customerPhone = session.customer_details?.phone;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerEmail) {
    console.error('No email in checkout session');
    return;
  }

  console.log(`Customer email: ${customerEmail}`);
  console.log(`Subscription ID: ${subscriptionId}`);

  // STEP 1: Create or get auth user
  let authUserId: string | null = null;
  let isNewUser = false;

  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${customerEmail}`,
    });

    if (existingUsers && existingUsers.users.length > 0) {
      authUserId = existingUsers.users[0].id;
      console.log('Auth user already exists:', authUserId);
    } else {
      const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: {
          name: customerName,
          phone: customerPhone,
          stripe_customer_id: customerId,
        },
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      authUserId = newUser.user.id;
      isNewUser = true;
      console.log('Auth user created:', authUserId);
    }
  } catch (error) {
    console.error('Auth user creation/lookup failed:', error);
    throw error;
  }

  // STEP 2: Create or update users table record
  let isNewSubscriber = false;

  if (authUserId) {
    // Check if user has ever subscribed before
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, subscription_started_at')
      .eq('id', authUserId)
      .single();

    isNewSubscriber = !existingUser || !existingUser.subscription_started_at;

    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        stripe_customer_id: customerId,
        // Only set subscription_started_at for first-ever subscription
        ...(isNewSubscriber ? { subscription_started_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('Error upserting user record:', upsertError);
    } else {
      console.log(`User record upserted (${isNewSubscriber ? 'FIRST' : 'RETURNING'} subscription)`);
    }
  }

  // STEP 3: Send integrations only for new subscribers
  // Note: Subscription provisioning happens in invoice.paid event
  if (isNewSubscriber) {
    console.log('New subscriber - sending welcome email and integrations');

    const customerData = {
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      customerId: customerId,
      subscriptionId: subscriptionId,
    };

    const integrationResults = await Promise.allSettled([
      retryWithBackoff(() => sendWelcomeEmail(customerData, supabase)),
      retryWithBackoff(() => sendToZapier(customerData)),
      retryWithBackoff(() => sendToMetaCAPI(customerData)),
    ]);

    integrationResults.forEach((result, index) => {
      const integrationName = index === 0 ? 'Welcome Email' : index === 1 ? 'Zapier' : 'Meta CAPI';
      if (result.status === 'rejected') {
        console.error(`${integrationName} integration failed after retries:`, result.reason);
      } else {
        console.log(`${integrationName} integration completed successfully`);
      }
    });
  } else {
    console.log('Returning subscriber - skipping welcome email and integrations');

    // TODO: Implement "Welcome Back" email for returning subscribers
    // const welcomeBackData = {
    //   email: customerEmail,
    //   name: customerName,
    //   customerId: customerId,
    //   subscriptionId: subscriptionId,
    // };
    // await sendWelcomeBackEmail(welcomeBackData, supabase);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice, supabase: any, stripe: Stripe, isTestMode = false) {
  console.log(`[${isTestMode ? 'TEST' : 'LIVE'}] Invoice paid:`, invoice.id);
  console.log(`Subscription: ${invoice.subscription}`);
  console.log(`Amount paid: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`);

  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  if (!subscriptionId) {
    console.log('No subscription associated with this invoice (one-time payment)');
    return;
  }

  // Fetch subscription details to provision/extend access
  // This handles BOTH initial subscriptions and recurring payments
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    console.log(`Provisioning subscription access for: ${customerId}`);
    console.log(`Period: ${new Date(subscription.current_period_start * 1000).toISOString()} to ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    // Update subscription cache - this provisions access for both new and recurring subscriptions
    const { error: cacheError } = await supabase
      .rpc('update_subscription_cache', {
        p_stripe_subscription_id: subscription.id,
        p_stripe_customer_id: customerId,
        p_status: subscription.status,
        p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        p_cancel_at_period_end: subscription.cancel_at_period_end,
        p_stripe_updated_at: new Date().toISOString()
      });

    if (cacheError) {
      console.error('[ERROR] Failed to provision subscription:', cacheError);
      throw cacheError;
    } else {
      console.log('[SUCCESS] Subscription access provisioned/extended');
    }
  } catch (error) {
    console.error('Error processing invoice.paid:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any, isTestMode = false) {
  console.log(`[${isTestMode ? 'TEST' : 'LIVE'}] Subscription updated:`, subscription.id);

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

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any, isTestMode = false) {
  console.log(`[${isTestMode ? 'TEST' : 'LIVE'}] Subscription cancelled:`, subscription.id);

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

async function sendWelcomeEmail(customerData: any, supabase: any) {
  try {
    const { data: magicLinkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: customerData.email,
    });

    if (linkError) {
      throw new Error(`Failed to generate magic link: ${linkError.message}`);
    }

    if (!magicLinkData) {
      throw new Error('No magic link data returned');
    }

    console.log('Magic link generated successfully');

    // Send welcome email via Resend
    const { sendEmail, generateWelcomeEmail } = await import('../_shared/resend.ts');
    const emailContent = generateWelcomeEmail(
      customerData.email,
      customerData.name,
      magicLinkData.properties.action_link
    );

    const emailResult = await sendEmail({
      to: customerData.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!emailResult) {
      throw new Error('Email send failed - no result returned');
    }

    console.log('Welcome email sent:', emailResult.id);
  } catch (error) {
    console.error("Welcome email failed:", error);
    throw error; // Re-throw for retry mechanism
  }
}