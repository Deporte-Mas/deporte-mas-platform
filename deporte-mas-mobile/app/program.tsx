import {
  Text,
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
import { useState, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView, ThemedText, Card } from "../components/themed";
import { Theme } from "../constants/Theme";
import muxExpoAv from "@codebayu/mux-data-expo-av";
import { Config } from "../config";
import { useAegis } from "@cavos/aegis";
import { watchedVideo } from "@/lib/rewards";

const { width: screenWidth } = Dimensions.get("window");

// Wrap Video component with Mux monitoring
const MuxVideo = muxExpoAv(Video);

interface ProgramParams {
  playbackId?: string;
  title?: string;
  description?: string;
}

export default function Program() {
  const params = useLocalSearchParams() as ProgramParams;
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default values if no params provided
  const playbackId = params.playbackId || Config.MUX_PLAYBACK_ID;
  const programTitle = params.title || "Programa DeporteMás";
  const programDescription =
    params.description || "Revive todo lo que pasó en el programa";

  // Construct Mux stream URL
  const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`;

  // Generate unique video ID for Mux monitoring
  const muxVideoId = `${playbackId}_${programTitle.replace(/\s+/g, "_")}`;

  const { aegisAccount } = useAegis();

  async function handleWatchedVideo() {
    await watchedVideo(aegisAccount?.address || '');
  }

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsLoading(false); 
    }
  };

  const handleVideoError = () => {
    Alert.alert(
      "Error de Reproducción",
      "No se pudo cargar el video. Verifica tu conexión.",
      [{ text: "OK" }]
    );
    setIsLoading(false);
  };

  useEffect(() => {
    handleWatchedVideo();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      <ScrollView style={styles.scrollView}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <ThemedText variant="title" style={styles.headerTitle}>Volver a ver</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Program Title */}
        <View style={styles.titleSection}>
          <ThemedText variant="title" style={styles.programTitle}>{programTitle}</ThemedText>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <ThemedText variant="body" style={styles.loadingText}>Cargando video...</ThemedText>
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
            onError={handleVideoError}
            muxOptions={{
              application_name: "DeporteMas",
              application_version: "1.0.0",
              data: {
                env_key: Config.MUX_ENV_KEY,
                video_id: muxVideoId,
                video_title: programTitle,
                viewer_user_id: "anonymous",
                player_name: "expo-av",
                video_stream_type: "on-demand",
              },
            }}
          />
        </View>

        {/* Program Description */}
        <View style={styles.descriptionSection}>
          <ThemedText variant="body" style={styles.descriptionText}>{programDescription}</ThemedText>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
  },
  placeholder: {
    width: 40,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  programTitle: {
  },
  videoContainer: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 1.1,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Theme.colors.card,
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
  descriptionSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  descriptionText: {
    lineHeight: 22,
    opacity: 0.9,
  },
});
