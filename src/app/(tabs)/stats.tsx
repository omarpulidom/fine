import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Colors } from "@/components/colors";
import * as Icon from "phosphor-react-native";
import Dropdown from "@/components/Elements/Dropdown/Dropdown";
import { useState } from "react";
import Svg, { Circle } from "react-native-svg";

const rangeOfTimeOptions = [
  {
    label: "Year",
    value: "year",
  },
  {
    label: "Month",
    value: "month",
  },
  {
    label: "Week",
    value: "week",
  },
];

export default function StatsScreen() {
  const [rangeOfTimeValue, setRangeOfTimeValue] = useState<string | null>(null);
  return (
    <ScrollView className="flex-1 px-7 pt-4 bg-secondary-800">
      <Text className="text-[20px] font-montserrat-medium text-primary-600">
        Stats
      </Text>

      {/* Data metrics */}
      <View className="border border-secondary-700 rounded-3xl pt-7 px-4 pb-4 my-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="gap-1">
            <Text className="text-[18px] font-montserrat-medium text-light-800">
              Data metrics
            </Text>
            <Text className="text-[14px] font-montserrat-regular text-secondary-500">
              Income-expense analyzer
            </Text>
          </View>
          <Dropdown
            options={rangeOfTimeOptions}
            value={rangeOfTimeValue || "month"}
            onValueChange={setRangeOfTimeValue}
            placeholder="month"
            className="w-28"
          />
        </View>

        {/* Date and Balance */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[14px] font-montserrat-medium text-light-900">
            17 JANUARY
          </Text>
          <Text className="text-[14px] font-montserrat-regular text-secondary-500">
            Day Balance:{" "}
            <Text className="font-montserrat-medium text-primary-600">
              $805
            </Text>
          </Text>
        </View>

        {/* Chart Placeholder */}
        <View className="h-40 bg-secondary-800 rounded-2xl mb-4 items-center justify-center">
          <Text className="text-secondary-500 text-[12px]">Chart Area</Text>
        </View>

        {/* Month Buttons */}
        <View className="flex-row gap-1 mb-4 items-center justify-center">
          {["JAN", "FEB", "MAR", "APR", "JUN", "JUL"].map((month, idx) => (
            <TouchableOpacity
              key={month}
              className={`px-3 py-2 rounded-full ${
                idx === 0
                  ? "bg-primary-700"
                  : "bg-secondary-800 border border-secondary-700"
              }`}
            >
              <Text
                className={`text-[12px] font-montserrat-medium ${
                  idx === 0 ? "text-light-900" : "text-secondary-500"
                }`}
              >
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Average Cards */}
        <View className="flex-row gap-3">
          <View className="bg-secondary-900 flex-1 rounded-3xl px-4 py-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] w-20 font-montserrat-medium text-light-900">
                Average Income
              </Text>
              <View className="w-9 h-9 bg-secondary-800 rounded-full items-center justify-center">
                <Icon.HandArrowUpIcon size={18} color={Colors.light[900]} />
              </View>
            </View>
            <Text className="text-[32px] font-montserrat-medium text-primary-600">
              $2,465
            </Text>
          </View>
          <View className="bg-secondary-900 flex-1 rounded-3xl px-4 py-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[16px] w-20 font-montserrat-medium text-light-900">
                Average Expense
              </Text>
              <View className="w-9 h-9 bg-secondary-800 rounded-full items-center justify-center">
                <Icon.HandArrowDownIcon size={18} color={Colors.light[900]} />
              </View>
            </View>
            <Text className="text-[32px] font-montserrat-medium text-light-800">
              $1,932
            </Text>
          </View>
        </View>
      </View>

      {/* Payment calendar */}
      <View className="border border-secondary-700 rounded-3xl pt-7 px-4 pb-4 mb-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="gap-1">
            <Text className="text-[18px] font-montserrat-medium text-light-800">
              Payment calendar
            </Text>
            <Text className="text-[14px] font-montserrat-regular text-secondary-500">
              Never miss a payment
            </Text>
          </View>
          <View className="p-3 bg-secondary-900 rounded-full">
            <Text className="text-[12px] font-montserrat-medium text-light-900">
              SEPTEMBER
            </Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="mb-4">
          <View className="flex-row justify-around mb-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
              <Text
                key={idx}
                className="text-[12px] font-montserrat-medium text-secondary-500 w-8 text-center"
              >
                {day}
              </Text>
            ))}
          </View>
          {/* Calendar days */}
          <View className="h-48 bg-secondary-800 rounded-2xl items-center justify-center">
            <Text className="text-secondary-500 text-[12px]">
              Calendar Grid
            </Text>
          </View>
        </View>

        {/* Manage button */}
        <TouchableOpacity className="flex-row items-center justify-end gap-3">
          <Text className="text-[14px] font-montserrat-regular text-light-900">
            Manage payments
          </Text>
          <View className="w-12 h-12 border border-secondary-700 rounded-full items-center justify-center">
            <Icon.ArrowRightIcon size={16} color={Colors.light[900]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Your savings */}
      <View className="border border-secondary-700 rounded-3xl pt-7 px-4 pb-4 mb-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="gap-1">
            <Text className="text-[18px] font-montserrat-medium text-light-800">
              Your savings
            </Text>
            <Text className="text-[14px] font-montserrat-regular text-secondary-500">
              Total saved across all goals
            </Text>
          </View>
          <View className="p-3 bg-secondary-900 rounded-full">
            <Text className="text-[12px] font-montserrat-medium text-light-900">
              74%
            </Text>
          </View>
        </View>

        {/* Total Savings */}
        <Text className="text-[32px] font-montserrat-medium text-primary-600 mb-6">
          $8,446
        </Text>

        {/* Savings icons */}
        <View className="flex-row items-center gap-8 mb-4">
          {[
            { Icon: Icon.CarIcon, progress: 0.65 },
            { Icon: Icon.HouseIcon, progress: 0.45 },
            { Icon: Icon.AirplaneIcon, progress: 0.85 },
          ].map(({ Icon: IconComponent, progress }, idx) => {
            const size = 64;
            const strokeWidth = 6;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);

            return (
              <View
                key={idx}
                className="w-16 h-16 items-center justify-center relative"
              >
                {/* SVG Progress */}
                <Svg
                  width={size}
                  height={size}
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Colors.secondary[900]}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Colors.primary[700]}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                  />
                </Svg>

                {/* TODO: Volver esto un componente */}
                {/* Icon */}
                <IconComponent
                  style={{ marginTop: 8, marginLeft: 8 }}
                  size={18}
                  color={Colors.light[800]}
                />
              </View>
            );
          })}

          <View className="h-12 pl-4 bg-secondary-800 items-center justify-center">
            <Text className="text-[20px] font-montserrat-medium text-light-900">
              +2
            </Text>
          </View>
        </View>

        {/* Manage button */}
        <TouchableOpacity className="flex-row items-center justify-end gap-3">
          <Text className="text-[14px] font-montserrat-regular text-light-900">
            Manage savings
          </Text>
          <View className="w-12 h-12 border border-secondary-700 rounded-full items-center justify-center">
            <Icon.ArrowRightIcon size={16} color={Colors.light[900]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Debts & Loans */}
      <View className="gap-3">
        <View className="flex-row gap-4">
          {/* Debts */}
          <View className="flex-1 border border-secondary-700 rounded-3xl pt-7 px-4 pb-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="gap-1">
                <Text className="text-[18px] font-montserrat-medium text-light-800">
                  Debts
                </Text>
                <Text className="text-[14px] font-montserrat-regular text-secondary-500">
                  Total payed
                </Text>
              </View>
              <View className="p-3 bg-secondary-900 rounded-full">
                <Text className="text-[12px] font-montserrat-medium text-light-900">
                  65%
                </Text>
              </View>
            </View>
            {/* Progress circle placeholder */}
            <View className="w-16 h-16 self-center items-center justify-center relative mb-8">
              <Svg
                width={64}
                height={64}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {/* Background circle */}
                <Circle
                  cx={32}
                  cy={32}
                  r={29}
                  stroke={Colors.secondary[900]}
                  strokeWidth={6}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={32}
                  cy={32}
                  r={29}
                  stroke={Colors.primary[700]}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 29}
                  strokeDashoffset={2 * Math.PI * 29 * (1 - 0.65)}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="32, 32"
                />
              </Svg>
              <Icon.ArrowDownIcon
                size={18}
                color={Colors.light[800]}
                style={{ marginTop: 8, marginLeft: 8 }}
              />
            </View>
            {/* Footer */}
            <View className="flex-row self-center items-center gap-1">
              <Icon.TrendDownIcon size={18} color={Colors.primary[600]} />
              <View className="items-center">
                <Text className="text-[12px] font-montserrat-medium text-light-900">
                  12% vs last month
                </Text>
                <Text className="text-[12px] font-montserrat-medium text-primary-600">
                  in debt amount
                </Text>
              </View>
            </View>
          </View>
          {/* Loans */}
          <View className="flex-1 border border-secondary-700 rounded-3xl pt-7 px-4 pb-4">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="gap-1">
                <Text className="text-[18px] font-montserrat-medium text-light-800">
                  Loans
                </Text>
                <Text className="text-[14px] font-montserrat-regular text-secondary-500">
                  Total payed
                </Text>
              </View>
              <View className="p-3 bg-secondary-900 rounded-full">
                <Text className="text-[12px] font-montserrat-medium text-light-900">
                  80%
                </Text>
              </View>
            </View>

            {/* Progress circle placeholder */}
            <View className="w-16 h-16 self-center items-center justify-center relative mb-8">
              <Svg
                width={64}
                height={64}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {/* Background circle */}
                <Circle
                  cx={32}
                  cy={32}
                  r={29}
                  stroke={Colors.secondary[900]}
                  strokeWidth={6}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={32}
                  cy={32}
                  r={29}
                  stroke={Colors.primary[700]}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={2 * Math.PI * 29}
                  strokeDashoffset={2 * Math.PI * 29 * (1 - 0.8)}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="32, 32"
                />
              </Svg>
              <Icon.ArrowUpIcon
                size={18}
                color={Colors.light[800]}
                style={{ marginTop: 8, marginLeft: 8 }}
              />
            </View>

            {/* Footer */}
            <View className="flex-row self-center items-center gap-1">
              <Icon.TrendUpIcon size={18} color={Colors.primary[600]} />
              <View className="items-center">
                <Text className="text-[12px] font-montserrat-medium text-light-900">
                  8% vs last month
                </Text>
                <Text className="text-[12px] font-montserrat-medium text-primary-600">
                  in loan amount
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Manage button */}
        <TouchableOpacity className="flex-row items-center justify-end gap-3 pr-4">
          <Text className="text-[14px] font-montserrat-regular text-light-900">
            Manage debts & loans
          </Text>
          <View className="w-12 h-12 border border-secondary-700 rounded-full items-center justify-center">
            <Icon.ArrowRightIcon size={16} color={Colors.light[900]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Budgets status */}
      <View className="border border-secondary-700 rounded-3xl pt-7 px-4 pb-4 my-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="gap-1">
            <Text className="text-[18px] font-montserrat-medium text-light-800">
              Budgets status
            </Text>
            <Text className="text-[14px] font-montserrat-regular text-secondary-500">
              Total used across all budgets
            </Text>
          </View>
          <View className="p-3 bg-secondary-900 rounded-full">
            <Text className="text-[12px] font-montserrat-medium text-light-900">
              74%
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text className="text-[32px] font-montserrat-medium text-primary-600 mb-6">
          $23,789
        </Text>

        <View className="bg-secondary-900 px-4 py-3 rounded-full mb-6 self-start">
          <Text className="text-[12px] font-montserrat-medium text-light-900">
            2 BUDGETS APPROACHING LIMIT
          </Text>
        </View>

        {/* Budget icons */}
        <View className="flex-row items-center gap-8 mb-4">
          {[
            { Icon: Icon.ConfettiIcon, progress: 0.65 },
            { Icon: Icon.DesktopTowerIcon, progress: 0.45 },
            { Icon: Icon.IslandIcon, progress: 0.85 },
          ].map(({ Icon: IconComponent, progress }, idx) => {
            const size = 64;
            const strokeWidth = 6;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);

            return (
              <View
                key={idx}
                className="w-16 h-16 items-center justify-center relative"
              >
                {/* SVG Progress */}
                <Svg
                  width={size}
                  height={size}
                  style={{ position: "absolute", top: 0, left: 0 }}
                >
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Colors.secondary[900]}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={Colors.primary[700]}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                  />
                </Svg>

                {/* TODO: Volver esto un componente */}
                {/* Icon */}
                <IconComponent
                  style={{ marginTop: 8, marginLeft: 8 }}
                  size={18}
                  color={Colors.light[800]}
                />
              </View>
            );
          })}
        </View>

        {/* Manage button */}
        <TouchableOpacity className="flex-row items-center justify-end gap-3">
          <Text className="text-[14px] font-montserrat-regular text-light-900">
            Manage budgets
          </Text>
          <View className="w-12 h-12 border border-secondary-700 rounded-full items-center justify-center">
            <Icon.ArrowRightIcon size={16} color={Colors.light[900]} />
          </View>
        </TouchableOpacity>
      </View>

      <View className="h-36" />
    </ScrollView>
  );
}
