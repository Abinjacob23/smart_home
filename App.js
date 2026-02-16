import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "./src/screens/DashboardScreen";
import CrackDetectionScreen from "./src/screens/CrackDetectionScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Crack Detection" component={CrackDetectionScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
