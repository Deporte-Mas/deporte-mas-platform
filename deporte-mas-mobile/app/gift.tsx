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
import { ThemedView, ThemedText, Card } from "../components/themed";
import { Theme } from "../constants/Theme";

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
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      <ScrollView style={styles.scrollView}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
          <ThemedText variant="title" style={styles.headerTitle}>Premios</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Gift Icon and Points */}
        <View style={styles.pointsSection}>
          <View style={styles.giftIconContainer}>
            <Ionicons name="gift-outline" size={80} color="white" />
          </View>
          <ThemedText variant="body" style={styles.pointsLabel}>Tus puntos</ThemedText>
          <ThemedText variant="title" style={styles.pointsValue}>{points}</ThemedText>
        </View>

        {/* Prizes List */}
        <View style={styles.prizesSection}>
          {prizes.map((prize) => (
            <View key={prize.id} style={styles.prizeCard}>
              <View style={styles.prizeInfo}>
                <ThemedText variant="body" style={styles.prizeTitle}>{prize.title}</ThemedText>
                {prize.subtitle ? (
                  <ThemedText variant="body" style={styles.prizeSubtitle}>{prize.subtitle}</ThemedText>
                ) : null}
              </View>
              <View style={styles.prizeActions}>
                <View style={styles.costBadge}>
                  <ThemedText variant="body" style={styles.costText}>{prize.cost}pts</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={() => handleRedeem(prize)}
                >
                  <ThemedText variant="body" style={styles.redeemButtonText}>Canjear</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
  },
  placeholder: {
    width: 40,
  },
  pointsSection: {
    alignItems: "center",
    paddingVertical: 30,
  },
  giftIconContainer: {
    marginBottom: 20,
  },
  pointsLabel: {
    marginBottom: 10,
    opacity: 0.9,
  },
  pointsValue: {
    fontSize: 56,
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
  },
  prizeSubtitle: {
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
  },
  redeemButton: {
    backgroundColor: "rgba(150, 150, 170, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  redeemButtonText: {
  },
});
