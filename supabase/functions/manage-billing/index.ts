/**
 * Manage Billing Edge Function
 *
 * Creates Stripe customer portal session for subscription management
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthContext
} from "../_shared/auth.ts";
import { EnhancedStripeService } from "../_shared/stripe-enhanced.ts";

// Types
interface BillingPortalRequest {
  return_url: string;
}

interface BillingPortalResponse {
  portal_url: string;
  expires_at: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  return await withAuth(req, async (context: AuthContext) => {
    const { user, supabase } = context;

    try {
      // Parse request body
      const body = await req.json();
      const { return_url } = body as BillingPortalRequest;

      if (!return_url) {
        return createErrorResponse('Return URL is required', 400, 'MISSING_RETURN_URL');
      }

      // Get user's Stripe customer ID
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (error || !userProfile) {
        return createErrorResponse('User profile not found', 404, 'USER_NOT_FOUND');
      }

      if (!userProfile.stripe_customer_id) {
        return createErrorResponse(
          'No subscription found. Please create a subscription first.',
          400,
          'NO_SUBSCRIPTION_FOUND'
        );
      }

      // Create Stripe portal session
      const stripeService = new EnhancedStripeService();
      const portalUrl = await stripeService.createPortalSession(
        userProfile.stripe_customer_id,
        return_url
      );

      if (!portalUrl) {
        return createErrorResponse(
          'Failed to create billing portal session',
          500,
          'PORTAL_CREATION_FAILED'
        );
      }

      const response: BillingPortalResponse = {
        portal_url: portalUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      return createSuccessResponse(response, 'Billing portal session created successfully');

    } catch (error) {
      console.error('Billing portal creation error:', error);
      return createErrorResponse(
        'Failed to create billing portal session',
        500,
        'BILLING_PORTAL_ERROR'
      );
    }
  });
});