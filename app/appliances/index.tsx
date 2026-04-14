import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { api } from "../../services/api";

type Appliance = {
  id: number;
  name: string;
};

export default function Appliances() {
  const [devices, setDevices] = useState<Appliance[]>([]);
  const [newDevice, setNewDevice] = useState("");

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = () => {
    api
      .get("/appliances")
      .then((res) => setDevices(res.data))
      .catch(() => Alert.alert("Error", "Failed to load appliances"));
  };

  const addDevice = () => {
    if (!newDevice.trim()) return;

    api
      .post("/appliances", { name: newDevice })
      .then(() => {
        setNewDevice("");
        loadDevices();
      })
      .catch(() => Alert.alert("Error", "Failed to add appliance"));
  };

  const openDevice = (device: Appliance) => {
    router.push(`/appliances/${device.id}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registered Appliances</Text>

      {/* Add Appliance */}
      <View style={styles.addBox}>
        <TextInput
          placeholder="Enter appliance name"
          value={newDevice}
          onChangeText={setNewDevice}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addDevice}>
          <Text style={styles.addText}>Add Device</Text>
        </TouchableOpacity>
      </View>

      {/* Appliance List */}
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>No appliances registered</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => openDevice(item)}
          >
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.view}>View Details →</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  addBox: {
    flexDirection: "row",
    marginBottom: 20,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 8,
    padding: 10,
  },

  addBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    justifyContent: "center",
    marginLeft: 10,
    borderRadius: 8,
  },

  addText: {
    color: "white",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  deviceName: {
    fontSize: 18,
    fontWeight: "600",
  },

  view: {
    color: "#64748B",
    marginTop: 4,
  },

  empty: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 40,
  },
});