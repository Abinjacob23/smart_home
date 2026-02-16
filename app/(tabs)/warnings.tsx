import { View, Text, FlatList, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function WarningsScreen() {
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    api.get("/warnings-history")
      .then(res => setWarnings(res.data))
      .catch(() => alert("Failed to load warnings"));
  }, []);

  const renderItem = ({ item }: any) => (
    <View
      style={[
        styles.card,
        item.level === "CRITICAL"
          ? styles.critical
          : item.level === "WARNING"
          ? styles.warning
          : styles.safe,
      ]}
    >
      <Text style={styles.level}>{item.level}</Text>
      <Text>{item.message}</Text>
      <Text style={styles.cost}>₹{item.repair_cost}</Text>
      <Text style={styles.time}>{item.timestamp}</Text>
    </View>
  );

  return (
    <FlatList
      data={warnings}
      keyExtractor={(_, i) => i.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 15 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  critical: {
    backgroundColor: "#FEE2E2",
    borderLeftWidth: 5,
    borderLeftColor: "#DC2626",
  },
  warning: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 5,
    borderLeftColor: "#D97706",
  },
  safe: {
    backgroundColor: "#DCFCE7",
    borderLeftWidth: 5,
    borderLeftColor: "#16A34A",
  },
  level: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  cost: {
    fontWeight: "bold",
    marginTop: 4,
  },
  time: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
});
