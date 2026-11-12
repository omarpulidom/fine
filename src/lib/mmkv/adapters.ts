import type { StateStorage } from 'zustand/middleware'
import { storageMMKV } from './stores'

export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => {
    return storageMMKV.set(name, value)
  },
  getItem: (name) => {
    const value = storageMMKV.getString(name)
    return value ?? null
  },
  removeItem: (name) => {
    return storageMMKV.delete(name)
  },
}
