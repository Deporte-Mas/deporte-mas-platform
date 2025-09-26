import { useState, useCallback } from 'react';
import { stripe } from '@/lib/supabase';
import { getFacebookIdentifiers, trackInitiateCheckout } from '@/lib/facebook-tracking';
import type { CheckoutSessionData, ApiResponse, CheckoutSessionResponse } from '@/types';

export const useCheckoutSession = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (planType: 'monthly' | 'annual'): Promise<CheckoutSessionResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Track the checkout initiation
      trackInitiateCheckout(planType);

      const facebookIds = getFacebookIdentifiers();
      const returnUrl = `${window.location.origin}/gracias`;

      const sessionData: CheckoutSessionData = {
        returnUrl,
        planType,
        metadata: {
          _fbp: facebookIds.fbp || '',
          _fbc: facebookIds.fbc || '',
          last_url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          source: 'landing_page',
          plan_type: planType
        }
      };

      const response: ApiResponse<CheckoutSessionResponse> = await stripe.createCheckoutSession(sessionData);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create checkout session');
      }

      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Checkout session creation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createCheckoutSession,
    isLoading,
    error,
    clearError
  };
};