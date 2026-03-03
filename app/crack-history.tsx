import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
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
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    api
      .get("/crack-history")
      .then((res) => setRecords(res.data || []))
      .catch(() => Alert.alert("Error", "Failed to load crack history"));
  };

  const deleteRecord = (id: number) => {
    Alert.alert(
      "Clear Crack Record",
      "Are you sure you want to delete this crack record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            api
              .delete(`/crack-history/${id}`)
              .then(() => {
                // Remove from UI immediately
                setRecords((prev) =>
                  prev.filter((item) => item.id !== id)
                );
              })
              .catch(() =>
                Alert.alert("Error", "Failed to delete crack record")
              );
          },
        },
      ]
    );
  };

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
              <View style={styles.row}>
                <Text style={styles.label}>
                  Condition: {item.label ?? "Unknown"}
                </Text>

                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => deleteRecord(item.id)}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <Text>Severity: {severity.toFixed(1)}%</Text>
              <Text>Repair Cost: ₹{cost.toFixed(2)}</Text>
              <Text>Status: {item.warning_level ?? "SAFE"}</Text>

              <Text style={styles.time}>{item.timestamp ?? ""}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontWeight: "600",
  },
  clearBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
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