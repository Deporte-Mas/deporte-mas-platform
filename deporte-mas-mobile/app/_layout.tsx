import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { fontAssets } from "../constants/Typography";
import { Theme } from "../constants/Theme";
import { SplashVideo } from "../components/SplashVideo";
import { AegisProvider } from "@cavos/aegis";
import { AEGIS_CONFIG } from "../config/aegis";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Navigation logic component that uses auth context
function NavigationHandler() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inPublicRoute = segments[0] === "login" || segments[0] === undefined || segments.length === 0;

    // Redirect to home if authenticated and on login/landing screen
    if (isAuthenticated && inPublicRoute) {
      router.replace("/(tabs)/home");
    }
    // Redirect to landing if not authenticated and trying to access protected routes
    else if (!isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments, isLoading]);

  return null;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [processingAuth, setProcessingAuth] = useState(false);

  // Load custom fonts - skip if fontAssets is empty
  const hasCustomFonts = Object.keys(fontAssets).length > 0;
  const [fontsLoaded, fontError] = useFonts(hasCustomFonts ? fontAssets : {});

  useEffect(() => {
    // Handle deep links for Supabase auth
    const handleDeepLink = async (event: { url: string }) => {
      try {
        const url = event.url;
        console.log("Deep link received:", url);

        // Parse both query params and hash fragments
        // Supabase sends tokens in hash fragment (#) not query params (?)
        let params: any = {};

        // Try to parse query params first
        const { queryParams } = Linking.parse(url);
        if (queryParams) {
          params = { ...queryParams };
        }

        // Also check hash fragment (after #)
        const hashMatch = url.match(/#(.+)$/);
        if (hashMatch) {
          const hashString = hashMatch[1];
          // Parse hash params (format: key=value&key2=value2)
          hashString.split("&").forEach((param) => {
            const [key, value] = param.split("=");
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });
        }

        console.log("Parsed params:", params);

        const {
          access_token,
          refresh_token,
          type,
          error,
          error_code,
          error_description,
        } = params;

        // Check if there's an error in the callback
        if (error || error_code) {
          console.log("Deep link error:", {
            error,
            error_code,
            error_description,
          });

          // Handle expired OTP
          if (
            error_code === "otp_expired" ||
            error_description?.includes("expired")
          ) {
            Alert.alert(
              "Enlace Expirado",
              "El enlace ha expirado. Solicita uno nuevo.",
              [{ text: "OK" }]
            );
          }
          // Handle access denied or other errors
          else {
            const message = error_description
              ? decodeURIComponent(error_description.replace(/\+/g, " "))
              : "No se pudo iniciar sesión. Intenta nuevamente.";

            Alert.alert("Error", message, [{ text: "OK" }]);
          }
          return;
        }

        // Validate this is a magic link callback
        if (type !== "magiclink") {
          console.log("Not a magic link, ignoring");
          return;
        }

        // Validate tokens are present
        if (!access_token || !refresh_token) {
          console.error("Missing tokens in magic link URL");
          Alert.alert("Error", "Enlace inválido. Solicita uno nuevo.", [
            { text: "OK" },
          ]);
          return;
        }

        // Show loading state while processing authentication
        setProcessingAuth(true);

        console.log("Processing magic link authentication...");

        // Set the session with the tokens from the magic link
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (sessionError) {
          console.error("Error setting session from deep link:", sessionError);

          // Check if token expired
          if (sessionError.message.toLowerCase().includes("expired")) {
            Alert.alert(
              "Enlace Expirado",
              "El enlace ha expirado. Solicita uno nuevo.",
              [{ text: "OK" }]
            );
          } else {
            Alert.alert(
              "Error",
              "No se pudo iniciar sesión. Intenta nuevamente.",
              [{ text: "OK" }]
            );
          }

          setProcessingAuth(false);
          return;
        }

        console.log("Successfully authenticated from magic link!");
        // AuthContext will handle navigation via onAuthStateChange
        setProcessingAuth(false);
      } catch (error) {
        console.error("Deep link handling error:", error);
        setProcessingAuth(false);
        // Silent fail - don't crash the app on malformed URLs
      }
    };

    // Listen for deep link events (warm start - app in background)
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle initial URL if app was opened from a deep link (cold start - app closed)
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
    console.error("Font loading error:", fontError);
    // Continue with system fonts
  }

  // Show splash video while fonts are loading or if fonts are loaded and splash hasn't finished
  const isLoadingFonts = hasCustomFonts && !fontsLoaded && !fontError;
  const shouldShowSplash = showSplash || isLoadingFonts || processingAuth;

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
    <AegisProvider config={AEGIS_CONFIG}>
      <AuthProvider>
        <NavigationHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Theme.colors.background },
          }}
        />
      </AuthProvider>
    </AegisProvider>
  );
}
