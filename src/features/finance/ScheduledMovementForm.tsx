import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { DateField } from '@/components/ui/DateField'
import { addDaysKey, formatShortDateKey, isDateKey } from './dates'
import type { Ledger } from './ledger'
import { formatMoneyInput, parseAmount } from './money'
import { cycleForCardPurchase } from './scheduledCardPurchases'
import type { ScheduledMovement } from './scheduledMovements'

type DraftMovement = Omit<ScheduledMovement, 'id'>

type Props = {
  todayKey: string
  ledger: Ledger
  initial?: ScheduledMovement | null
  onSave: (movement: DraftMovement) => void
}

const INK = '#101010'
const MUTED = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export function ScheduledMovementForm({
  todayKey,
  ledger,
  initial,
  onSave,
}: Props) {
  const { accounts, cards } = ledger
  const [type, setType] = useState<DraftMovement['type']>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [cardId, setCardId] = useState('')
  const [counterpartyAccountId, setCounterpartyAccountId] = useState('')
  const [startDate, setStartDate] = useState(addDaysKey(todayKey, 1))
  const [recurrence, setRecurrence] = useState<DraftMovement['recurrence']>(undefined)
  const [endDateInput, setEndDateInput] = useState('')
  const [error, setError] = useState('')
  const firstCardCycle = type === 'expense' && cardId
    ? cycleForCardPurchase(ledger, cardId, startDate)
    : undefined
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Initialize a new draft only when switching movements, preserving edits during ledger refreshes.
  useEffect(() => {
    setType(initial?.type ?? 'expense')
    setAmount(initial ? formatMoneyInput((initial.amountCents / 100).toFixed(2)) : '')
    setDescription(initial?.description ?? '')
    setAccountId(initial?.accountId ?? accounts[0]?.id ?? '')
    setCardId(initial?.cardId ?? '')
    setCounterpartyAccountId(initial?.counterpartyAccountId ?? '')
    setStartDate(initial?.effectiveDate ?? addDaysKey(todayKey, 1))
    setRecurrence(initial?.recurrence)
    setEndDateInput(initial?.endDate ?? '')
    setError('')
  }, [
    initial?.id,
  ])

  useEffect(() => {
    setAccountId((current) => current && accounts.some((account) => account.id === current)
      ? current : accounts[0]?.id ?? '')
  }, [accounts])

  function save() {
    const amountCents = parseAmount(amount)
    const effectiveDate = startDate

    if (amountCents === null || amountCents <= 0) {
      setError('Ingresa un importe mayor que cero.')
      return
    }
    if (!cardId && (!accountId || !accounts.some((account) => account.id === accountId))) {
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
    if (type === 'expense' && cardId) {
      const card = cards.find((item) => item.id === cardId)
      if (!card || !cycleForCardPurchase(ledger, cardId, effectiveDate) ||
        (recurrence && !card.billingRule)) {
        setError('La tarjeta necesita ciclos de pago para programar esta compra.')
        return
      }
    }
    if (
      recurrence &&
      endDateInput.trim() &&
      (!isDateKey(endDateInput.trim()) || endDateInput.trim() < effectiveDate)
    ) {
      setError('La fecha de término debe ser igual o posterior al inicio.')
      return
    }

    try {
      onSave({
        type,
        amountCents,
        accountId: type === 'expense' && cardId ? undefined : accountId,
        cardId: type === 'expense' && cardId ? cardId : undefined,
        counterpartyAccountId: type === 'transfer' ? counterpartyAccountId : undefined,
        effectiveDate,
        recurrence,
        endDate: recurrence && endDateInput.trim() ? endDateInput.trim() : undefined,
        description: description.trim(),
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el movimiento.')
    }
  }

  return (
    <View>
      <View>
        <View>
          <Text
            style={{
              fontFamily: semibold,
              fontSize: 21,
              color: INK,
            }}
          >
            {initial ? 'Editar movimiento' : 'Programar movimiento'}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: regular,
            fontSize: 13,
            color: MUTED,
            marginTop: 5,
          }}
        >
          {type === 'expense' && cardId
            ? 'La compra aumentará la deuda; la liquidez bajará en la fecha límite de pago.'
            : 'Solo se reflejará en la liquidez desde la fecha indicada.'}
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
              onPress={() => {
                setType(value)
                if (value !== 'expense') setCardId('')
              }}
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
          keyboardType='decimal-pad'
          value={amount}
          onChangeText={(value) => {
            setAmount(formatMoneyInput(value))
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
          {type === 'expense' ? 'Medio de pago' : 'Cuenta'}
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
              onPress={() => {
                setAccountId(account.id)
                setCardId('')
              }}
              style={{
                marginRight: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 9,
                backgroundColor: !cardId && accountId === account.id ? INK : '#f3f3f3',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: !cardId && accountId === account.id ? '#fff' : INK,
                }}
              >
                {account.name}
              </Text>
            </Pressable>
          ))}
          {type === 'expense' && cards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => setCardId(card.id)}
              accessibilityRole='button'
              accessibilityLabel={`Tarjeta de crédito ${card.name}`}
              style={{
                marginRight: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 9,
                backgroundColor: cardId === card.id ? INK : '#f3f3f3',
              }}
            >
              <Text style={{ fontFamily: medium, color: cardId === card.id ? '#fff' : INK }}>
                TC · {card.name}
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
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <DateField
            label='Fecha de inicio'
            value={startDate}
            onChange={(value) => {
              setStartDate(value)
              setError('')
            }}
            minimumDate={addDaysKey(todayKey, 1)}
            compact
            style={{
              flex: 1,
            }}
          />
          {recurrence && (
            <DateField
              label='Fecha de término'
              value={endDateInput}
              onChange={setEndDateInput}
              minimumDate={startDate}
              placeholder='Opcional'
              clearable
              compact
              style={{
                flex: 1,
              }}
            />
          )}
        </View>
        {firstCardCycle && (
          <Text style={{ fontFamily: regular, color: MUTED, fontSize: 12, marginTop: 10 }}>
            {recurrence ? 'Primer pago previsto' : 'Pago previsto'}: {' '}
            {formatShortDateKey(firstCardCycle.dueDate)}
          </Text>
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
    </View>
  )
}
