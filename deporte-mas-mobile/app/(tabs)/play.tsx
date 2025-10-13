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
import { ThemedView, ThemedText, Card } from "../../components/themed";
import { Theme } from "../../constants/Theme";
import { Config } from "../../config";
import { Header } from "../../components/Header";

export default function Play() {
  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      <ScrollView style={styles.scrollView}>
        <Header />

        {/* Programas anteriores Section */}
        <View style={styles.section}>
          <ThemedText variant="title" style={styles.sectionTitle}>Programas anteriores</ThemedText>
          <View style={styles.videoGrid}>
            <VideoThumbnail title="Programa 10/10/25" />
            <VideoThumbnail title="Programa 09/10/25" />
            <VideoThumbnail title="Programa 08/10/25" />
          </View>
        </View>

        {/* Nacionales Section */}
        <View style={styles.section}>
          <ThemedText variant="title" style={styles.sectionTitle}>Nacionales</ThemedText>
          <View style={styles.videoGrid}>
            <VideoThumbnail title="Liga MX Highlights" />
            <VideoThumbnail title="Análisis Nacional" />
            <VideoThumbnail title="Goles de la Semana" />
          </View>
        </View>

        {/* Internacionales Section */}
        <View style={styles.section}>
          <ThemedText variant="title" style={styles.sectionTitle}>Internacionales</ThemedText>
          <View style={styles.videoGrid}>
            <VideoThumbnail title="Champions League" />
            <VideoThumbnail title="Premier League" />
            <VideoThumbnail title="La Liga" />
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </ThemedView>
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
            playbackId: '9ZDWNvgKATXo88QlxFswY3YQC9RBDm02GC9aJ6WtRzDM',
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
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    marginBottom: 15,
    fontSize: 20,
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
    backgroundColor: Theme.colors.card,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: Theme.colors.subCard,
    justifyContent: "center",
    alignItems: "center",
  },
});
