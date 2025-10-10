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
import { useState, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import muxExpoAv from "@codebayu/mux-data-expo-av";
import { Config } from "../config";

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

  return (
    <LinearGradient
      colors={["#010017", "#06007D"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar style="light" hidden={true} />

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Volver a ver</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Program Title */}
        <View style={styles.titleSection}>
          <Text style={styles.programTitle}>{programTitle}</Text>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Cargando video...</Text>
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
          <Text style={styles.descriptionText}>{programDescription}</Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/home")}
        >
          <Ionicons name="home-outline" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/play")}
        >
          <Ionicons name="play-outline" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  programTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  videoContainer: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 1.1,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
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
    color: "white",
    marginTop: 10,
    fontSize: 14,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  descriptionText: {
    color: "white",
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    paddingVertical: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#2a2a3e",
  },
  navButton: {
    padding: 10,
  },
});
