import { addMonthsKey, isDateKey } from './dates'

export type BillingRule = {
  anchorCutoffMonth: string
  anchorDueDate: string
}

export function cutoffForMonth(monthKey: string, preferredDay: number): string {
  const first = `${monthKey}-01`
  const last = addMonthsKey(first, 1)
  const lastDay = new Date(`${last}T12:00:00Z`)
  lastDay.setUTCDate(0)
  return `${monthKey}-${String(Math.min(preferredDay, lastDay.getUTCDate())).padStart(2, '0')}`
}

export function previousCutoffMonth(dueDate: string, preferredDay: number): string {
  if (!isDateKey(dueDate)) throw new Error('Fecha límite inválida')
  const month = dueDate.slice(0, 7)
  return cutoffForMonth(month, preferredDay) < dueDate
    ? month
    : addMonthsKey(`${month}-01`, -1).slice(0, 7)
}

export function cycleDates(rule: BillingRule, preferredDay: number, offset: number) {
  const month = addMonthsKey(`${rule.anchorCutoffMonth}-01`, offset).slice(0, 7)
  return {
    cutoffDate: cutoffForMonth(month, preferredDay),
    dueDate: addMonthsKey(rule.anchorDueDate, offset),
  }
}
