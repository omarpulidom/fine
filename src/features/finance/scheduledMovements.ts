import { storageMMKV } from '@/lib/mmkv/stores'
import { addDaysKey, addMonthsKey, isDateKey } from './dates'

const STORAGE_KEY = 'finance:scheduled-movements:v1'
const SKIPPED_OCCURRENCES_KEY = 'finance:skipped-scheduled-occurrences:v1'

export type ScheduledMovement = {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amountCents: number
  accountId?: string
  cardId?: string
  counterpartyAccountId?: string
  recurrence?: 'weekly' | 'biweekly' | 'monthly' | 'custom'
  recurrenceInterval?: number
  recurrenceUnit?: 'days' | 'weeks' | 'months' | 'years'
  endDate?: string
  effectiveDate: string
  description: string
}

function isScheduledMovement(value: unknown): value is ScheduledMovement {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    (item.type === 'income' || item.type === 'expense' || item.type === 'transfer') &&
    typeof item.amountCents === 'number' &&
    Number.isSafeInteger(item.amountCents) &&
    item.amountCents > 0 &&
    (item.accountId === undefined || typeof item.accountId === 'string') &&
    (item.cardId === undefined || typeof item.cardId === 'string') &&
    (item.cardId === undefined ||
      (item.type === 'expense' && item.accountId === undefined &&
        item.counterpartyAccountId === undefined)) &&
    (item.counterpartyAccountId === undefined || typeof item.counterpartyAccountId === 'string') &&
    (item.recurrence === undefined ||
      item.recurrence === 'weekly' ||
      item.recurrence === 'biweekly' ||
      item.recurrence === 'monthly' ||
      item.recurrence === 'custom') &&
    (item.recurrence !== 'custom' ||
      (typeof item.recurrenceInterval === 'number' &&
        Number.isSafeInteger(item.recurrenceInterval) &&
        item.recurrenceInterval >= 1 && item.recurrenceInterval <= 999 &&
        (item.recurrenceUnit === 'days' || item.recurrenceUnit === 'weeks' ||
          item.recurrenceUnit === 'months' || item.recurrenceUnit === 'years'))) &&
    (item.endDate === undefined || (typeof item.endDate === 'string' && isDateKey(item.endDate))) &&
    typeof item.effectiveDate === 'string' &&
    isDateKey(item.effectiveDate) &&
    typeof item.description === 'string'
  )
}

export function getScheduledMovements(): ScheduledMovement[] {
  const raw = storageMMKV.getString(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isScheduledMovement) : []
  } catch {
    return []
  }
}

export function saveScheduledMovement(movement: ScheduledMovement): ScheduledMovement[] {
  if (!isScheduledMovement(movement)) throw new Error('Movimiento inválido')
  const previous = getScheduledMovements()
  const next = previous.some((item) => item.id === movement.id)
    ? previous.map((item) => (item.id === movement.id ? movement : item))
    : [
        ...previous,
        movement,
      ]
  storageMMKV.set(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function deleteScheduledMovement(id: string): ScheduledMovement[] {
  const next = getScheduledMovements().filter((movement) => movement.id !== id)
  storageMMKV.set(STORAGE_KEY, JSON.stringify(next))
  storageMMKV.set(
    SKIPPED_OCCURRENCES_KEY,
    JSON.stringify(getSkippedOccurrences().filter((key) => !key.startsWith(`${id}:`))),
  )
  return next
}

export function moveCardScheduledMovements(
  cardId: string,
  target: { cardId: string } | { accountId: string } | null,
): ScheduledMovement[] {
  const previous = getScheduledMovements()
  const removedIds = previous.filter((movement) => movement.cardId === cardId).map((movement) => movement.id)
  const next = previous.flatMap((movement) => {
    if (movement.cardId !== cardId) return [movement]
    if (!target) return []
    return [{ ...movement, cardId: 'cardId' in target ? target.cardId : undefined,
      accountId: 'accountId' in target ? target.accountId : undefined }]
  })
  storageMMKV.set(STORAGE_KEY, JSON.stringify(next))
  if (!target) storageMMKV.set(SKIPPED_OCCURRENCES_KEY, JSON.stringify(
    getSkippedOccurrences().filter((key) => !removedIds.some((id) => key.startsWith(`${id}:`))),
  ))
  return next
}

export function getSkippedOccurrences(): string[] {
  const raw = storageMMKV.getString(SKIPPED_OCCURRENCES_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => {
          if (typeof value !== 'string') return false
          const separator = value.lastIndexOf(':')
          return separator > 0 && isDateKey(value.slice(separator + 1))
        })
      : []
  } catch {
    return []
  }
}

export function skipScheduledOccurrence(movementId: string, date: string): string[] {
  const movement = getScheduledMovements().find((item) => item.id === movementId)
  if (!movement?.recurrence || !isDateKey(date)) {
    throw new Error('No se puede omitir este periodo.')
  }
  const next = [...new Set([...getSkippedOccurrences(), `${movementId}:${date}`])]
  storageMMKV.set(SKIPPED_OCCURRENCES_KEY, JSON.stringify(next))
  return next
}

export function occurrenceDateAt(movement: ScheduledMovement, index: number): string {
  if (movement.recurrence === 'custom') {
    const interval = movement.recurrenceInterval ?? 1
    if (movement.recurrenceUnit === 'months') return addMonthsKey(movement.effectiveDate, index * interval)
    if (movement.recurrenceUnit === 'years') return addMonthsKey(movement.effectiveDate, index * interval * 12)
    return addDaysKey(movement.effectiveDate,
      index * interval * (movement.recurrenceUnit === 'weeks' ? 7 : 1))
  }
  if (movement.recurrence === 'monthly') return addMonthsKey(movement.effectiveDate, index)
  if (movement.recurrence === 'biweekly') {
    const monthOffset = Math.floor(index / 2)
    const firstOfMonth = addMonthsKey(movement.effectiveDate, monthOffset)
    if (index % 2 === 0) return firstOfMonth
    const secondDay = Number(movement.effectiveDate.slice(8)) + 14
    if (secondDay <= 31) {
      const month = firstOfMonth.slice(0, 7)
      const lastDay = Number(addDaysKey(addMonthsKey(`${month}-01`, 1), -1).slice(8))
      return `${month}-${String(Math.min(secondDay, lastDay)).padStart(2, '0')}`
    }
    return addDaysKey(firstOfMonth, 14)
  }
  return addDaysKey(movement.effectiveDate, index * (movement.recurrence === 'weekly' ? 7 : 0))
}

export function nextOccurrenceDate(
  movement: ScheduledMovement,
  completedOccurrences: ReadonlySet<string>,
): string | null {
  let index = 0
  while (true) {
    const date = occurrenceDateAt(movement, index)
    if (movement.endDate && date > movement.endDate) return null
    if (!completedOccurrences.has(`${movement.id}:${date}`)) return date
    if (!movement.recurrence) return null
    index += 1
  }
}

export function occurrenceDatesThrough(movement: ScheduledMovement, lastDate: string): string[] {
  const dates: string[] = []
  let index = 0
  let date = movement.effectiveDate
  while (date <= lastDate && (!movement.endDate || date <= movement.endDate)) {
    dates.push(date)
    if (!movement.recurrence) break
    index += 1
    date = occurrenceDateAt(movement, index)
  }
  return dates
}
