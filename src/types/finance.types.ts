import type { ComponentType } from "react";
import type { IconProps } from "phosphor-react-native";

export type IconComponent = ComponentType<IconProps>;

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  time: string;
  icon: IconComponent;
}

export interface TransactionGroup {
  label: string;
  transactions: Transaction[];
}

export interface FinanceItem {
  id: string;
  title: string;
  current: number;
  total: number;
  percentage: number;
  tagColor?: string;
  dueDate?: string;
}

export interface ProgressSegment {
  color: string;
  flex: number;
}

export type CardVariant = "primary" | "secondary";

export type BadgeVariant = "primary" | "secondary";

export type BadgeSize = "sm" | "md";
