import { Text, TouchableOpacity, View } from "react-native";
import { PercentageBadge } from "../Common";
import type { CardVariant } from "@/types/finance.types";

interface ItemCardProps {
  title: string;
  current: number;
  total: number;
  percentage: number;
  tagColor?: string;
  dueDate?: string;
  variant?: CardVariant;
  statusLabel?: string;
  onPress?: () => void;
}

export function ItemCard({
  title,
  current,
  total,
  percentage,
  tagColor,
  dueDate,
  variant = "secondary",
  statusLabel = "payed",
  onPress,
}: ItemCardProps) {
  const isPrimary = variant === "primary";
  const bgColor = isPrimary ? "bg-primary-700" : "bg-secondary-900";
  const mutedColor = isPrimary ? "text-primary-600" : "text-secondary-500";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgColor} rounded-3xl p-5 gap-2`}
    >
      {/* Tags */}
      <View className="items-center justify-between flex-row h-8">
        {tagColor && (
          <View
            className="rounded-full w-3 h-3"
            style={{ backgroundColor: tagColor }}
          />
        )}
        {dueDate && (
          <View className="bg-secondary-500 rounded-full py-2 px-4">
            <Text className="font-montserrat-bold text-[12px] text-light-900">
              {dueDate}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text
        className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
        numberOfLines={1}
      >
        {title}
      </Text>

      {/* Amounts */}
      <View className="flex-col gap-1 my-2">
        <View className="flex-row justify-between items-center">
          <Text className="font-montserrat-medium text-[24px] text-light-800">
            ${current.toLocaleString("en-US")}
          </Text>
          <Text className={`font-montserrat-medium text-[16px] ${mutedColor}`}>
            of
          </Text>
        </View>
        <Text className={`font-montserrat-medium text-[16px] ${mutedColor}`}>
          ${total.toLocaleString("en-US")}
        </Text>
      </View>

      {/* Percentage */}
      <View className="flex-row items-center gap-2">
        <PercentageBadge
          value={percentage}
          variant={isPrimary ? "primary" : "secondary"}
        />
        <Text className={`font-montserrat-medium text-[14px] ${mutedColor}`}>
          {statusLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
