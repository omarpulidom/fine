import { View } from "react-native";
import type { ProgressSegment } from "@/types/finance.types";

interface MultiColorProgressBarProps {
  segments: ProgressSegment[];
}

export function MultiColorProgressBar({
  segments,
}: MultiColorProgressBarProps) {
  return (
    <View className="bg-secondary-500 h-4 mt-2 rounded-full overflow-hidden flex-row">
      {segments.map((segment, index) => (
        <View
          key={index}
          className="rounded-full"
          style={{
            backgroundColor: segment.color,
            flex: segment.flex,
            marginLeft: index > 0 ? -12 : 0,
            zIndex: segments.length - index,
          }}
        />
      ))}
    </View>
  );
}
