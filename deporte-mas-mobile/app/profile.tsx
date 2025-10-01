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

export default function Profile() {
  const userEmail = "emmanuelaguerorojas@gmail.com";
  const points = 229;
  const multiplier = 2;

  const recentActivity = [
    { id: 1, action: "Ver transmisión", points: 50 },
    { id: 2, action: "Ver transmisión", points: 50 },
    { id: 3, action: "Ver transmisión", points: 50 },
    { id: 4, action: "Ver transmisión", points: 50 },
    { id: 5, action: "Ver transmisión", points: 50 },
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
          <Text style={styles.headerTitle}>Perfil</Text>
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

        {/* Profile Icon */}
        <View style={styles.profileSection}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person-outline" size={60} color="white" />
          </View>
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        {/* Points Section */}
        <View style={styles.pointsSection}>
          <Text style={styles.pointsLabel}>Tus puntos</Text>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.multiplierText}>
            Current multiplier ({multiplier}x)
          </Text>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Actividad Reciente</Text>
          <View style={styles.divider} />

          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <Text style={styles.activityText}>{activity.action}</Text>
              <Text style={styles.activityPoints}>+{activity.points}</Text>
            </View>
          ))}
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
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  profileIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emailText: {
    color: "white",
    fontSize: 16,
    opacity: 0.8,
  },
  pointsSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  pointsLabel: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
    opacity: 0.9,
  },
  pointsValue: {
    color: "white",
    fontSize: 64,
    fontWeight: "bold",
    marginBottom: 5,
  },
  multiplierText: {
    color: "white",
    fontSize: 14,
    opacity: 0.7,
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activityTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  activityText: {
    color: "white",
    fontSize: 16,
  },
  activityPoints: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
