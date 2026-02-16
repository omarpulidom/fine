import { Text, View } from "react-native";

interface AmountDisplayProps {
  amount: number;
  currency?: string;
  size?: "md" | "lg" | "xl";
  showSign?: boolean;
  colorBySign?: boolean;
}

export function AmountDisplay({
  amount,
  currency = "MXN",
  size = "xl",
  showSign = false,
  colorBySign = false,
}: AmountDisplayProps) {
  const isPositive = amount >= 0;
  const sign = showSign ? (isPositive ? "+ " : "- ") : "";
  const displayAmount = Math.abs(amount).toLocaleString("en-US");

  const sizeClasses = {
    md: "text-[24px]",
    lg: "text-[32px]",
    xl: "text-[48px]",
  };

  const amountColor = colorBySign
    ? isPositive
      ? "text-primary-600"
      : "text-light-800"
    : "text-light-800";

  const signColor = colorBySign
    ? isPositive
      ? "text-primary-600"
      : "text-light-800"
    : "text-light-800";

  return (
    <View className="flex-row items-center justify-center">
      {showSign && (
        <Text
          className={`font-montserrat-medium ${sizeClasses[size]} ${signColor}`}
        >
          {sign}
        </Text>
      )}
      <Text
        className={`font-montserrat-medium ${sizeClasses[size]} text-primary-600`}
      >
        $
      </Text>
      <Text
        className={`font-montserrat-medium ${sizeClasses[size]} ${amountColor}`}
      >
        {displayAmount}
      </Text>
      {currency && (
        <Text className="text-secondary-500 font-montserrat-medium text-[20px] ml-4">
          {currency}
        </Text>
      )}
    </View>
  );
}
