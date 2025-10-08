// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  country?: string;
  stripe_customer_id?: string;
  is_active_subscriber: boolean;
  subscription_started_at?: string;
  created_at: string;
  updated_at: string;
}

// Simplified subscription status (detailed data comes from Stripe API when needed)
export interface SubscriptionStatus {
  is_active: boolean;
  started_at?: string;
}

// Checkout types
export interface CheckoutSessionData {
  returnUrl: string;
  planType: 'monthly' | 'annual';
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  clientSecret: string;
  sessionId: string;
}

// Facebook tracking types
export interface FacebookIdentifiers {
  fbp?: string;
  fbc?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Authentication types
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}