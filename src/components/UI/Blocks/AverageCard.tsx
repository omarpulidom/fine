import { View, Text } from "react-native";
import { Colors } from "@/components/colors";
import type { IconComponent } from "@/types/finance.types";

interface AverageCardProps {
  title: string;
  amount: number;
  Icon: IconComponent;
  variant?: "primary" | "secondary";
}

export function AverageCard({
  title,
  amount,
  Icon,
  variant = "primary",
}: AverageCardProps) {
  const amountColor =
    variant === "primary" ? "text-primary-600" : "text-light-800";

  return (
    <View className="bg-secondary-900 flex-1 rounded-3xl px-4 py-5 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] w-20 font-montserrat-medium text-light-900">
          {title}
        </Text>
        <View className="w-9 h-9 bg-secondary-800 rounded-full items-center justify-center">
          <Icon size={18} color={Colors.light[900]} />
        </View>
      </View>
      <Text className={`text-[32px] font-montserrat-medium ${amountColor}`}>
        ${amount.toLocaleString()}
      </Text>
    </View>
  );
}
