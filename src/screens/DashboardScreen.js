import { View, Text, StyleSheet } from "react-native";
import WarningBanner from "../components/WarningBanner";

export default function DashboardScreen() {
  const electricityLeak = true;
  const gasLeak = false;

  return (
    <View style={styles.container}>
      {electricityLeak && (
        <WarningBanner message="⚡ Electricity Leakage Detected" />
      )}

      {gasLeak && (
        <WarningBanner message="🔥 LPG Gas Leakage Detected" />
      )}

      <Text style={styles.text}>Voltage: 240V</Text>
      <Text style={styles.text}>Gas Level: Normal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  text: { fontSize: 18, marginTop: 10 },
});
