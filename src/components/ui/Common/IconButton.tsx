import { TouchableOpacity } from "react-native";
import { DotsThreeIcon } from "phosphor-react-native";
import { Colors } from "@/components/colors";
import type { IconComponent } from "@/types/finance.types";

interface IconButtonProps {
  icon?: IconComponent;
  onPress?: () => void;
  size?: number;
}

export function IconButton({
  icon: Icon = DotsThreeIcon,
  onPress,
  size = 24,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-center h-14 w-14 bg-light-800 rounded-full"
    >
      <Icon size={size} color={Colors.secondary[800]} weight="bold" />
    </TouchableOpacity>
  );
}
