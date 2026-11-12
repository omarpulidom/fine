export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateDisplay(
  date: Date,
  includeYear = true,
  monthStyle: 'long' | 'short' = 'long',
): string {
  const parts = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: monthStyle,
    year: 'numeric',
  }).formatToParts(date)
  const get = (type: 'day' | 'month' | 'year') =>
    parts.find((part) => part.type === type)?.value ?? ''
  const month = get('month')
  return `${get('day')} ${month.charAt(0).toUpperCase()}${month.slice(1)}${includeYear ? ` ${get('year')}` : ''}`
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
