import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Config } from "../../config";
import { ThemedView, ThemedText, Card } from "../../components/themed";
import { Theme } from "../../constants/Theme";
import { Header } from "../../components/Header";
import { useAegis } from "@cavos/aegis";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import * as Crypto from "expo-crypto";

const { width: screenWidth } = Dimensions.get("window");

export default function Home() {
  const { aegisAccount } = useAegis();
  const { user } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasLoggedInToAegis, setHasLoggedInToAegis] = useState(false);

  const generatePassword = async (email: string): Promise<string> => {
    try {
      const hashHex = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        email,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      const password = `Dp1${hashHex}`;
      return password;
    } catch (error) {
      console.error("Error generando contraseña:", error);
      throw error;
    }
  };

  useEffect(() => {
    const handleAegisLogin = async () => {
      if (!user?.email) {
        console.log("Usuario no autenticado, saltando login con Aegis");
        return;
      }

      // Verificar que no estemos ya en proceso de login
      if (isLoggingIn) {
        console.log("Ya hay un login en proceso, saltando");
        return;
      }

      // Verificar que no hayamos ya hecho login con Aegis para este usuario
      if (hasLoggedInToAegis) {
        console.log("Ya se hizo login con Aegis para este usuario, saltando");
        return;
      }

      try {
        setIsLoggingIn(true);
        console.log("Iniciando login con Aegis para:", user.email);

        // Generar contraseña usando el mismo algoritmo del servidor
        const password = await generatePassword(user.email);

        // Hacer signIn con Aegis (el usuario ya debe existir creado por el webhook de Stripe)
        const result = await aegisAccount.signIn(user.email, password);
        console.log("Login con Aegis exitoso");
        setHasLoggedInToAegis(true);
      } catch (error) {
        console.error("Error en login con Aegis:", error);
      } finally {
        setIsLoggingIn(false);
      }
    };

    // Ejecutar login cuando el componente se monta y tenemos usuario
    handleAegisLogin();
  }, [aegisAccount, user?.email]);

  // Resetear el estado de login cuando el usuario cambie
  useEffect(() => {
    if (user?.email) {
      console.log(
        "Usuario detectado, reseteando estado de Aegis para:",
        user.email
      );
      setHasLoggedInToAegis(false);
    } else {
      console.log("No hay usuario, reseteando estado de Aegis");
      setHasLoggedInToAegis(false);
    }
  }, [user?.email]);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      <ScrollView style={styles.scrollView}>
        <Header />

        {/* Main Stream Thumbnail */}
        <TouchableOpacity
          style={styles.mainVideoContainer}
          onPress={() =>
            router.push({
              pathname: "/stream",
              params: {
                playbackId: Config.MUX_PLAYBACK_ID,
                title: "Transmisión en Vivo - DeporteMás",
                description: "Partido en vivo con análisis y comentarios",
                isLive: "true",
              },
            })
          }
        >
          <View style={styles.thumbnailMain}>
            <Ionicons name="play-circle" size={64} color="white" />
          </View>
          <View style={styles.liveOverlay}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Volver a ver Section */}
        <View style={styles.replaySection}>
          <ThemedText variant="title" style={styles.replayTitle}>
            Volver a ver
          </ThemedText>
          <View style={styles.replayGrid}>
            {/* Stream 1 */}
            <TouchableOpacity
              style={styles.replayVideoContainer}
              onPress={() =>
                router.push({
                  pathname: "/stream",
                  params: {
                    playbackId: Config.MUX_PLAYBACK_ID,
                    title: "Programa 02/10/25",
                    description: "Revive los mejores momentos del programa",
                    isLive: "false",
                  },
                })
              }
            >
              <View style={styles.thumbnailSmall}>
                <Ionicons name="play-circle" size={40} color="white" />
              </View>
            </TouchableOpacity>

            {/* Stream 2 */}
            <TouchableOpacity
              style={styles.replayVideoContainer}
              onPress={() =>
                router.push({
                  pathname: "/stream",
                  params: {
                    playbackId: Config.MUX_PLAYBACK_ID,
                    title: "Análisis Deportivo",
                    description: "Análisis completo de la jornada",
                    isLive: "false",
                  },
                })
              }
            >
              <View style={styles.thumbnailSmall}>
                <Ionicons name="play-circle" size={40} color="white" />
              </View>
            </TouchableOpacity>

            {/* Stream 3 */}
            <TouchableOpacity
              style={styles.replayVideoContainer}
              onPress={() =>
                router.push({
                  pathname: "/stream",
                  params: {
                    playbackId: Config.MUX_PLAYBACK_ID,
                    title: "Highlights de la Semana",
                    description: "Lo mejor del fútbol esta semana",
                    isLive: "false",
                  },
                })
              }
            >
              <View style={styles.thumbnailSmall}>
                <Ionicons name="play-circle" size={40} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  mainVideoContainer: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.95,
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Theme.colors.card,
  },
  thumbnailMain: {
    width: "100%",
    height: "100%",
    backgroundColor: Theme.colors.subCard,
    justifyContent: "center",
    alignItems: "center",
  },
  liveOverlay: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  liveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  replaySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  replayTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  replayGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  replayVideoContainer: {
    flex: 1,
    aspectRatio: 0.6,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Theme.colors.card,
    position: "relative",
  },
  thumbnailSmall: {
    width: "100%",
    height: "100%",
    backgroundColor: Theme.colors.subCard,
    justifyContent: "center",
    alignItems: "center",
  },
});
