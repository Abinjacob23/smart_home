import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../services/api";


export default function CrackDetection() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPatch, setShowPatch] = useState(false);

    // -------------------------
  // Simulated notification handler
  // -------------------------
  const triggerNotification = (warning: any) => {
    if (!warning) return;

    if (warning.level === "WARNING") {
      Alert.alert(
        "⚠️ Maintenance Warning",
        warning.message
      );
    }

    if (warning.level === "CRITICAL") {
      Alert.alert(
        "🚨 CRITICAL ALERT",
        warning.message
      );
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    }
  };


  // -------------------------
  // Pick image
  // -------------------------
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      setResult(null);
      setShowPatch(false);
    }
  };

  // -------------------------
  // Analyze crack
  // -------------------------
  const analyze = async () => {
    if (!image) {
      alert("Please select an image first");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("image", {
        uri: image,
        name: "wall.jpg",
        type: "image/jpeg",
      } as any);

      const res = await api.post("/crack-detect", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("BACKEND RESPONSE:", res.data);
      setResult(res.data);
      triggerNotification(res.data.warning);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze crack. Check backend connection.");
    }

    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧱 Crack Detection</Text>

      <Button title="Select Wall Image" onPress={pickImage} />

      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Analyze Crack" onPress={analyze} />
        </>
      )}

      {loading && (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      )}
{result && result.combined_warning && (
  <View
    style={[
      styles.warningBox,
      result.combined_warning.level === "CRITICAL"
        ? styles.critical
        : result.combined_warning.level === "WARNING"
        ? styles.warning
        : styles.safe,
    ]}
  >
    <Text style={styles.warningLevel}>
      OVERALL HOME STATUS: {result.combined_warning.level}
    </Text>
    <Text>{result.combined_warning.message}</Text>
  </View>
)}


      {/* ================= RESULT SECTION ================= */}
      {result && (
        <View style={styles.card}>
        
          <Text style={styles.cardTitle}>Analysis Result</Text>
          <Text>Condition: {result.label}</Text>
          <Text>Severity: {result.severity_text}</Text>
          <Text>
            Crack Area: {Number(result.area_perc ?? 0).toFixed(2)}%
          </Text>

          {/* 💰 REPAIR COST */}
          <Text style={styles.cost}>
            Estimated Repair Cost: ₹
            {Number(result.repair_cost ?? 0).toFixed(2)}
          </Text>

          {/* 🧩 AR PATCH TOGGLE */}
          {result.patched_image && (
            <Button
              title={
                showPatch
                  ? "Show Original Image"
                  : "Show AR Patch Preview"
              }
              onPress={() => setShowPatch(!showPatch)}
            />
          )}

          {/* 🖼 IMAGE VIEW */}
          <Image
            source={{
              uri:
                showPatch && result.patched_image
                  ? `data:image/jpeg;base64,${result.patched_image}`
                  : image!,
            }}
            style={styles.image}
          />

          {/* 🔴 HIGHLIGHTED CRACKS */}
          {result.highlighted_image && (
            <>
              <Text style={styles.subTitle}>
                Highlighted Crack Areas
              </Text>
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${result.highlighted_image}`,
                }}
                style={styles.image}
              />
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// -------------------------
// Styles
// -------------------------
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  image: {
    height: 220,
    marginTop: 15,
    borderRadius: 10,
  },
  card: {
    marginTop: 20,
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subTitle: {
    marginTop: 15,
    fontWeight: "bold",
  },
  cost: {
    marginTop: 10,
    fontWeight: "bold",
    color: "#B91C1C",
  },

  // 🚨 Warning styles
  warningBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
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
  warningLevel: {
    fontWeight: "bold",
    marginBottom: 4,
  },
});
