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
    const devMode = Deno.env.get('VITE_DEV_MODE') === 'true';
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

    // Handle different event types
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
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
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

  // Create or update user in database
  if (customerData.email) {
    const { error } = await supabase
      .from('users')
      .upsert({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        country: customerData.country,
        stripe_customer_id: customerData.customerId,
        stripe_subscription_id: customerData.subscriptionId,
        subscription_status: 'active',
        plan_type: customerData.metadata?.plan_type || 'monthly',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('Error upserting user:', error);
    }
  }

  // Send to integrations in parallel
  await Promise.allSettled([
    sendToZapier(customerData),
    sendToMetaCAPI(customerData),
  ]);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  console.log("Subscription created:", subscription.id);

  // Update subscription details in database
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan_type: subscription.metadata?.plan_type || 'monthly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (error) {
    console.error('Error creating subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  console.log("Subscription updated:", subscription.id);

  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  console.log("Subscription cancelled:", subscription.id);

  // Update subscription status to cancelled
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  console.log("Payment succeeded for subscription:", invoice.subscription);

  // Record successful payment
  const { error } = await supabase
    .from('payments')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription as string,
      stripe_customer_id: invoice.customer as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error recording payment:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  console.log("Payment failed for subscription:", invoice.subscription);

  // Record failed payment
  const { error } = await supabase
    .from('payments')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription as string,
      stripe_customer_id: invoice.customer as string,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error recording failed payment:', error);
  }
}

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