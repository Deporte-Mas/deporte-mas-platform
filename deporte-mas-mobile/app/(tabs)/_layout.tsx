import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../constants/Theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: "#2a2a3e",
          paddingBottom: 30,
          paddingTop: 15,
          height: 90,
        },
        tabBarActiveTintColor: Theme.colors.text,
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
