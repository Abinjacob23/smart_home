import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function GasSafety() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    api.get("/gas-status")
      .then(res => setStatus(res.data))
      .catch(() => alert("Failed to load gas status"));
  }, []);

  if (!status) {
    return <Text style={{ padding: 20 }}>Loading gas status...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Gas Safety</Text>

      <View
        style={[
          styles.card,
          status.level === "CRITICAL"
            ? styles.critical
            : status.level === "WARNING"
            ? styles.warning
            : styles.safe,
        ]}
      >
        <Text style={styles.level}>{status.level}</Text>
        <Text>LPG Level: {status.value} ppm</Text>
        <Text>{status.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  card: { padding: 15, borderRadius: 12 },
  level: { fontWeight: "bold", marginBottom: 5 },
  critical: { backgroundColor: "#FEE2E2" },
  warning: { backgroundColor: "#FEF3C7" },
  safe: { backgroundColor: "#DCFCE7" },
});
