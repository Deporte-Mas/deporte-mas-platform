/**
 * Enhanced Stripe Integration Utilities
 *
 * Handles payments with Web3 integration triggers
 * Extends existing Stripe functionality with blockchain components
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { Web3IntegrationService } from './web3.ts';

// Types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: string;
        };
      };
    }>;
  };
  metadata: Record<string, string>;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  subscription: string;
  amount_paid: number;
  currency: string;
  status: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: StripeSubscription | StripeInvoice | StripeCustomer;
  };
  created: number;
}

export interface CheckoutSessionRequest {
  returnUrl: string;
  planType: 'monthly' | 'annual';
  metadata?: Record<string, string>;
}

// Enhanced Stripe Service
export class EnhancedStripeService {
  private stripeSecretKey: string;
  private webhookSecret: string;
  private supabase: any;
  private web3Service: Web3IntegrationService;
  private baseUrl = 'https://api.stripe.com';

  constructor() {
    // Determine environment and use appropriate keys
    const isDev = Deno.env.get('VITE_DEV_MODE') === 'true';

    this.stripeSecretKey = isDev
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY') || ''
      : Deno.env.get('STRIPE_SECRET_KEY') || '';

    this.webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Web3 service
    this.web3Service = new Web3IntegrationService();

    if (!this.stripeSecretKey) {
      console.warn('Stripe secret key not configured');
    }
  }

  /**
   * Get authorization header for Stripe API
   */
  private getAuthHeader(): string {
    return `Bearer ${this.stripeSecretKey}`;
  }

  /**
   * Get price IDs based on environment
   */
  private getPriceIds(): { monthly: string; annual: string } {
    const isDev = Deno.env.get('VITE_DEV_MODE') === 'true';

    return {
      monthly: isDev
        ? Deno.env.get('STRIPE_TEST_PRICE_MONTHLY') || ''
        : Deno.env.get('STRIPE_LIVE_PRICE_MONTHLY') || '',
      annual: isDev
        ? Deno.env.get('STRIPE_TEST_PRICE_ANNUAL') || ''
        : Deno.env.get('STRIPE_LIVE_PRICE_ANNUAL') || ''
    };
  }

  /**
   * Create enhanced checkout session with metadata
   */
  async createCheckoutSession(
    request: CheckoutSessionRequest,
    userEmail?: string
  ): Promise<{ clientSecret: string; sessionId: string } | null> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe not configured');
      }

      const priceIds = this.getPriceIds();
      const priceId = request.planType === 'monthly' ? priceIds.monthly : priceIds.annual;

      if (!priceId) {
        throw new Error(`Price ID not configured for ${request.planType} plan`);
      }

      const sessionData: any = {
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: request.returnUrl,
        cancel_url: request.returnUrl,
        metadata: {
          plan_type: request.planType,
          platform: 'deportemas',
          ...request.metadata
        }
      };

      // Add customer email if provided
      if (userEmail) {
        sessionData.customer_email = userEmail;
      }

      const response = await fetch(`${this.baseUrl}/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.encodeFormData(sessionData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stripe API error: ${error}`);
      }

      const session = await response.json();

      return {
        clientSecret: session.client_secret,
        sessionId: session.id
      };
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      return null;
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string | null> {
    try {
      if (!this.stripeSecretKey) {
        throw new Error('Stripe not configured');
      }

      const response = await fetch(`${this.baseUrl}/v1/billing_portal/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: this.encodeFormData({
          customer: customerId,
          return_url: returnUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const session = await response.json();
      return session.url;
    } catch (error) {
      console.error('Failed to create portal session:', error);
      return null;
    }
  }

  /**
   * Process webhook event with Web3 integration
   */
  async processWebhookEvent(event: StripeWebhookEvent): Promise<void> {
    try {
      console.log(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as any);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as StripeSubscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as StripeSubscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as StripeInvoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as StripeInvoice);
          break;

        default:
          console.log(`Unhandled Stripe webhook: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to process Stripe webhook:', error);
      throw error;
    }
  }

  /**
   * Handle checkout session completion
   */
  private async handleCheckoutCompleted(session: any): Promise<void> {
    try {
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Get subscription details
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Find or create user
      const customer = await this.getCustomer(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Update user subscription status
      await this.updateUserSubscription(customer.email, subscription);

      console.log(`Checkout completed for customer: ${customer.email}`);
    } catch (error) {
      console.error('Failed to handle checkout completion:', error);
    }
  }

  /**
   * Handle subscription update with Web3 integration
   */
  private async handleSubscriptionUpdated(subscription: StripeSubscription): Promise<void> {
    try {
      // Get customer details
      const customer = await this.getCustomer(subscription.customer);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Update user in database
      const { data: user } = await this.supabase
        .from('users')
        .select('id, wallet_address')
        .eq('email', customer.email)
        .single();

      if (!user) {
        console.warn(`User not found for email: ${customer.email}`);
        return;
      }

      // Update subscription status
      await this.updateUserSubscription(customer.email, subscription);

      // Handle Web3 integration
      if (subscription.status === 'active') {
        // Create wallet if not exists
        if (!user.wallet_address) {
          await this.web3Service.createUserWallet(user.id, customer.email);
        }

        // Mint membership NFT
        await this.web3Service.handleSubscriptionActivated(user.id);
      }

      console.log(`Subscription updated for user: ${customer.email} - Status: ${subscription.status}`);
    } catch (error) {
      console.error('Failed to handle subscription update:', error);
    }
  }

  /**
   * Handle subscription deletion with Web3 cleanup
   */
  private async handleSubscriptionDeleted(subscription: StripeSubscription): Promise<void> {
    try {
      // Get customer details
      const customer = await this.getCustomer(subscription.customer);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get user
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (!user) {
        console.warn(`User not found for email: ${customer.email}`);
        return;
      }

      // Update subscription status
      await this.supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('email', customer.email);

      // Burn membership NFT
      await this.web3Service.handleSubscriptionCancelled(user.id);

      console.log(`Subscription deleted for user: ${customer.email}`);
    } catch (error) {
      console.error('Failed to handle subscription deletion:', error);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: StripeInvoice): Promise<void> {
    try {
      // Record payment in database
      await this.supabase
        .from('payments')
        .insert({
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: invoice.subscription,
          stripe_customer_id: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded'
        });

      console.log(`Payment succeeded: ${invoice.id}`);
    } catch (error) {
      console.error('Failed to handle payment success:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: StripeInvoice): Promise<void> {
    try {
      // Record failed payment
      await this.supabase
        .from('payments')
        .insert({
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: invoice.subscription,
          stripe_customer_id: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'failed'
        });

      // You might want to send notification to user here

      console.log(`Payment failed: ${invoice.id}`);
    } catch (error) {
      console.error('Failed to handle payment failure:', error);
    }
  }

  /**
   * Get subscription details from Stripe
   */
  private async getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Get customer details from Stripe
   */
  private async getCustomer(customerId: string): Promise<StripeCustomer | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/customers/${customerId}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get customer:', error);
      return null;
    }
  }

  /**
   * Update user subscription in database
   */
  private async updateUserSubscription(email: string, subscription: StripeSubscription): Promise<void> {
    const planType = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';

    await this.supabase
      .from('users')
      .update({
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_tier: subscription.status === 'active' ? 'premium' : 'free',
        plan_type: planType,
        subscription_started_at: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    // Update subscriptions table
    await this.supabase
      .from('subscriptions')
      .upsert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        price_amount: subscription.items.data[0]?.price?.unit_amount || 0,
        price_currency: subscription.items.data[0]?.price?.currency || 'usd',
        billing_interval: subscription.items.data[0]?.price?.recurring?.interval || 'month'
      }, {
        onConflict: 'stripe_subscription_id'
      });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        console.warn('Stripe webhook secret not configured');
        return true; // Allow through if not configured
      }

      // Implementation would verify HMAC signature
      // This is a placeholder for actual crypto verification
      return true;
    } catch (error) {
      console.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Encode form data for Stripe API
   */
  private encodeFormData(data: any): string {
    return Object.keys(data)
      .map(key => {
        const value = data[key];
        if (typeof value === 'object' && value !== null) {
          return Object.keys(value)
            .map(subKey => `${key}[${subKey}]=${encodeURIComponent(value[subKey])}`)
            .join('&');
        }
        return `${key}=${encodeURIComponent(value)}`;
      })
      .join('&');
  }
}

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'CRC'): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
};

export const isActiveSubscription = (status: string): boolean => {
  return ['active', 'trialing'].includes(status);
};

export const getSubscriptionEndDate = (subscription: StripeSubscription): Date => {
  return new Date(subscription.current_period_end * 1000);
};

export default {
  EnhancedStripeService,
  formatCurrency,
  isActiveSubscription,
  getSubscriptionEndDate
};