import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { ThemedView, ThemedText, GradientButton } from "../components/themed";
import { Theme } from "../constants/Theme";

const { width: screenWidth } = Dimensions.get("window");

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { sendMagicLink } = useAuth();

  const handleLogin = async () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    // Temporary bypass: go directly to home tabs
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("/(tabs)/home");
    }, 500);

    // TODO: Uncomment this when ready to use real magic link
    // const result = await sendMagicLink(email);
    // setLoading(false);
    // if (result.success) {
    //   setSuccess(true);
    // } else {
    //   Alert.alert("Error", result.message);
    // }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo - Using deportesMas.png */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/deportesMas.png")}
            style={styles.logo}
          />
        </View>

        {success ? (
          /* Success Message */
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>✓ Magic Link Enviado!</Text>
            <Text style={styles.successText}>
              Revisa tu email y haz click en el enlace para iniciar sesión.
            </Text>
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => setSuccess(false)}
            >
              <Text style={styles.backToLoginText}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Login Form */
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Te enviaremos un enlace mágico para iniciar sesión sin contraseña.
            </Text>

            {/* Login Button */}
            {loading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color="white" />
              </View>
            ) : (
              <GradientButton
                title="Enviar Magic Link"
                onPress={handleLogin}
                disabled={loading}
              />
            )}
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 80, // Same padding as index
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
  },
  form: {
    width: "100%",
    maxWidth: 300,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  loadingButton: {
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  infoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  successContainer: {
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  successTitle: {
    color: "#4ade80",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  successText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  backToLoginButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  backToLoginText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
