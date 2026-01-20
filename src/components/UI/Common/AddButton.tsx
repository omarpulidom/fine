import { TouchableOpacity } from "react-native";
import { PlusIcon } from "phosphor-react-native";
import { Colors } from "@/components/colors";

interface AddButtonProps {
  onPress?: () => void;
}

export function AddButton({ onPress }: AddButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-full border-2 border-secondary-700 border-dashed w-16 items-center justify-center"
    >
      <PlusIcon size={20} color={Colors.secondary[500]} />
    </TouchableOpacity>
  );
}
