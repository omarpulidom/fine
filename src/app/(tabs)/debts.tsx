import { View, ScrollView } from "react-native";
import { SectionHeader, ScreenTitle } from "@/components/ui/Common";
import {
  SummaryCard,
  ItemCard,
  HorizontalCardList,
} from "@/components/ui/Blocks";
import type { FinanceItem, ProgressSegment } from "@/types/finance.types";

// Mock data
const DEBT_SEGMENTS: ProgressSegment[] = [
  { color: "#a855f7", flex: 45 },
  { color: "#0ab87e", flex: 25 },
  { color: "#facc15", flex: 15 },
  { color: "#ef4444", flex: 15 },
];

const LOAN_SEGMENTS: ProgressSegment[] = [
  { color: "#a855f7", flex: 40 },
  { color: "#0ab87e", flex: 30 },
  { color: "#facc15", flex: 15 },
  { color: "#ef4444", flex: 15 },
];

const DEBTS_DATA: FinanceItem[] = [
  {
    id: "1",
    title: "Carro",
    current: 4112,
    total: 5000,
    percentage: 76,
    tagColor: "#7e22ce",
    dueDate: "10 JAN",
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

const LOANS_DATA: FinanceItem[] = [
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

export default function DebtsScreen() {
  return (
    <ScrollView className="flex-1 px-7 pt-4 bg-secondary-800">
      {/* Title */}
      <ScreenTitle title="Debts" highlight="Loans" />

      {/* Main cards */}
      <View className="flex-row gap-4 mt-8">
        <SummaryCard
          title="You owe"
          current={11453}
          total={18000}
          percentage={46}
          totalLabel="debt"
          statusLabel="payed"
          variant="secondary"
          segments={DEBT_SEGMENTS}
        />
        <SummaryCard
          title="Owed to you"
          current={9731}
          total={23000}
          percentage={62}
          totalLabel="loans"
          statusLabel="payed"
          variant="primary"
          segments={LOAN_SEGMENTS}
        />
      </View>

      {/* My Debts */}
      <View className="mt-8 gap-6">
        <SectionHeader title="My" highlight="Debts" showSeeAll />

        <HorizontalCardList
          data={DEBTS_DATA}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <ItemCard
              title={item.title}
              current={item.current}
              total={item.total}
              percentage={item.percentage}
              tagColor={item.tagColor}
              dueDate={item.dueDate}
              variant="secondary"
              statusLabel="payed"
            />
          )}
        />
      </View>

      {/* My Loans */}
      <View className="mt-8 gap-6">
        <SectionHeader title="My" highlight="Loans" showSeeAll />

        <HorizontalCardList
          data={LOANS_DATA}
          keyExtractor={(item) => item.id}
          renderItem={(item) => (
            <ItemCard
              title={item.title}
              current={item.current}
              total={item.total}
              percentage={item.percentage}
              tagColor={item.tagColor}
              variant="primary"
              statusLabel="payed"
            />
          )}
        />
      </View>

      <View className="h-36" />
    </ScrollView>
  );
}
