import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Video, ResizeMode } from "expo-av";
import { useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

export default function Home() {
  const mainVideoRef = useRef<Video>(null);
  const video1Ref = useRef<Video>(null);
  const video2Ref = useRef<Video>(null);
  const video3Ref = useRef<Video>(null);

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

        {/* Main Video Player */}
        <View style={styles.mainVideoContainer}>
          <Video
            ref={mainVideoRef}
            source={require("../assets/images/example.mp4")}
            style={styles.mainVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay
          />
        </View>

        {/* Volver a ver Section */}
        <View style={styles.replaySection}>
          <Text style={styles.replayTitle}>Volver a ver</Text>
          <View style={styles.replayGrid}>
            {/* Video 1 */}
            <TouchableOpacity
              style={styles.replayVideoContainer}
              onPress={() => router.push("/program")}
            >
              <Video
                ref={video1Ref}
                source={require("../assets/images/example.mp4")}
                style={styles.replayVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
              />
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </TouchableOpacity>

            {/* Video 2 */}
            <TouchableOpacity
              style={styles.replayVideoContainer}
              onPress={() => router.push("/program")}
            >
              <Video
                ref={video2Ref}
                source={require("../assets/images/example.mp4")}
                style={styles.replayVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
              />
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </TouchableOpacity>

            {/* Video 3 */}
            <TouchableOpacity
              style={styles.replayVideoContainer}
              onPress={() => router.push("/program")}
            >
              <Video
                ref={video3Ref}
                source={require("../assets/images/example.mp4")}
                style={styles.replayVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
              />
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
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
  mainVideo: {
    width: "100%",
    height: "100%",
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
  replayVideo: {
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
    color: "white",
    fontSize: 30,
    opacity: 0.8,
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
