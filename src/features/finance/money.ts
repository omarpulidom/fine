export function formatMoney(cents: number): string {
  return `$${new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`
}

export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '')
  if (!/^\d+([.,]\d{1,2})?$/.test(trimmed)) return null
  const cents = Math.round(Number(trimmed.replace(',', '.')) * 100)
  return Number.isSafeInteger(cents) ? cents : null
}
