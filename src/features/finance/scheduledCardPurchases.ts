import type { BillingCycle, Ledger } from './ledger'
import { occurrenceDatesThrough, type ScheduledMovement } from './scheduledMovements'

export function cycleForCardPurchase(
  ledger: Ledger,
  cardId: string,
  purchaseDate: string,
): BillingCycle | undefined {
  return ledger.cycles
    .filter((cycle) => cycle.cardId === cardId && cycle.cutoffDate >= purchaseDate &&
      cycle.dueDate > purchaseDate)
    .sort((left, right) => left.cutoffDate.localeCompare(right.cutoffDate))[0]
}

export function scheduledCardChargesByCycle(
  ledger: Ledger,
  movements: readonly ScheduledMovement[],
  lastDate: string,
  completedOccurrences: ReadonlySet<string>,
): Map<string, number> {
  const charges = new Map<string, number>()
  for (const movement of movements) {
    if (!movement.cardId || movement.type !== 'expense') continue
    for (const date of occurrenceDatesThrough(movement, lastDate)) {
      if (completedOccurrences.has(`${movement.id}:${date}`)) continue
      const cycle = cycleForCardPurchase(ledger, movement.cardId, date)
      if (!cycle) continue
      charges.set(cycle.id, (charges.get(cycle.id) ?? 0) + movement.amountCents)
    }
  }
  return charges
}
