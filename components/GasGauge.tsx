import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  value: number;      // gas ppm
  max?: number;       // max scale (default 1000)
  level: "SAFE" | "WARNING" | "CRITICAL" | "UNKNOWN";
};

export default function GasGauge({
  value,
  max = 1000,
  level,
}: Props) {
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(value / max, 1);
  const strokeDashoffset =
    circumference * (1 - progress);

  const color =
    level === "CRITICAL"
      ? "#DC2626"
      : level === "WARNING"
      ? "#D97706"
      : "#16A34A";

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={180} height={180}>
        {/* Background ring */}
        <Circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress ring */}
        <Circle
          cx="90"
          cy="90"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin="90,90"
        />
      </Svg>

      {/* Center text */}
      <Text
        style={{
          position: "absolute",
          top: 70,
          fontSize: 28,
          fontWeight: "bold",
          color,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          position: "absolute",
          top: 105,
          fontSize: 14,
          color: "#64748B",
        }}
      >
        ppm
      </Text>
    </View>
  );
}