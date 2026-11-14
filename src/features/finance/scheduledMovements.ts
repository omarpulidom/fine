import { storageMMKV } from '@/lib/mmkv/stores'
import { addDaysKey, addMonthsKey, isDateKey } from './dates'

const STORAGE_KEY = 'finance:scheduled-movements:v1'
const SKIPPED_OCCURRENCES_KEY = 'finance:skipped-scheduled-occurrences:v1'

export type ScheduledMovement = {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amountCents: number
  accountId?: string
  counterpartyAccountId?: string
  recurrence?: 'weekly' | 'biweekly' | 'monthly'
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
    (item.counterpartyAccountId === undefined || typeof item.counterpartyAccountId === 'string') &&
    (item.recurrence === undefined ||
      item.recurrence === 'weekly' ||
      item.recurrence === 'biweekly' ||
      item.recurrence === 'monthly') &&
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

export function nextOccurrenceDate(
  movement: ScheduledMovement,
  completedOccurrences: ReadonlySet<string>,
): string | null {
  let index = 0
  while (true) {
    const date =
      movement.recurrence === 'monthly'
        ? addMonthsKey(movement.effectiveDate, index)
        : addDaysKey(movement.effectiveDate, index * (movement.recurrence === 'weekly' ? 7 : 14))
    if (movement.endDate && date > movement.endDate) return null
    if (!completedOccurrences.has(`${movement.id}:${date}`)) return date
    if (!movement.recurrence) return null
    index += 1
  }
}
