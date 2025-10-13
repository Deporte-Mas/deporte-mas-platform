import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
                    process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth functions for mobile using Supabase Magic Link (OTP)
export const auth = {
  /**
   * Send magic link to user's email using Supabase Auth
   */
  sendMagicLink: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Deep link that will be used in the email
          // Format: deportemas://auth/callback
          emailRedirectTo: 'deportemas://',
        },
      });

      if (error) {
        console.error('Magic link error:', error);
        return {
          success: false,
          message: error.message || 'No se pudo enviar el enlace. Intenta nuevamente.',
        };
      }

      return {
        success: true,
        message: 'Enlace enviado! Revisa tu email.',
      };
    } catch (error) {
      console.error('Send magic link error:', error);
      return {
        success: false,
        message: 'Ocurrió un error. Intenta nuevamente.',
      };
    }
  },

  /**
   * Verify existing session
   */
  verifySession: async (): Promise<{ success: boolean; user?: any }> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return { success: false };
      }

      return {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name,
        },
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return { success: false };
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
};

export default supabase;
