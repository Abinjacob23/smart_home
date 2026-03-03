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

type GasRecord = {
  id: number;
  timestamp: string;
  value: number;
  level: string;
  message: string;
};

export default function GasHistory() {
  const [records, setRecords] = useState<GasRecord[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    api
      .get("/gas-history")
      .then((res) => setRecords(res.data || []))
      .catch(() => Alert.alert("Error", "Failed to load gas history"));
  };

  const clearAll = () => {
    Alert.alert(
      "Clear All Gas Records",
      "This will delete ALL gas leak records. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            api.delete("/gas-history").then(() => setRecords([]));
          },
        },
      ]
    );
  };

  const deleteOne = (id: number) => {
    Alert.alert("Delete Record", "Delete this gas record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          api.delete(`/gas-history/${id}`).then(() =>
            setRecords((prev) => prev.filter((r) => r.id !== id))
          );
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gas Leak History</Text>
        {records.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={clearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>No gas leak records</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.level}>{item.level}</Text>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => deleteOne(item.id)}
              >
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <Text>Gas Level: {item.value} ppm</Text>
            <Text>{item.message}</Text>
            <Text style={styles.time}>{item.timestamp}</Text>
          </View>
        )}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  clearAllBtn: {
    backgroundColor: "#B91C1C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearAllText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
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
  level: { fontWeight: "bold" },
  clearBtn: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  time: { color: "#64748B", fontSize: 12, marginTop: 4 },
  empty: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 40,
  },
});