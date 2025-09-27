import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types';

// Additional admin types
export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  // Note: For revenue data, query Stripe API directly
}

export interface UserWithSubscription extends User {
  // Simplified - detailed subscription data comes from Stripe API when needed
}

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const auth = {
  signUp: async (email: string, password: string, metadata?: { name?: string }) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getUser: async () => {
    return await supabase.auth.getUser();
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  }
};

// User functions
export const users = {
  getProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    return await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  },

  getByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  }
};

// Note: Detailed subscription data now comes from Stripe API
// Local database only tracks simple subscription status via users.is_active_subscriber

// Note: Payment data now comes from Stripe API
// No local payment tracking needed

// Admin functions
export const admin = {
  getStats: async (): Promise<AdminStats> => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions from cache
      const { count: activeSubscriptions } = await supabase
        .from('subscription_cache')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing'])
        .gt('current_period_end', new Date().toISOString());

      return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        // Note: For revenue data, integrate with Stripe API
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalUsers: 0,
        activeSubscriptions: 0,
      };
    }
  },

  getAllUsers: async (): Promise<UserWithSubscription[]> => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        subscription_cache (
          status,
          current_period_end,
          stripe_customer_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }

    // Transform data to include computed subscription fields
    return data?.map(user => ({
      ...user,
      is_active_subscriber: user.subscription_cache?.[0] &&
                           ['active', 'trialing'].includes(user.subscription_cache[0].status) &&
                           new Date(user.subscription_cache[0].current_period_end) > new Date(),
      subscription_started_at: user.subscription_cache?.[0] ? user.created_at : null
    })) || [];
  }
};

export default supabase;