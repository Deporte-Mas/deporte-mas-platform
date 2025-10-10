# Environment Variables Setup

## Required Environment Variables

This app requires the following environment variables to be configured:

### Mux Configuration

- `EXPO_PUBLIC_MUX_ENV_KEY` - Your Mux Data environment key for analytics
- `EXPO_PUBLIC_MUX_PLAYBACK_ID` - Default Mux playback ID for demo streams

## Setup Instructions

### 1. Copy the example file

Copy `env.example` to `.env`:

```bash
cd deporte-mas-mobile
cp env.example .env
```

Or create manually:

```bash
touch .env
```

### 2. Add your environment variables

Open `.env` and replace the placeholder values:

```
EXPO_PUBLIC_MUX_ENV_KEY=your_actual_mux_environment_key
EXPO_PUBLIC_MUX_PLAYBACK_ID=your_actual_mux_playback_id
```

### 3. Get your Mux credentials

#### Mux Environment Key:

1. Go to [Mux Dashboard](https://dashboard.mux.com/)
2. Navigate to **Settings → Data**
3. Copy your **Environment Key**

#### Mux Playback ID:

1. Go to [Mux Dashboard](https://dashboard.mux.com/)
2. Navigate to **Video** or **Live Streams**
3. Select or create a video/stream
4. Copy the **Playback ID**

### 4. Restart Expo

After creating/modifying `.env`, restart the Expo dev server:

```bash
expo start -c
```

## Security Notes

- **Never commit `.env` to git** - It's already in `.gitignore`
- The `.env` file contains sensitive API keys
- Share credentials securely with team members
- Use different keys for development and production

## Fallback Values

If environment variables are not set, the app will use fallback values from `config.ts`:

- These are default values and should be replaced with actual credentials
- The app will work with defaults but analytics may not function correctly

## Configuration File

The `config.ts` file centralizes all environment variable access:

```typescript
export const Config = {
  MUX_ENV_KEY: process.env.EXPO_PUBLIC_MUX_ENV_KEY || "fallback_key",
  MUX_PLAYBACK_ID: process.env.EXPO_PUBLIC_MUX_PLAYBACK_ID || "fallback_id",
};
```

Import and use it in your components:

```typescript
import { Config } from "../config";

const playbackId = Config.MUX_PLAYBACK_ID;
const envKey = Config.MUX_ENV_KEY;
```

## Troubleshooting

### Environment variables not loading

1. Ensure `.env` file is in the correct directory (`deporte-mas-mobile/`)
2. Restart Expo with cache cleared: `expo start -c`
3. Check that variable names start with `EXPO_PUBLIC_`
4. Verify no spaces around `=` in `.env` file

### Still using fallback values

1. Check `.env` syntax is correct
2. Make sure you restarted the dev server after creating `.env`
3. Try stopping and restarting: `Ctrl+C` then `expo start`
