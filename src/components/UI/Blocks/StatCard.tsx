import { Text, View } from "react-native";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function StatCard({ title, subtitle, badge, children }: StatCardProps) {
  return (
    <View className="border border-secondary-700 rounded-3xl pt-7 px-4 pb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="gap-1">
          <Text className="text-[18px] font-montserrat-medium text-light-800">
            {title}
          </Text>
          <Text className="text-[14px] font-montserrat-regular text-secondary-500">
            {subtitle}
          </Text>
        </View>
        {badge}
      </View>

      {/* Content */}
      {children}
    </View>
  );
}
