import { storageMMKV } from '@/lib/mmkv/stores'
import { isDateKey, localDateKey } from './dates'
import { allocateInstallments, type Installment } from './installments'

const LEDGER_KEY = 'finance:ledger:v1'
const LEGACY_BALANCE_KEY = 'finance:cash-account-balance-cents:v1'

export type LiquidAccount = {
  id: string
  name: string
  type: 'cash' | 'bank'
  balanceCents: number
  asOfDate?: string
}

export type CompletedMovement = {
  id: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  counterpartyAccountId?: string
  amountCents: number
  effectiveDate: string
  description: string
  sourceScheduledId?: string
  sourceOccurrenceDate?: string
}

export type CreditCard = {
  id: string
  name: string
  cutoffDay: number
  currentDebtCents: number
  unbilledOpeningCents: number
  paymentSourceAccountId: string
  createdDate: string
}

export type BillingCycle = {
  id: string
  cardId: string
  cutoffDate: string
  dueDate: string
  openingStatementCents: number
  scheduledDate?: string
  scheduledAmountCents: number
  paidAmountCents: number
  paymentToAvoidInterestCents?: number
  minimumPaymentCents?: number
}

export type CardActivity = {
  id: string
  type: 'purchase' | 'payment'
  cardId: string
  cycleId: string
  sourceAccountId?: string
  amountCents: number
  effectiveDate: string
  description: string
  installments?: Installment[]
}

export type BalanceReconciliation = {
  id: string
  accountId: string
  date: string
  deltaCents: number
}

export type Ledger = {
  accounts: LiquidAccount[]
  completedMovements: CompletedMovement[]
  cards: CreditCard[]
  cycles: BillingCycle[]
  cardActivity: CardActivity[]
  reconciliations: BalanceReconciliation[]
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function isAccount(value: unknown): value is LiquidAccount {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    (item.type === 'cash' || item.type === 'bank') &&
    (item.asOfDate === undefined ||
      (typeof item.asOfDate === 'string' && isDateKey(item.asOfDate))) &&
    typeof item.balanceCents === 'number' &&
    Number.isSafeInteger(item.balanceCents)
  )
}

function isCompletedMovement(value: unknown): value is CompletedMovement {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    (item.type === 'income' || item.type === 'expense' || item.type === 'transfer') &&
    typeof item.accountId === 'string' &&
    (item.counterpartyAccountId === undefined || typeof item.counterpartyAccountId === 'string') &&
    (item.sourceScheduledId === undefined || typeof item.sourceScheduledId === 'string') &&
    (item.sourceOccurrenceDate === undefined ||
      (typeof item.sourceOccurrenceDate === 'string' && isDateKey(item.sourceOccurrenceDate))) &&
    typeof item.amountCents === 'number' &&
    Number.isSafeInteger(item.amountCents) &&
    item.amountCents > 0 &&
    typeof item.effectiveDate === 'string' &&
    isDateKey(item.effectiveDate) &&
    typeof item.description === 'string'
  )
}

export function getLedger(): Ledger {
  const raw = storageMMKV.getString(LEDGER_KEY)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const value = parsed as Record<string, unknown>
        if (Array.isArray(value.accounts) && Array.isArray(value.completedMovements)) {
          const originalAccounts = value.accounts.filter(isAccount)
          const accounts = originalAccounts.map((account) => ({
            ...account,
            asOfDate: account.asOfDate ?? localDateKey(new Date()),
          }))
          const ledger: Ledger = {
            accounts,
            completedMovements: value.completedMovements.filter(isCompletedMovement),
            cards: Array.isArray(value.cards) ? (value.cards as CreditCard[]) : [],
            cycles: Array.isArray(value.cycles) ? (value.cycles as BillingCycle[]) : [],
            cardActivity: Array.isArray(value.cardActivity)
              ? (value.cardActivity as CardActivity[])
              : [],
            reconciliations: Array.isArray(value.reconciliations)
              ? (value.reconciliations as BalanceReconciliation[])
              : [],
          }
          if (originalAccounts.some((account) => !account.asOfDate)) {
            storageMMKV.set(LEDGER_KEY, JSON.stringify(ledger))
          }
          return ledger
        }
      }
    } catch {
      // An unreadable local snapshot is treated as empty.
    }
  }

  const legacyBalance = storageMMKV.getNumber(LEGACY_BALANCE_KEY)
  const ledger: Ledger = {
    accounts:
      legacyBalance !== undefined && Number.isSafeInteger(legacyBalance)
        ? [
            {
              id: newId(),
              name: 'Efectivo y débito',
              type: 'bank',
              balanceCents: legacyBalance,
              asOfDate: localDateKey(new Date()),
            },
          ]
        : [],
    completedMovements: [],
    cards: [],
    cycles: [],
    cardActivity: [],
    reconciliations: [],
  }
  storageMMKV.set(LEDGER_KEY, JSON.stringify(ledger))
  return ledger
}

function persist(ledger: Ledger): Ledger {
  storageMMKV.set(LEDGER_KEY, JSON.stringify(ledger))
  return ledger
}

export function upsertAccount(account: LiquidAccount): Ledger {
  if (!isAccount(account) || !account.name.trim()) throw new Error('Cuenta inválida')
  const ledger = getLedger()
  const index = ledger.accounts.findIndex((item) => item.id === account.id)
  const accounts = [
    ...ledger.accounts,
  ]
  const previous = index === -1 ? null : accounts[index]
  if (index === -1) accounts.push(account)
  else accounts[index] = account
  return persist({
    ...ledger,
    accounts,
    reconciliations:
      previous && previous.balanceCents !== account.balanceCents
        ? [
            ...ledger.reconciliations,
            {
              id: newId(),
              accountId: account.id,
              date: localDateKey(new Date()),
              deltaCents: account.balanceCents - previous.balanceCents,
            },
          ]
        : ledger.reconciliations,
  })
}

export function upsertCompletedMovement(movement: CompletedMovement, todayKey: string): Ledger {
  if (!isCompletedMovement(movement) || movement.effectiveDate > todayKey) {
    throw new Error('Movimiento realizado inválido')
  }
  const ledger = getLedger()
  const old = ledger.completedMovements.find((item) => item.id === movement.id)
  const accounts = ledger.accounts.map((account) => ({
    ...account,
  }))
  const apply = (entry: CompletedMovement, multiplier: number) => {
    const account = accounts.find((item) => item.id === entry.accountId)
    if (!account) throw new Error('Selecciona una cuenta existente')
    if (account.asOfDate && entry.effectiveDate < account.asOfDate) {
      throw new Error('La fecha es anterior al saldo inicial de la cuenta')
    }
    const sign = entry.type === 'income' ? 1 : -1
    account.balanceCents += sign * entry.amountCents * multiplier
    if (entry.type === 'transfer') {
      const target = accounts.find((item) => item.id === entry.counterpartyAccountId)
      if (!target || target.id === account.id) throw new Error('Elige otra cuenta de destino')
      if (target.asOfDate && entry.effectiveDate < target.asOfDate) {
        throw new Error('La fecha es anterior al saldo inicial de la cuenta de destino')
      }
      target.balanceCents += entry.amountCents * multiplier
      if (!Number.isSafeInteger(target.balanceCents)) throw new Error('Saldo fuera de rango')
    }
    if (!Number.isSafeInteger(account.balanceCents)) throw new Error('Saldo fuera de rango')
  }
  if (old) apply(old, -1)
  apply(movement, 1)
  const completedMovements = old
    ? ledger.completedMovements.map((item) => (item.id === movement.id ? movement : item))
    : [
        ...ledger.completedMovements,
        movement,
      ]
  return persist({
    ...ledger,
    accounts,
    completedMovements,
  })
}

export function deleteCompletedMovement(id: string): Ledger {
  const ledger = getLedger()
  const old = ledger.completedMovements.find((item) => item.id === id)
  if (!old) return ledger
  const accounts = ledger.accounts.map((account) => ({
    ...account,
  }))
  const account = accounts.find((item) => item.id === old.accountId)
  if (!account) throw new Error('No se encontró la cuenta')
  account.balanceCents += old.type === 'income' ? -old.amountCents : old.amountCents
  if (old.type === 'transfer') {
    const target = accounts.find((item) => item.id === old.counterpartyAccountId)
    if (!target) throw new Error('No se encontró la cuenta de destino')
    target.balanceCents -= old.amountCents
  }
  return persist({
    ...ledger,
    accounts,
    completedMovements: ledger.completedMovements.filter((item) => item.id !== id),
  })
}

export function newAccountId(): string {
  return newId()
}
export function newMovementId(): string {
  return newId()
}
export function totalLiquidity(ledger: Ledger): number {
  return ledger.accounts.reduce((total, account) => total + account.balanceCents, 0)
}

export function newCardId(): string {
  return newId()
}
export function newCycleId(): string {
  return newId()
}
export function newCardActivityId(): string {
  return newId()
}

export function statementAmountCents(ledger: Ledger, cycleId: string): number {
  const cycle = ledger.cycles.find((item) => item.id === cycleId)
  if (!cycle) return 0
  return (
    cycle.openingStatementCents +
    ledger.cardActivity
      .filter((item) => item.type === 'purchase')
      .reduce(
        (total, item) =>
          total +
          (item.installments
            ? (item.installments.find((part) => part.cycleId === cycleId)?.amountCents ?? 0)
            : item.cycleId === cycleId
              ? item.amountCents
              : 0),
        0,
      )
  )
}

export function createCreditCard(card: CreditCard, initialCycle: BillingCycle | null): Ledger {
  const ledger = getLedger()
  if (
    !card.name.trim() ||
    !isDateKey(card.createdDate) ||
    card.cutoffDay < 1 ||
    card.cutoffDay > 31 ||
    !ledger.accounts.some((account) => account.id === card.paymentSourceAccountId) ||
    !Number.isSafeInteger(card.currentDebtCents) ||
    card.currentDebtCents < 0 ||
    !Number.isSafeInteger(card.unbilledOpeningCents) ||
    card.unbilledOpeningCents < 0 ||
    ledger.cards.some((item) => item.id === card.id)
  )
    throw new Error('Tarjeta inválida')
  if (
    initialCycle &&
    (initialCycle.cardId !== card.id ||
      initialCycle.openingStatementCents > card.currentDebtCents ||
      !isDateKey(initialCycle.cutoffDate) ||
      !isDateKey(initialCycle.dueDate) ||
      initialCycle.dueDate <= initialCycle.cutoffDate)
  )
    throw new Error('Ciclo inicial inválido')
  return persist({
    ...ledger,
    cards: [
      ...ledger.cards,
      card,
    ],
    cycles: initialCycle
      ? [
          ...ledger.cycles,
          initialCycle,
        ]
      : ledger.cycles,
  })
}

export function updateCreditCardSettings(
  cardId: string,
  name: string,
  cutoffDay: number,
  paymentSourceAccountId: string,
): Ledger {
  const ledger = getLedger()
  if (
    !ledger.cards.some((card) => card.id === cardId) ||
    !name.trim() ||
    !Number.isInteger(cutoffDay) ||
    cutoffDay < 1 ||
    cutoffDay > 31 ||
    !ledger.accounts.some((account) => account.id === paymentSourceAccountId)
  ) {
    throw new Error('Configuración de tarjeta inválida')
  }
  return persist({
    ...ledger,
    cards: ledger.cards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            name: name.trim(),
            cutoffDay,
            paymentSourceAccountId,
          }
        : card,
    ),
  })
}

export function createBillingCycle(cycle: BillingCycle): Ledger {
  const ledger = getLedger()
  const card = ledger.cards.find((item) => item.id === cycle.cardId)
  if (
    !card ||
    !Number.isSafeInteger(cycle.openingStatementCents) ||
    cycle.openingStatementCents < 0 ||
    cycle.openingStatementCents > card.unbilledOpeningCents ||
    !isDateKey(cycle.cutoffDate) ||
    !isDateKey(cycle.dueDate) ||
    cycle.dueDate <= cycle.cutoffDate ||
    ledger.cycles.some(
      (item) =>
        item.id === cycle.id ||
        (item.cardId === cycle.cardId && item.cutoffDate === cycle.cutoffDate),
    )
  ) {
    throw new Error('Ciclo inválido')
  }
  return persist({
    ...ledger,
    cards: ledger.cards.map((item) =>
      item.id === card.id
        ? {
            ...item,
            unbilledOpeningCents: item.unbilledOpeningCents - cycle.openingStatementCents,
          }
        : item,
    ),
    cycles: [
      ...ledger.cycles,
      cycle,
    ],
  })
}

export function scheduleCyclePayment(
  cycleId: string,
  scheduledDate: string | undefined,
  scheduledAmountCents: number,
  dueDate?: string,
  details?: {
    paymentToAvoidInterestCents?: number
    minimumPaymentCents?: number
  },
): Ledger {
  const ledger = getLedger()
  const cycle = ledger.cycles.find((item) => item.id === cycleId)
  if (
    !cycle ||
    (scheduledDate && !isDateKey(scheduledDate)) ||
    (dueDate && (!isDateKey(dueDate) || dueDate <= cycle.cutoffDate)) ||
    !Number.isSafeInteger(scheduledAmountCents) ||
    scheduledAmountCents < 0 ||
    scheduledAmountCents > statementAmountCents(ledger, cycleId) ||
    (details?.paymentToAvoidInterestCents !== undefined &&
      (!Number.isSafeInteger(details.paymentToAvoidInterestCents) ||
        details.paymentToAvoidInterestCents < 0)) ||
    (details?.minimumPaymentCents !== undefined &&
      (!Number.isSafeInteger(details.minimumPaymentCents) || details.minimumPaymentCents < 0))
  ) {
    throw new Error('Pago programado inválido')
  }
  return persist({
    ...ledger,
    cycles: ledger.cycles.map((item) =>
      item.id === cycleId
        ? {
            ...item,
            dueDate: dueDate ?? item.dueDate,
            scheduledDate,
            scheduledAmountCents,
            paymentToAvoidInterestCents: details?.paymentToAvoidInterestCents,
            minimumPaymentCents: details?.minimumPaymentCents,
          }
        : item,
    ),
  })
}

export function addCardActivity(activity: CardActivity, todayKey: string): Ledger {
  const ledger = getLedger()
  const card = ledger.cards.find((item) => item.id === activity.cardId)
  const cycle = ledger.cycles.find(
    (item) => item.id === activity.cycleId && item.cardId === activity.cardId,
  )
  if (
    !card ||
    !cycle ||
    !isDateKey(activity.effectiveDate) ||
    activity.effectiveDate > todayKey ||
    !Number.isSafeInteger(activity.amountCents) ||
    activity.amountCents <= 0 ||
    activity.effectiveDate < card.createdDate ||
    ledger.cardActivity.some((item) => item.id === activity.id)
  )
    throw new Error('Actividad inválida')

  const accounts = ledger.accounts.map((item) => ({
    ...item,
  }))
  const cards = ledger.cards.map((item) => ({
    ...item,
  }))
  const cycles = ledger.cycles.map((item) => ({
    ...item,
  }))
  const targetCard = cards.find((item) => item.id === card.id)
  const targetCycle = cycles.find((item) => item.id === cycle.id)
  if (!targetCard || !targetCycle) throw new Error('No se encontró la tarjeta o el ciclo')
  if (activity.type === 'purchase') {
    if (activity.installments) {
      const parts = activity.installments
      if (
        parts.length < 2 ||
        new Set(parts.map((part) => part.cycleId)).size !== parts.length ||
        parts.reduce((total, part) => total + part.amountCents, 0) !== activity.amountCents ||
        parts.some(
          (part) =>
            part.amountCents <= 0 ||
            !ledger.cycles.some((item) => item.id === part.cycleId && item.cardId === card.id),
        )
      ) {
        throw new Error('Plan MSI inválido')
      }
    }
    targetCard.currentDebtCents += activity.amountCents
  } else {
    const source = accounts.find((item) => item.id === activity.sourceAccountId)
    const unpaidStatement = statementAmountCents(ledger, cycle.id) - cycle.paidAmountCents
    if (
      !source ||
      activity.amountCents > targetCard.currentDebtCents ||
      activity.amountCents > unpaidStatement
    )
      throw new Error('Pago mayor que la deuda pendiente')
    source.balanceCents -= activity.amountCents
    targetCard.currentDebtCents -= activity.amountCents
    targetCycle.paidAmountCents += activity.amountCents
  }
  if (!Number.isSafeInteger(targetCard.currentDebtCents)) throw new Error('Deuda fuera de rango')
  return persist({
    ...ledger,
    accounts,
    cards,
    cycles,
    cardActivity: [
      ...ledger.cardActivity,
      activity,
    ],
  })
}

export function deleteCardActivity(id: string): Ledger {
  const ledger = getLedger()
  const activity = ledger.cardActivity.find((item) => item.id === id)
  if (!activity) return ledger
  const accounts = ledger.accounts.map((item) => ({
    ...item,
  }))
  const cards = ledger.cards.map((item) => ({
    ...item,
  }))
  const cycles = ledger.cycles.map((item) => ({
    ...item,
  }))
  const card = cards.find((item) => item.id === activity.cardId)
  const cycle = cycles.find((item) => item.id === activity.cycleId)
  if (!card || !cycle) throw new Error('No se encontró la tarjeta o el ciclo')
  if (activity.type === 'purchase') {
    const portions = activity.installments ?? [
      {
        cycleId: activity.cycleId,
        amountCents: activity.amountCents,
      },
    ]
    if (
      card.currentDebtCents < activity.amountCents ||
      portions.some((part) => {
        const linkedCycle = cycles.find((item) => item.id === part.cycleId)
        return (
          !linkedCycle ||
          statementAmountCents(ledger, part.cycleId) - part.amountCents <
            linkedCycle.paidAmountCents ||
          statementAmountCents(ledger, part.cycleId) - part.amountCents <
            linkedCycle.scheduledAmountCents
        )
      })
    )
      throw new Error('No puedes borrar una compra que ya fue pagada')
    card.currentDebtCents -= activity.amountCents
  } else {
    const source = accounts.find((item) => item.id === activity.sourceAccountId)
    if (!source) throw new Error('No se encontró la cuenta de pago')
    source.balanceCents += activity.amountCents
    card.currentDebtCents += activity.amountCents
    cycle.paidAmountCents -= activity.amountCents
  }
  return persist({
    ...ledger,
    accounts,
    cards,
    cycles,
    cardActivity: ledger.cardActivity.filter((item) => item.id !== id),
  })
}

export function reassignPurchase(id: string, targetCycleId: string): Ledger {
  const ledger = getLedger()
  const purchase = ledger.cardActivity.find((item) => item.id === id && item.type === 'purchase')
  const target = ledger.cycles.find(
    (item) => item.id === targetCycleId && item.cardId === purchase?.cardId,
  )
  const origin = ledger.cycles.find((item) => item.id === purchase?.cycleId)
  if (
    !purchase ||
    purchase.installments ||
    !target ||
    !origin ||
    statementAmountCents(ledger, origin.id) - purchase.amountCents < origin.paidAmountCents ||
    statementAmountCents(ledger, origin.id) - purchase.amountCents < origin.scheduledAmountCents
  ) {
    throw new Error('No se puede reasignar esta compra')
  }
  return persist({
    ...ledger,
    cardActivity: ledger.cardActivity.map((item) =>
      item.id === id
        ? {
            ...item,
            cycleId: targetCycleId,
          }
        : item,
    ),
  })
}

export function reassignInstallmentPurchase(
  id: string,
  firstCycleId: string,
  months: number,
): Ledger {
  const ledger = getLedger()
  const purchase = ledger.cardActivity.find(
    (item) => item.id === id && item.type === 'purchase' && item.installments,
  )
  if (!purchase?.installments) throw new Error('No se encontró el plan MSI')
  const nextParts = allocateInstallments(
    ledger.cycles,
    purchase.cardId,
    firstCycleId,
    months,
    purchase.amountCents,
  )
  const affectedIds = new Set([
    ...purchase.installments.map((part) => part.cycleId),
    ...nextParts.map((part) => part.cycleId),
  ])
  for (const cycleId of affectedIds) {
    const cycle = ledger.cycles.find((item) => item.id === cycleId)
    if (!cycle) throw new Error('Ciclo faltante')
    const oldShare =
      purchase.installments.find((part) => part.cycleId === cycleId)?.amountCents ?? 0
    const newShare = nextParts.find((part) => part.cycleId === cycleId)?.amountCents ?? 0
    const nextStatement = statementAmountCents(ledger, cycleId) - oldShare + newShare
    if (nextStatement < cycle.paidAmountCents || nextStatement < cycle.scheduledAmountCents) {
      throw new Error('Corrige los pagos vinculados antes de cambiar este plan MSI')
    }
  }
  return persist({
    ...ledger,
    cardActivity: ledger.cardActivity.map((item) =>
      item.id === id
        ? {
            ...item,
            cycleId: firstCycleId,
            installments: nextParts,
          }
        : item,
    ),
  })
}
