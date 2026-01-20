import { Text, TouchableOpacity, View } from "react-native";
import { ArrowRightIcon } from "phosphor-react-native";
import { Colors } from "@/components/colors";

interface ManageButtonProps {
  label: string;
  onPress?: () => void;
  className?: string;
}

export function ManageButton({ label, onPress, className }: ManageButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-end gap-3 ${className || ""}`}
    >
      <Text className="text-[14px] font-montserrat-regular text-light-900">
        {label}
      </Text>
      <View className="w-12 h-12 border border-secondary-700 rounded-full items-center justify-center">
        <ArrowRightIcon size={16} color={Colors.light[900]} />
      </View>
    </TouchableOpacity>
  );
}
