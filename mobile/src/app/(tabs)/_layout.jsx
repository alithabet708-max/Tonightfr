import { Tabs } from "expo-router";
import { Home, Clock } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#f5f0e8",
          borderTopWidth: 1,
          borderColor: "#e8dfc8",
          paddingTop: 4,
        },
        tabBarActiveTintColor: "#0f0e0c",
        tabBarInactiveTintColor: "#8a8070",
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "System",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tonight",
          tabBarIcon: ({ color, size }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Clock color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
