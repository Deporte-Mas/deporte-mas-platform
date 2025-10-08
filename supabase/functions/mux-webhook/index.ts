/**
 * Mux Webhook Handler
 *
 * Receives and processes webhooks from Mux for video asset events
 * Verifies webhook signatures and updates database accordingly
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/auth.ts";
import { VideoProcessingService, type MuxWebhookEvent } from "../_shared/mux.ts";

/**
 * Verify Mux webhook signature using HMAC-SHA256
 * Mux sends signature in Mux-Signature header
 * https://docs.mux.com/guides/system/verify-webhook-signatures
 */
async function verifyMuxSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    if (!secret) {
      console.warn('MUX_WEBHOOK_SECRET not configured - signatures cannot be verified');
      return false;
    }

    if (!signature) {
      console.warn('No Mux-Signature header provided');
      return false;
    }

    // Mux sends: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !sig) {
      console.warn('Invalid signature format');
      return false;
    }

    // Create signed payload: timestamp.body
    const signedPayload = `${timestamp}.${body}`;

    // Generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant-time comparison)
    return expectedSignature === sig;
  } catch (error) {
    console.error('Error verifying Mux signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  try {
    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('MUX_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('MUX_WEBHOOK_SECRET not configured');
      return createErrorResponse('Webhook not configured', 500, 'WEBHOOK_NOT_CONFIGURED');
    }

    // Get signature from header
    const signature = req.headers.get('Mux-Signature');
    if (!signature) {
      console.warn('No Mux-Signature header provided');
      return createErrorResponse('Signature required', 401, 'SIGNATURE_REQUIRED');
    }

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify signature
    const isValid = await verifyMuxSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid Mux webhook signature');
      return createErrorResponse('Invalid signature', 401, 'INVALID_SIGNATURE');
    }

    // Parse webhook event
    const event: MuxWebhookEvent = JSON.parse(rawBody);

    console.log(`Processing Mux webhook: ${event.type} for ${event.object.type} ${event.object.id}`);

    // Process webhook event
    const videoService = new VideoProcessingService();
    await videoService.processWebhookEvent(event);

    // Acknowledge receipt to Mux
    return createSuccessResponse(
      { received: true, event_type: event.type },
      'Webhook processed successfully'
    );

  } catch (error) {
    console.error('Error processing Mux webhook:', error);

    // Return 200 to Mux to prevent retries for malformed webhooks
    // But log the error for debugging
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
