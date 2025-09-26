import {
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

const { width: screenWidth } = Dimensions.get("window");

export default function Index() {
  const [currentPage, setCurrentPage] = useState(0);

  const handleLogin = () => {
    // TODO: Navigate to login screen
    console.log("Navigate to login");
  };

  const handleRegister = () => {
    Linking.openURL("https://deportesmas.com/register");
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentPage(pageIndex);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#010017",
      }}
    >
      <StatusBar style="light" hidden={true} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 80,
          paddingBottom: 20,
        }}
      >
        {/* Logo */}
        <Image
          source={require("../assets/images/deportesMas.png")}
          style={{
            width: 120,
            height: 40,
            resizeMode: "contain",
          }}
        />

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          style={{
            backgroundColor: "#2d2d2d",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Ingresar</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content - Swipeable Carousel */}
      <View style={{ flex: 1 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {/* Screen 1 - TV with Soccer */}
          <View
            style={{
              width: screenWidth,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            {/* TV Illustration */}
            <Image
              source={require("../assets/images/futStream.png")}
              style={{
                width: 280,
                height: 200,
                marginBottom: 30,
                resizeMode: "contain",
              }}
            />

            {/* Main Text */}
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Míralo donde sea
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                textAlign: "center",
                opacity: 0.8,
                marginBottom: 40,
              }}
            >
              Transmite en tu dispositivo móvil
            </Text>
          </View>

          {/* Screen 2 - Phone with Basketball Replay */}
          <View
            style={{
              width: screenWidth,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            {/* Phone Illustration */}
            <Image
              source={require("../assets/images/replay.png")}
              style={{
                width: 280,
                height: 200,
                marginBottom: 30,
                resizeMode: "contain",
              }}
            />

            {/* Main Text */}
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Revive los mejores momentos
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                textAlign: "center",
                opacity: 0.8,
                marginBottom: 40,
              }}
            >
              Accede a repeticiones de los mejores momentos del programa
            </Text>
          </View>

          {/* Screen 3 - Giveaway */}
          <View
            style={{
              width: screenWidth,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            {/* Giveaway Illustration */}
            <Image
              source={require("../assets/images/giveaway.png")}
              style={{
                width: 280,
                height: 200,
                marginBottom: 30,
                resizeMode: "contain",
              }}
            />

            {/* Main Text */}
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Accede a Giveaways mensuales
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                textAlign: "center",
                opacity: 0.8,
                marginBottom: 40,
              }}
            >
              Gana chemas, saludos personalizados y mucho más
            </Text>
          </View>

          {/* Screen 4 - Cancel */}
          <View
            style={{
              width: screenWidth,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            {/* Cancel Illustration */}
            <Image
              source={require("../assets/images/cancel.png")}
              style={{
                width: 280,
                height: 200,
                marginBottom: 30,
                resizeMode: "contain",
              }}
            />

            {/* Main Text */}
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Cancela cuando quieras
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 16,
                textAlign: "center",
                opacity: 0.8,
                marginBottom: 40,
              }}
            >
              Si no te gusta, tranquilo nosotros te ayudamos
            </Text>
          </View>
        </ScrollView>

        {/* Page Indicators */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 0 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 1 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 2 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                currentPage === 3 ? "white" : "rgba(255,255,255,0.3)",
              marginHorizontal: 4,
            }}
          />
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
      >
        <TouchableOpacity
          onPress={handleRegister}
          style={{
            backgroundColor: "#2d1b69",
            borderWidth: 1,
            borderColor: "#8b5cf6",
            borderRadius: 12,
            padding: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Crea una cuenta y obtén los beneficios.
          </Text>
          <Text
            style={{
              color: "#a78bfa",
              fontSize: 14,
            }}
          >
            Navega a{" "}
            <Text style={{ color: "#c4b5fd", textDecorationLine: "underline" }}>
              deportesmas.com/register
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
