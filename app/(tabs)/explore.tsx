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

  /* ---------- ALERT HANDLER ---------- */
  const triggerNotification = (warning: any) => {
    if (!warning) return;

    if (warning.level === "WARNING") {
      Alert.alert("⚠️ Maintenance Warning", warning.message);
    }

    if (warning.level === "CRITICAL") {
      Alert.alert("🚨 CRITICAL ALERT", warning.message);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );
    }
  };

  /* ---------- IMAGE PICKER ---------- */
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

  /* ---------- ANALYZE ---------- */
  const analyze = async () => {
    if (!image) {
      alert("Select an image first");
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

      setResult(res.data);
      triggerNotification(res.data.warning);
    } catch {
      alert("Failed to analyze crack");
    }

    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Text style={styles.title}>🧱 Structural Crack Analysis</Text>
        <Text style={styles.subtitle}>
          AI-powered inspection & risk evaluation
        </Text>
      </View>

      {/* ---------- ACTION BAR ---------- */}
      <View style={styles.actionBar}>
        <Button title="Select Image" onPress={pickImage} />
        {image && (
          <View style={{ marginTop: 10 }}>
            <Button title="Analyze" onPress={analyze} />
          </View>
        )}
      </View>

      {/* ---------- IMAGE PREVIEW ---------- */}
      {image && (
        <View style={styles.previewCard}>
          <Text style={styles.sectionLabel}>Selected Image</Text>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      {loading && (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      )}

      {/* ---------- OVERALL STATUS ---------- */}
      {result?.combined_warning && (
        <View
          style={[
            styles.statusBanner,
            result.combined_warning.level === "CRITICAL"
              ? styles.critical
              : result.combined_warning.level === "WARNING"
              ? styles.warning
              : styles.safe,
          ]}
        >
          <Text style={styles.statusLevel}>
            {result.combined_warning.level}
          </Text>
          <Text style={styles.statusMessage}>
            {result.combined_warning.message}
          </Text>
        </View>
      )}

      {/* ---------- RESULTS ---------- */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Inspection Summary</Text>

          <View style={styles.metricRow}>
            <Metric label="Condition" value={result.label} />
            <Metric label="Severity" value={result.severity_text} />
          </View>

          <View style={styles.metricRow}>
            <Metric
              label="Crack Area"
              value={`${Number(result.area_perc ?? 0).toFixed(2)} %`}
            />
            <Metric
              label="Repair Cost"
              value={`₹${Number(result.repair_cost ?? 0).toFixed(2)}`}
              highlight
            />
          </View>

          {result.patched_image && (
            <View style={{ marginTop: 10 }}>
              <Button
                title={
                  showPatch
                    ? "View Original Image"
                    : "View AR Patch Preview"
                }
                onPress={() => setShowPatch(!showPatch)}
              />
            </View>
          )}

          <Image
            source={{
              uri:
                showPatch && result.patched_image
                  ? `data:image/jpeg;base64,${result.patched_image}`
                  : image!,
            }}
            style={styles.image}
          />

          {result.highlighted_image && (
            <>
              <Text style={styles.sectionLabel}>
                Detected Crack Zones
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

/* ---------- METRIC COMPONENT ---------- */
function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricBox,
        highlight && styles.metricHighlight,
      ]}
    >
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          highlight && styles.metricValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#ebe8f1ab" },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#64748B", marginTop: 4 },

  actionBar: {
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },

  previewCard: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
  },

  image: {
    height: 220,
    marginTop: 10,
    borderRadius: 12,
  },

  statusBanner: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  statusLevel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
  },

  resultCard: {
    backgroundColor: "#F8FAFC",
    padding: 18,
    borderRadius: 16,
    marginBottom: 30,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricBox: {
    width: "48%",
    backgroundColor: "#E5E7EB",
    padding: 12,
    borderRadius: 12,
  },
  metricHighlight: {
    backgroundColor: "#FEE2E2",
  },
  metricLabel: {
    fontSize: 12,
    color: "#374151",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  metricValueHighlight: {
    color: "#B91C1C",
  },

  sectionLabel: {
    marginTop: 12,
    fontWeight: "bold",
  },

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