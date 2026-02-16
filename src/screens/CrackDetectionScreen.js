import { View, Button, Image, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export default function CrackDetectionScreen() {
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Select Wall Image" onPress={pickImage} />
      {image && (
        <>
          <Image source={{ uri: image }} style={{ height: 200 }} />
          <Text>Crack Detection Result: Pending</Text>
        </>
      )}
    </View>
  );
}
