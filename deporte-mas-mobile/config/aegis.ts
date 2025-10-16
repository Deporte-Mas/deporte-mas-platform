/**
 * Aegis SDK Configuration
 *
 * Configuration for the Aegis Cavos SDK integration.
 * All values are loaded from environment variables for security and flexibility.
 */

type AegisNetwork = "SN_SEPOLIA" | "SN_MAINNET" | "SN_DEVNET";

export const AEGIS_CONFIG = {
  // Starknet network to connect to
  network: (process.env.EXPO_PUBLIC_AEGIS_NETWORK || "SN_SEPOLIA") as AegisNetwork,

  // Application name displayed in wallet connections
  appName: process.env.EXPO_PUBLIC_AEGIS_APP_NAME || '',

  // Required: Your App ID from https://aegis.cavos.xyz
  appId: process.env.EXPO_PUBLIC_AEGIS_APP_ID || '',

  // Enable debug logging for development
  enableLogging: process.env.EXPO_PUBLIC_AEGIS_ENABLE_LOGGING === 'true' || false,

  // Optional: AVNU Paymaster API key for gasless transactions
  // Get your API key from https://avnu.fi/
  paymasterApiKey: "c37c52b7-ea5a-4426-8121-329a78354b0b",
};
