import { View, Text, TouchableOpacity } from "react-native";

interface ChipSelectorProps<T extends string> {
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
}

export function ChipSelector<T extends string>({
  options,
  selected,
  onSelect,
}: ChipSelectorProps<T>) {
  return (
    <View className="flex-row gap-1 items-center justify-center">
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            className={`px-3 py-2 rounded-full ${
              isSelected
                ? "bg-primary-700"
                : "bg-secondary-800 border border-secondary-700"
            }`}
          >
            <Text
              className={`text-[12px] font-montserrat-medium ${
                isSelected ? "text-light-900" : "text-secondary-500"
              }`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
