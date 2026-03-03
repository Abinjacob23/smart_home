import { View, Text, StyleSheet, Alert } from "react-native";
import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";

/* ---------------- TYPES ---------------- */

type ElectricityStatus = {
  level: "SAFE" | "CRITICAL" | "UNKNOWN";
  value: number;
  leakage: number;
  message: string;
};

const EMPTY_STATUS: ElectricityStatus = {
  level: "UNKNOWN",
  value: 0,
  leakage: 0,
  message: "Waiting for sensor data...",
};

/* ---------------- COMPONENT ---------------- */

export default function ElectricitySafety() {
  const [status, setStatus] = useState<ElectricityStatus>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);

  const previousLeakage = useRef<number | null>(null);

  /* ---------------- LOGIC (UNCHANGED) ---------------- */

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchElectricityStatus = async () => {
      try {
        const res = await api.get("/electricity-status");
        const raw = res?.data;

        const current = Number(raw?.value);
        const leakage = Number(raw?.leakage);

        if (
          !raw ||
          Number.isNaN(current) ||
          (leakage !== 0 && leakage !== 1)
        ) {
          if (isMounted) setStatus(EMPTY_STATUS);
          return;
        }

        if (isMounted) {
          setStatus({
            level: raw.level ?? "UNKNOWN",
            value: current,
            leakage,
            message: raw.message ?? "",
          });

          if (leakage === 1 && previousLeakage.current !== 1) {
            Alert.alert(
              "🚨 ELECTRIC LEAKAGE DETECTED",
              `Current: ${current} mA\n\n${raw.message ?? ""}`,
              [{ text: "OK" }]
            );
            previousLeakage.current = 1;
          }

          if (leakage === 0) {
            previousLeakage.current = 0;
          }
        }
      } catch (err) {
        console.error("Electricity polling error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchElectricityStatus();
    intervalId = setInterval(fetchElectricityStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>
          Loading electricity sensor data…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Electricity Safety Monitor</Text>
      <Text style={styles.subtitle}>
        Real-time electrical leakage monitoring
      </Text>

      {/* STATUS BANNER */}
      <View
        style={[
          styles.statusBanner,
          status.level === "CRITICAL"
            ? styles.critical
            : styles.safe,
        ]}
      >
        <Text style={styles.statusLevel}>
          {status.level}
        </Text>
        <Text style={styles.statusMessage}>
          {status.message}
        </Text>
      </View>

      {/* CURRENT BOX */}
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Current Reading</Text>
        <Text style={styles.metricValue}>
          {Number.isFinite(status.value)
            ? `${status.value} mA`
            : "--"}
        </Text>
      </View>

      {/* LEAKAGE BOX */}
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Leakage Status</Text>
        <Text
          style={[
            styles.metricValue,
            status.leakage === 1 && styles.alertText,
          ]}
        >
          {status.leakage === 1 ? "YES" : "NO"}
        </Text>
      </View>
    </View>
  );
}

/* ---------------- STYLES (SAME AS GAS) ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: "#ebe8f1ab"
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
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15, // 👈 spacing between stacked boxes
  },
  metricLabel: {
    fontSize: 14,
    color: "#475569",
  },
  metricValue: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 6,
    color: "#0F172A",
  },

  alertText: {
    color: "#DC2626",
  },

  /* STATES */
  critical: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 6,
    borderLeftColor: "#DC2626",
  },
  safe: {
    backgroundColor: "#DCFCE7",
    borderLeftWidth: 6,
    borderLeftColor: "#16A34A",
  },
});