import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import * as SplashScreen from "expo-splash-screen";
import { Theme } from "../constants/Theme";

interface SplashVideoProps {
  onFinish: () => void;
}

export function SplashVideo({ onFinish }: SplashVideoProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Keep splash screen visible while video loads
    SplashScreen.preventAutoHideAsync();
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (!isReady) {
        setIsReady(true);
        SplashScreen.hideAsync();
      }

      // When video finishes playing, call onFinish
      if (status.didJustFinish) {
        onFinish();
      }
    }
  };

  const handleError = () => {
    // If video fails to load, just hide splash and continue
    console.warn("Splash video failed to load");
    SplashScreen.hideAsync();
    onFinish();
  };

  return (
    <View style={styles.container}>
      <Video
        source={require("../assets/videos/splash.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
