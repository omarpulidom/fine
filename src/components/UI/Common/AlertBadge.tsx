import { View, Text } from "react-native";

interface AlertBadgeProps {
  text: string;
}

export function AlertBadge({ text }: AlertBadgeProps) {
  return (
    <View className="bg-secondary-900 px-4 py-3 rounded-full self-start">
      <Text className="text-[12px] font-montserrat-medium text-light-900">
        {text}
      </Text>
    </View>
  );
}
