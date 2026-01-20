import { View, Text } from "react-native";
import * as Icon from "phosphor-react-native";
import { Colors } from "@/components/colors";
import { CircularProgress } from "@/components/UI/Common";
import type { IconComponent } from "@/types/finance.types";

interface MiniStatCardProps {
  title: string;
  subtitle: string;
  percentage: number;
  progress: number;
  Icon: IconComponent;
  trendDirection: "up" | "down";
  trendText: string;
  trendSubtext: string;
}

export function MiniStatCard({
  title,
  subtitle,
  percentage,
  progress,
  Icon: IconComponent,
  trendDirection,
  trendText,
  trendSubtext,
}: MiniStatCardProps) {
  const TrendIcon =
    trendDirection === "up" ? Icon.TrendUpIcon : Icon.TrendDownIcon;

  return (
    <View className="flex-1 border border-secondary-700 rounded-3xl pt-7 px-4 pb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View className="gap-1">
          <Text className="text-[18px] font-montserrat-medium text-light-800">
            {title}
          </Text>
          <Text className="text-[14px] font-montserrat-regular text-secondary-500">
            {subtitle}
          </Text>
        </View>
        <View className="p-3 bg-secondary-900 rounded-full">
          <Text className="text-[12px] font-montserrat-medium text-light-900">
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress circle */}
      <View className="w-16 h-16 self-center mb-8">
        <CircularProgress progress={progress} size={64} icon={IconComponent} />
      </View>

      {/* Footer */}
      <View className="flex-row self-center items-center gap-1">
        <TrendIcon size={18} color={Colors.primary[600]} />
        <View className="items-center">
          <Text className="text-[12px] font-montserrat-medium text-light-900">
            {trendText}
          </Text>
          <Text className="text-[12px] font-montserrat-medium text-primary-600">
            {trendSubtext}
          </Text>
        </View>
      </View>
    </View>
  );
}
