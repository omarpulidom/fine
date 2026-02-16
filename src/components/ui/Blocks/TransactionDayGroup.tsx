import { Text, View } from "react-native";
import { TransactionItem } from "./TransactionItem";
import type { Transaction } from "@/types/finance.types";

interface TransactionDayGroupProps {
  label: string;
  transactions: Transaction[];
}

export function TransactionDayGroup({
  label,
  transactions,
}: TransactionDayGroupProps) {
  return (
    <View>
      {/* Date Header */}
      <Text className="text-secondary-500 font-montserrat-medium text-[12px]">
        {label}
      </Text>
      {/* Transactions */}
      <View className="mt-4 gap-4">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            icon={transaction.icon}
            title={transaction.title}
            category={transaction.category}
            amount={transaction.amount}
            time={transaction.time}
          />
        ))}
      </View>
    </View>
  );
}
