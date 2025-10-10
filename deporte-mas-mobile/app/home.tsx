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
import { Config } from "../config";

const { width: screenWidth } = Dimensions.get("window");

export default function Home() {
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
          <Text style={styles.headerTitle}>En vivo</Text>
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
          <Text style={styles.replayTitle}>Volver a ver</Text>
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
  mainVideoContainer: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.95,
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
  },
  thumbnailMain: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a4e",
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
    paddingBottom: 100,
  },
  replayTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
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
    backgroundColor: "#1a1a2e",
    position: "relative",
  },
  thumbnailSmall: {
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
