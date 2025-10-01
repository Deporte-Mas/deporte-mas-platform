import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Gift() {
  const points = 229;

  const prizes = [
    {
      id: 1,
      title: "Saludo personalizado",
      subtitle: "por Erick Lonnis",
      cost: 500,
    },
    {
      id: 2,
      title: "Entradas al próximo",
      subtitle: "programa",
      cost: 500,
    },
    {
      id: 3,
      title: "Camiseta personalizada",
      subtitle: "",
      cost: 500,
    },
    {
      id: 4,
      title: "Saludo personalizado",
      subtitle: "por Erick Lonnis",
      cost: 500,
    },
  ];

  const handleRedeem = (prize: any) => {
    if (points >= prize.cost) {
      Alert.alert(
        "Canjear premio",
        `¿Deseas canjear ${prize.title} por ${prize.cost} puntos?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: () => {
              Alert.alert("¡Éxito!", "Premio canjeado exitosamente");
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Puntos insuficientes",
        `Necesitas ${prize.cost - points} puntos más para canjear este premio.`
      );
    }
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
          <Text style={styles.headerTitle}>Premios</Text>
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

        {/* Gift Icon and Points */}
        <View style={styles.pointsSection}>
          <View style={styles.giftIconContainer}>
            <Ionicons name="gift-outline" size={80} color="white" />
          </View>
          <Text style={styles.pointsLabel}>Tus puntos</Text>
          <Text style={styles.pointsValue}>{points}</Text>
        </View>

        {/* Prizes List */}
        <View style={styles.prizesSection}>
          {prizes.map((prize) => (
            <View key={prize.id} style={styles.prizeCard}>
              <View style={styles.prizeInfo}>
                <Text style={styles.prizeTitle}>{prize.title}</Text>
                {prize.subtitle ? (
                  <Text style={styles.prizeSubtitle}>{prize.subtitle}</Text>
                ) : null}
              </View>
              <View style={styles.prizeActions}>
                <View style={styles.costBadge}>
                  <Text style={styles.costText}>{prize.cost}pts</Text>
                </View>
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={() => handleRedeem(prize)}
                >
                  <Text style={styles.redeemButtonText}>Canjear</Text>
                </TouchableOpacity>
              </View>
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
  pointsSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  giftIconContainer: {
    marginBottom: 20,
  },
  pointsLabel: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
    opacity: 0.9,
  },
  pointsValue: {
    color: "white",
    fontSize: 56,
    fontWeight: "bold",
  },
  prizesSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  prizeCard: {
    backgroundColor: "rgba(42, 42, 62, 0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  prizeInfo: {
    flex: 1,
  },
  prizeTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  prizeSubtitle: {
    color: "white",
    fontSize: 14,
    opacity: 0.8,
  },
  prizeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  costBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  costText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  redeemButton: {
    backgroundColor: "rgba(150, 150, 170, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  redeemButtonText: {
    color: "white",
    fontSize: 14,
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
