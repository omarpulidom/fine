import { View, Text } from "react-native";

interface StatItem {
  label: string;
  value: string | number;
  highlighted?: boolean;
}

interface InfoStatsBarProps {
  stats: [StatItem, StatItem, StatItem];
}

export function InfoStatsBar({ stats }: InfoStatsBarProps) {
  return (
    <View className="flex-row rounded-full border items-center border-secondary-700 -mx-2">
      {stats.map((stat, idx) => {
        const isMiddle = idx === 1;
        const labelColor = stat.highlighted
          ? "text-light-800"
          : "text-secondary-500";
        const fontWeight = stat.highlighted
          ? "font-montserrat-medium"
          : "font-montserrat-regular";

        return (
          <View
            key={idx}
            className={`flex-col flex-1 gap-3 items-center ${
              isMiddle ? "border-l border-r border-secondary-700 py-5" : ""
            }`}
          >
            <Text className={`text-[12px] ${fontWeight} ${labelColor}`}>
              {stat.label}
            </Text>
            <Text className="text-[16px] font-montserrat-semibold text-primary-600">
              {stat.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
