export function formatMoney(cents: number): string {
  return `$${new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`
}

export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '')
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(trimmed)) return null
  const cents = Math.round(Number(trimmed.replace(/,/g, '')) * 100)
  return Number.isSafeInteger(cents) ? cents : null
}

export function formatMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/,/g, '')
  const dot = cleaned.indexOf('.')
  const digits = (dot < 0 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, '')
  const integer = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (dot < 0) return integer
  return `${integer || '0'}.${cleaned
    .slice(dot + 1)
    .replace(/\D/g, '')
    .slice(0, 2)}`
}
