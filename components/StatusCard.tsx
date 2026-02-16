import { View, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  value: string;
  status: "normal" | "warning" | "critical";
};

export default function StatusCard({ title, value, status }: Props) {
  const bg =
    status === "normal"
      ? "#DCFCE7"
      : status === "warning"
      ? "#FEF9C3"
      : "#FEE2E2";

  const color =
    status === "normal"
      ? "#166534"
      : status === "warning"
      ? "#854D0E"
      : "#991B1B";

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
});
