/**
 * Cancel Subscription Edge Function
 *
 * Cancels subscription at period end with Web3 cleanup
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  requireActiveSubscription,
  type AuthContext
} from "../_shared/auth.ts";
import { ValidationService, SubscriptionManagementSchema } from "../_shared/validation.ts";

// Types
interface CancellationResponse {
  subscription_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string;
  message: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  return await withAuth(req, async (context: AuthContext) => {
    const { user, supabase } = context;

    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = ValidationService.validate(SubscriptionManagementSchema, body);

      if (!validation.success) {
        return ValidationService.createValidationResponse(validation.errors!);
      }

      const { action, reason } = validation.data!;

      if (action !== 'cancel') {
        return createErrorResponse('Invalid action for this endpoint', 400, 'INVALID_ACTION');
      }

      // Get user's stripe customer ID
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
          'No subscription found',
          400,
          'NO_SUBSCRIPTION_FOUND'
        );
      }

      // Check if user has an active subscription using the cache
      const hasActiveSubscription = await requireActiveSubscription(supabase, user.id);
      if (!hasActiveSubscription) {
        return createErrorResponse(
          'No active subscription to cancel',
          400,
          'NO_ACTIVE_SUBSCRIPTION'
        );
      }

      // Get current subscription from Stripe to cancel it
      const stripeSecretKey = Deno.env.get('VITE_DEV_MODE') === 'true'
        ? Deno.env.get('STRIPE_TEST_SECRET_KEY')
        : Deno.env.get('STRIPE_SECRET_KEY');

      if (!stripeSecretKey) {
        return createErrorResponse('Stripe not configured', 500, 'STRIPE_NOT_CONFIGURED');
      }

      // First get the customer's active subscription from Stripe
      const customerResponse = await fetch(
        `https://api.stripe.com/v1/customers/${userProfile.stripe_customer_id}/subscriptions?status=active&limit=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          }
        }
      );

      if (!customerResponse.ok) {
        return createErrorResponse(
          'Failed to retrieve subscription from Stripe',
          500,
          'STRIPE_RETRIEVAL_FAILED'
        );
      }

      const customerSubscriptions = await customerResponse.json();
      if (!customerSubscriptions.data || customerSubscriptions.data.length === 0) {
        return createErrorResponse(
          'No active subscription found in Stripe',
          400,
          'NO_STRIPE_SUBSCRIPTION'
        );
      }

      const activeSubscription = customerSubscriptions.data[0];

      // Cancel subscription at period end
      const response = await fetch(
        `https://api.stripe.com/v1/subscriptions/${activeSubscription.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'cancel_at_period_end=true'
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Stripe cancellation error:', error);
        return createErrorResponse(
          'Failed to cancel subscription with Stripe',
          500,
          'STRIPE_CANCELLATION_FAILED'
        );
      }

      const subscription = await response.json();

      // Note: We don't update local records here since webhook will handle that

      // Record admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id, // User is admin of their own subscription
          action_type: 'subscription_cancel',
          target_type: 'subscription',
          target_id: activeSubscription.id,
          description: 'User canceled subscription at period end',
          reason: reason || 'User requested cancellation',
          success: true
        });

      const cancellationResponse: CancellationResponse = {
        subscription_id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        message: 'Subscription will be canceled at the end of the current billing period. You will retain access until then.'
      };

      return createSuccessResponse(cancellationResponse, 'Subscription cancellation scheduled');

    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return createErrorResponse(
        'Failed to cancel subscription',
        500,
        'SUBSCRIPTION_CANCELLATION_ERROR'
      );
    }
  });
});