import { Text, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/components/colors";
import { BellIcon, CaretRightIcon } from "phosphor-react-native";
import { router } from "expo-router";

export function Header() {
  return (
    <SafeAreaView
      className="bg-secondary-800 px-7"
      style={{
        shadowColor: Colors.secondary[800],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View className="flex-row justify-between items-center -mb-4">
        <View className="flex-row items-center mt-3">
          <TouchableOpacity
            className="flex-row items-center gap-2"
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Image
              source={require("@/assets/images/user-profile.png")}
              className="w-8 h-8"
            />
            <Text className="ml-1 text-light-800 font-montserrat-medium text-[16px]">
              Omar PM
            </Text>
            <CaretRightIcon color={Colors.secondary[500]} size={20} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity className="p-2 w-12 h-12 rounded-full border border-secondary-700 items-center justify-center">
          <BellIcon color={Colors.light[900]} size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
