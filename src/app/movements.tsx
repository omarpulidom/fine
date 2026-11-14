import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { DateField } from '@/components/ui/DateField'
import { formatShortDateKey, isDateKey, localDateKey } from '@/features/finance/dates'
import {
  type CompletedMovement,
  deleteCompletedMovement,
  getLedger,
  newMovementId,
  upsertCompletedMovement,
} from '@/features/finance/ledger'
import { formatMoney, formatMoneyInput, parseAmount } from '@/features/finance/money'

const INK = '#101010'
const MUTED = '#888'
const BACKGROUND = '#f6f6f6'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export default function MovementsScreen() {
  const router = useRouter()
  const { create } = useLocalSearchParams<{
    create?: string
  }>()
  const [ledger, setLedger] = useState(getLedger)
  const [editing, setEditing] = useState<CompletedMovement | null | undefined>(
    create === '1' ? null : undefined,
  )
  const [type, setType] = useState<CompletedMovement['type']>('expense')
  const [accountId, setAccountId] = useState(create === '1' ? (ledger.accounts[0]?.id ?? '') : '')
  const [counterpartyAccountId, setCounterpartyAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(localDateKey(new Date()))
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const todayKey = localDateKey(new Date())
  const sorted = [
    ...ledger.completedMovements,
  ].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
  const movementTypes: CompletedMovement['type'][] =
    editing?.type === 'transfer'
      ? [
          'expense',
          'income',
          'transfer',
        ]
      : [
          'expense',
          'income',
        ]

  function open(movement: CompletedMovement | null) {
    setEditing(movement)
    setType(movement?.type ?? 'expense')
    setAccountId(movement?.accountId ?? ledger.accounts[0]?.id ?? '')
    setCounterpartyAccountId(movement?.counterpartyAccountId ?? ledger.accounts[1]?.id ?? '')
    setAmount(movement ? formatMoneyInput((movement.amountCents / 100).toFixed(2)) : '')
    setDate(movement?.effectiveDate ?? todayKey)
    setDescription(movement?.description ?? '')
    setError('')
  }

  function save() {
    const amountCents = parseAmount(amount)
    if (
      !accountId ||
      (type === 'transfer' && (!counterpartyAccountId || counterpartyAccountId === accountId)) ||
      amountCents === null ||
      amountCents <= 0 ||
      !isDateKey(date) ||
      date > todayKey
    ) {
      setError('Selecciona cuenta, importe mayor que cero y fecha de hoy o anterior.')
      return
    }
    if (
      editing?.sourceScheduledId &&
      (type !== editing.type || amountCents !== editing.amountCents)
    ) {
      setError(
        'Para corregir el importe o tipo, elimina este registro y edita el movimiento programado.',
      )
      return
    }
    try {
      setLedger(
        upsertCompletedMovement(
          {
            id: editing?.id ?? newMovementId(),
            type,
            accountId,
            counterpartyAccountId: type === 'transfer' ? counterpartyAccountId : undefined,
            amountCents,
            effectiveDate: date,
            description: description.trim(),
            sourceScheduledId: editing?.sourceScheduledId,
            sourceOccurrenceDate: editing?.sourceOccurrenceDate,
          },
          todayKey,
        ),
      )
      setEditing(undefined)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.')
    }
  }

  function remove(movement: CompletedMovement) {
    Alert.alert('Eliminar movimiento', 'Se revertirá su efecto en el saldo actual.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setLedger(deleteCompletedMovement(movement.id)),
      },
    ])
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BACKGROUND,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 18,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole='button'
            accessibilityLabel='Volver'
          >
            <Feather name='arrow-left' size={23} color={INK} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              marginRight: 23,
              fontFamily: medium,
              fontSize: 16,
              color: INK,
            }}
          >
            Movimientos
          </Text>
        </View>
        <Text
          style={{
            marginTop: 60,
            fontFamily: semibold,
            fontSize: 31,
            color: INK,
            letterSpacing: -1,
          }}
        >
          Historial
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontFamily: regular,
            fontSize: 14,
            lineHeight: 21,
            color: MUTED,
          }}
        >
          Los movimientos realizados cambian el saldo actual de su cuenta una sola vez.
        </Text>
        <Pressable
          onPress={() => (ledger.accounts.length ? open(null) : router.push({ pathname: '/accounts', params: { create: '1' } }))}
          style={{
            marginTop: 26,
            height: 52,
            borderRadius: 12,
            backgroundColor: INK,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Feather name='plus' size={18} color='#fff' />
          <Text
            style={{
              fontFamily: medium,
              color: '#fff',
            }}
          >
            {ledger.accounts.length ? 'Registrar movimiento' : 'Crear cuenta primero'}
          </Text>
        </Pressable>
        {sorted.length === 0 && (
          <View
            style={{
              marginTop: 18,
              padding: 24,
              borderRadius: 12,
              backgroundColor: '#fff',
            }}
          >
            <Text
              style={{
                fontFamily: regular,
                color: MUTED,
                textAlign: 'center',
              }}
            >
              Aún no hay movimientos realizados
            </Text>
          </View>
        )}
        {sorted.map((movement) => {
          const account = ledger.accounts.find((item) => item.id === movement.accountId)
          return (
            <View
              key={movement.id}
              style={{
                marginTop: 10,
                minHeight: 70,
                borderRadius: 12,
                backgroundColor: '#fff',
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Pressable
                onPress={() => open(movement)}
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: medium,
                    color: INK,
                    fontSize: 15,
                  }}
                >
                  {movement.description ||
                    (movement.type === 'income'
                      ? 'Ingreso'
                      : movement.type === 'transfer'
                        ? 'Transferencia'
                        : 'Gasto')}
                </Text>
                <Text
                  style={{
                    fontFamily: regular,
                    color: MUTED,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {formatShortDateKey(movement.effectiveDate)} · {account?.name ?? 'Cuenta'}
                  {movement.type === 'transfer'
                    ? ` → ${ledger.accounts.find((item) => item.id === movement.counterpartyAccountId)?.name ?? 'Cuenta'}`
                    : ''}
                </Text>
              </Pressable>
              <Text
                style={{
                  fontFamily: medium,
                  color: INK,
                  fontSize: 14,
                  marginRight: 12,
                }}
              >
                {movement.type === 'income' ? '+' : '−'}
                {formatMoney(movement.amountCents)}
              </Text>
              <Pressable
                onPress={() => remove(movement)}
                hitSlop={10}
                accessibilityRole='button'
                accessibilityLabel='Eliminar movimiento'
              >
                <Feather name='trash-2' size={17} color={MUTED} />
              </Pressable>
            </View>
          )
        })}
      </ScrollView>

      <AppBottomSheet
        visible={editing !== undefined}
        onClose={() => setEditing(undefined)}
      >
        <View>
          <Text
            style={{
              fontFamily: semibold,
              fontSize: 21,
              color: INK,
            }}
          >
            {editing ? 'Editar movimiento' : 'Movimiento realizado'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 24,
            }}
          >
            {movementTypes.map((value) => (
              <Pressable
                key={value}
                onPress={() => setType(value)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: type === value ? INK : '#f3f3f3',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: medium,
                    color: type === value ? '#fff' : INK,
                  }}
                >
                  {value === 'expense' ? 'Gasto' : value === 'income' ? 'Ingreso' : 'Transferir'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={{
              marginTop: 22,
              fontFamily: medium,
              fontSize: 13,
              color: MUTED,
            }}
          >
            Importe
          </Text>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(formatMoneyInput(value))}
            keyboardType='decimal-pad'
            placeholder='0.00'
            placeholderTextColor='#bbb'
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#ddd',
              fontFamily: medium,
              fontSize: 30,
              paddingVertical: 10,
              color: INK,
            }}
          />
          <Text
            style={{
              marginTop: 22,
              fontFamily: medium,
              fontSize: 13,
              color: MUTED,
            }}
          >
            Cuenta
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              marginTop: 10,
            }}
          >
            {ledger.accounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => setAccountId(account.id)}
                style={{
                  marginRight: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 9,
                  backgroundColor: accountId === account.id ? INK : '#f3f3f3',
                }}
              >
                <Text
                  style={{
                    fontFamily: medium,
                    color: accountId === account.id ? '#fff' : INK,
                  }}
                >
                  {account.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {type === 'transfer' && (
            <>
              <Text
                style={{
                  marginTop: 22,
                  fontFamily: medium,
                  fontSize: 13,
                  color: MUTED,
                }}
              >
                Cuenta de destino
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  marginTop: 10,
                }}
              >
                {ledger.accounts
                  .filter((account) => account.id !== accountId)
                  .map((account) => (
                    <Pressable
                      key={account.id}
                      onPress={() => setCounterpartyAccountId(account.id)}
                      style={{
                        marginRight: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 9,
                        backgroundColor: counterpartyAccountId === account.id ? INK : '#f3f3f3',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: medium,
                          color: counterpartyAccountId === account.id ? '#fff' : INK,
                        }}
                      >
                        {account.name}
                      </Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </>
          )}
          <DateField
            label='Fecha del movimiento'
            value={date}
            onChange={setDate}
            maximumDate={todayKey}
          />
          <Text
            style={{
              marginTop: 22,
              fontFamily: medium,
              fontSize: 13,
              color: MUTED,
            }}
          >
            Concepto (opcional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder='¿De qué se trata?'
            placeholderTextColor='#bbb'
            maxLength={80}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#ddd',
              fontFamily: regular,
              fontSize: 16,
              paddingVertical: 10,
              color: INK,
            }}
          />
          {!!error && (
            <Text
              style={{
                marginTop: 12,
                fontFamily: regular,
                color: '#c84242',
              }}
            >
              {error}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 28,
            }}
          >
            <Pressable
              onPress={() => setEditing(undefined)}
              style={{
                flex: 1,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: MUTED,
                }}
              >
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={save}
              style={{
                flex: 1,
                height: 50,
                backgroundColor: INK,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: '#fff',
                }}
              >
                Guardar
              </Text>
            </Pressable>
          </View>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  )
}
