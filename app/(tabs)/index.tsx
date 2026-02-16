import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/dashboard-stats")
      .then(res => setStats(res.data))
      .catch(() => alert("Failed to load dashboard"));
  }, []);

  if (!stats) {
    return <Text style={{ padding: 20 }}>Loading dashboard...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Safety Dashboard</Text>

      <View style={styles.card}>
        <Text>Total Checks</Text>
        <Text style={styles.value}>{stats.total_checks}</Text>
      </View>

      <View style={styles.cardCritical}>
        <Text>Critical Alerts</Text>
        <Text style={styles.value}>{stats.critical_alerts}</Text>
      </View>

      <View style={styles.cardWarning}>
        <Text>Warning Alerts</Text>
        <Text style={styles.value}>{stats.warning_alerts}</Text>
      </View>

      <View style={styles.card}>
        <Text>Total Repair Cost</Text>
        <Text style={styles.value}>₹{stats.total_repair_cost.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
  <Text>Gas Status</Text>
  <Text style={styles.value}>{stats.gas_status}</Text>
</View>

<View style={styles.card}>
  <Text>Electricity Status</Text>
  <Text style={styles.value}>{stats.electricity_status}</Text>
</View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardCritical: {
    backgroundColor: "#FEE2E2",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardWarning: {
    backgroundColor: "#FEF3C7",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
