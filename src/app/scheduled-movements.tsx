import * as Icon from '@/components/ui/PhosphorIcons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScheduledMovementsList } from '@/components/finance/ScheduledMovementsList'
import { localDateKey } from '@/features/finance/dates'
import {
  completedScheduledOccurrenceKeys,
  completeScheduledCardPurchase,
  getLedger,
  newMovementId,
  upsertCompletedMovement,
} from '@/features/finance/ledger'
import {
  deleteScheduledMovement,
  getScheduledMovements,
  getSkippedOccurrences,
  nextOccurrenceDate,
  type ScheduledMovement,
  skipScheduledOccurrence,
} from '@/features/finance/scheduledMovements'

export default function ScheduledMovementsScreen() {
  const router = useRouter()
  const [ledger, setLedger] = useState(getLedger)
  const [movements, setMovements] = useState(getScheduledMovements)
  const [skippedOccurrences, setSkippedOccurrences] = useState(getSkippedOccurrences)
  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()))

  useFocusEffect(
    useCallback(() => {
      setLedger(getLedger())
      setMovements(getScheduledMovements())
      setSkippedOccurrences(getSkippedOccurrences())
      setTodayKey(localDateKey(new Date()))
    }, []),
  )

  const completedOccurrences = useMemo(
    () =>
      new Set([
        ...skippedOccurrences,
        ...completedScheduledOccurrenceKeys(ledger),
      ]),
    [
      ledger,
      skippedOccurrences,
    ],
  )

  function deleteMovement(movement: ScheduledMovement, occurrenceDate: string) {
    const removeAll = () => {
      setMovements(deleteScheduledMovement(movement.id))
      setSkippedOccurrences(getSkippedOccurrences())
    }
    if (movement.recurrence) {
      Alert.alert('Eliminar movimiento', '¿Solo este periodo o toda la programación?', [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Solo este periodo',
          onPress: () => {
            try {
              setSkippedOccurrences(skipScheduledOccurrence(movement.id, occurrenceDate))
            } catch (caught) {
              Alert.alert('No se pudo omitir', caught instanceof Error ? caught.message : '')
            }
          },
        },
        {
          text: 'Eliminar siempre',
          style: 'destructive',
          onPress: removeAll,
        },
      ])
      return
    }
    Alert.alert('Eliminar movimiento', 'Este movimiento dejará de afectar la proyección.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: removeAll,
      },
    ])
  }

  function completeMovement(movement: ScheduledMovement) {
    const occurrenceDate = nextOccurrenceDate(movement, completedOccurrences)
    const accountId = movement.accountId ?? ledger.accounts[0]?.id
    if (!occurrenceDate || (!movement.cardId && !accountId)) return
    Alert.alert(
      'Registrar como realizado',
      movement.cardId
        ? 'Se registrará como compra en la tarjeta. La liquidez cambiará al pagar el ciclo.'
        : 'Se aplicará al saldo actual y dejará de proyectarse.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Registrar',
          onPress: () => {
            try {
              if (movement.cardId) {
                setLedger(completeScheduledCardPurchase(movement, occurrenceDate, todayKey))
                return
              }
              if (!accountId) throw new Error('Selecciona una cuenta.')
              setLedger(
                upsertCompletedMovement(
                  {
                    id: newMovementId(),
                    type: movement.type,
                    accountId,
                    counterpartyAccountId: movement.counterpartyAccountId,
                    amountCents: movement.amountCents,
                    effectiveDate: todayKey,
                    description: movement.description,
                    sourceScheduledId: movement.id,
                    sourceOccurrenceDate: occurrenceDate,
                  },
                  todayKey,
                ),
              )
            } catch (caught) {
              Alert.alert('No se pudo registrar', caught instanceof Error ? caught.message : '')
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#f6f6f6',
      }}
    >
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 18,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole='button'
          accessibilityLabel='Volver'
          style={{
            alignSelf: 'flex-start',
            padding: 3,
          }}
        >
          <Icon.ArrowLeftIcon size={23} color='#101010' />
        </Pressable>
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: 28,
            color: '#101010',
            marginTop: 25,
          }}
        >
          Movimientos programados
        </Text>
      </View>
      <ScrollView
        style={{
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 36,
        }}
      >
        <ScheduledMovementsList
          mode='full'
          ledger={ledger}
          movements={movements}
          completedOccurrences={completedOccurrences}
          todayKey={todayKey}
          onEdit={(movement) => {
            router.push({ pathname: '/scheduled-movement-form',
              params: { movementId: movement.id } })
          }}
          onComplete={completeMovement}
          onDelete={deleteMovement}
          onOpenCard={(cardId) =>
            router.push({
              pathname: '/cards',
              params: {
                cardId,
              },
            })
          }
        />
      </ScrollView>
    </SafeAreaView>
  )
}
