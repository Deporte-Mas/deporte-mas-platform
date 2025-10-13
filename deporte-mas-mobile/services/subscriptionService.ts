import * as WebBrowser from 'expo-web-browser';
import { Platform, Alert, Linking } from 'react-native';
import { isValidUrl } from '../utils/urlValidator';
import { SUBSCRIPTION_MESSAGES } from '../constants/messages';
import { getSubscriptionUrl } from '../config/subscription';

export enum SubscriptionError {
  BROWSER_FAILED = 'BROWSER_FAILED',
  INVALID_URL = 'INVALID_URL',
  USER_CANCELLED = 'USER_CANCELLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN',
}

export interface SubscriptionServiceResult {
  success: boolean;
  error?: SubscriptionError;
  message?: string;
}

/**
 * Opens the subscription URL in the device's browser
 * @param {string} url - The subscription URL to open
 * @returns {Promise<SubscriptionServiceResult>} Result of the operation
 */
export const openSubscriptionUrl = async (
  url: string
): Promise<SubscriptionServiceResult> => {
  try {
    // Validate URL before opening
    if (!isValidUrl(url)) {
      console.error('[Subscription Service] Invalid URL:', url);
      return {
        success: false,
        error: SubscriptionError.INVALID_URL,
        message: SUBSCRIPTION_MESSAGES.ERROR_INVALID_URL,
      };
    }

    // Platform-specific browser opening
    if (Platform.OS === 'web') {
      // On web, open in new tab
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        console.error('[Subscription Service] Failed to open window (popup blocked?)');
        return {
          success: false,
          error: SubscriptionError.BROWSER_FAILED,
          message: SUBSCRIPTION_MESSAGES.ERROR_BROWSER_FAILED,
        };
      }
      return { success: true };
    } else {
      // On iOS/Android, use expo-web-browser
      const result = await WebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'close',
        readerMode: false,
        enableBarCollapsing: true,
      });

      if (result.type === 'cancel') {
        console.log('[Subscription Service] User cancelled browser');
        return {
          success: false,
          error: SubscriptionError.USER_CANCELLED,
        };
      }

      return { success: true };
    }
  } catch (error) {
    console.error('[Subscription Service] Error opening browser:', error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return {
          success: false,
          error: SubscriptionError.PERMISSION_DENIED,
          message: SUBSCRIPTION_MESSAGES.ERROR_PERMISSION_DENIED,
        };
      }
    }

    return {
      success: false,
      error: SubscriptionError.BROWSER_FAILED,
      message: SUBSCRIPTION_MESSAGES.ERROR_BROWSER_FAILED,
    };
  }
};

/**
 * Shows compliance warning and initiates subscription flow
 * This is the main entry point for the subscription feature
 * @returns {Promise<SubscriptionServiceResult>} Result of the operation
 */
export const initiateSubscription = async (): Promise<SubscriptionServiceResult> => {
  return new Promise((resolve) => {
    Alert.alert(
      SUBSCRIPTION_MESSAGES.WARNING_TITLE,
      SUBSCRIPTION_MESSAGES.WARNING_MESSAGE,
      [
        {
          text: SUBSCRIPTION_MESSAGES.WARNING_CANCEL,
          style: 'cancel',
          onPress: () => {
            console.log('[Subscription Service] User cancelled warning');
            resolve({
              success: false,
              error: SubscriptionError.USER_CANCELLED,
            });
          },
        },
        {
          text: SUBSCRIPTION_MESSAGES.WARNING_CONTINUE,
          onPress: async () => {
            console.log('[Subscription Service] User confirmed warning');
            const url = getSubscriptionUrl();
            const result = await openSubscriptionUrl(url);
            resolve(result);
          },
        },
      ]
    );
  });
};

/**
 * Opens subscription URL directly in external browser without warning
 * @returns {Promise<SubscriptionServiceResult>} Result of the operation
 */
export const openSubscriptionDirect = async (): Promise<SubscriptionServiceResult> => {
  try {
    const url = getSubscriptionUrl();

    // Validate URL before opening
    if (!isValidUrl(url)) {
      console.error('[Subscription Service] Invalid URL:', url);
      return {
        success: false,
        error: SubscriptionError.INVALID_URL,
        message: SUBSCRIPTION_MESSAGES.ERROR_INVALID_URL,
      };
    }

    // Open in external browser (outside the app)
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      console.error('[Subscription Service] Cannot open URL:', url);
      return {
        success: false,
        error: SubscriptionError.BROWSER_FAILED,
        message: SUBSCRIPTION_MESSAGES.ERROR_BROWSER_FAILED,
      };
    }

    await Linking.openURL(url);
    return { success: true };
  } catch (error) {
    console.error('[Subscription Service] Error opening external browser:', error);
    return {
      success: false,
      error: SubscriptionError.BROWSER_FAILED,
      message: SUBSCRIPTION_MESSAGES.ERROR_BROWSER_FAILED,
    };
  }
};
