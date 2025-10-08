import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Webhook } from "npm:svix@1.40.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'svix-id, svix-timestamp, svix-signature, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get webhook secret
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Get Svix headers
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Svix headers');
      return new Response(JSON.stringify({ error: 'Missing webhook headers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let payload;

    try {
      payload = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('Resend webhook received:', payload.type);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract event data
    const eventType = payload.type;
    const eventData = payload.data;

    // Find user_id by email if available
    let userId = null;
    if (eventData.to && eventData.to.length > 0) {
      const email = eventData.to[0];
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (user) {
        userId = user.id;
      }
    }

    // Store event in database
    const { error } = await supabase
      .from('email_events')
      .insert({
        email: eventData.to?.[0] || eventData.email || 'unknown',
        event_type: eventType,
        resend_email_id: eventData.email_id || payload.id,
        user_id: userId,
        metadata: {
          subject: eventData.subject,
          from: eventData.from,
          created_at: eventData.created_at,
          ...eventData
        }
      });

    if (error) {
      console.error('Error storing email event:', error);
      // Don't fail the webhook, just log the error
    }

    // Handle specific event types
    switch (eventType) {
      case 'email.delivered':
        console.log(`Email delivered successfully to: ${eventData.to?.[0]}`);
        break;

      case 'email.bounced':
        console.warn(`Email bounced: ${eventData.to?.[0]}`, eventData.bounce_type);
        // TODO: Flag user for follow-up
        break;

      case 'email.failed':
        console.error(`Email failed: ${eventData.to?.[0]}`, eventData.error);
        // TODO: Trigger retry mechanism
        break;

      case 'email.opened':
        console.log(`Email opened by: ${eventData.to?.[0]}`);
        break;

      case 'email.clicked':
        console.log(`Email link clicked by: ${eventData.to?.[0]}`);
        break;

      case 'email.complained':
        console.warn(`Email marked as spam by: ${eventData.to?.[0]}`);
        // TODO: Add to suppression list
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Resend webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
