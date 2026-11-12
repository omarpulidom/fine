import { addMonthsKey } from './dates'
import type { BillingCycle } from './ledger'

export type Installment = {
  cycleId: string
  amountCents: number
}

export function allocateInstallments(
  cycles: readonly BillingCycle[],
  cardId: string,
  firstCycleId: string,
  months: number,
  totalCents: number,
): Installment[] {
  if (
    !Number.isInteger(months) ||
    months < 2 ||
    months > 36 ||
    !Number.isSafeInteger(totalCents) ||
    totalCents < months
  ) {
    throw new Error('Número de meses o importe MSI inválido')
  }
  const ordered = cycles
    .filter((cycle) => cycle.cardId === cardId)
    .sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate))
  const firstIndex = ordered.findIndex((cycle) => cycle.id === firstCycleId)
  const chosen = ordered.slice(firstIndex, firstIndex + months)
  if (firstIndex < 0 || chosen.length !== months) {
    throw new Error('Configura todos los ciclos mensuales antes de registrar MSI')
  }
  for (let index = 1; index < chosen.length; index += 1) {
    const expectedMonth = addMonthsKey(`${chosen[index - 1].cutoffDate.slice(0, 7)}-01`, 1).slice(
      0,
      7,
    )
    if (chosen[index].cutoffDate.slice(0, 7) !== expectedMonth) {
      throw new Error('Faltan ciclos mensuales consecutivos para este plan MSI')
    }
  }
  const base = Math.floor(totalCents / months)
  return chosen.map((cycle, index) => ({
    cycleId: cycle.id,
    amountCents: index === months - 1 ? totalCents - base * (months - 1) : base,
  }))
}
