import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Determine environment and select appropriate key
const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
const publishableKey = isDevMode
  ? import.meta.env.VITE_STRIPE_TEST_PUBLISHABLE_KEY
  : import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate key prefix for safety
if (publishableKey) {
  const expectedPrefix = isDevMode ? 'pk_test_' : 'pk_live_';
  if (!publishableKey.startsWith(expectedPrefix)) {
    console.warn(
      `Stripe key mismatch: Expected ${expectedPrefix} key in ${isDevMode ? 'development' : 'production'} mode, but got: ${publishableKey.substring(0, 10)}...`
    );
  }
}

console.log(`Stripe Provider: Running in ${isDevMode ? 'TEST' : 'LIVE'} mode`);

const stripePromise = loadStripe(publishableKey);

interface StripeContextType {
  stripe: any;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      <StripeContext.Provider value={{ stripe: stripePromise }}>
        {children}
      </StripeContext.Provider>
    </Elements>
  );
}

export function useStripeContext() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
}