import { View, Text, StyleSheet } from "react-native";

export default function WarningBanner({ message }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  text: {
    color: "white",
    fontWeight: "bold",
  },
});
