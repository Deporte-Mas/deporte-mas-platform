# Mux Video Monitoring Setup

This app uses Mux Data to monitor video playback performance and analytics in the React Native mobile app.

## Configuration

### 1. Get Your Mux Environment Key

1. Go to [Mux Dashboard](https://dashboard.mux.com/)
2. Navigate to Settings → Data
3. Copy your Environment Key

### 2. Set Up Environment Variable

Create a `.env` file in the `deporte-mas-mobile` directory with:

```
EXPO_PUBLIC_MUX_ENV_KEY=your_mux_environment_key_here
```

**Note:** Environment variables in Expo must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

### 3. Install dotenv (if not already installed)

```bash
npm install dotenv
```

## What's Been Implemented

The `program.tsx` file now includes:

- **Mux-wrapped Video Component**: The native `expo-av` Video component is wrapped with Mux monitoring
- **Analytics Tracking**: Tracks the following metrics:
  - Application name and version
  - Video ID and title
  - Player name
  - Viewer engagement
  - Playback performance

## Mux Options Explained

```typescript
muxOptions={{
  application_name: "DeporteMas",           // Your app name
  application_version: "1.0.0",              // App version
  data: {
    env_key: process.env.EXPO_PUBLIC_MUX_ENV_KEY,  // Your Mux environment key
    video_id: "programa_02_10_25",           // Unique ID for this video
    video_title: "Programa 02/10/25",        // Human-readable title
    viewer_user_id: "anonymous",             // User ID (update when auth is implemented)
    player_name: "expo-av",                  // Video player name
  },
}}
```

## Customization

### Dynamic Video IDs

When you have multiple videos or dynamic content, update the `video_id` and `video_title` based on the actual content:

```typescript
video_id: `programa_${date}`,
video_title: `Programa ${date}`,
```

### User Tracking

Once you have user authentication, replace `"anonymous"` with the actual user ID:

```typescript
viewer_user_id: currentUser?.id || "anonymous",
```

### Additional Metadata

You can add more metadata to track:

```typescript
data: {
  env_key: process.env.EXPO_PUBLIC_MUX_ENV_KEY,
  video_id: "programa_02_10_25",
  video_title: "Programa 02/10/25",
  viewer_user_id: "anonymous",
  player_name: "expo-av",
  // Optional additional fields:
  video_series: "Programas Semanales",
  video_duration: 3600, // in seconds
  video_stream_type: "on-demand",
  custom_1: "additional_data",
}
```

## Viewing Analytics

1. Log in to your [Mux Dashboard](https://dashboard.mux.com/)
2. Navigate to Data → Video
3. View metrics like:
   - Playback success rate
   - Buffering percentage
   - Video startup time
   - Viewer engagement
   - Error rates

## Troubleshooting

### Environment Variable Not Found

If you get an error about the environment key:

1. Ensure your `.env` file is in the `deporte-mas-mobile` directory
2. Restart the Expo dev server after creating/modifying `.env`
3. Clear Metro cache: `expo start -c`

### Video Not Playing

The Mux wrapper doesn't affect video playback. If videos aren't playing, check:

- The video source path is correct
- The video file exists in `assets/images/`
- Native video permissions are granted

## Stream Screen Usage

The app now includes a dedicated streaming screen (`stream.tsx`) for live and on-demand Mux streams.

### Navigation to Stream Screen

```typescript
import { router } from "expo-router";

// Navigate to stream with parameters
router.push({
  pathname: "/stream",
  params: {
    playbackId: "your_mux_playback_id",
    title: "Partido en Vivo",
    description: "Transmisión del partido de hoy",
    isLive: "true",
  },
});
```

### Parameters

- **playbackId** (required): The Mux playback ID for your video/stream
- **title** (optional): Title displayed on the stream screen
- **description** (optional): Description text for the stream
- **isLive** (optional): Set to "true" for live streams, "false" for VOD

### Example: Launching a Live Stream

```typescript
<TouchableOpacity
  onPress={() =>
    router.push({
      pathname: "/stream",
      params: {
        playbackId: "abc123xyz",
        title: "Liga MX - América vs Chivas",
        description: "Clásico Nacional en vivo desde el Estadio Azteca",
        isLive: "true",
      },
    })
  }
>
  <Text>Ver Stream</Text>
</TouchableOpacity>
```

### Example: Launching On-Demand Video

```typescript
router.push({
  pathname: "/stream",
  params: {
    playbackId: "def456uvw",
    title: "Resumen - Jornada 10",
    description: "Los mejores momentos de la jornada",
    isLive: "false",
  },
});
```

### Features

The stream screen includes:

- ✅ Live stream support with real-time indicators
- ✅ Viewer count display
- ✅ Interactive chat section
- ✅ Action buttons (like, share, save)
- ✅ Full Mux analytics integration
- ✅ Error handling and loading states
- ✅ Native video controls

### Getting Mux Playback IDs

1. Upload or create a live stream in [Mux Dashboard](https://dashboard.mux.com/)
2. For **Live Streams**: Go to Live Streams → Your Stream → Copy Playback ID
3. For **Video Assets**: Go to Video → Your Video → Copy Playback ID

## Resources

- [Mux Data Documentation](https://docs.mux.com/guides/data)
- [Mux React Native Guide](https://www.mux.com/docs/guides/monitor-react-native-video)
- [Mux Live Streaming Guide](https://docs.mux.com/guides/video/start-live-streaming)
- [@codebayu/mux-data-expo-av Package](https://www.npmjs.com/package/@codebayu/mux-data-expo-av)
