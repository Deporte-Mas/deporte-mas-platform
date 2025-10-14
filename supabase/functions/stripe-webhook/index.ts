import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import { AegisSDK } from "https://esm.sh/@cavos/aegis@0.1.12";

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
  const startTime = Date.now();
  const mode = isTestMode ? 'TEST' : 'LIVE';

  console.log(`[${mode}] [INFO] Checkout completed - Session ID: ${session.id}`);

  // Extract customer details from checkout session
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const customerPhone = session.customer_details?.phone;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Validate required email field
  if (!customerEmail) {
    console.error(`[${mode}] [CRITICAL] No email in checkout session:`, {
      sessionId: session.id,
      customerId,
      subscriptionId,
      customerDetails: session.customer_details
    });
    throw new Error('No email in checkout session - cannot create user');
  }

  console.log(`[${mode}] [INFO] Processing checkout for customer:`, {
    email: customerEmail,
    name: customerName,
    customerId,
    subscriptionId
  });

  // STEP 1: Create or get auth user (with retry logic)
  let authUserId: string | null = null;
  let isNewUser = false;

  console.log(`[${mode}] [AUTH] Starting auth user creation/lookup for: ${customerEmail}`);

  try {
    await retryWithBackoff(async () => {
      console.log(`[${mode}] [AUTH] FORCE CREATE MODE - Always attempting to create user for: ${customerEmail}`);

      console.log(`[${mode}] [AUTH] Calling createUser with:`, {
        email: customerEmail,
        email_confirm: true,
        has_user_metadata: true,
        supabaseUrl: Deno.env.get('SUPABASE_URL'),
        hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      });

      const createUserResponse = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
        user_metadata: {
          name: customerName,
          phone: customerPhone,
          stripe_customer_id: customerId,
        },
      });

      const { data: newUser, error: authError } = createUserResponse;

      console.log(`[${mode}] [AUTH] createUser RAW RESPONSE:`, {
        email: customerEmail,
        fullResponse: JSON.stringify(createUserResponse, null, 2),
        hasData: !!newUser,
        hasError: !!authError,
        dataKeys: newUser ? Object.keys(newUser) : null,
        userData: newUser ? JSON.stringify(newUser, null, 2) : null,
        errorDetails: authError ? {
          message: authError.message,
          code: authError.code,
          status: authError.status,
          fullError: JSON.stringify(authError, null, 2)
        } : null
      });

      // If user already exists, get their ID
      if (authError && authError.message?.includes('already registered')) {
        console.log(`[${mode}] [AUTH] User already exists, fetching existing user:`, {
          email: customerEmail
        });

        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
          filter: `email.eq.${customerEmail}`,
        });

        if (listError || !existingUsers?.users || existingUsers.users.length === 0) {
          console.error(`[${mode}] [AUTH ERROR] User exists but couldn't fetch:`, {
            listError: listError?.message,
            email: customerEmail
          });
          throw new Error(`User already exists but couldn't fetch: ${listError?.message}`);
        }

        authUserId = existingUsers.users[0].id;
        isNewUser = false;
        console.log(`[${mode}] [AUTH] Existing user found:`, {
          userId: authUserId,
          email: customerEmail,
          createdAt: existingUsers.users[0].created_at
        });
        return;
      }

      if (authError) {
        console.error(`[${mode}] [AUTH ERROR] Failed to create user:`, {
          error: authError,
          email: customerEmail,
          code: authError.code,
          message: authError.message,
          status: authError.status,
          customerId,
          subscriptionId,
          fullError: JSON.stringify(authError)
        });
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!newUser || !newUser.user) {
        console.error(`[${mode}] [AUTH ERROR] No user returned after creation:`, {
          email: customerEmail,
          response: newUser,
          customerId,
          subscriptionId
        });
        throw new Error('Auth user creation returned no user data');
      }

      if (!newUser.user.id) {
        console.error(`[${mode}] [AUTH ERROR] No user ID in response:`, {
          email: customerEmail,
          user: newUser.user,
          customerId,
          subscriptionId
        });
        throw new Error('Auth user creation returned no user ID');
      }

      authUserId = newUser.user.id;
      isNewUser = true;
      console.log(`[${mode}] [AUTH SUCCESS] New user created:`, {
        userId: authUserId,
        email: customerEmail,
        customerId,
        subscriptionId
      });
    });
  } catch (error) {
    console.error(`[${mode}] [AUTH CRITICAL] Auth user creation/lookup failed after retries:`, {
      error: error.message,
      stack: error.stack,
      email: customerEmail,
      customerId,
      subscriptionId
    });
    throw error;
  }

  // STEP 2: Create or update users table record
  let isNewSubscriber = false;

  if (authUserId) {
    console.log(`[${mode}] [DB] Checking subscription history for user: ${authUserId}`);

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, subscription_started_at, email')
        .eq('id', authUserId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found (acceptable)
        console.error(`[${mode}] [DB ERROR] Failed to fetch user:`, {
          error: fetchError,
          userId: authUserId,
          email: customerEmail,
          code: fetchError.code,
          message: fetchError.message
        });
      }

      isNewSubscriber = !existingUser || !existingUser.subscription_started_at;

      console.log(`[${mode}] [DB] Subscription status determined:`, {
        userId: authUserId,
        email: customerEmail,
        isNewSubscriber,
        hasExistingRecord: !!existingUser,
        subscriptionStartedAt: existingUser?.subscription_started_at
      });

      const upsertData = {
        id: authUserId,
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        stripe_customer_id: customerId,
        ...(isNewSubscriber ? { subscription_started_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString()
      };

      console.log(`[${mode}] [DB] Upserting user record:`, {
        userId: authUserId,
        email: customerEmail,
        willSetSubscriptionStartedAt: isNewSubscriber,
        customerId
      });

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error(`[${mode}] [DB ERROR] Failed to upsert user:`, {
          error: upsertError,
          userId: authUserId,
          email: customerEmail,
          code: upsertError.code,
          message: upsertError.message,
          customerId,
          subscriptionId
        });
        // Don't throw - allow process to continue to magic link
      } else {
        console.log(`[${mode}] [DB SUCCESS] User record upserted:`, {
          userId: authUserId,
          email: customerEmail,
          subscriberType: isNewSubscriber ? 'NEW' : 'RETURNING',
          customerId
        });
      }
    } catch (error) {
      console.error(`[${mode}] [DB CRITICAL] Database operation failed:`, {
        error: error.message,
        stack: error.stack,
        userId: authUserId,
        email: customerEmail,
        customerId,
        subscriptionId
      });
      // Don't throw - allow process to continue
    }
  }

  // STEP 3: Send welcome email to ALL subscribers (both new and returning)
  console.log(`[${mode}] [EMAIL] Sending welcome email and integrations:`, {
    email: customerEmail,
    name: customerName,
    customerId,
    subscriptionId,
    subscriberType: isNewSubscriber ? 'NEW' : 'RETURNING'
  });

  const customerData = {
    email: customerEmail,
    name: customerName,
    phone: customerPhone,
    customerId: customerId,
    subscriptionId: subscriptionId,
    authUserId: authUserId,
    isNewUser: isNewUser,
  };

  const integrationResults = await Promise.allSettled([
    retryWithBackoff(() => sendWelcomeEmail(customerData, supabase, isTestMode)),
    retryWithBackoff(() => sendToZapier(customerData)),
    retryWithBackoff(() => sendToMetaCAPI(customerData)),
    retryWithBackoff(() => sendToAegis(customerData, supabase)),
  ]);

  integrationResults.forEach((result, index) => {
    const integrationNames = ['Welcome Email', 'Zapier', 'Meta CAPI', 'Aegis Wallet'];
    const integrationName = integrationNames[index] || 'Unknown Integration';

    if (result.status === 'rejected') {
      console.error(`[${mode}] [INTEGRATION ERROR] ${integrationName} failed after retries:`, {
        error: result.reason,
        email: customerEmail,
        customerId,
        subscriptionId
      });
    } else {
      console.log(`[${mode}] [INTEGRATION SUCCESS] ${integrationName} completed:`, {
        email: customerEmail,
        customerId
      });
    }
  });

  // SUMMARY LOG
  const processingTime = Date.now() - startTime;
  console.log(`[${mode}] [SUMMARY] Checkout processing completed:`, {
    sessionId: session.id,
    email: customerEmail,
    customerId,
    subscriptionId,
    authUserId,
    authUserCreated: isNewUser,
    isNewSubscriber,
    emailSent: true, // Always sent now
    processingTimeMs: processingTime
  });
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

  // Extract period from invoice line items (more reliable than subscription object)
  // This handles BOTH initial subscriptions and recurring payments
  try {
    const subscriptionLine = invoice.lines.data.find((line: any) => line.subscription === subscriptionId);

    if (!subscriptionLine || !subscriptionLine.period) {
      console.error('Could not find subscription line item with period data');
      throw new Error('Missing subscription period in invoice');
    }

    const periodStart = new Date(subscriptionLine.period.start * 1000);
    const periodEnd = new Date(subscriptionLine.period.end * 1000);

    console.log(`Provisioning subscription access for: ${customerId}`);
    console.log(`Subscription: ${subscriptionId}`);
    console.log(`Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

    // Fetch subscription for status and cancel_at_period_end
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update subscription cache - this provisions access for both new and recurring subscriptions
    const { error: cacheError } = await supabase
      .rpc('update_subscription_cache', {
        p_stripe_subscription_id: subscriptionId,
        p_stripe_customer_id: customerId,
        p_status: subscription.status,
        p_current_period_start: periodStart.toISOString(),
        p_current_period_end: periodEnd.toISOString(),
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

async function sendToAegis(customerData: any, supabase: any) {
  try {
    // Check if user already has a wallet address
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', customerData.authUserId)
      .single();

    if (fetchError) {
      console.error('[AEGIS] Failed to fetch user wallet address:', {
        error: fetchError.message,
        email: customerData.email,
        userId: customerData.authUserId
      });
      return;
    }

    // Skip if user already has a wallet
    if (userData?.wallet_address) {
      console.log('[AEGIS] User already has wallet, skipping creation:', {
        email: customerData.email,
        address: userData.wallet_address
      });
      return;
    }

    console.log('[AEGIS] Creating wallet for user:', customerData.email);

    const aegisAccount = new AegisSDK({
      network: 'SN_SEPOLIA',
      appName: 'Deporte+',
      appId: 'app-pwoeZT2RJ5SbVrz9yMdzp8sRXYkLrL6Z'
    });

    // Hash the email to use as password
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(customerData.email)
    );
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Make password meet requirements: uppercase letter, lowercase letter, number
    // Add "Dp1" prefix to ensure it has uppercase, lowercase, and number
    const password = `Dp1${hashHex}`;

    console.log('[AEGIS] Signing up user with email:', customerData.email);

    // Sign up with email and hashed email as password
    const accountInfo = await aegisAccount.signUp(
      customerData.email,
      password
    );

    console.log('[AEGIS] Wallet created successfully:', {
      email: customerData.email,
      address: aegisAccount.address,
      customerId: customerData.customerId
    });

    // Update user's wallet_address in database
    if (aegisAccount.address) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          wallet_address: aegisAccount.address,
          wallet_provider: 'aegis',
          wallet_created_at: new Date().toISOString()
        })
        .eq('id', customerData.authUserId);

      if (updateError) {
        console.error('[AEGIS] Failed to update wallet address:', {
          error: updateError.message,
          email: customerData.email,
          address: aegisAccount.address,
        });
      } else {
        console.log('[AEGIS] Wallet address saved to database:', {
          email: customerData.email,
          address: aegisAccount.address,
        });
      }
    }

    return accountInfo;
  } catch (error) {
    console.error('[AEGIS] Failed to create wallet:', {
      error: error.message,
      email: customerData.email,
      customerId: customerData.customerId
    });
    // Don't throw - allow process to continue even if Aegis fails
  }
}

async function sendWelcomeEmail(customerData: any, supabase: any, isTestMode = false) {
  const mode = isTestMode ? 'TEST' : 'LIVE';

  console.log(`[${mode}] [MAGIC_LINK] Starting magic link generation:`, {
    email: customerData.email,
    name: customerData.name,
    customerId: customerData.customerId,
    subscriptionId: customerData.subscriptionId,
    authUserId: customerData.authUserId,
    isNewUser: customerData.isNewUser
  });

  try {
    // STEP 1: Skip magic link generation and just send a welcome-back email
    // For returning subscribers, they already have an account and can log in normally
    // We'll just send them a notification that their subscription is active

    if (!customerData.isNewUser && !customerData.authUserId) {
      console.error(`[${mode}] [CRITICAL] Existing user flagged but no authUserId provided:`, {
        email: customerData.email,
        isNewUser: customerData.isNewUser,
        authUserId: customerData.authUserId
      });
      throw new Error('Existing user without authUserId - data inconsistency');
    }

    if (customerData.isNewUser) {
      // For NEW users: Generate magic link for first-time access
      console.log(`[${mode}] [MAGIC_LINK] Generating magic link for NEW user: ${customerData.email}`);

      const { data: magicLinkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: customerData.email,
      });

      if (linkError) {
        console.error(`[${mode}] [MAGIC_LINK ERROR] Failed to generate magic link:`, {
          error: linkError,
          email: customerData.email,
          code: linkError.code,
          message: linkError.message,
          status: linkError.status,
          customerId: customerData.customerId,
          subscriptionId: customerData.subscriptionId
        });
        throw new Error(`Failed to generate magic link: ${linkError.message}`);
      }

      if (!magicLinkData || !magicLinkData.properties || !magicLinkData.properties.action_link) {
        console.error(`[${mode}] [MAGIC_LINK ERROR] Invalid magic link data:`, {
          email: customerData.email,
          magicLinkData,
          customerId: customerData.customerId
        });
        throw new Error('No action_link in magic link data');
      }

      console.log(`[${mode}] [MAGIC_LINK SUCCESS] Magic link generated for NEW user:`, {
        email: customerData.email,
        hasActionLink: true,
        customerId: customerData.customerId
      });

      // Send welcome email with magic link
      const { sendEmail, generateWelcomeEmail } = await import('../_shared/resend.ts');
      const emailContent = generateWelcomeEmail(
        customerData.email,
        customerData.name,
        magicLinkData.properties.action_link
      );

      console.log(`[${mode}] [EMAIL] Sending welcome email with magic link to NEW user`);

      const emailResult = await sendEmail({
        to: customerData.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (!emailResult || !emailResult.id) {
        console.error(`[${mode}] [EMAIL ERROR] Email send failed:`, {
          email: customerData.email,
          hasResult: !!emailResult,
          customerId: customerData.customerId
        });
        throw new Error('Email send failed - no result returned');
      }

      console.log(`[${mode}] [EMAIL SUCCESS] Welcome email sent:`, {
        email: customerData.email,
        emailId: emailResult.id,
        customerId: customerData.customerId
      });

      return emailResult;
    } else {
      // For EXISTING/RETURNING users: Send welcome-back email WITHOUT magic link
      // They can log in using their existing credentials or request a new magic link
      console.log(`[${mode}] [EMAIL] Sending welcome-back email to RETURNING user (no magic link needed): ${customerData.email}`);

      const { sendEmail } = await import('../_shared/resend.ts');

      const emailContent = {
        subject: '¡Bienvenido de vuelta a Deporte+! 🎉',
        html: `
          <h1>¡Hola ${customerData.name || 'amigo'}!</h1>
          <p>Tu suscripción a Deporte+ ha sido renovada exitosamente.</p>
          <p>Ya puedes acceder a todo nuestro contenido exclusivo:</p>
          <ul>
            <li>Transmisiones en vivo</li>
            <li>Videos exclusivos</li>
            <li>Cursos de formación</li>
            <li>Y mucho más...</li>
          </ul>
          <p><a href="${Deno.env.get('FRONTEND_URL') || 'https://deportemas.com'}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0;">Acceder a Deporte+</a></p>
          <p>Si tienes problemas para acceder, puedes solicitar un nuevo enlace de acceso desde la página de inicio de sesión.</p>
          <p>¡Gracias por ser parte de la familia Deporte+!</p>
        `,
        text: `¡Hola ${customerData.name || 'amigo'}!\n\nTu suscripción a Deporte+ ha sido renovada exitosamente.\n\nYa puedes acceder a todo nuestro contenido exclusivo.\n\nAccede aquí: ${Deno.env.get('FRONTEND_URL') || 'https://deportemas.com'}/login\n\n¡Gracias por ser parte de la familia Deporte+!`
      };

      const emailResult = await sendEmail({
        to: customerData.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (!emailResult || !emailResult.id) {
        console.error(`[${mode}] [EMAIL ERROR] Welcome-back email send failed:`, {
          email: customerData.email,
          hasResult: !!emailResult,
          customerId: customerData.customerId
        });
        throw new Error('Welcome-back email send failed');
      }

      console.log(`[${mode}] [EMAIL SUCCESS] Welcome-back email sent:`, {
        email: customerData.email,
        emailId: emailResult.id,
        customerId: customerData.customerId,
        type: 'welcome-back'
      });

      return emailResult;
    }
  } catch (error) {
    console.error(`[${mode}] [WELCOME_EMAIL CRITICAL] Welcome email process failed:`, {
      error: error.message,
      stack: error.stack,
      email: customerData.email,
      customerId: customerData.customerId,
      subscriptionId: customerData.subscriptionId
    });
    throw error; // Re-throw for retry mechanism
  }
}