import { isDateKey } from './dates'
import { allocateInstallments } from './installments'
import type { Ledger } from './ledger'
import type { ProjectionPoint } from './projection'

export type PurchaseScenario =
  | {
      method: 'cash'
      amountCents: number
      purchaseDate: string
    }
  | {
      method: 'card'
      amountCents: number
      purchaseDate: string
      cardId: string
      payments: {
        date: string
        amountCents: number
      }[]
    }
  | {
      method: 'msi'
      amountCents: number
      purchaseDate: string
      cardId: string
      firstCycleId: string
      months: number
      includePayments: boolean
    }

export function simulatePurchase(
  baseline: readonly ProjectionPoint[],
  todayKey: string,
  ledger: Ledger,
  scenario: PurchaseScenario,
): {
  points: ProjectionPoint[]
  debtIncreaseCents: number
  payments: {
    date: string
    amountCents: number
  }[]
} {
  if (
    !Number.isSafeInteger(scenario.amountCents) ||
    scenario.amountCents <= 0 ||
    !isDateKey(scenario.purchaseDate) ||
    scenario.purchaseDate < todayKey
  ) {
    throw new Error('Ingresa un importe y una fecha de compra válidos')
  }
  let payments: {
    date: string
    amountCents: number
  }[] = []
  if (scenario.method === 'cash') {
    payments = [
      {
        date: scenario.purchaseDate,
        amountCents: scenario.amountCents,
      },
    ]
  } else {
    if (!ledger.cards.some((card) => card.id === scenario.cardId)) {
      throw new Error('Selecciona una tarjeta')
    }
    if (scenario.method === 'card') {
      payments = scenario.payments
      if (payments.reduce((sum, item) => sum + item.amountCents, 0) > scenario.amountCents) {
        throw new Error('Los pagos superan el importe de la compra')
      }
    } else {
      const parts = allocateInstallments(
        ledger.cycles,
        scenario.cardId,
        scenario.firstCycleId,
        scenario.months,
        scenario.amountCents,
      )
      payments = scenario.includePayments
        ? parts.map((part) => {
            const cycle = ledger.cycles.find((item) => item.id === part.cycleId)
            if (!cycle) throw new Error('Falta un ciclo MSI')
            return {
              date: cycle.dueDate,
              amountCents: part.amountCents,
            }
          })
        : []
    }
  }
  if (
    payments.some(
      (item) =>
        !isDateKey(item.date) ||
        item.date < scenario.purchaseDate ||
        !Number.isSafeInteger(item.amountCents) ||
        item.amountCents <= 0,
    )
  ) {
    throw new Error('Confirma fechas e importes de pago posteriores a la compra')
  }
  const points = baseline.map((point) => ({
    ...point,
    balanceCents:
      point.balanceCents -
      payments
        .filter((item) => item.date <= point.date)
        .reduce((sum, item) => sum + item.amountCents, 0),
  }))
  return {
    points,
    debtIncreaseCents: scenario.method === 'cash' ? 0 : scenario.amountCents,
    payments,
  }
}
