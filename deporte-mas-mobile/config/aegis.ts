/**
 * Aegis SDK Configuration
 *
 * Configuration for the Aegis Cavos SDK integration.
 * All values are loaded from environment variables for security and flexibility.
 */

export const AEGIS_CONFIG = {
  // Starknet network to connect to
  // Options: 'mainnet', 'testnet', 'sepolia'
  network: process.env.EXPO_PUBLIC_AEGIS_NETWORK,

  // Application name displayed in wallet connections
  appName: process.env.EXPO_PUBLIC_AEGIS_APP_NAME,

  // Required: Your App ID from https://aegis.cavos.xyz
  appId: process.env.EXPO_PUBLIC_AEGIS_APP_ID,

  // Enable debug logging for development
  enableLogging: process.env.EXPO_PUBLIC_AEGIS_ENABLE_LOGGING,

  // Optional: AVNU Paymaster API key for gasless transactions
  // Get your API key from https://avnu.fi/
  paymasterApiKey: "",

  // Optional: Custom tracking URL for analytics
  trackingApiUrl: "",
};
