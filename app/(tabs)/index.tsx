import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function Dashboard() {
  const [gas, setGas] = useState<any>(null);
  const [electricity, setElectricity] = useState<any>(null);
  const [crackCount, setCrackCount] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      const gasRes = await api.get("/gas-status");
      const elecRes = await api.get("/electricity-status");
      const crackRes = await api.get("/crack-history");

      setGas(gasRes.data);
      setElectricity(elecRes.data);
      setCrackCount(crackRes.data.length || 0);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!gas || !electricity) return null;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.hello}>Hello,</Text>
        <Text style={styles.name}>User</Text>
        <Text style={styles.subtitle}>Smart Home Surveillance</Text>
      </View>

      {/* CIRCULAR STATUS CARD */}
      <View style={styles.circleCard}>
        <Text style={styles.circleTitle}>Overall Safety</Text>

        <View style={styles.circle}>
          <Text style={styles.circleValue}>
            {gas.level === "SAFE" && electricity.leakage === 0
              ? "SAFE"
              : "ALERT"}
          </Text>
          <Text style={styles.circleSub}>
            Live monitoring
          </Text>
        </View>
      </View>

      {/* QUICK STATUS */}
      <View style={styles.quickRow}>
        <View style={styles.quickCard}>
          <Text style={styles.quickIcon}>🔥</Text>
          <Text style={styles.quickLabel}>Gas</Text>
          <Text
            style={[
              styles.quickValue,
              gas.level !== "SAFE" && styles.danger,
            ]}
          >
            {gas.level}
          </Text>
        </View>

        <View style={styles.quickCard}>
          <Text style={styles.quickIcon}>⚡</Text>
          <Text style={styles.quickLabel}>Electricity</Text>
          <Text
            style={[
              styles.quickValue,
              electricity.leakage && styles.danger,
            ]}
          >
            {electricity.leakage ? "LEAK" : "SAFE"}
          </Text>
        </View>

        <View style={styles.quickCard}>
          <Text style={styles.quickIcon}>🧱</Text>
          <Text style={styles.quickLabel}>Cracks</Text>
          <Text style={styles.quickValue}>{crackCount}</Text>
        </View>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ebe8f1ab",
    padding: 20,
  },

  header: {
    marginBottom: 20,
  },

  hello: {
    fontSize: 18,
    color: "#6D28D9",
  },

  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4C1D95",
  },

  subtitle: {
    color: "#000000",
  },

  circleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },

  circleTitle: {
    fontSize: 16,
    color: "#6B7280",
  },

  circle: {
    marginTop: 15,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },

  circleValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4C1D95",
  },

  circleSub: {
    color: "#6B7280",
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  quickCard: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
  },

  quickIcon: {
    fontSize: 24,
  },

  quickLabel: {
    marginTop: 5,
    color: "#6B7280",
  },

  quickValue: {
    marginTop: 5,
    fontWeight: "bold",
    color: "#4C1D95",
  },

  danger: {
    color: "#DC2626",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4C1D95",
  },

  monitorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },

  monitorTitle: {
    fontWeight: "600",
    fontSize: 16,
    color: "#111827",
  },

  monitorSub: {
    marginTop: 4,
    color: "#6B7280",
  },
});