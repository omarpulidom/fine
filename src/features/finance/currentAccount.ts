import { storageMMKV } from '@/lib/mmkv/stores'

const ACCOUNT_BALANCE_KEY = 'finance:cash-account-balance-cents:v1'

// Current balance is the starting point; past transactions are not replayed.
export function getCurrentBalanceCents(): number | null {
  const value = storageMMKV.getNumber(ACCOUNT_BALANCE_KEY)
  return value !== undefined && Number.isSafeInteger(value) ? value : null
}

export function setCurrentBalanceCents(amountCents: number): void {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error('El saldo debe ser un importe válido.')
  }
  storageMMKV.set(ACCOUNT_BALANCE_KEY, amountCents)
}
