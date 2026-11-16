import { addDaysKey } from './dates'
import { type Ledger, totalLiquidity } from './ledger'
import type { ProjectionPoint } from './projection'

export function liquidityHistory(
  ledger: Ledger,
  todayKey: string,
  daysBack = 30,
): ProjectionPoint[] {
  if (!ledger.accounts.length) return []
  const earliestKnownDate = ledger.accounts.reduce(
    (latest, account) =>
      account.asOfDate && account.asOfDate > latest ? account.asOfDate : latest,
    addDaysKey(todayKey, -daysBack),
  )
  const start = ledger.accounts.some((account) => !account.asOfDate) ? todayKey : earliestKnownDate
  const points: ProjectionPoint[] = []
  let day = start
  while (day <= todayKey) {
    let balanceCents = totalLiquidity(ledger)
    for (const movement of ledger.completedMovements) {
      if (movement.effectiveDate <= day) continue
      if (movement.type === 'income') balanceCents -= movement.amountCents
      if (movement.type === 'expense') balanceCents += movement.amountCents
    }
    for (const activity of ledger.cardActivity) {
      if (activity.type === 'payment' && activity.effectiveDate > day) {
        balanceCents += activity.amountCents
      }
    }
    for (const adjustment of ledger.reconciliations) {
      if (adjustment.date > day) balanceCents -= adjustment.deltaCents
    }
    points.push({
      date: day,
      balanceCents,
    })
    day = addDaysKey(day, 1)
  }
  return points
}
