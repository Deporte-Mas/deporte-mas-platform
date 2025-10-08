import { createClient } from '@supabase/supabase-js';
import type { User, CheckoutSessionData, CheckoutSessionResponse, ApiResponse } from '@/types';

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabasePublishableKey);

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

// User functions - Now using edge functions for better security
export const users = {
  getProfile: async (): Promise<User | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  updateProfile: async (updates: { name?: string; phone?: string; country?: string }) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: updates,
      });

      if (error) {
        console.error('Error updating user profile:', error);
        return { data: null, error };
      }

      return { data: data.data, error: null };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { data: null, error };
    }
  },

  deleteAccount: async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('user-management', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error deleting user account:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting user account:', error);
      return { success: false, error };
    }
  },

  // Legacy function for backward compatibility
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

// Stripe integration functions
export const stripe = {
  createCheckoutSession: async (sessionData: CheckoutSessionData): Promise<ApiResponse<CheckoutSessionResponse>> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: sessionData
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default supabase;