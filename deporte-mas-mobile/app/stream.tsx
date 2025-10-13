import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Video, ResizeMode } from "expo-av";
import { useState, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView, ThemedText, Card } from "../components/themed";
import muxExpoAv from "@codebayu/mux-data-expo-av";
import { Config } from "../config";

const { width: screenWidth } = Dimensions.get("window");

// Wrap Video component with Mux monitoring
const MuxVideo = muxExpoAv(Video);

interface StreamParams {
  playbackId?: string;
  title?: string;
  description?: string;
  isLive?: string;
}

export default function Stream() {
  const params = useLocalSearchParams() as StreamParams;
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default values if no params provided
  const playbackId = params.playbackId || "DEMO_PLAYBACK_ID";
  const streamTitle = params.title || "Stream en Vivo";
  const streamDescription =
    params.description || "Transmisión en vivo de DeporteMás";
  const isLive = params.isLive === "true" || true;

  // Construct Mux stream URL
  const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  // Generate unique video ID for Mux monitoring
  const muxVideoId = `${playbackId}_${streamTitle.replace(/\s+/g, "_")}`;

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false);
    }
  };

  const handleStreamError = () => {
    Alert.alert(
      "Error de Transmisión",
      "No se pudo cargar el stream. Verifica tu conexión o intenta más tarde.",
      [{ text: "OK" }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        {isLive && (
          <View style={styles.headerLiveBadge}>
            <View style={styles.liveDot} />
            <ThemedText variant="body" style={styles.headerLiveText}>EN VIVO</ThemedText>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Video Player */}
        <View style={styles.videoWrapper}>
          {/* Stream Info */}
          <View style={styles.streamInfo}>
            <ThemedText variant="title" style={styles.streamTitle} numberOfLines={2}>
              {streamTitle}
            </ThemedText>
            {streamDescription && (
              <ThemedText variant="body" style={styles.streamDescription} numberOfLines={3}>
                {streamDescription}
              </ThemedText>
            )}
          </View>

          <View style={styles.videoContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <ThemedText variant="body" style={styles.loadingText}>Cargando stream...</ThemedText>
              </View>
            )}

            <MuxVideo
              key={muxVideoId}
              ref={videoRef}
              source={{ uri: streamUrl }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              onError={handleStreamError}
              muxOptions={{
                application_name: "DeporteMas",
                application_version: "1.0.0",
                data: {
                  env_key: Config.MUX_ENV_KEY,
                  video_id: muxVideoId,
                  video_title: streamTitle,
                  viewer_user_id: "anonymous",
                  player_name: "expo-av",
                  video_stream_type: isLive ? "live" : "on-demand",
                },
              }}
            />
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0000",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
  },
  headerLiveText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  videoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  videoContainer: {
    width: screenWidth - 40,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
  },
  streamInfo: {
    alignItems: "flex-start",
    width: screenWidth - 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  streamTitle: {
    marginBottom: 8,
    lineHeight: 30,
    textAlign: "left",
  },
  streamDescription: {
    lineHeight: 22,
    opacity: 0.85,
    textAlign: "left",
  },
});
