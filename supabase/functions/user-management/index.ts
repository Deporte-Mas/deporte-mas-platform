import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  validateRequestBody,
  type AuthContext
} from "../_shared/auth.ts";

// Types
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  country?: string;
  is_active_subscriber: boolean;
  subscription_started_at?: string;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  country?: string;
}

serve(async (req) => {
  return await withAuth(req, async (context: AuthContext, req: Request) => {
    const { user, supabase } = context;

    switch (req.method) {
      case 'GET':
        return await handleGetProfile(supabase, user.id);

      case 'PUT':
        return await handleUpdateProfile(supabase, user.id, req);

      case 'DELETE':
        return await handleDeleteUser(supabase, user.id);

      default:
        return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
    }
  });
});

async function handleGetProfile(supabase: any, userId: string) {
  try {
    // Get user profile with subscription info
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        country,
        stripe_customer_id,
        subscription_started_at,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      return createErrorResponse('User profile not found', 404, 'USER_NOT_FOUND');
    }

    // Get subscription status from cache
    const { data: subscriptionStatus } = await supabase
      .rpc('get_user_subscription_status', { user_id: userId });

    const isActiveSubscriber = subscriptionStatus?.[0]?.is_active || false;

    const profileData = {
      ...data,
      is_active_subscriber: isActiveSubscriber,
      subscription_status: subscriptionStatus?.[0]?.subscription_status || null,
      current_period_end: subscriptionStatus?.[0]?.current_period_end || null
    };

    return createSuccessResponse(profileData, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    return createErrorResponse('Failed to fetch user profile', 500, 'PROFILE_FETCH_ERROR');
  }
}

async function handleUpdateProfile(supabase: any, userId: string, req: Request) {
  try {
    const body: UpdateProfileRequest = await req.json();

    // Validate input using helper
    const allowedFields = ['name', 'phone', 'country'];
    const updates = validateRequestBody<UpdateProfileRequest>(body, [], allowedFields);

    if (Object.keys(updates).length === 0) {
      return createErrorResponse('No valid fields to update', 400, 'VALIDATION_ERROR');
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createSuccessResponse(data, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return createErrorResponse('Failed to update user profile', 500, 'PROFILE_UPDATE_ERROR');
  }
}

async function handleDeleteUser(supabase: any, userId: string) {
  try {
    // Note: This will also delete the user from auth.users due to CASCADE
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    return createSuccessResponse(null, 'User account deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse('Failed to delete user account', 500, 'USER_DELETE_ERROR');
  }
}