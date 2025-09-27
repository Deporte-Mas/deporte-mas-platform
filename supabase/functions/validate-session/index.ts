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
    is_active_subscriber: boolean;
    subscription_started_at?: string;
    wallet_address?: string;
    total_points_earned: number;
    team_badges: string[];
  };
  subscription: {
    is_active: boolean;
    started_at?: string;
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
      // Get user profile and subscription status
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          avatar_url,
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

      // Get subscription status from cache
      const { data: subscriptionStatus } = await supabase
        .rpc('get_user_subscription_status', { user_id: user.id });

      const hasAccess = subscriptionStatus?.[0]?.is_active || false;

      // Generate permissions array
      const permissions: string[] = [];
      if (hasAccess) {
        permissions.push('platform_access', 'chat', 'polls', 'giveaways', 'premium_content');
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
          is_active_subscriber: hasAccess,
          subscription_started_at: subscriptionStatus?.[0]?.stripe_customer_id ? subscriptionStatus[0].current_period_end : null,
          wallet_address: userProfile.wallet_address,
          total_points_earned: userProfile.total_points_earned || 0,
          team_badges: userProfile.team_badges || []
        },
        subscription: {
          is_active: hasAccess,
          started_at: subscriptionStatus?.[0]?.current_period_end || null
        },
        wallet: walletInfo,
        permissions,
        hasAccess,
        features: {
          web3_enabled: !!userProfile.wallet_address,
          can_chat: hasAccess,
          can_enter_giveaways: hasAccess,
          can_access_premium: hasAccess
        }
      };

      return createSuccessResponse(response, 'Session validated successfully');

    } catch (error) {
      console.error('Session validation error:', error);
      return createErrorResponse('Failed to validate session', 500, 'SESSION_VALIDATION_ERROR');
    }
  });
});