import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { api } from "../../services/api";

type UsagePoint = {
  timestamp: string;
  current_value: number;
};

type Analytics = {
  current: number;
  peakHour: number;
  idealHour: number;
  averageCurrent: number;
  predictedNextHour?: number; 
  overloadStatus?: string;
  overloadMessage?: string;
  futurePredictions?: number[];
  dailyChangePercent?: number;
  weeklyChangePercent?: number;
  data: UsagePoint[];
};

export default function ApplianceDetails() {
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [data, setData] = useState<Analytics | null>(null);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    loadAppliance();
  }, []);

  /* -----------------------------
     Load Appliance + Analytics
  ----------------------------- */
 const loadAppliance = async () => {
  try {
    const res = await api.get("/appliances");

    const appliance = res.data.find((a: any) => a.id == id);

    if (appliance) {
      setName(appliance.name);

      const analytics = await api.get("/appliance-analytics", {
        params: { name: appliance.name },
      });

      // 🔥 DEBUG: see what backend returns
      console.log("Analytics Response:", analytics.data);

      // ✅ Ensure proper data assignment
      if (analytics?.data) {
        setData(analytics.data);
      } else {
        console.log("No analytics data received");
      }
    }

    setLoading(false);
  } catch (err) {
    console.log("Error loading appliance:", err);
    setLoading(false);
  }
};
  /* -----------------------------
     Delete Appliance
  ----------------------------- */
  const deleteAppliance = () => {
    Alert.alert(
      "Delete Appliance",
      "Are you sure you want to delete this appliance?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            api
              .delete(`/appliances/${id}`)
              .then(() => {
                Alert.alert("Deleted", "Appliance removed");
                router.replace("/appliances");
              })
              .catch(() => {
                Alert.alert("Error", "Failed to delete appliance");
              });
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* -----------------------------
     Prepare Chart Data
  ----------------------------- */

  const chartData = {
    labels:
      data?.data
        ?.slice(-6)
        .map((d) =>
          new Date(d.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        ) || [],
    datasets: [
      {
        data: data?.data?.slice(-6).map((d) => d.current_value) || [],
      },
    ],
  };

  return (
    <>
      <Stack.Screen options={{ title: name }} />

      <ScrollView style={styles.container}>
        <Text style={styles.title}>{name}</Text>

        <Button
          title="Delete Appliance"
          color="#EF4444"
          onPress={deleteAppliance}
        />

        <View style={styles.card}>
          <Text style={styles.label}>Current Usage</Text>
          <Text style={styles.value}>{data?.current} mA</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Peak Usage Hour</Text>
          <Text style={styles.value}>{data?.peakHour}:00</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Predicted Next Hour</Text>
          <Text style={styles.value}>
  {data?.predictedNextHour !== undefined && data?.predictedNextHour !== null
    ? `${data.predictedNextHour} mA`
    : "Calculating..."}
</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Ideal Usage Hour</Text>
          <Text style={styles.value}>{data?.idealHour}:00</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Voltage</Text>
          <Text style={styles.value}>{data?.voltage} V</Text>
        </View>

<View style={styles.card}>
  <Text style={styles.label}>Energy Consumption</Text>
  <Text style={styles.value}>{data?.energyKwh} kWh</Text>
</View>

<View style={styles.card}>
  <Text style={styles.label}>Estimated Cost</Text>
  <Text style={styles.value}>₹{data?.estimatedBill}</Text>
</View>

<View style={styles.card}>
  <Text style={styles.label}>System Status Future</Text>
  <Text
    style={[
      styles.value,
      {
        color:
          data?.overloadStatus === "WARNING"
            ? "#EF4444"
            : "#22C55E",
      },
    ]}
  >
    {data?.overloadMessage}
  </Text>
</View>
<View style={styles.card}>
  <Text style={styles.label}>Today vs Yesterday</Text>
  <Text
    style={[
      styles.value,
      {
        color:
          data?.dailyChangePercent && data.dailyChangePercent > 0
            ? "#EF4444"
            : "#22C55E",
      },
    ]}
  >
    {data?.dailyChangePercent}% 
  </Text>
</View>

        {/* Graph Section */}
        {data?.data && data.data.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Current Usage Trend</Text>

            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#F8FAFC",
                backgroundGradientTo: "#F8FAFC",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(34,197,94, ${opacity})`,
                labelColor: () => "#64748B",
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#22C55E",
                },
              }}
              bezier
              style={{
                marginTop: 10,
                borderRadius: 12,
              }}
            />
          </View>
          
        )}
      </ScrollView>
    </>
  );
}

/* -----------------------------
   Styles
----------------------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },

  label: {
    color: "#64748B",
    fontSize: 14,
  },

  value: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },
});
