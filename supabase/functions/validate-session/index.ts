/**
 * Validate Session Edge Function
 *
 * Validates JWT tokens and returns enriched user data with subscription and Web3 info
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthContext
} from "../_shared/auth.ts";
import { Web3IntegrationService } from "../_shared/web3.ts";

// Types
interface SessionResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    subscription_status: string;
    subscription_tier: string;
    subscription_ends_at?: string;
    wallet_address?: string;
    total_points_earned: number;
    team_badges: string[];
  };
  subscription: {
    status: string;
    tier: string;
    plan_type: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  };
  wallet?: {
    address: string;
    provider: string;
    created_at: string;
  };
  permissions: string[];
  hasAccess: boolean;
  features: {
    web3_enabled: boolean;
    can_chat: boolean;
    can_enter_giveaways: boolean;
    can_access_premium: boolean;
  };
}

serve(async (req) => {
  return await withAuth(req, async (context: AuthContext) => {
    const { user, supabase } = context;

    try {
      // Get detailed user profile with subscription info
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          avatar_url,
          subscription_status,
          subscription_tier,
          plan_type,
          subscription_ends_at,
          wallet_address,
          wallet_provider,
          wallet_created_at,
          total_points_earned,
          team_badges,
          last_active_at
        `)
        .eq('id', user.id)
        .single();

      if (userError || !userProfile) {
        return createErrorResponse('User profile not found', 404, 'USER_NOT_FOUND');
      }

      // Update last active timestamp
      await supabase
        .from('users')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', user.id);

      // Get subscription details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_customer_id', userProfile.stripe_customer_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Determine access permissions based on Stripe subscription (primary control)
      const hasAccess = userProfile.subscription_status === 'active' &&
                       (!userProfile.subscription_ends_at ||
                        new Date(userProfile.subscription_ends_at) > new Date());

      // Generate permissions array
      const permissions: string[] = [];
      if (hasAccess) {
        permissions.push('platform_access', 'chat', 'polls', 'giveaways');
        if (userProfile.subscription_tier === 'premium') {
          permissions.push('premium_content', 'exclusive_chat');
        }
      }

      // Admin permissions (would be set in user metadata)
      const isAdmin = false; // TODO: Check admin status
      if (isAdmin) {
        permissions.push('admin_access', 'content_moderate', 'user_manage');
      }

      // Prepare wallet info if available
      let walletInfo = undefined;
      if (userProfile.wallet_address) {
        walletInfo = {
          address: userProfile.wallet_address,
          provider: userProfile.wallet_provider || 'cavos',
          created_at: userProfile.wallet_created_at
        };
      }

      // Build response
      const response: SessionResponse = {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          avatar_url: userProfile.avatar_url,
          subscription_status: userProfile.subscription_status,
          subscription_tier: userProfile.subscription_tier,
          subscription_ends_at: userProfile.subscription_ends_at,
          wallet_address: userProfile.wallet_address,
          total_points_earned: userProfile.total_points_earned || 0,
          team_badges: userProfile.team_badges || []
        },
        subscription: {
          status: userProfile.subscription_status,
          tier: userProfile.subscription_tier,
          plan_type: userProfile.plan_type || 'monthly',
          current_period_end: userProfile.subscription_ends_at,
          cancel_at_period_end: subscription?.cancel_at_period_end || false
        },
        wallet: walletInfo,
        permissions,
        hasAccess,
        features: {
          web3_enabled: !!userProfile.wallet_address,
          can_chat: hasAccess,
          can_enter_giveaways: hasAccess,
          can_access_premium: hasAccess && userProfile.subscription_tier === 'premium'
        }
      };

      return createSuccessResponse(response, 'Session validated successfully');

    } catch (error) {
      console.error('Session validation error:', error);
      return createErrorResponse('Failed to validate session', 500, 'SESSION_VALIDATION_ERROR');
    }
  });
});