import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { fontAssets } from "../constants/Typography";
import { Theme } from "../constants/Theme";
import { SplashVideo } from "../components/SplashVideo";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  // Load custom fonts - skip if fontAssets is empty
  const hasCustomFonts = Object.keys(fontAssets).length > 0;
  const [fontsLoaded, fontError] = useFonts(hasCustomFonts ? fontAssets : {});

  useEffect(() => {
    // Handle deep links for Supabase auth
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);

      // Parse the URL to get query params
      const { queryParams } = Linking.parse(url);

      // Supabase sends tokens in these params
      if (queryParams) {
        const { access_token, refresh_token, type } = queryParams as any;

        if (access_token && type === 'magiclink') {
          // Set the session with the tokens from the magic link
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('Error setting session from deep link:', error);
          } else {
            console.log('Successfully authenticated from magic link!');
          }
        }
      }
    };

    // Listen for deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle font loading error
  if (fontError) {
    console.error('Font loading error:', fontError);
    // Continue with system fonts
  }

  // Show splash video while fonts are loading or if fonts are loaded and splash hasn't finished
  const isLoadingFonts = hasCustomFonts && !fontsLoaded && !fontError;
  const shouldShowSplash = showSplash || isLoadingFonts;

  if (shouldShowSplash) {
    return (
      <SplashVideo
        onFinish={() => {
          // Only hide splash if fonts are ready
          if (!isLoadingFonts) {
            setShowSplash(false);
          }
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.colors.background },
        }}
      />
    </AuthProvider>
  );
}
