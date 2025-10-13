import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function Header() {
  return (
    <View style={styles.header}>
      <Image
        source={require("../assets/images/deportemas-isotipo-blanco.png")}
        style={styles.logo}
      />
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
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
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
});
