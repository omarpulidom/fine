import { addDaysKey, addMonthsKey } from './dates'
import type { ScheduledMovement } from './scheduledMovements'

export type ProjectionPoint = {
  date: string
  balanceCents: number
}

export type ProjectionBreakdownPoint = ProjectionPoint & {
  incomeCents: number
  expenseCents: number
}

export type ScheduledCardPayment = {
  date: string
  amountCents: number
}

// The current balance already includes completed activity. Only explicitly
// scheduled movements after today affect future dates.
export function projectLiquidity(
  currentBalanceCents: number,
  todayKey: string,
  movements: readonly ScheduledMovement[],
  horizonDays: number,
  cardPayments: readonly ScheduledCardPayment[] = [],
  completedOccurrences: ReadonlySet<string> = new Set(),
): ProjectionPoint[] {
  return projectLiquidityBreakdown(
    currentBalanceCents,
    todayKey,
    movements,
    horizonDays,
    cardPayments,
    completedOccurrences,
  ).map(({ date, balanceCents }) => ({
    date,
    balanceCents,
  }))
}

export function projectLiquidityBreakdown(
  currentBalanceCents: number,
  todayKey: string,
  movements: readonly ScheduledMovement[],
  horizonDays: number,
  cardPayments: readonly ScheduledCardPayment[] = [],
  completedOccurrences: ReadonlySet<string> = new Set(),
): ProjectionBreakdownPoint[] {
  let incomeCents = 0
  let expenseCents = 0
  const changesByDate = new Map<
    string,
    {
      incomeCents: number
      expenseCents: number
    }
  >()
  const horizonKey = addDaysKey(todayKey, horizonDays)

  for (const movement of movements) {
    let occurrence = movement.effectiveDate
    let index = 0
    while (occurrence <= horizonKey && (!movement.endDate || occurrence <= movement.endDate)) {
      if (occurrence > todayKey && !completedOccurrences.has(`${movement.id}:${occurrence}`)) {
        const change = changesByDate.get(occurrence) ?? {
          incomeCents: 0,
          expenseCents: 0,
        }
        if (movement.type === 'income') change.incomeCents += movement.amountCents
        if (movement.type === 'expense') change.expenseCents += movement.amountCents
        changesByDate.set(occurrence, change)
      }
      if (!movement.recurrence) break
      index += 1
      occurrence =
        movement.recurrence === 'monthly'
          ? addMonthsKey(movement.effectiveDate, index)
          : addDaysKey(movement.effectiveDate, index * (movement.recurrence === 'weekly' ? 7 : 14))
    }
  }

  for (const payment of cardPayments) {
    if (payment.date <= todayKey || payment.date > horizonKey) continue
    const change = changesByDate.get(payment.date) ?? {
      incomeCents: 0,
      expenseCents: 0,
    }
    change.expenseCents += payment.amountCents
    changesByDate.set(payment.date, change)
  }

  return Array.from(
    {
      length: horizonDays + 1,
    },
    (_, day) => {
      const date = addDaysKey(todayKey, day)
      const change = changesByDate.get(date)
      incomeCents += change?.incomeCents ?? 0
      expenseCents += change?.expenseCents ?? 0
      return {
        date,
        balanceCents: currentBalanceCents + incomeCents - expenseCents,
        incomeCents,
        expenseCents,
      }
    },
  )
}
