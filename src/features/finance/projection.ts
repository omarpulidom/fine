import { addDaysKey, addMonthsKey } from './dates'
import type { ScheduledMovement } from './scheduledMovements'

export type ProjectionPoint = {
  date: string
  balanceCents: number
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
  let balanceCents = currentBalanceCents
  const changesByDate = new Map<string, number>()
  const horizonKey = addDaysKey(todayKey, horizonDays)

  for (const movement of movements) {
    const sign = movement.type === 'income' ? 1 : movement.type === 'expense' ? -1 : 0
    let occurrence = movement.effectiveDate
    let index = 0
    while (occurrence <= horizonKey && (!movement.endDate || occurrence <= movement.endDate)) {
      if (occurrence > todayKey && !completedOccurrences.has(`${movement.id}:${occurrence}`)) {
        changesByDate.set(
          occurrence,
          (changesByDate.get(occurrence) ?? 0) + sign * movement.amountCents,
        )
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
    changesByDate.set(payment.date, (changesByDate.get(payment.date) ?? 0) - payment.amountCents)
  }

  return Array.from(
    {
      length: horizonDays + 1,
    },
    (_, day) => {
      const date = addDaysKey(todayKey, day)
      balanceCents += changesByDate.get(date) ?? 0
      return {
        date,
        balanceCents,
      }
    },
  )
}
