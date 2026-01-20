import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/components/colors";
import type { IconComponent } from "@/types/finance.types";

interface ActionButtonProps {
  label: string;
  icon: IconComponent;
  onPress?: () => void;
}

export function ActionButton({
  label,
  icon: Icon,
  onPress,
}: ActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="pl-4 pr-6 gap-2 flex-row items-center h-14 bg-light-800 rounded-full"
    >
      <View className="h-6 w-6 bg-secondary-800 items-center justify-center rounded-full">
        <Icon size={14} color={Colors.light[800]} weight="bold" />
      </View>
      <Text className="font-montserrat-medium text-[16px] text-secondary-800">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
