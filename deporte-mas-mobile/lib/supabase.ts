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

/**
 * Map Supabase error messages to user-friendly Spanish messages
 */
function mapErrorMessage(error: string): string {
  const errorLower = error.toLowerCase();

  // Invalid email format
  if (errorLower.includes('invalid') && errorLower.includes('email')) {
    return 'Email inválido. Verifica e intenta nuevamente.';
  }

  // Rate limiting
  if (errorLower.includes('rate') || errorLower.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e intenta nuevamente.';
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('connection')) {
    return 'No hay conexión a internet. Verifica tu conexión e intenta nuevamente.';
  }

  // User not found / doesn't exist
  if (errorLower.includes('user not found') || errorLower.includes('invalid credentials')) {
    return 'Email no registrado. Completa tu suscripción primero.';
  }

  // Generic fallback
  return 'Ocurrió un error. Intenta nuevamente.';
}

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
          // Deep link that will be used in the email - full callback path
          emailRedirectTo: 'deportemas://auth/callback',
          // Don't create new users - only existing users from Stripe webhook
          shouldCreateUser: false,
        },
      });

      if (error) {
        console.error('Magic link error:', error);
        return {
          success: false,
          message: mapErrorMessage(error.message),
        };
      }

      return {
        success: true,
        message: 'Enlace enviado! Revisa tu email.',
      };
    } catch (error: any) {
      console.error('Send magic link error:', error);

      // Check if it's a network error
      if (error?.message) {
        return {
          success: false,
          message: mapErrorMessage(error.message),
        };
      }

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
