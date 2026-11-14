import * as Icon from '@/components/ui/PhosphorIcons'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { localDateKey } from '@/features/finance/dates'
import { getLedger } from '@/features/finance/ledger'
import { ScheduledMovementForm } from '@/features/finance/ScheduledMovementForm'
import {
  getScheduledMovements,
  type ScheduledMovement,
  saveScheduledMovement,
} from '@/features/finance/scheduledMovements'

export default function ScheduledMovementFormScreen() {
  const router = useRouter()
  const { movementId } = useLocalSearchParams<{ movementId?: string }>()
  const [accounts, setAccounts] = useState(() => getLedger().accounts)
  const [initial, setInitial] = useState<ScheduledMovement | null>(() =>
    getScheduledMovements().find((item) => item.id === movementId) ?? null,
  )
  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()))

  useFocusEffect(useCallback(() => {
    setAccounts(getLedger().accounts)
    setInitial(getScheduledMovements().find((item) => item.id === movementId) ?? null)
    setTodayKey(localDateKey(new Date()))
  }, [movementId]))

  function save(draft: Omit<ScheduledMovement, 'id'>) {
    saveScheduledMovement({
      ...draft,
      id: initial?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    })
    router.back()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
      <View style={{ height: 70, paddingHorizontal: 24, justifyContent: 'center' }}>
        <Pressable onPress={() => router.back()} accessibilityRole='button'
          accessibilityLabel='Cerrar formulario' style={{ alignSelf: 'flex-start', padding: 3 }}>
          <Icon.XIcon size={23} color='#101010' />
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48 }}>
        <ScheduledMovementForm
          todayKey={todayKey}
          accounts={accounts}
          initial={initial}
          onSave={save}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
