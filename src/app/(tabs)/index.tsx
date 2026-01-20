import * as Icon from "phosphor-react-native";
import { ScrollView, Text, View } from "react-native";
import {
  AmountDisplay,
  SectionHeader,
  ActionButton,
  IconButton,
} from "@/components/UI/Common";
import { OverviewCard, TransactionDayGroup } from "@/components/UI/Blocks";
import type { TransactionGroup, ProgressSegment } from "@/types/finance.types";

// Mock data
const SPENDING_SEGMENTS: ProgressSegment[] = [
  { color: "#a855f7", flex: 35 },
  { color: "#0ab87e", flex: 25 },
  { color: "#facc15", flex: 20 },
  { color: "#ef4444", flex: 20 },
];

const TRANSACTIONS_DATA: TransactionGroup[] = [
  {
    label: "TODAY",
    transactions: [
      {
        id: "1",
        title: "Despensa",
        category: "Groceries",
        amount: -1399,
        time: "9:32 AM",
        icon: Icon.ShoppingCartSimpleIcon,
      },
    ],
  },
  {
    label: "YESTERDAY",
    transactions: [
      {
        id: "2",
        title: "Pago beca",
        category: "School",
        amount: 1500,
        time: "10:45 PM",
        icon: Icon.StudentIcon,
      },
      {
        id: "3",
        title: "Gasolina",
        category: "Transport",
        amount: -670,
        time: "10:23 AM",
        icon: Icon.CarIcon,
      },
    ],
  },
  {
    label: "MON 5 JAN",
    transactions: [
      {
        id: "4",
        title: "Pago",
        category: "Other",
        amount: 1000,
        time: "5:32 PM",
        icon: Icon.CoinsIcon,
      },
      {
        id: "5",
        title: "Ropa",
        category: "Clothes",
        amount: -520,
        time: "1:15 PM",
        icon: Icon.CoatHangerIcon,
      },
    ],
  },
  {
    label: "SUN 4 JAN",
    transactions: [
      {
        id: "6",
        title: "Medicamentos",
        category: "Health",
        amount: -134,
        time: "6:13 PM",
        icon: Icon.FirstAidKitIcon,
      },
      {
        id: "7",
        title: "Comida",
        category: "Food",
        amount: -245,
        time: "2:41 PM",
        icon: Icon.BowlFoodIcon,
      },
    ],
  },
];

export default function HomeTab() {
  return (
    <ScrollView className="flex-1 px-7 bg-secondary-800">
      {/* Total Balance */}
      <View className="mt-4">
        <Text className="text-[20px] text-center font-montserrat-regular text-light-800">
          Total Balance
        </Text>
        <View className="mt-2">
          <AmountDisplay amount={3293} currency="MXN" size="xl" />
        </View>

        {/* Buttons */}
        <View className="flex-row justify-center mt-8 gap-3">
          <ActionButton label="Income" icon={Icon.PlusIcon} />
          <ActionButton label="Expense" icon={Icon.ArrowUpRightIcon} />
          <IconButton icon={Icon.DotsThreeIcon} />
        </View>
      </View>

      {/* Overview */}
      <View className="mt-10 gap-6">
        <SectionHeader title="Overview" showSeeAll />

        <View className="flex-row gap-4">
          <OverviewCard
            title="Spending"
            amount={3365}
            percentageChange={4.5}
            icon={Icon.ChartDonutIcon}
            variant="primary"
            segments={SPENDING_SEGMENTS}
          />
          <OverviewCard
            title="Streaming"
            amount={343}
            icon={Icon.CalendarDotsIcon}
            variant="secondary"
            badge="12"
          />
        </View>
      </View>

      {/* Transactions */}
      <View className="mt-10">
        <SectionHeader title="Transactions" showSeeAll />

        <View className="flex-col mt-6 gap-6">
          {TRANSACTIONS_DATA.map((group) => (
            <TransactionDayGroup
              key={group.label}
              label={group.label}
              transactions={group.transactions}
            />
          ))}
        </View>
      </View>

      <View className="h-36" />
    </ScrollView>
  );
}
