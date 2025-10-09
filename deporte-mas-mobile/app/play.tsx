import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MuxThumbnail } from "../components/MuxThumbnail";

const { width: screenWidth } = Dimensions.get("window");

export default function Play() {
  // Asset IDs de ejemplo - reemplaza con tus IDs reales de Mux
  const PROGRAMAS_ANTERIORES = [
    { id: "programa-1-asset-id", title: "Programa 01/10/25", duration: "45:30" },
    { id: "programa-2-asset-id", title: "Programa 30/09/25", duration: "42:15" },
    { id: "programa-3-asset-id", title: "Programa 29/09/25", duration: "38:45" },
  ];

  const NACIONALES = [
    { id: "nacional-1-asset-id", title: "Liga MX - Jornada 12", duration: "35:20" },
    { id: "nacional-2-asset-id", title: "Liga MX - Jornada 11", duration: "40:10" },
    { id: "nacional-3-asset-id", title: "Liga MX - Jornada 10", duration: "37:55" },
  ];

  const INTERNACIONALES = [
    { id: "internacional-1-asset-id", title: "Premier League - Matchday 8", duration: "43:25" },
    { id: "internacional-2-asset-id", title: "LaLiga - Jornada 9", duration: "39:40" },
    { id: "internacional-3-asset-id", title: "Serie A - Matchday 7", duration: "41:15" },
  ];

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
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("/gift")}
            >
              <Ionicons name="gift-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Programas anteriores Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programas anteriores</Text>
          <View style={styles.videoGrid}>
            {PROGRAMAS_ANTERIORES.map((video, index) => (
              <MuxThumbnail
                key={index}
                assetId={video.id}
                style={styles.videoContainer}
                onPress={() => router.push("/program")}
                title={video.title}
                duration={video.duration}
              />
            ))}
          </View>
        </View>

        {/* Nacionales Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nacionales</Text>
          <View style={styles.videoGrid}>
            {NACIONALES.map((video, index) => (
              <MuxThumbnail
                key={index}
                assetId={video.id}
                style={styles.videoContainer}
                onPress={() => router.push("/program")}
                title={video.title}
                duration={video.duration}
              />
            ))}
          </View>
        </View>

        {/* Internacionales Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Internacionales</Text>
          <View style={styles.videoGrid}>
            {INTERNACIONALES.map((video, index) => (
              <MuxThumbnail
                key={index}
                assetId={video.id}
                style={styles.videoContainer}
                onPress={() => router.push("/program")}
                title={video.title}
                duration={video.duration}
              />
            ))}
          </View>
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
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  videoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  videoContainer: {
    flex: 1,
    aspectRatio: 0.65,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playIcon: {
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
