import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { api } from "../services/api";

type RecordItem = {
  id: number;
  timestamp?: string;
  label?: string;
  severity_score?: number;
  repair_cost?: number;
  warning_level?: string;
};

export default function CrackHistory() {
  const [records, setRecords] = useState<RecordItem[]>([]);

  useEffect(() => {
    api.get("/crack-history")
      .then(res => setRecords(res.data || []))
      .catch(() => alert("Failed to load crack history"));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crack History</Text>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>No history available</Text>
        }
        renderItem={({ item }) => {
          const severity = item.severity_score ?? 0;
          const cost = item.repair_cost ?? 0;

          return (
            <View style={styles.card}>
              <Text>Condition: {item.label ?? "Unknown"}</Text>
              <Text>Severity: {severity.toFixed(1)}%</Text>
              <Text>Repair Cost: ₹{cost.toFixed(2)}</Text>
              <Text>Status: {item.warning_level ?? "SAFE"}</Text>
              <Text style={styles.time}>
                {item.timestamp ?? ""}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  time: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 40,
  },
});
