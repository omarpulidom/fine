import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Colors } from "@/components/colors";
import type { IconComponent } from "@/types/finance.types";

interface CircularProgressProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  icon?: IconComponent;
  iconSize?: number;
  progressColor?: string;
  backgroundColor?: string;
}

export function CircularProgress({
  progress,
  size = 64,
  strokeWidth = 6,
  icon: Icon,
  iconSize = 18,
  progressColor = Colors.primary[700],
  backgroundColor = Colors.secondary[900],
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center relative"
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Icon */}
      {Icon && <Icon size={iconSize} color={Colors.light[800]} />}
    </View>
  );
}
