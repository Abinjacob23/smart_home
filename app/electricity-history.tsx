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

type ElectricityRecord = {
  id: number;
  timestamp: string;
  value: number;     // current (mA)
  leakage: number;   // 0 / 1
  level: string;
  message: string;
};

export default function ElectricityHistory() {
  const [records, setRecords] = useState<ElectricityRecord[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    api
      .get("/electricity-history")
      .then((res) => setRecords(res.data || []))
      .catch(() =>
        Alert.alert("Error", "Failed to load electricity history")
      );
  };

  const deleteRecord = (id: number) => {
    Alert.alert(
      "Delete Record",
      "Delete this electricity leak record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            api.delete(`/electricity-history/${id}`).then(() => {
              setRecords((prev) => prev.filter((r) => r.id !== id));
            });
          },
        },
      ]
    );
  };

  const clearAll = () => {
    Alert.alert(
      "Clear All Records",
      "This will delete ALL electricity leak records. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            api.delete("/electricity-history").then(() => setRecords([]));
          },
        },
      ]
    );
  };

  const getLevelColor = (level: string) => {
    if (level === "CRITICAL") return "#EF4444";
    if (level === "WARNING") return "#F59E0B";
    return "#22C55E";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Electricity Leak History</Text>

      <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
        <Text style={styles.clearAllText}>Clear All</Text>
      </TouchableOpacity>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No electricity leak records
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { borderLeftColor: getLevelColor(item.level) },
            ]}
          >
            <View style={styles.row}>
              <Text
                style={[
                  styles.level,
                  { color: getLevelColor(item.level) },
                ]}
              >
                {item.level}
              </Text>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => deleteRecord(item.id)}
              >
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <Text>⚡ Current: {item.value} mA</Text>
            <Text>
              Leakage: {item.leakage === 1 ? "YES" : "NO"}
            </Text>
            <Text>{item.message}</Text>

            <Text style={styles.time}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F1F5F9",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 5,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  level: {
    fontWeight: "bold",
    fontSize: 14,
  },
  clearBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  clearText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  time: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 6,
  },
  empty: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 40,
  },
  clearAllBtn: {
    backgroundColor: "#DC2626",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  clearAllText: {
    color: "#fff",
    fontWeight: "bold",
  },
});