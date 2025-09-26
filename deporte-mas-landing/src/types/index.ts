// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  country?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  plan_type: 'monthly' | 'annual';
  created_at: string;
  updated_at: string;
}

// Subscription types
export interface Subscription {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'unpaid';
  plan_type: 'monthly' | 'annual';
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
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