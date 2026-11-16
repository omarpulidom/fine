import type { Ledger } from './ledger'

export type MonthlyStatistics = {
  incomeCents: number
  directExpenseCents: number
  cardPaymentsCents: number
  expenseCents: number
  netCents: number
  incomeCount: number
  expenseCount: number
  cardPaymentCount: number
}

export function monthlyStatistics(ledger: Ledger, month: string): MonthlyStatistics {
  const movements = ledger.completedMovements.filter(
    (item) => item.effectiveDate.slice(0, 7) === month,
  )
  const payments = ledger.cardActivity.filter(
    (item) => item.type === 'payment' && item.effectiveDate.slice(0, 7) === month,
  )
  const incomes = movements.filter((item) => item.type === 'income')
  const expenses = movements.filter((item) => item.type === 'expense')
  const incomeCents = incomes.reduce((sum, item) => sum + item.amountCents, 0)
  const directExpenseCents = expenses.reduce((sum, item) => sum + item.amountCents, 0)
  const cardPaymentsCents = payments.reduce((sum, item) => sum + item.amountCents, 0)
  const expenseCents = directExpenseCents + cardPaymentsCents
  return {
    incomeCents,
    directExpenseCents,
    cardPaymentsCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    incomeCount: incomes.length,
    expenseCount: expenses.length,
    cardPaymentCount: payments.length,
  }
}
