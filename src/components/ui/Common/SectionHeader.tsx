import { Text, TouchableOpacity, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  highlight?: string;
  onSeeAll?: () => void;
  showSeeAll?: boolean;
}

export function SectionHeader({
  title,
  highlight,
  onSeeAll,
  showSeeAll = true,
}: SectionHeaderProps) {
  return (
    <View className="items-center justify-between flex-row">
      <Text className="text-light-800 font-montserrat-medium text-[20px]">
        {title}
        {highlight && <Text className="text-primary-600"> {highlight}</Text>}
      </Text>
      {showSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-secondary-500 font-montserrat-medium text-[14px]">
            See All
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
