import { View, Text, ScrollView } from "react-native";
import * as Icon from "phosphor-react-native";
import {
  Dropdown,
  ManageButton,
  ScreenTitle,
  ChipSelector,
  AlertBadge,
} from "@/components/ui/Common";
import {
  StatSection,
  AverageCard,
  CircularProgressItem,
  MiniStatCard,
} from "@/components/ui/Blocks";
import { useState } from "react";
import type { IconComponent } from "@/types/finance.types";

// Mock data
const RANGE_OPTIONS = [
  { label: "Year", value: "year" },
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "JUN", "JUL"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface ProgressIcon {
  Icon: IconComponent;
  progress: number;
}

const SAVINGS_ICONS: ProgressIcon[] = [
  { Icon: Icon.CarIcon, progress: 0.65 },
  { Icon: Icon.HouseIcon, progress: 0.45 },
  { Icon: Icon.AirplaneIcon, progress: 0.85 },
];

const BUDGET_ICONS: ProgressIcon[] = [
  { Icon: Icon.ConfettiIcon, progress: 0.65 },
  { Icon: Icon.DesktopTowerIcon, progress: 0.45 },
  { Icon: Icon.IslandIcon, progress: 0.85 },
];

export default function StatsScreen() {
  const [rangeOfTimeValue, setRangeOfTimeValue] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0]);

  return (
    <ScrollView className="flex-1 px-7 pt-4 bg-secondary-800">
      <ScreenTitle title="Stats" />

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
            options={RANGE_OPTIONS}
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
        <View className="mb-4">
          <ChipSelector
            options={MONTHS}
            selected={selectedMonth}
            onSelect={setSelectedMonth}
          />
        </View>

        {/* Average Cards */}
        <View className="flex-row gap-3">
          <AverageCard
            title="Average Income"
            amount={2465}
            Icon={Icon.HandArrowUpIcon}
            variant="primary"
          />
          <AverageCard
            title="Average Expense"
            amount={1932}
            Icon={Icon.HandArrowDownIcon}
            variant="secondary"
          />
        </View>
      </View>

      {/* Payment calendar */}
      <StatSection
        title="Payment calendar"
        subtitle="Never miss a payment"
        badgeText="SEPTEMBER"
        manageLabel="Manage payments"
      >
        {/* Calendar Grid */}
        <View className="mb-4">
          <View className="flex-row justify-around mb-4">
            {DAYS.map((day, idx) => (
              <Text
                key={idx}
                className="text-[12px] font-montserrat-medium text-secondary-500 w-8 text-center"
              >
                {day}
              </Text>
            ))}
          </View>
          <View className="h-48 bg-secondary-800 rounded-2xl items-center justify-center">
            <Text className="text-secondary-500 text-[12px]">
              Calendar Grid
            </Text>
          </View>
        </View>
      </StatSection>

      {/* Your savings */}
      <StatSection
        title="Your savings"
        subtitle="Total saved across all goals"
        badgeText="74%"
        manageLabel="Manage savings"
      >
        <Text className="text-[32px] font-montserrat-medium text-primary-600 mb-6">
          $8,446
        </Text>

        <View className="flex-row items-center gap-8 mb-4">
          {SAVINGS_ICONS.map(({ Icon: IconComp, progress }, idx) => (
            <CircularProgressItem
              key={idx}
              Icon={IconComp}
              progress={progress}
            />
          ))}
          <View className="h-12 bg-secondary-800 items-center justify-center">
            <Text className="text-[20px] font-montserrat-medium text-light-900">
              +2
            </Text>
          </View>
        </View>
      </StatSection>

      {/* Debts & Loans */}
      <View className="gap-3">
        <View className="flex-row gap-4">
          <MiniStatCard
            title="Debts"
            subtitle="Total payed"
            percentage={65}
            progress={0.65}
            Icon={Icon.ArrowDownIcon}
            trendDirection="down"
            trendText="12% vs last month"
            trendSubtext="in debt amount"
          />
          <MiniStatCard
            title="Loans"
            subtitle="Total payed"
            percentage={80}
            progress={0.8}
            Icon={Icon.ArrowUpIcon}
            trendDirection="up"
            trendText="8% vs last month"
            trendSubtext="in loan amount"
          />
        </View>
        <ManageButton label="Manage debts & loans" className="pr-4" />
      </View>

      {/* Budgets status */}
      <StatSection
        title="Budgets status"
        subtitle="Total used across all budgets"
        badgeText="74%"
        manageLabel="Manage budgets"
      >
        <Text className="text-[32px] font-montserrat-medium text-primary-600 mb-6">
          $23,789
        </Text>

        <View className="mb-6">
          <AlertBadge text="2 BUDGETS APPROACHING LIMIT" />
        </View>

        <View className="flex-row items-center gap-8 mb-4">
          {BUDGET_ICONS.map(({ Icon: IconComp, progress }, idx) => (
            <CircularProgressItem
              key={idx}
              Icon={IconComp}
              progress={progress}
            />
          ))}
        </View>
      </StatSection>

      <View className="h-36" />
    </ScrollView>
  );
}
