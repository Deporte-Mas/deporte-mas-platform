import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView, ThemedText, Card } from "../../components/themed";
import { Theme } from "../../constants/Theme";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../components/Header";
import { useAegis } from "@cavos/aegis";
import { useState, useEffect } from "react";

const DEPORTE_MAS_POINTS = process.env.EXPO_PUBLIC_DEPORTE_MAS_POINTS || '';

export default function Profile() {
  const { logout, user } = useAuth();
  const { aegisAccount } = useAegis();
  const [points, setPoints] = useState<number | null>(null);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const multiplier = 2;

  // Fetch token balance function
  const fetchBalance = async () => {
    if (!aegisAccount || !DEPORTE_MAS_POINTS) {
      setLoadingPoints(false);
      return;
    }

    try {
      setLoadingPoints(true);
      const balance = await aegisAccount.getTokenBalance(DEPORTE_MAS_POINTS, 18);
      setPoints(Number(balance));
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setPoints(0);
    } finally {
      setLoadingPoints(false);
    }
  };

  // Fetch on mount and when aegisAccount changes
  useEffect(() => {
    fetchBalance();
  }, [aegisAccount]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar Cuenta",
      "¿Estás seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert("En desarrollo", "Esta funcionalidad estará disponible pronto.");
          },
        },
      ]
    );
  };

  const recentActivity = [
    { id: 1, action: "Ver transmisión", points: 50 },
    { id: 2, action: "Ver transmisión", points: 50 },
    { id: 3, action: "Ver transmisión", points: 50 },
    { id: 4, action: "Ver transmisión", points: 50 },
    { id: 5, action: "Ver transmisión", points: 50 },
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={["white"]}
          />
        }
      >
        <Header />

        {/* Profile Icon */}
        <View style={styles.profileSection}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person-outline" size={60} color="white" />
          </View>
          <ThemedText variant="body" style={styles.emailText}>{user?.email || 'No email'}</ThemedText>
        </View>

        {/* Points Section */}
        <View style={styles.pointsSection}>
          <ThemedText variant="body" style={styles.pointsLabel}>Tus puntos</ThemedText>
          {loadingPoints ? (
            <ActivityIndicator size="large" color="white" style={styles.pointsLoader} />
          ) : (
            <ThemedText variant="title" style={styles.pointsValue}>
              {points !== null ? Math.floor(points) : 0}
            </ThemedText>
          )}
          <ThemedText variant="body" style={styles.multiplierText}>
            Current multiplier ({multiplier}x)
          </ThemedText>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <ThemedText variant="title" style={styles.activityTitle}>Actividad Reciente</ThemedText>
          <View style={styles.divider} />

          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <ThemedText variant="body" style={styles.activityText}>{activity.action}</ThemedText>
              <ThemedText variant="body" style={styles.activityPoints}>+{activity.points}</ThemedText>
            </View>
          ))}
        </View>

        {/* Account Actions Section */}
        <View style={styles.actionsSection}>
          <ThemedText variant="title" style={styles.actionsTitle}>Cuenta</ThemedText>
          <View style={styles.divider} />

          {/* Logout Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <ThemedText variant="body" style={styles.actionButtonText}>
                Cerrar Sesión
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
              <ThemedText variant="body" style={[styles.actionButtonText, styles.dangerText]}>
                Eliminar Cuenta
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
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
    opacity: 0.8,
  },
  pointsSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  pointsLabel: {
    marginBottom: 10,
    opacity: 0.9,
  },
  pointsValue: {
    fontSize: 64,
    marginBottom: 5,
  },
  pointsLoader: {
    marginVertical: 20,
  },
  multiplierText: {
    opacity: 0.7,
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activityTitle: {
    marginBottom: 15,
    fontSize: 20,
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
  },
  activityPoints: {
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  actionsTitle: {
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
  },
  dangerText: {
    color: "#ef4444",
  },
});
