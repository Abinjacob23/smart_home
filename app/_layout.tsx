import { Drawer } from "expo-router/drawer";


export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#0F172A" },
        headerTintColor: "white",
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{ title: "Home" }}
      />
      <Drawer.Screen
      name="crack-history"
      options={{ title: "Crack History" }}
      />
      <Drawer.Screen
      name="gas-history"
      options={{ title: "Gas History" }}
      />
      <Drawer.Screen
      name="electricity-history"
      options={{ title: "Electricity History" }}
      />
    </Drawer>
  );
}
