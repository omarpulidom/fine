import * as Icon from '@/components/ui/PhosphorIcons'
import type { IconProps } from 'phosphor-react-native'

const icons = {
  'activity': Icon.PulseIcon,
  'arrow-down-left': Icon.ArrowDownLeftIcon,
  'arrow-up-right': Icon.ArrowUpRightIcon,
  'bar-chart-2': Icon.ChartBarIcon,
  'briefcase': Icon.BriefcaseIcon,
  'clock': Icon.ClockIcon,
  'credit-card': Icon.CreditCardIcon,
  'dollar-sign': Icon.CurrencyDollarIcon,
  'edit-2': Icon.PencilSimpleIcon,
  'layers': Icon.StackIcon,
  'list': Icon.ListIcon,
  'plus': Icon.PlusIcon,
  'repeat': Icon.ArrowsLeftRightIcon,
  'settings': Icon.GearIcon,
  'shopping-bag': Icon.ShoppingBagIcon,
  'trash-2': Icon.TrashIcon,
} as const

export type FinanceIconName = keyof typeof icons

export function FinanceIcon({ name, ...props }: IconProps & { name: FinanceIconName }) {
  const Component = icons[name]
  return <Component {...props} />
}
