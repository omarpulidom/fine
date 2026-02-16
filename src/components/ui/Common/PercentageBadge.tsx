import { Text, View } from "react-native";
import type { BadgeVariant, BadgeSize } from "@/types/finance.types";

interface PercentageBadgeProps {
  value: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export function PercentageBadge({
  value,
  variant = "secondary",
  size = "md",
}: PercentageBadgeProps) {
  const bgColor = variant === "primary" ? "bg-primary-600" : "bg-secondary-500";
  const padding = size === "sm" ? "py-1 px-3" : "py-2 px-4";
  const textSize = size === "sm" ? "text-[10px]" : "text-[12px]";

  return (
    <View className={`${bgColor} rounded-full ${padding}`}>
      <Text className={`font-montserrat-semibold ${textSize} text-light-900`}>
        {value}%
      </Text>
    </View>
  );
}
