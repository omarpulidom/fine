import { MMKV } from 'react-native-mmkv'

const MAIN_STORE_ID = 'main-store-id'
const ENCRYPTION_KEY = 'encryption-key'

const storageMMKV = new MMKV({
  id: MAIN_STORE_ID,
  encryptionKey: ENCRYPTION_KEY,
})

function WARNING_CLEAR_ALL_MMKVS_INSTANCES() {
  console.log('Clearing all MMKV instances...')

  try {
    storageMMKV.clearAll()
    console.log('Main storage cleared')
  } catch (error) {
    console.error('Error clearing main storage:', error)
  }

}

export { storageMMKV, WARNING_CLEAR_ALL_MMKVS_INSTANCES }
