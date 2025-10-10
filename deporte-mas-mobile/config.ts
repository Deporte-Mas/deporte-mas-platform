// Configuration file for environment variables
// Create a .env file in the root directory with these variables

export const Config = {
  MUX_ENV_KEY:
    process.env.EXPO_PUBLIC_MUX_ENV_KEY || "q0h80m0o27dog7r0628m79foj",
  MUX_PLAYBACK_ID: process.env.EXPO_PUBLIC_MUX_PLAYBACK_ID || "",
};
