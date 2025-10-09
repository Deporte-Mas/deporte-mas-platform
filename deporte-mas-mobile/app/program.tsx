import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MuxPlayer } from "../components/MuxPlayer";

const { width: screenWidth } = Dimensions.get("window");

export default function Program() {
  // Asset ID de ejemplo - reemplaza con tu ID real de Mux
  const PROGRAM_VIDEO_ASSET_ID = "your-program-video-asset-id";

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
          <Text style={styles.programTitle}>Programa 02/10/25</Text>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <MuxPlayer
            assetId={PROGRAM_VIDEO_ASSET_ID}
            style={styles.video}
            autoplay={false}
            muted={false}
            loop={false}
            controls={true}
            resizeMode="contain"
            onLoad={() => console.log('Program video loaded')}
            onError={(error) => console.error('Program video error:', error)}
          />
        </View>

        {/* Program Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Revive todo lo que pasó en el programa de este domingo.
          </Text>
          <Text style={styles.descriptionText}>
            Hablamos de los temas más relevantes del fútbol nacional e
            internacional: los mejores momentos, jugadas clave y análisis de
            expertos que no te puedes perder.
          </Text>
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
