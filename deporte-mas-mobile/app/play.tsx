import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Config } from "../config";

export default function Play() {
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
            <VideoThumbnail title="Programa 10/10/25" />
            <VideoThumbnail title="Programa 09/10/25" />
            <VideoThumbnail title="Programa 08/10/25" />
          </View>
        </View>

        {/* Nacionales Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nacionales</Text>
          <View style={styles.videoGrid}>
            <VideoThumbnail title="Liga MX Highlights" />
            <VideoThumbnail title="Análisis Nacional" />
            <VideoThumbnail title="Goles de la Semana" />
          </View>
        </View>

        {/* Internacionales Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Internacionales</Text>
          <View style={styles.videoGrid}>
            <VideoThumbnail title="Champions League" />
            <VideoThumbnail title="Premier League" />
            <VideoThumbnail title="La Liga" />
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

interface VideoThumbnailProps {
  title: string;
}

function VideoThumbnail({ title }: VideoThumbnailProps) {
  return (
    <TouchableOpacity
      style={styles.videoContainer}
      onPress={() =>
        router.push({
          pathname: "/program",
          params: {
            playbackId: Config.MUX_PLAYBACK_ID,
            title: title,
            description: `Contenido completo de ${title}`,
          },
        })
      }
    >
      <View style={styles.thumbnail}>
        <Ionicons name="play-circle" size={50} color="white" />
      </View>
    </TouchableOpacity>
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
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a4e",
    justifyContent: "center",
    alignItems: "center",
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
