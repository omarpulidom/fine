import { Text, TouchableOpacity, View } from "react-native";
import { PercentageBadge, MultiColorProgressBar } from "../Common";
import type { CardVariant, ProgressSegment } from "@/types/finance.types";

interface SummaryCardProps {
  title: string;
  current: number;
  total: number;
  percentage: number;
  totalLabel: string;
  statusLabel: string;
  variant?: CardVariant;
  segments?: ProgressSegment[];
  onPress?: () => void;
}

export function SummaryCard({
  title,
  current,
  total,
  percentage,
  totalLabel,
  statusLabel,
  variant = "secondary",
  segments,
  onPress,
}: SummaryCardProps) {
  const isPrimary = variant === "primary";
  const bgColor = isPrimary ? "bg-primary-700" : "bg-secondary-900";
  const mutedColor = isPrimary ? "text-primary-600" : "text-secondary-500";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgColor} flex-1 rounded-3xl p-5 pt-8 gap-2`}
    >
      {/* Title */}
      <Text className="font-montserrat-medium text-[32px] w-32 text-light-900 leading-[32px]">
        {title}
      </Text>

      {/* Amounts */}
      <View className="flex-col gap-2 my-2">
        <View className="flex-row justify-between items-center">
          <Text className="font-montserrat-semibold text-[24px] text-light-800">
            ${current.toLocaleString("en-US")}
          </Text>
          <Text className={`font-montserrat-medium text-[16px] ${mutedColor}`}>
            of
          </Text>
        </View>
        <Text className={`font-montserrat-medium text-[16px] ${mutedColor}`}>
          ${total.toLocaleString("en-US")} {totalLabel}
        </Text>
      </View>

      {/* Percentage Badge */}
      <View className="flex-row items-center gap-2">
        <PercentageBadge
          value={percentage}
          variant={isPrimary ? "primary" : "secondary"}
        />
        <Text className={`font-montserrat-medium text-[14px] ${mutedColor}`}>
          {statusLabel}
        </Text>
      </View>

      {/* Progress Bar */}
      {segments && (
        <View>
          <MultiColorProgressBar segments={segments} />
        </View>
      )}
    </TouchableOpacity>
  );
}
