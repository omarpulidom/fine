import { View, ScrollView } from "react-native";
import { AddButton } from "../Common";
import type { ReactNode } from "react";

interface HorizontalCardListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onAdd?: () => void;
  showAddButton?: boolean;
  keyExtractor?: (item: T, index: number) => string;
}

export function HorizontalCardList<T>({
  data,
  renderItem,
  onAdd,
  showAddButton = true,
  keyExtractor,
}: HorizontalCardListProps<T>) {
  return (
    <View className="flex-row gap-4 -mr-7">
      {/* Add button */}
      {showAddButton && <AddButton onPress={onAdd} />}

      {/* Cards List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4 pr-7"
      >
        {data.map((item, index) => (
          <View key={keyExtractor?.(item, index) ?? index}>
            {renderItem(item, index)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
