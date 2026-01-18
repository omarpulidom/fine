import { Colors } from "@/components/colors";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

import * as Icon from "phosphor-react-native";

export default function SavingsScreen() {
  return (
    <ScrollView className="flex-1 px-7 pt-4 bg-secondary-800">
      {/* Title */}
      <Text className="text-[20px] font-montserrat-medium text-primary-600">
        Savings <Text className="text-light-900">&</Text> Budgets
      </Text>

      {/* Main cards */}
      <View className="flex-row gap-4 mt-8">
        {/* Savings Card */}
        <TouchableOpacity className="bg-secondary-900 flex-1 rounded-3xl p-5 pt-8 gap-2">
          {/* Title */}
          <Text className="font-montserrat-medium text-[32px] w-32 text-light-900 leading-[32px]">
            You’ve saved
          </Text>
          {/* Amounts */}
          <View className="flex-col gap-2 my-2">
            <View className="flex-row justify-between items-center">
              <Text className="font-montserrat-semibold text-[24px] text-light-800">
                $11,453
              </Text>
              <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                of
              </Text>
            </View>
            <Text className="font-montserrat-medium text-[16px] text-secondary-500">
              $18,000 goal
            </Text>
          </View>
          {/* Percentage */}
          <View className="flex-row items-center gap-2">
            <View className="bg-secondary-500 rounded-full py-2 px-4 self-start">
              <Text className="font-montserrat-semibold text-[12px] text-light-900">
                46%
              </Text>
            </View>
            <Text className="font-montserrat-medium text-[14px] text-secondary-500">
              saved
            </Text>
          </View>
          {/* Percentage */}
          <View>
            <View className="bg-secondary-500 h-4 mt-2 rounded-full overflow-hidden flex-row">
              <View className="bg-purple-500 flex-[45] rounded-full z-40" />
              <View className="bg-greeny-300 flex-[25] rounded-full -ml-3 z-30" />
              <View className="bg-yellow-400 flex-[15] rounded-full -ml-3 z-20" />
              <View className="bg-red-500 flex-[15] rounded-full -ml-3 z-10" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Budget Card */}
        <TouchableOpacity className="bg-primary-700 flex-1 rounded-3xl p-5 pt-8 gap-2">
          {/* Title */}
          <Text className="font-montserrat-medium text-[32px] w-32 text-light-900 leading-[32px]">
            You’ve used
          </Text>
          {/* Amounts */}
          <View className="flex-col gap-2 my-2">
            <View className="flex-row justify-between items-center">
              <Text className="font-montserrat-semibold text-[24px] text-light-800">
                $9,731
              </Text>
              <Text className="font-montserrat-medium text-[16px] text-primary-600">
                of
              </Text>
            </View>
            <Text className="font-montserrat-medium text-[16px] text-primary-600">
              $23,000 budget
            </Text>
          </View>
          {/* Percentage */}
          <View className="flex-row items-center gap-2">
            <View className="bg-primary-600 rounded-full py-2 px-4 self-start">
              <Text className="font-montserrat-semibold text-[12px] text-light-900">
                62%
              </Text>
            </View>
            <Text className="font-montserrat-medium text-[14px] text-primary-600">
              used
            </Text>
          </View>
          {/* Percentage */}
          <View>
            <View className="bg-secondary-500 h-4 mt-2 rounded-full overflow-hidden flex-row">
              <View className="bg-purple-500 flex-[40] rounded-full z-40" />
              <View className="bg-greeny-300 flex-[30] rounded-full -ml-3 z-30" />
              <View className="bg-yellow-400 flex-[15] rounded-full -ml-3 z-20" />
              <View className="bg-red-500 flex-[15] rounded-full -ml-3 z-10" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* MySavings */}
      <View className="mt-8 gap-6">
        {/* Subtitle */}
        <View className="items-center justify-between flex-row">
          <Text className="text-light-800 font-montserrat-medium text-[20px]">
            My <Text className="text-primary-600">Savings</Text>
          </Text>
          <TouchableOpacity>
            <Text className="text-secondary-500 font-montserrat-medium text-[14px]">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Savings items */}
        {/* TODO: Cambiar ScrollView a FlatList */}
        <View className="flex-row gap-4 -mr-7">
          {/* Add button */}
          <TouchableOpacity className="rounded-full border-2 border-secondary-700 border-dashed w-16 items-center justify-center">
            <Icon.PlusIcon size={20} color={Colors.secondary[500]} />
          </TouchableOpacity>

          {/* Saving Cards List */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-4 pr-7"
          >
            {/* Savings Card */}
            <TouchableOpacity className="bg-secondary-900 rounded-3xl p-5 gap-2">
              {/* Tag */}
              <View className="h-8 items-center flex-row justify-between">
                <View className="bg-purple-700 rounded-full w-3 h-3" />
              </View>
              {/* Title */}
              <Text
                className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
                numberOfLines={1}
              >
                Carro
              </Text>
              {/* Amounts */}
              <View className="flex-col gap-2 my-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-montserrat-medium text-[24px] text-light-800">
                    $4,112
                  </Text>
                  <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                    of
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                  $5,000
                </Text>
              </View>
              {/* Percentage */}
              <View className="flex-row items-center gap-2">
                <View className="bg-secondary-500 rounded-full py-2 px-4 self-start">
                  <Text className="font-montserrat-semibold text-[12px] text-light-900">
                    76%
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                  saved
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-secondary-900 rounded-3xl p-5 gap-2">
              {/* Tag */}
              <View className="h-8 items-center flex-row justify-between">
                <View className="bg-green-600 rounded-full w-3 h-3" />
              </View>
              {/* Title */}
              <Text
                className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
                numberOfLines={1}
              >
                Comida
              </Text>
              {/* Amounts */}
              <View className="flex-col gap-2 my-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-montserrat-medium text-[24px] text-light-800">
                    $647
                  </Text>
                  <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                    of
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                  $1,000
                </Text>
              </View>
              {/* Percentage */}
              <View className="flex-row items-center gap-2">
                <View className="bg-secondary-500 rounded-full py-2 px-4 self-start">
                  <Text className="font-montserrat-semibold text-[12px] text-light-900">
                    65%
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                  saved
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-secondary-900 rounded-3xl p-5 gap-2">
              {/* Tag */}
              <View className="h-8 items-center flex-row justify-between">
                <View className="bg-pink-700 rounded-full w-3 h-3" />
              </View>
              {/* Title */}
              <Text
                className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
                numberOfLines={1}
              >
                Moto
              </Text>
              {/* Amounts */}
              <View className="flex-col gap-2 my-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-montserrat-medium text-[24px] text-light-800">
                    $45,112
                  </Text>
                  <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                    of
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[16px] text-secondary-500">
                  $89,000
                </Text>
              </View>
              {/* Percentage */}
              <View className="flex-row items-center gap-2">
                <View className="bg-secondary-500 rounded-full py-2 px-4 self-start">
                  <Text className="font-montserrat-semibold text-[12px] text-light-900">
                    54%
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[14px] text-secondary-500">
                  saved
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* MyBudgets */}
      <View className="mt-8 gap-6">
        {/* Subtitle */}
        <View className="items-center justify-between flex-row">
          <Text className="text-light-800 font-montserrat-medium text-[20px]">
            My <Text className="text-primary-600">Budgets</Text>
          </Text>
          <TouchableOpacity>
            <Text className="text-secondary-500 font-montserrat-medium text-[14px]">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Budget items */}
        {/* TODO: Cambiar ScrollView a FlatList */}
        <View className="flex-row gap-4 -mr-7">
          {/* Add button */}
          <TouchableOpacity className="rounded-full border-2 border-secondary-700 border-dashed w-16 items-center justify-center">
            <Icon.PlusIcon size={20} color={Colors.secondary[500]} />
          </TouchableOpacity>

          {/* Budget Cards List */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-4 pr-7"
          >
            {/* Budget Card */}
            <TouchableOpacity className="bg-primary-700 rounded-3xl p-5 gap-2">
              {/* Tag */}
              <View className="h-8 items-center flex-row justify-between">
                <View className="bg-purple-700 rounded-full w-3 h-3" />
              </View>
              {/* Title */}
              <Text
                className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
                numberOfLines={1}
              >
                Carro
              </Text>
              {/* Amounts */}
              <View className="flex-col gap-2 my-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-montserrat-medium text-[24px] text-light-800">
                    $3,450
                  </Text>
                  <Text className="font-montserrat-medium text-[16px] text-primary-600">
                    of
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[16px] text-primary-600">
                  $5,000
                </Text>
              </View>
              {/* Percentage */}
              <View className="flex-row items-center gap-2">
                <View className="bg-primary-600 rounded-full py-2 px-4 self-start">
                  <Text className="font-montserrat-semibold text-[12px] text-light-900">
                    69%
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[14px] text-primary-600">
                  used
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-primary-700 rounded-3xl p-5 gap-2">
              {/* Tag */}
              <View className="h-8 items-center flex-row justify-between">
                <View className="bg-green-600 rounded-full w-3 h-3" />
              </View>
              {/* Title */}
              <Text
                className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
                numberOfLines={1}
              >
                Comida
              </Text>
              {/* Amounts */}
              <View className="flex-col gap-2 my-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-montserrat-medium text-[24px] text-light-800">
                    $2,890
                  </Text>
                  <Text className="font-montserrat-medium text-[16px] text-primary-600">
                    of
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[16px] text-primary-600">
                  $4,000
                </Text>
              </View>
              {/* Percentage */}
              <View className="flex-row items-center gap-2">
                <View className="bg-primary-600 rounded-full py-2 px-4 self-start">
                  <Text className="font-montserrat-semibold text-[12px] text-light-900">
                    72%
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[14px] text-primary-600">
                  used
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-primary-700 rounded-3xl p-5 gap-2">
              {/* Tag */}
              <View className="h-8 items-center flex-row justify-between">
                <View className="bg-pink-700 rounded-full w-3 h-3" />
              </View>
              {/* Title */}
              <Text
                className="font-montserrat-medium text-[20px] w-36 text-light-900 leading-[32px]"
                numberOfLines={1}
              >
                Transporte
              </Text>
              {/* Amounts */}
              <View className="flex-col gap-2 my-2">
                <View className="flex-row justify-between items-center">
                  <Text className="font-montserrat-medium text-[24px] text-light-800">
                    $1,234
                  </Text>
                  <Text className="font-montserrat-medium text-[16px] text-primary-600">
                    of
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[16px] text-primary-600">
                  $2,000
                </Text>
              </View>
              {/* Percentage */}
              <View className="flex-row items-center gap-2">
                <View className="bg-primary-600 rounded-full py-2 px-4 self-start">
                  <Text className="font-montserrat-semibold text-[12px] text-light-900">
                    62%
                  </Text>
                </View>
                <Text className="font-montserrat-medium text-[14px] text-primary-600">
                  used
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <View className="h-36" />
    </ScrollView>
  );
}
