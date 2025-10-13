import Constants from 'expo-constants';

export interface SubscriptionConfig {
  subscriptionUrl: string;
  fallbackUrl: string;
}

const FALLBACK_URL = 'https://deporte-mas-platform.vercel.app/';

/**
 * Gets the subscription URL from environment variables with fallback
 * @returns {string} The subscription URL
 */
export const getSubscriptionUrl = (): string => {
  const envUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUBSCRIPTION_URL ||
                 process.env.EXPO_PUBLIC_SUBSCRIPTION_URL;

  if (!envUrl) {
    console.warn(
      '[Subscription Config] EXPO_PUBLIC_SUBSCRIPTION_URL not found in environment. Using fallback URL.'
    );
    return FALLBACK_URL;
  }

  // Basic validation
  const trimmedUrl = envUrl.trim();
  if (trimmedUrl.length === 0) {
    console.warn(
      '[Subscription Config] EXPO_PUBLIC_SUBSCRIPTION_URL is empty. Using fallback URL.'
    );
    return FALLBACK_URL;
  }

  return trimmedUrl;
};

/**
 * Gets the complete subscription configuration
 * @returns {SubscriptionConfig} Configuration object
 */
export const getSubscriptionConfig = (): SubscriptionConfig => {
  return {
    subscriptionUrl: getSubscriptionUrl(),
    fallbackUrl: FALLBACK_URL,
  };
};
