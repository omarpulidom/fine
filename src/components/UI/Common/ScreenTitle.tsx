import { Text } from "react-native";

interface ScreenTitleProps {
  title: string;
  highlight?: string;
  separator?: string;
}

export function ScreenTitle({
  title,
  highlight,
  separator = "&",
}: ScreenTitleProps) {
  if (!highlight) {
    return (
      <Text className="text-[20px] font-montserrat-medium text-primary-600">
        {title}
      </Text>
    );
  }

  return (
    <Text className="text-[20px] font-montserrat-medium text-primary-600">
      {title} <Text className="text-light-900">{separator}</Text> {highlight}
    </Text>
  );
}
