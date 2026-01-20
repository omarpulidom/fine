import { View, Text } from "react-native";
import { ManageButton } from "@/components/UI/Common";

interface StatSectionProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  children: React.ReactNode;
  manageLabel?: string;
  onManagePress?: () => void;
}

export function StatSection({
  title,
  subtitle,
  badgeText,
  children,
  manageLabel,
  onManagePress,
}: StatSectionProps) {
  return (
    <View className="border border-secondary-700 rounded-3xl pt-7 px-4 pb-4 mb-6">
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
        {badgeText && (
          <View className="p-3 bg-secondary-900 rounded-full">
            <Text className="text-[12px] font-montserrat-medium text-light-900">
              {badgeText}
            </Text>
          </View>
        )}
      </View>

      {children}

      {manageLabel && (
        <ManageButton label={manageLabel} onPress={onManagePress} />
      )}
    </View>
  );
}
