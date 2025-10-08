import type { FacebookIdentifiers } from '@/types';

/**
 * Get Facebook identifiers for conversion tracking
 */
export function getFacebookIdentifiers(): FacebookIdentifiers {
  const identifiers: FacebookIdentifiers = {};

  // Get _fbp cookie (Facebook browser pixel)
  if (typeof document !== 'undefined') {
    const fbpMatch = document.cookie.match(/_fbp=([^;]+)/);
    if (fbpMatch) {
      identifiers.fbp = fbpMatch[1];
    }

    // Get _fbc cookie (Facebook click identifier)
    const fbcMatch = document.cookie.match(/_fbc=([^;]+)/);
    if (fbcMatch) {
      identifiers.fbc = fbcMatch[1];
    }

    // If _fbc is not present but we have fbclid in URL, construct it
    if (!identifiers.fbc && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get('fbclid');
      if (fbclid) {
        identifiers.fbc = `fb.1.${Date.now()}.${fbclid}`;
      }
    }
  }

  return identifiers;
}

/**
 * Track Facebook pixel events
 */
export function trackFacebookEvent(eventName: string, parameters?: any) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, parameters);
  }
}

/**
 * Track lead conversion
 */
export function trackLead(userData?: any, customData?: any) {
  trackFacebookEvent('Lead', {
    ...customData,
    content_name: 'Deporte+ Club Landing',
  });
}

/**
 * Track InitiateCheckout event
 */
export function trackInitiateCheckout(planType: 'monthly' | 'annual') {
  const value = planType === 'annual' ? 180 : 20;

  trackFacebookEvent('InitiateCheckout', {
    value,
    currency: 'USD',
    content_name: `Deporte+ Club ${planType} plan`,
    content_category: 'subscription',
  });
}

/**
 * Track Purchase event
 */
export function trackPurchase(planType: 'monthly' | 'annual', value: number) {
  trackFacebookEvent('Purchase', {
    value,
    currency: 'USD',
    content_name: `Deporte+ Club ${planType} subscription`,
    content_category: 'subscription',
  });
}