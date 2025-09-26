import { createClient } from '@supabase/supabase-js';
import type { User, Subscription, Payment } from '@/types';

// Additional admin types
export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  cancelledSubscriptions: number;
}

export interface UserWithSubscription extends User {
  subscription?: Subscription;
  payments?: Payment[];
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

// Subscription functions
export const subscriptions = {
  getByUserId: async (userId: string): Promise<Subscription | null> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  },

  getAll: async (): Promise<Subscription[]> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }

    return data || [];
  }
};

// Payment functions
export const payments = {
  getByUserId: async (userId: string): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return data || [];
  },

  getAll: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all payments:', error);
      return [];
    }

    return data || [];
  }
};

// Admin functions
export const admin = {
  getStats: async (): Promise<AdminStats> => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get cancelled subscriptions
      const { count: cancelledSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      // Get monthly revenue (this month's successful payments)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = monthlyPayments?.reduce((total, payment) => total + payment.amount, 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        cancelledSubscriptions: cancelledSubscriptions || 0,
        monthlyRevenue: monthlyRevenue / 100, // Convert cents to dollars
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalUsers: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        monthlyRevenue: 0,
      };
    }
  },

  getAllUsers: async (): Promise<UserWithSubscription[]> => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        subscriptions(*),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }

    return data || [];
  }
};

export default supabase;