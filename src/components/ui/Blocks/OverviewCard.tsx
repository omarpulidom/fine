import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/components/colors";
import { MultiColorProgressBar, PercentageBadge } from "../Common";
import type {
  CardVariant,
  IconComponent,
  ProgressSegment,
} from "@/types/finance.types";

interface OverviewCardProps {
  title: string;
  amount: number;
  percentageChange?: number;
  icon: IconComponent;
  variant?: CardVariant;
  segments?: ProgressSegment[];
  badge?: string;
  onPress?: () => void;
}

export function OverviewCard({
  title,
  amount,
  percentageChange,
  icon: Icon,
  variant = "primary",
  segments,
  badge,
  onPress,
}: OverviewCardProps) {
  const isPrimary = variant === "primary";
  const bgColor = isPrimary ? "bg-primary-700" : "bg-secondary-900";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${bgColor} flex-1 rounded-3xl p-5`}
    >
      {/* Icon */}
      <View className="h-12 w-12 bg-secondary-800 rounded-full items-center justify-center">
        <Icon size={20} weight="fill" color={Colors.light[800]} />
      </View>

      {/* Texts */}
      <View className="mt-4 gap-1">
        <Text className="font-montserrat-regular text-[16px] text-light-800">
          {title}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="font-montserrat-medium text-[24px] text-light-800">
            ${amount.toLocaleString("en-US")}
          </Text>
          {percentageChange !== undefined && (
            <Text className="font-montserrat-semibold text-[14px] text-primary-600">
              {percentageChange > 0 ? "+" : ""}
              {percentageChange}%
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar or Badge */}
      <View className="mt-2">
        {segments ? (
          <MultiColorProgressBar segments={segments} />
        ) : badge ? (
          <View className="self-end">
            <PercentageBadge value={Number(badge)} variant="secondary" />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
