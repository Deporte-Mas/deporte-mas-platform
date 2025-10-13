import {
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  StyleSheet,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { openSubscriptionDirect } from "../services/subscriptionService";
import { ThemedView, ThemedText, GradientButton, Card } from "../components/themed";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

const messages = [
  {
    title: "Míralo donde sea",
    description: "Transmite en tu dispositivo móvil",
  },
  {
    title: "Revive los mejores momentos",
    description: "Accede a repeticiones de los mejores momentos del programa",
  },
  {
    title: "Accede a Giveaways mensuales",
    description: "Gana chemas, saludos personalizados y mucho más",
  },
  {
    title: "Cancela cuando quieras",
    description: "Si no te gusta, tranquilo nosotros te ayudamos",
  },
];

export default function Index() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change page
        setCurrentPage((prev) => (prev + 1) % messages.length);

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleRegister = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await openSubscriptionDirect();

      if (!result.success && result.message) {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error inesperado. Por favor, intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView>
      <StatusBar style="light" hidden={true} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 80,
          paddingBottom: 20,
        }}
      >
        {/* Logo */}
        <Image
          source={require("../assets/images/deportesMas.png")}
          style={{
            width: 120,
            height: 40,
            resizeMode: "contain",
          }}
        />

        {/* Login Button */}
        <GradientButton title="Ingresar" onPress={handleLogin} style={styles.headerButton} />
      </View>

      {/* Main Content - Static with Auto-changing Text */}
      <View style={{ flex: 1, position: "relative" }}>
        {/* Static Logo - Absolute Position */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/images/deportemas-isotipo-blanco.png")}
            style={{
              width: 350,
              height: 350,
              resizeMode: "contain",
              opacity: 0.2,
              marginBottom: 120,
            }}
          />
        </View>

        {/* Animated Text - On Top */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <Animated.View style={{ opacity: fadeAnim, alignItems: "center", width: "100%" }}>
            <ThemedText variant="title" style={styles.heading}>
              {messages[currentPage].title}
            </ThemedText>

            <ThemedText variant="body" style={styles.description}>
              {messages[currentPage].description}
            </ThemedText>
          </Animated.View>
        </View>

        {/* Gradient Fade at Bottom */}
        <LinearGradient
          colors={["rgba(9, 11, 28, 0)", "rgba(9, 11, 28, 0.3)", "rgba(9, 11, 28, 0.7)", "rgba(9, 11, 28, 1)"]}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.fadeGradient}
          pointerEvents="none"
        />

        {/* Page Indicators */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 0 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 1 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 2 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 3 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Card style={styles.footerCard}>
          <TouchableOpacity
            onPress={handleRegister}
            style={styles.footerContent}
            disabled={isLoading}
          >
            <ThemedText variant="body" style={styles.footerTitle}>
              {isLoading ? "Cargando..." : "Crea una cuenta y obtén los beneficios."}
            </ThemedText>
            <ThemedText variant="body" style={styles.footerSubtitle}>
              Navega a{" "}
              <ThemedText variant="body" style={styles.footerLink}>
                deporte-mas-platform.vercel.app
              </ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </Card>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  heading: {
    fontSize: 46,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 40,
  },
  fadeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  footerCard: {
    padding: 0,
    overflow: "hidden",
  },
  footerContent: {
    padding: 20,
    alignItems: "center",
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  footerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  footerLink: {
    textDecorationLine: "underline",
    opacity: 0.9,
  },
});
