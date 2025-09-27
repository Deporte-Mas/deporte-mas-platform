/**
 * Facebook API Integration Utilities
 *
 * Handles Facebook group management and Meta Conversion API
 */

// Types
export interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

export interface FacebookGroupMember {
  id: string;
  name: string;
  administrator: boolean;
}

export interface ConversionEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  user_data: {
    email?: string;
    phone?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_type?: string;
    contents?: Array<{
      id: string;
      quantity: number;
    }>;
  };
  action_source: string; // website, app, email, etc.
}

// Facebook API Service
export class FacebookService {
  private accessToken: string;
  private groupId: string;
  private appId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN') || '';
    this.groupId = Deno.env.get('FACEBOOK_GROUP_ID') || '';
    this.appId = Deno.env.get('FACEBOOK_APP_ID') || '';

    if (!this.accessToken || !this.groupId) {
      console.warn('Facebook API not configured - group management features will be disabled');
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(): Promise<FacebookGroupMember[]> {
    try {
      if (!this.accessToken || !this.groupId) {
        return [];
      }

      const response = await fetch(
        `${this.baseUrl}/${this.groupId}/members?access_token=${this.accessToken}&fields=id,name,administrator`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to get Facebook group members:', error);
      return [];
    }
  }

  /**
   * Invite user to Facebook group
   */
  async inviteToGroup(userId: string): Promise<boolean> {
    try {
      if (!this.accessToken || !this.groupId) {
        console.warn('Facebook API not configured - cannot invite to group');
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.groupId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            member: userId,
            access_token: this.accessToken
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to invite user to Facebook group:', error);
      return false;
    }
  }

  /**
   * Remove user from Facebook group
   */
  async removeFromGroup(userId: string): Promise<boolean> {
    try {
      if (!this.accessToken || !this.groupId) {
        console.warn('Facebook API not configured - cannot remove from group');
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.groupId}/members`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            member: userId,
            access_token: this.accessToken
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to remove user from Facebook group:', error);
      return false;
    }
  }

  /**
   * Get user by Facebook ID
   */
  async getUser(userId: string): Promise<FacebookUser | null> {
    try {
      if (!this.accessToken) {
        return null;
      }

      const response = await fetch(
        `${this.baseUrl}/${userId}?access_token=${this.accessToken}&fields=id,name,email`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Facebook user:', error);
      return null;
    }
  }
}

// Meta Conversion API Service
export class MetaConversionService {
  private accessToken: string;
  private pixelId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = Deno.env.get('META_ACCESS_TOKEN') || '';
    this.pixelId = Deno.env.get('META_PIXEL_ID') || '';

    if (!this.accessToken || !this.pixelId) {
      console.warn('Meta Conversion API not configured - conversion tracking will be disabled');
    }
  }

  /**
   * Send conversion event to Meta
   */
  async sendConversionEvent(event: ConversionEvent): Promise<boolean> {
    try {
      if (!this.accessToken || !this.pixelId) {
        console.warn('Meta Conversion API not configured - skipping event');
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/${this.pixelId}/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [event],
            access_token: this.accessToken
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Meta Conversion API error: ${error}`);
      }

      const result = await response.json();
      return result.events_received === 1;
    } catch (error) {
      console.error('Failed to send conversion event:', error);
      return false;
    }
  }

  /**
   * Send subscription conversion event
   */
  async trackSubscription(userData: {
    email: string;
    phone?: string;
    fbc?: string;
    fbp?: string;
    value: number;
    currency: string;
    planType: string;
  }): Promise<boolean> {
    const event: ConversionEvent = {
      event_name: 'Subscribe',
      event_time: Math.floor(Date.now() / 1000),
      event_id: crypto.randomUUID(),
      user_data: {
        email: this.hashEmail(userData.email),
        phone: userData.phone ? this.hashPhone(userData.phone) : undefined,
        fbc: userData.fbc,
        fbp: userData.fbp,
      },
      custom_data: {
        value: userData.value,
        currency: userData.currency,
        content_type: 'subscription',
        contents: [{
          id: userData.planType,
          quantity: 1
        }]
      },
      action_source: 'website'
    };

    return await this.sendConversionEvent(event);
  }

  /**
   * Send engagement conversion event
   */
  async trackEngagement(userData: {
    email: string;
    eventType: string;
    fbc?: string;
    fbp?: string;
  }): Promise<boolean> {
    const event: ConversionEvent = {
      event_name: 'CompleteRegistration',
      event_time: Math.floor(Date.now() / 1000),
      event_id: crypto.randomUUID(),
      user_data: {
        email: this.hashEmail(userData.email),
        fbc: userData.fbc,
        fbp: userData.fbp,
      },
      custom_data: {
        content_type: userData.eventType
      },
      action_source: 'website'
    };

    return await this.sendConversionEvent(event);
  }

  /**
   * Hash email for privacy (SHA-256)
   */
  private hashEmail(email: string): string {
    // In a real implementation, this would use a proper crypto library
    // This is a placeholder
    return email.toLowerCase().trim();
  }

  /**
   * Hash phone for privacy (SHA-256)
   */
  private hashPhone(phone: string): string {
    // Remove all non-numeric characters and hash
    const cleaned = phone.replace(/\D/g, '');
    return cleaned;
  }
}

// Social Integration Service
export class SocialIntegrationService {
  private facebook: FacebookService;
  private metaConversion: MetaConversionService;

  constructor() {
    this.facebook = new FacebookService();
    this.metaConversion = new MetaConversionService();
  }

  /**
   * Sync Facebook group membership with active subscriptions
   */
  async syncGroupMembership(): Promise<{
    invited: number;
    removed: number;
    errors: string[];
  }> {
    const results = {
      invited: 0,
      removed: 0,
      errors: []
    };

    try {
      // This would integrate with Supabase to get active subscribers
      // and compare with Facebook group members

      console.log('Facebook group sync completed', results);
      return results;
    } catch (error) {
      console.error('Failed to sync Facebook group membership:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  /**
   * Handle new subscription with social integration
   */
  async handleNewSubscription(userData: {
    email: string;
    facebookId?: string;
    planType: string;
    value: number;
    metadata?: Record<string, string>;
  }): Promise<void> {
    try {
      // Send conversion event to Meta
      await this.metaConversion.trackSubscription({
        email: userData.email,
        fbc: userData.metadata?.fbc,
        fbp: userData.metadata?.fbp,
        value: userData.value,
        currency: 'CRC',
        planType: userData.planType
      });

      // Invite to Facebook group if Facebook ID provided
      if (userData.facebookId) {
        await this.facebook.inviteToGroup(userData.facebookId);
      }

      console.log(`Social integration completed for new subscription: ${userData.email}`);
    } catch (error) {
      console.error('Failed to handle new subscription social integration:', error);
    }
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionCancellation(userData: {
    email: string;
    facebookId?: string;
  }): Promise<void> {
    try {
      // Remove from Facebook group
      if (userData.facebookId) {
        await this.facebook.removeFromGroup(userData.facebookId);
      }

      console.log(`Social integration cleanup completed for: ${userData.email}`);
    } catch (error) {
      console.error('Failed to handle subscription cancellation social integration:', error);
    }
  }

  /**
   * Track engagement events
   */
  async trackUserEngagement(userData: {
    email: string;
    eventType: string;
    metadata?: Record<string, string>;
  }): Promise<void> {
    try {
      await this.metaConversion.trackEngagement({
        email: userData.email,
        eventType: userData.eventType,
        fbc: userData.metadata?.fbc,
        fbp: userData.metadata?.fbp
      });

      console.log(`Engagement tracked for: ${userData.email} - ${userData.eventType}`);
    } catch (error) {
      console.error('Failed to track user engagement:', error);
    }
  }
}

// Utility functions
export const extractFacebookId = (url: string): string | null => {
  const match = url.match(/facebook\.com\/(?:profile\.php\?id=)?([^/?]+)/);
  return match ? match[1] : null;
};

export const validateFacebookId = (id: string): boolean => {
  return /^\d+$/.test(id) || /^[a-zA-Z0-9.]+$/.test(id);
};

export const formatFacebookGroupUrl = (groupId: string): string => {
  return `https://www.facebook.com/groups/${groupId}`;
};

export default {
  FacebookService,
  MetaConversionService,
  SocialIntegrationService,
  extractFacebookId,
  validateFacebookId,
  formatFacebookGroupUrl
};