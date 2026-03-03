import { View, Text, StyleSheet, Alert } from "react-native";
import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import GasGauge from "../../components/GasGauge";

/* ---------------- TYPES ---------------- */

type GasStatus = {
  level: "SAFE" | "WARNING" | "CRITICAL" | "UNKNOWN";
  value: number;
  message: string;
};

/* ---------------- DEFAULT ---------------- */

const EMPTY_STATUS: GasStatus = {
  level: "UNKNOWN",
  value: 0,
  message: "Waiting for sensor data...",
};

/* ---------------- COMPONENT ---------------- */

export default function GasSafety() {
  const [status, setStatus] = useState<GasStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);

  const previousLevel = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchGasStatus = async () => {
      try {
        const res = await api.get("/gas-status");
        const raw = res?.data;

        const value = Number(raw?.value);
        if (!raw || Number.isNaN(value)) {
          if (isMounted) setStatus(EMPTY_STATUS);
          return;
        }

        const currentLevel = raw.level ?? "UNKNOWN";

        if (isMounted) {
          setStatus({
            level: currentLevel,
            value,
            message: raw.message ?? "",
          });

          if (
            (currentLevel === "CRITICAL" ||
              currentLevel === "WARNING") &&
            previousLevel.current !== currentLevel
          ) {
            Alert.alert(
              currentLevel === "CRITICAL"
                ? "🚨 GAS LEAK DETECTED"
                : "⚠️ Gas Level Warning",
              `Gas Level: ${value} ppm\n\n${raw.message ?? ""}`,
              [{ text: "OK" }]
            );
            previousLevel.current = currentLevel;
          }

          if (currentLevel === "SAFE") {
            previousLevel.current = "SAFE";
          }
        }
      } catch (err) {
        console.error("Gas polling error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGasStatus();
    intervalId = setInterval(fetchGasStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading gas sensor data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Gas Safety Monitor</Text>
      <Text style={styles.subtitle}>
        Real-time LPG monitoring
      </Text>

      {/* STATUS BANNER */}
      <View
        style={[
          styles.statusBanner,
          status.level === "CRITICAL"
            ? styles.critical
            : status.level === "WARNING"
            ? styles.warning
            : styles.safe,
        ]}
      >
        <Text style={styles.statusLevel}>{status.level}</Text>
        <Text style={styles.statusMessage}>{status.message}</Text>
      </View>

      {/* METRIC CARD */}
      <View style={styles.metricCard}>
  <Text style={styles.metricLabel}>
    Current Gas Level
  </Text>

  <GasGauge
    value={status.value}
    level={status.level}
    max={1000}
  />
</View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#ebe8f1ab",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#64748B",
    marginBottom: 20,
  },
  loading: {
    fontSize: 16,
    padding: 20,
  },

  /* STATUS */
  statusBanner: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusLevel: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  statusMessage: {
    fontSize: 14,
  },

  /* METRIC */
  metricCard: {
  backgroundColor: "#FFFFFF",
  padding: 24,
  borderRadius: 24,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 5,
},
  metricLabel: {
    fontSize: 14,
    color: "#475569",
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 6,
  },

  /* STATES */
  critical: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 6,
    borderLeftColor: "#DC2626",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 6,
    borderLeftColor: "#D97706",
  },
  safe: {
    backgroundColor: "#DCFCE7",
    borderLeftWidth: 6,
    borderLeftColor: "#16A34A",
  },
});