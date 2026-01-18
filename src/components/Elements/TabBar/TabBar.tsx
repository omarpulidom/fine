import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/components/colors";
import {
  ChartPieSliceIcon,
  PiggyBankIcon,
  ReceiptIcon,
  WalletIcon,
} from "phosphor-react-native";

const getTabLabel = (routeName: string) => {
  switch (routeName) {
    case "index":
      return "Wallet";
    case "stats":
      return "Statics";
    case "savings":
      return "Savings";
    case "debts":
      return "Debts";
    default:
      return routeName;
  }
};

const TabIcon = ({
  routeName,
  isFocused,
}: {
  routeName: string;
  isFocused: boolean;
}) => {
  const color = isFocused ? Colors.secondary[800] : Colors.light[900];

  switch (routeName) {
    case "index":
      return <WalletIcon weight="fill" color={color} size={20} />;
    case "stats":
      return <ChartPieSliceIcon weight="fill" color={color} size={20} />;
    case "savings":
      return <PiggyBankIcon weight="fill" color={color} size={20} />;
    case "debts":
      return <ReceiptIcon weight="fill" color={color} size={20} />;
    default:
      return null;
  }
};

const tabNames = ["index", "stats", "savings", "debts"];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 pb-12 flex-row justify-center"
      style={{
        shadowColor: Colors.secondary[800],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View className="bg-secondary rounded-full">
        <View className="flex-row justify-center items-center gap-1 p-1 ">
          {tabNames.map((tabName) => {
            const routeIndex = state.routes.findIndex(
              (route) => route.name === tabName,
            );
            if (routeIndex === -1) return null;

            const route = state.routes[routeIndex];
            const isFocused = state.index === routeIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                className={`p-5 rounded-full ${
                  isFocused ? "bg-light-900" : "bg-secondary-800"
                }`}
              >
                <View className="flex-row gap-2 items-center">
                  <TabIcon routeName={route.name} isFocused={isFocused} />
                  {isFocused && (
                    <Text
                      className={
                        "font-montserrat-medium text-[14px] w-16 text-secondary-800"
                      }
                    >
                      {getTabLabel(route.name)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
