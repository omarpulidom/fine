import { View, ScrollView } from "react-native";
import { SectionHeader, ScreenTitle } from "@/components/ui/Common";
import {
  SummaryCard,
  ItemCard,
  HorizontalCardList,
} from "@/components/ui/Blocks";
import type { FinanceItem, ProgressSegment } from "@/types/finance.types";

// Mock data
const SAVINGS_SEGMENTS: ProgressSegment[] = [
  { color: "#a855f7", flex: 45 },
  { color: "#0ab87e", flex: 25 },
  { color: "#facc15", flex: 15 },
  { color: "#ef4444", flex: 15 },
];

const BUDGET_SEGMENTS: ProgressSegment[] = [
  { color: "#a855f7", flex: 40 },
  { color: "#0ab87e", flex: 30 },
  { color: "#facc15", flex: 15 },
  { color: "#ef4444", flex: 15 },
];

const SAVINGS_DATA: FinanceItem[] = [
  {
    id: "1",
    title: "Carro",
    current: 4112,
    total: 5000,
    percentage: 76,
    tagColor: "#7e22ce",
  },
  {
    id: "2",
    title: "Comida",
    current: 647,
    total: 1000,
    percentage: 65,
    tagColor: "#16a34a",
  },
  {
    id: "3",
    title: "Moto",
    current: 45112,
    total: 89000,
    percentage: 54,
    tagColor: "#be185d",
  },
];

const BUDGETS_DATA: FinanceItem[] = [
  {
    id: "1",
    title: "Carro",
    current: 3450,
    total: 5000,
    percentage: 69,
    tagColor: "#7e22ce",
  },
  {
    id: "2",
    title: "Comida",
    current: 2890,
    total: 4000,
    percentage: 72,
    tagColor: "#16a34a",
  },
  {
    id: "3",
    title: "Transporte",
    current: 1234,
    total: 2000,
    percentage: 62,
    tagColor: "#be185d",
  },
];

export default function SavingsScreen() {
  return (
    <ScrollView className="flex-1 px-7 pt-4 bg-secondary-800">
      {/* Title */}
      <ScreenTitle title="Savings" highlight="Budgets" />

      {/* Main cards */}
      <View className="flex-row gap-4 mt-8">
        <SummaryCard
          title="You've saved"
          current={11453}
          total={18000}
          percentage={46}
          totalLabel="goal"
          statusLabel="saved"
          variant="secondary"
          segments={SAVINGS_SEGMENTS}
        />
        <SummaryCard
          title="You've used"
          current={9731}
          total={23000}
          percentage={62}
          totalLabel="budget"
          statusLabel="used"
          variant="primary"
          segments={BUDGET_SEGMENTS}
        />
      </View>

      {/* My Savings */}
      <View className="mt-8 gap-6">
        <SectionHeader title="My" highlight="Savings" showSeeAll />

        <HorizontalCardList
          data={SAVINGS_DATA}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <ItemCard
              title={item.title}
              current={item.current}
              total={item.total}
              percentage={item.percentage}
              tagColor={item.tagColor}
              variant="secondary"
              statusLabel="saved"
            />
          )}
        />
      </View>

      {/* My Budgets */}
      <View className="mt-8 gap-6">
        <SectionHeader title="My" highlight="Budgets" showSeeAll />

        <HorizontalCardList
          data={BUDGETS_DATA}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <ItemCard
              title={item.title}
              current={item.current}
              total={item.total}
              percentage={item.percentage}
              tagColor={item.tagColor}
              variant="primary"
              statusLabel="used"
            />
          )}
        />
      </View>

      <View className="h-36" />
    </ScrollView>
  );
}
