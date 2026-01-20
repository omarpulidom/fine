import { Text, View } from "react-native";
import { Colors } from "@/components/colors";
import type { IconComponent } from "@/types/finance.types";

interface TransactionItemProps {
  icon: IconComponent;
  title: string;
  category: string;
  amount: number;
  time: string;
}

export function TransactionItem({
  icon: Icon,
  title,
  category,
  amount,
  time,
}: TransactionItemProps) {
  const isPositive = amount >= 0;
  const displayAmount = `${isPositive ? "+ " : "- "}$${Math.abs(amount).toLocaleString("en-US")}`;

  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center gap-4">
        <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
          <Icon size={18} color={Colors.light[800]} />
        </View>
        <View className="flex-col gap-1">
          <Text className="font-montserrat-regular text-[16px] text-light-900">
            {title}
          </Text>
          <Text className="font-montserrat-medium text-[14px] text-secondary-500">
            {category}
          </Text>
        </View>
      </View>
      <View className="flex-col gap-1">
        <Text
          className={`font-montserrat-${isPositive ? "semibold" : "medium"} text-[16px] text-right ${
            isPositive ? "text-primary-600" : "text-light-800"
          }`}
        >
          {displayAmount}
        </Text>
        <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
          {time}
        </Text>
      </View>
    </View>
  );
}
