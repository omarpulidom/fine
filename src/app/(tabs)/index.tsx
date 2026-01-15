import { Colors } from "@/components/colors";
import * as Icon from "phosphor-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeTab() {
  return (
    <ScrollView className="flex-1 px-7 bg-secondary-800">
      {/* Total Balance */}
      <View className="mt-4">
        <Text className="text-[20px] text-center font-montserrat-regular text-light-800">
          Total Balance
        </Text>
        <View className="flex-row items-center mt-2 justify-center">
          <Text className="font-montserrat-medium text-[48px] text-primary-600">
            $
          </Text>
          <Text className="font-montserrat-medium text-[48px] text-light-800">
            3,293.00
          </Text>
          <Text className="text-secondary-500 font-montserrat-medium text-[20px] ml-4">
            MXN
          </Text>
        </View>

        {/* Buttons */}
        <View className="flex-row justify-center mt-8 gap-3">
          <TouchableOpacity className="pl-4 pr-6 gap-2 flex-row items-center h-14 bg-light-800 rounded-full">
            <View className="h-6 w-6 bg-secondary-800 items-center justify-center rounded-full">
              <Icon.PlusIcon
                size={14}
                color={Colors.light[800]}
                weight="bold"
              />
            </View>
            <Text className="font-montserrat-medium text-[16px] text-secondary-800">
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="pl-4 pr-6 gap-2 flex-row items-center h-14 bg-light-800 rounded-full">
            <View className="h-6 w-6 bg-secondary-800 items-center justify-center rounded-full">
              <Icon.ArrowUpRightIcon
                size={14}
                color={Colors.light[800]}
                weight="bold"
              />
            </View>
            <Text className="font-montserrat-medium text-[16px] text-secondary-800">
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center justify-center h-14 w-14 bg-light-800 rounded-full">
            <Icon.DotsThreeIcon
              size={24}
              color={Colors.secondary[800]}
              weight="bold"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview */}
      <View className="mt-10 gap-6">
        {/* Section title */}
        <View className="items-center justify-between flex-row">
          <Text className="text-light-800 font-montserrat-medium text-[20px]">
            Overview
          </Text>
          <TouchableOpacity>
            <Text className="text-secondary-500 font-montserrat-medium text-[14px]">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-row gap-4">
          <TouchableOpacity className="bg-primary-700 flex-1 rounded-3xl p-5">
            {/* Icon */}
            <View className="h-12 w-12 bg-secondary-800 rounded-full items-center justify-center">
              <Icon.ChartDonutIcon
                size={20}
                weight="fill"
                color={Colors.light[800]}
              />
            </View>
            {/* Texts */}
            <View className="mt-4 gap-1">
              <Text className="font-montserrat-regular text-[16px] text-light-800">
                Spending
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-montserrat-medium text-[24px] text-light-800">
                  $3,365
                </Text>
                <Text className="font-montserrat-semibold text-[14px] text-primary-600">
                  +4.5%
                </Text>
              </View>
            </View>

            {/* Percentage */}
            <View className="mt-2">
              <View className="bg-secondary-500 h-4 mt-2 rounded-full overflow-hidden flex-row">
                <View className="bg-purple-500 flex-[35] rounded-full z-40" />
                <View className="bg-greeny-300 flex-[25] rounded-full -ml-3 z-30" />
                <View className="bg-yellow-400 flex-[20] rounded-full -ml-3 z-20" />
                <View className="bg-red-500 flex-[20] rounded-full -ml-3 z-10" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="bg-secondary-900 flex-1 rounded-3xl p-5">
            {/* Icon */}
            <View className="h-12 w-12 bg-secondary-800 rounded-full items-center justify-center">
              <Icon.CalendarDotsIcon
                size={20}
                weight="fill"
                color={Colors.light[800]}
              />
            </View>
            {/* Texts */}
            <View className="mt-4 gap-1">
              <Text className="font-montserrat-regular text-[16px] text-light-800">
                Streaming
              </Text>
              <Text className="font-montserrat-medium text-[24px] text-light-800">
                $343
              </Text>
            </View>
            {/* Percentage */}
            <View className="mt-2">
              <View className="bg-secondary-500 rounded-full py-2 px-4 self-end">
                <Text className="font-montserrat-semibold text-[12px] text-light-900">
                  12%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions */}
      <View className="mt-10">
        {/* Section title */}
        <View className="items-center justify-between flex-row">
          <Text className="text-light-800 font-montserrat-medium text-[20px]">
            Transactions
          </Text>
          <TouchableOpacity>
            <Text className="text-secondary-500 font-montserrat-medium text-[14px]">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-col mt-6 gap-6">
          {/* Transaction Day */}
          <View>
            {/* Date Header */}
            <Text className="text-secondary-500 font-montserrat-medium text-[12px]">
              TODAY
            </Text>
            {/* Transactions */}
            <View className="mt-4 gap-4">
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.ShoppingCartSimpleIcon
                      size={18}
                      color={Colors.light[800]}
                    />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Despensa
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      Groceries
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-medium text-[16px] text-right text-light-800">
                    - $1,399
                  </Text>
                  <Text className="font-montserrat-regular text-[14px]  text-secondary-500 text-right">
                    9:32 AM
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Transaction Day */}
          <View>
            {/* Date Header */}
            <Text className="text-secondary-500 font-montserrat-medium text-[12px]">
              YESTERDAY
            </Text>
            {/* Transactions */}
            <View className="mt-4 gap-4">
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.StudentIcon size={18} color={Colors.light[800]} />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Pago beca
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      School
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-semibold text-[16px] text-right text-primary-600">
                    + $1,500
                  </Text>
                  <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
                    10:45 PM
                  </Text>
                </View>
              </View>
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.CarIcon size={18} color={Colors.light[800]} />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Gasolina
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      Transport
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-medium text-[16px] text-right text-light-800">
                    - $670
                  </Text>
                  <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
                    10:23 AM
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Transaction Day */}
          <View>
            {/* Date Header */}
            <Text className="text-secondary-500 font-montserrat-medium text-[12px]">
              MON 5 JAN
            </Text>
            {/* Transactions */}
            <View className="mt-4 gap-4">
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.CoinsIcon size={18} color={Colors.light[800]} />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Pago
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      Other
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-semibold text-[16px] text-right text-primary-600">
                    + $1,000
                  </Text>
                  <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
                    5:32 PM
                  </Text>
                </View>
              </View>
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.CoatHangerIcon size={18} color={Colors.light[800]} />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Ropa
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      Clothes
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-medium text-[16px] text-right text-light-800">
                    - $520
                  </Text>
                  <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
                    1:15 PM
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Transaction Day */}
          <View>
            {/* Date Header */}
            <Text className="text-secondary-500 font-montserrat-medium text-[12px]">
              SUN 4 JAN
            </Text>
            {/* Transactions */}
            <View className="mt-4 gap-4">
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.FirstAidKitIcon size={18} color={Colors.light[800]} />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Medicamentos
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      Health
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-medium text-[16px] text-right text-light-800">
                    - $134
                  </Text>
                  <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
                    6:13 PM
                  </Text>
                </View>
              </View>
              {/* Transaction Item */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-4">
                  <View className="h-12 w-12 bg-secondary-900 rounded-full items-center justify-center">
                    <Icon.BowlFoodIcon size={18} color={Colors.light[800]} />
                  </View>
                  <View className="flex-col gap-1">
                    <Text className="font-montserrat-regular text-[16px] text-light-900">
                      Comida
                    </Text>
                    <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                      Food
                    </Text>
                  </View>
                </View>
                <View className="flex-col gap-1">
                  <Text className="font-montserrat-medium text-[16px] text-right text-light-800">
                    - $245
                  </Text>
                  <Text className="font-montserrat-regular text-[14px] text-secondary-500 text-right">
                    2:41 PM
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View className="h-36" />
    </ScrollView>
  );
}
