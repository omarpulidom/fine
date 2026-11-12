import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { addDaysKey, isDateKey } from './dates'
import type { LiquidAccount } from './ledger'
import { parseAmount } from './money'
import type { ScheduledMovement } from './scheduledMovements'

type DraftMovement = Omit<ScheduledMovement, 'id'>

type Props = {
  visible: boolean
  todayKey: string
  accounts: LiquidAccount[]
  initial?: ScheduledMovement | null
  onClose: () => void
  onSave: (movement: DraftMovement) => void
}

const INK = '#101010'
const MUTED = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export function ScheduledMovementModal({
  visible,
  todayKey,
  accounts,
  initial,
  onClose,
  onSave,
}: Props) {
  const [type, setType] = useState<DraftMovement['type']>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [counterpartyAccountId, setCounterpartyAccountId] = useState('')
  const [dateChoice, setDateChoice] = useState<'tomorrow' | 'week' | 'custom'>('tomorrow')
  const [customDate, setCustomDate] = useState('')
  const [recurrence, setRecurrence] = useState<DraftMovement['recurrence']>(undefined)
  const [endDateInput, setEndDateInput] = useState('')
  const [error, setError] = useState('')

  const movementTypes: DraftMovement['type'][] =
    initial?.type === 'transfer'
      ? [
          'expense',
          'income',
          'transfer',
        ]
      : [
          'expense',
          'income',
        ]
  useEffect(() => {
    if (!visible) return
    setType(initial?.type ?? 'expense')
    setAmount(initial ? (initial.amountCents / 100).toFixed(2) : '')
    setDescription(initial?.description ?? '')
    setAccountId(initial?.accountId ?? accounts[0]?.id ?? '')
    setCounterpartyAccountId(initial?.counterpartyAccountId ?? '')
    setDateChoice(initial ? 'custom' : 'tomorrow')
    setCustomDate(initial?.effectiveDate ?? '')
    setRecurrence(initial?.recurrence)
    setEndDateInput(initial?.endDate ?? '')
    setError('')
  }, [
    visible,
    accounts,
    initial,
  ])

  function save() {
    const amountCents = parseAmount(amount)
    const effectiveDate =
      dateChoice === 'tomorrow'
        ? addDaysKey(todayKey, 1)
        : dateChoice === 'week'
          ? addDaysKey(todayKey, 7)
          : customDate.trim()

    if (amountCents === null || amountCents <= 0) {
      setError('Ingresa un importe mayor que cero.')
      return
    }
    if (!accountId || !accounts.some((account) => account.id === accountId)) {
      setError('Selecciona una cuenta.')
      return
    }
    if (type === 'transfer' && (!counterpartyAccountId || counterpartyAccountId === accountId)) {
      setError('Selecciona otra cuenta de destino.')
      return
    }
    if (!isDateKey(effectiveDate) || effectiveDate <= todayKey) {
      setError('Elige una fecha futura válida.')
      return
    }
    if (
      recurrence &&
      endDateInput.trim() &&
      (!isDateKey(endDateInput.trim()) || endDateInput.trim() < effectiveDate)
    ) {
      setError('La fecha de término debe ser igual o posterior al inicio.')
      return
    }

    onSave({
      type,
      amountCents,
      accountId,
      counterpartyAccountId: type === 'transfer' ? counterpartyAccountId : undefined,
      effectiveDate,
      recurrence,
      endDate: recurrence && endDateInput.trim() ? endDateInput.trim() : undefined,
      description: description.trim(),
    })
    onClose()
  }

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={[
        '80%',
        '94%',
      ]}
    >
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: semibold,
              fontSize: 21,
              color: INK,
            }}
          >
            {initial ? 'Editar movimiento' : 'Programar movimiento'}
          </Text>
          <Pressable onPress={onClose} accessibilityRole='button' accessibilityLabel='Cerrar'>
            <Text
              style={{
                fontFamily: regular,
                fontSize: 25,
                color: MUTED,
              }}
            >
              ×
            </Text>
          </Pressable>
        </View>
        <Text
          style={{
            fontFamily: regular,
            fontSize: 13,
            color: MUTED,
            marginTop: 5,
          }}
        >
          Solo se reflejará en la liquidez desde la fecha indicada.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginTop: 26,
          }}
        >
          {movementTypes.map((value) => (
            <Pressable
              key={value}
              onPress={() => setType(value)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 11,
                alignItems: 'center',
                backgroundColor: type === value ? INK : '#f3f3f3',
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
            fontFamily: medium,
            color: MUTED,
            fontSize: 13,
            marginTop: 26,
          }}
        >
          Importe
        </Text>
        <TextInput
          autoFocus
          keyboardType='decimal-pad'
          value={amount}
          onChangeText={(value) => {
            setAmount(value)
            setError('')
          }}
          placeholder='0.00'
          placeholderTextColor='#b9b9b9'
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#e3e3e3',
            paddingVertical: 10,
            color: INK,
            fontFamily: medium,
            fontSize: 34,
          }}
        />

        <Text
          style={{
            fontFamily: medium,
            color: MUTED,
            fontSize: 13,
            marginTop: 25,
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
          {accounts.map((account) => (
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
                fontFamily: medium,
                color: MUTED,
                fontSize: 13,
                marginTop: 25,
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
              {accounts
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

        <Text
          style={{
            fontFamily: medium,
            color: MUTED,
            fontSize: 13,
            marginTop: 25,
          }}
        >
          Fecha
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginTop: 11,
          }}
        >
          {(
            [
              [
                'tomorrow',
                'Mañana',
              ],
              [
                'week',
                'En 7 días',
              ],
              [
                'custom',
                'Otra fecha',
              ],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setDateChoice(value)}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 9,
                backgroundColor: dateChoice === value ? '#e8e8e8' : '#f7f7f7',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: INK,
                  fontSize: 12,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {dateChoice === 'custom' && (
          <TextInput
            value={customDate}
            onChangeText={(value) => {
              setCustomDate(value)
              setError('')
            }}
            placeholder='AAAA-MM-DD'
            placeholderTextColor='#b9b9b9'
            keyboardType='numbers-and-punctuation'
            autoCapitalize='none'
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#e3e3e3',
              marginTop: 12,
              paddingVertical: 10,
              color: INK,
              fontFamily: regular,
              fontSize: 16,
            }}
          />
        )}

        <Text
          style={{
            fontFamily: medium,
            color: MUTED,
            fontSize: 13,
            marginTop: 25,
          }}
        >
          Repetición
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: 10,
          }}
        >
          {(
            [
              [
                undefined,
                'Una vez',
              ],
              [
                'weekly',
                'Semanal',
              ],
              [
                'biweekly',
                'Quincenal',
              ],
              [
                'monthly',
                'Mensual',
              ],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value ?? 'once'}
              onPress={() => setRecurrence(value)}
              style={{
                marginRight: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 9,
                backgroundColor: recurrence === value ? INK : '#f3f3f3',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: recurrence === value ? '#fff' : INK,
                  fontSize: 12,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {recurrence && (
          <TextInput
            value={endDateInput}
            onChangeText={setEndDateInput}
            placeholder='Termina el (AAAA-MM-DD), opcional'
            placeholderTextColor='#b9b9b9'
            keyboardType='numbers-and-punctuation'
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#e3e3e3',
              marginTop: 12,
              paddingVertical: 10,
              color: INK,
              fontFamily: regular,
              fontSize: 14,
            }}
          />
        )}

        <Text
          style={{
            fontFamily: medium,
            color: MUTED,
            fontSize: 13,
            marginTop: 25,
          }}
        >
          Concepto (opcional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder='¿De qué se trata?'
          placeholderTextColor='#b9b9b9'
          maxLength={80}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#e3e3e3',
            paddingVertical: 10,
            color: INK,
            fontFamily: regular,
            fontSize: 16,
          }}
        />

        {!!error && (
          <Text
            style={{
              color: '#c84242',
              fontFamily: regular,
              fontSize: 13,
              marginTop: 14,
            }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={save}
          style={{
            height: 52,
            borderRadius: 12,
            backgroundColor: INK,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 28,
          }}
        >
          <Text
            style={{
              fontFamily: medium,
              color: '#fff',
              fontSize: 15,
            }}
          >
            Guardar movimiento
          </Text>
        </Pressable>
      </View>
    </AppBottomSheet>
  )
}
