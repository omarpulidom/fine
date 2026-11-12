export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

export function formatDateDisplay(date: Date): string {
  const day = date.getDate()
  const month = MONTH_NAMES[date.getMonth()]
  return `${day} ${month} ${date.getFullYear()}`
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function addDaysKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function addMonthsKey(dateKey: string, months: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const firstOfMonth = new Date(Date.UTC(year, month - 1 + months, 1, 12))
  const lastDay = new Date(
    Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0, 12),
  ).getUTCDate()
  firstOfMonth.setUTCDate(Math.min(day, lastDay))
  return firstOfMonth.toISOString().slice(0, 10)
}
