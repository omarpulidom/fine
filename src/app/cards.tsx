import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { isDateKey, localDateKey } from '@/features/finance/dates'
import { allocateInstallments } from '@/features/finance/installments'
import {
  addCardActivity,
  type CardActivity,
  createBillingCycle,
  createCreditCard,
  deleteCardActivity,
  getLedger,
  newCardActivityId,
  newCardId,
  newCycleId,
  reassignInstallmentPurchase,
  reassignPurchase,
  scheduleCyclePayment,
  statementAmountCents,
  updateCreditCardSettings,
} from '@/features/finance/ledger'
import { formatMoney, formatMoneyInput, parseAmount } from '@/features/finance/money'

const INK = '#101010'
const MUTED = '#888'
const BACKGROUND = '#f6f6f6'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'
type FormMode = 'card' | 'settings' | 'cycle' | 'purchase' | 'payment' | 'plan' | 'reassign' | null

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: medium,
        fontSize: 13,
        color: MUTED,
        marginTop: 19,
      }}
    >
      {children}
    </Text>
  )
}

function Field({
  value,
  onChangeText,
  placeholder,
  decimal = false,
}: {
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  decimal?: boolean
}) {
  return (
    <TextInput
      value={value}
      onChangeText={(value) => onChangeText(decimal ? formatMoneyInput(value) : value)}
      placeholder={placeholder}
      placeholderTextColor='#bbb'
      keyboardType={decimal ? 'decimal-pad' : 'default'}
      autoCapitalize='none'
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 10,
        fontFamily: regular,
        fontSize: 16,
        color: INK,
      }}
    />
  )
}

export default function CardsScreen() {
  const router = useRouter()
  const [ledger, setLedger] = useState(getLedger)
  useFocusEffect(
    useCallback(() => {
      setLedger(getLedger())
    }, []),
  )
  const [mode, setMode] = useState<FormMode>(null)
  const [selectedCardId, setSelectedCardId] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<CardActivity | null>(null)
  const [name, setName] = useState('')
  const [cutoffDay, setCutoffDay] = useState('')
  const [cutoffDate, setCutoffDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [debt, setDebt] = useState('')
  const [billed, setBilled] = useState('')
  const [amount, setAmount] = useState('')
  const [isInstallment, setIsInstallment] = useState(false)
  const [installmentMonths, setInstallmentMonths] = useState('3')
  const [activityDate, setActivityDate] = useState(localDateKey(new Date()))
  const [description, setDescription] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [paymentToAvoidInterest, setPaymentToAvoidInterest] = useState('')
  const [minimumPayment, setMinimumPayment] = useState('')
  const [error, setError] = useState('')
  const todayKey = localDateKey(new Date())
  const selectedCard = ledger.cards.find((card) => card.id === selectedCardId)
  const selectedCycle = ledger.cycles.find((cycle) => cycle.id === selectedCycleId)
  const cycles = ledger.cycles
    .filter((cycle) => cycle.cardId === selectedCardId)
    .sort((a, b) => b.cutoffDate.localeCompare(a.cutoffDate))

  function open(
    nextMode: FormMode,
    cardId = '',
    cycleId = '',
    activity: CardActivity | null = null,
  ) {
    setMode(nextMode)
    setSelectedCardId(cardId)
    setSelectedCycleId(cycleId)
    setSelectedActivity(activity)
    setName('')
    setCutoffDay('')
    setCutoffDate('')
    setDueDate('')
    setDebt('')
    setBilled('')
    setAmount('')
    setIsInstallment(Boolean(activity?.installments))
    setInstallmentMonths(activity?.installments ? String(activity.installments.length) : '3')
    setActivityDate(todayKey)
    setDescription('')
    setScheduledDate(
      ledger.cycles.find((cycle) => cycle.id === cycleId)?.scheduledDate ??
        ledger.cycles.find((cycle) => cycle.id === cycleId)?.dueDate ??
        '',
    )
    setPaymentToAvoidInterest('')
    setMinimumPayment('')
    setSourceAccountId(
      ledger.cards.find((card) => card.id === cardId)?.paymentSourceAccountId ??
        ledger.accounts[0]?.id ??
        '',
    )
    setError('')
    if (nextMode === 'settings') {
      const card = ledger.cards.find((item) => item.id === cardId)
      setName(card?.name ?? '')
      setCutoffDay(card ? String(card.cutoffDay) : '')
    }
    if (nextMode === 'plan') {
      const cycle = ledger.cycles.find((item) => item.id === cycleId)
      setAmount(
        cycle?.scheduledAmountCents
          ? formatMoneyInput((cycle.scheduledAmountCents / 100).toFixed(2))
          : '',
      )
      setDueDate(cycle?.dueDate ?? '')
      setPaymentToAvoidInterest(
        cycle?.paymentToAvoidInterestCents === undefined
          ? ''
          : formatMoneyInput((cycle.paymentToAvoidInterestCents / 100).toFixed(2)),
      )
      setMinimumPayment(
        cycle?.minimumPaymentCents === undefined
          ? ''
          : formatMoneyInput((cycle.minimumPaymentCents / 100).toFixed(2)),
      )
    }
  }

  function save() {
    try {
      if (mode === 'card') {
        const debtCents = parseAmount(debt)
        const billedCents = parseAmount(billed)
        const day = Number(cutoffDay)
        if (
          !name.trim() ||
          !Number.isInteger(day) ||
          day < 1 ||
          day > 31 ||
          debtCents === null ||
          billedCents === null ||
          billedCents > debtCents ||
          !sourceAccountId ||
          (billedCents > 0 && (!isDateKey(cutoffDate) || !isDateKey(dueDate)))
        ) {
          throw new Error('Revisa nombre, corte, deuda, saldo facturado y fechas.')
        }
        const id = newCardId()
        setLedger(
          createCreditCard(
            {
              id,
              name: name.trim(),
              cutoffDay: day,
              currentDebtCents: debtCents,
              unbilledOpeningCents: debtCents - billedCents,
              paymentSourceAccountId: sourceAccountId,
              createdDate: todayKey,
            },
            billedCents > 0
              ? {
                  id: newCycleId(),
                  cardId: id,
                  cutoffDate,
                  dueDate,
                  openingStatementCents: billedCents,
                  scheduledAmountCents: 0,
                  paidAmountCents: 0,
                }
              : null,
          ),
        )
      } else if (mode === 'settings') {
        if (!selectedCard) throw new Error('Selecciona una tarjeta.')
        setLedger(
          updateCreditCardSettings(selectedCard.id, name, Number(cutoffDay), sourceAccountId),
        )
      } else if (mode === 'cycle') {
        if (!selectedCard || !isDateKey(cutoffDate) || !isDateKey(dueDate))
          throw new Error('Ingresa fechas válidas.')
        const openingCents = billed.trim() ? parseAmount(billed) : 0
        if (openingCents === null) throw new Error('Saldo previo inválido.')
        setLedger(
          createBillingCycle({
            id: newCycleId(),
            cardId: selectedCard.id,
            cutoffDate,
            dueDate,
            openingStatementCents: openingCents,
            scheduledAmountCents: 0,
            paidAmountCents: 0,
          }),
        )
      } else if (mode === 'purchase' || mode === 'payment') {
        const cents = parseAmount(amount)
        if (
          !selectedCard ||
          !selectedCycle ||
          cents === null ||
          cents <= 0 ||
          !isDateKey(activityDate) ||
          activityDate > todayKey
        )
          throw new Error('Revisa ciclo, importe y fecha.')
        setLedger(
          addCardActivity(
            {
              id: newCardActivityId(),
              type: mode,
              cardId: selectedCard.id,
              cycleId: selectedCycle.id,
              sourceAccountId: mode === 'payment' ? sourceAccountId : undefined,
              amountCents: cents,
              effectiveDate: activityDate,
              description: description.trim(),
              installments:
                mode === 'purchase' && isInstallment
                  ? allocateInstallments(
                      ledger.cycles,
                      selectedCard.id,
                      selectedCycle.id,
                      Number(installmentMonths),
                      cents,
                    )
                  : undefined,
            },
            todayKey,
          ),
        )
      } else if (mode === 'plan') {
        const cents = amount.trim() ? parseAmount(amount) : 0
        const ppngi = paymentToAvoidInterest.trim()
          ? parseAmount(paymentToAvoidInterest)
          : undefined
        const minimum = minimumPayment.trim() ? parseAmount(minimumPayment) : undefined
        if (
          !selectedCycle ||
          cents === null ||
          (cents > 0 && (!isDateKey(scheduledDate) || scheduledDate <= todayKey))
        ) {
          throw new Error('Ingresa un importe y una fecha futura válidos.')
        }
        if (ppngi === null || minimum === null) throw new Error('Importes informativos inválidos.')
        setLedger(
          scheduleCyclePayment(
            selectedCycle.id,
            cents > 0 ? scheduledDate : undefined,
            cents,
            dueDate,
            {
              paymentToAvoidInterestCents: ppngi,
              minimumPaymentCents: minimum,
            },
          ),
        )
      } else if (mode === 'reassign') {
        if (!selectedActivity || !selectedCycleId) throw new Error('Selecciona un ciclo.')
        setLedger(
          selectedActivity.installments
            ? reassignInstallmentPurchase(
                selectedActivity.id,
                selectedCycleId,
                Number(installmentMonths),
              )
            : reassignPurchase(selectedActivity.id, selectedCycleId),
        )
      }
      setMode(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar.')
    }
  }

  function removeActivity(activity: CardActivity) {
    Alert.alert('Eliminar registro', 'Se revertirá su efecto en deuda y saldo.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          try {
            setLedger(deleteCardActivity(activity.id))
          } catch (caught) {
            Alert.alert('No se pudo eliminar', caught instanceof Error ? caught.message : '')
          }
        },
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
          paddingBottom: 42,
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
            Tarjetas
          </Text>
        </View>
        <Text
          style={{
            marginTop: 58,
            fontFamily: semibold,
            fontSize: 31,
            letterSpacing: -1,
            color: INK,
          }}
        >
          Tarjetas de crédito
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
          Las compras aumentan la deuda. La liquidez cambia al registrar o programar un pago.
        </Text>
        <Text
          style={{
            marginTop: 6,
            fontFamily: regular,
            fontSize: 12,
            lineHeight: 18,
            color: MUTED,
          }}
        >
          Registra solo compras nuevas que no estén incluidas en la deuda inicial.
        </Text>
        <Pressable
          onPress={() => (ledger.accounts.length ? open('card') : router.push('/accounts'))}
          style={{
            marginTop: 24,
            height: 52,
            backgroundColor: INK,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
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
            {ledger.accounts.length ? 'Añadir tarjeta' : 'Añadir cuenta bancaria primero'}
          </Text>
        </Pressable>
        {ledger.cards.map((card) => {
          const cardCycles = ledger.cycles
            .filter((cycle) => cycle.cardId === card.id)
            .sort((a, b) => b.cutoffDate.localeCompare(a.cutoffDate))
          const activity = ledger.cardActivity
            .filter((item) => item.cardId === card.id)
            .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
          return (
            <View
              key={card.id}
              style={{
                marginTop: 24,
              }}
            >
              <View
                style={{
                  padding: 18,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: semibold,
                    fontSize: 17,
                    color: INK,
                  }}
                >
                  {card.name}
                </Text>
                <Text
                  style={{
                    fontFamily: regular,
                    fontSize: 13,
                    color: MUTED,
                    marginTop: 5,
                  }}
                >
                  Deuda actual · Corte día {card.cutoffDay}
                </Text>
                <Text
                  style={{
                    fontFamily: semibold,
                    fontSize: 24,
                    color: INK,
                    marginTop: 12,
                  }}
                >
                  {formatMoney(card.currentDebtCents)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 14,
                    marginTop: 18,
                  }}
                >
                  <Pressable onPress={() => open('settings', card.id)}>
                    <Text
                      style={{
                        fontFamily: medium,
                        color: INK,
                        fontSize: 13,
                      }}
                    >
                      Editar
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => open('cycle', card.id)}>
                    <Text
                      style={{
                        fontFamily: medium,
                        color: INK,
                        fontSize: 13,
                      }}
                    >
                      + Ciclo
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => cardCycles.length && open('purchase', card.id, cardCycles[0].id)}
                  >
                    <Text
                      style={{
                        fontFamily: medium,
                        color: cardCycles.length ? INK : MUTED,
                        fontSize: 13,
                      }}
                    >
                      + Compra
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => cardCycles.length && open('payment', card.id, cardCycles[0].id)}
                  >
                    <Text
                      style={{
                        fontFamily: medium,
                        color: cardCycles.length ? INK : MUTED,
                        fontSize: 13,
                      }}
                    >
                      + Pago
                    </Text>
                  </Pressable>
                </View>
              </View>
              {cardCycles.map((cycle) => {
                const statement = statementAmountCents(ledger, cycle.id)
                const pending = Math.max(0, cycle.scheduledAmountCents - cycle.paidAmountCents)
                const installmentShares = activity.flatMap(
                  (item) =>
                    item.installments
                      ?.filter((part) => part.cycleId === cycle.id)
                      .map((part) => ({
                        id: item.id,
                        label: item.description || 'Compra a MSI',
                        amountCents: part.amountCents,
                      })) ?? [],
                )
                return (
                  <Pressable
                    key={cycle.id}
                    onPress={() => open('plan', card.id, cycle.id)}
                    style={{
                      marginTop: 8,
                      padding: 16,
                      backgroundColor: '#fff',
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: medium,
                        color: INK,
                        fontSize: 14,
                      }}
                    >
                      Corte {cycle.cutoffDate}
                    </Text>
                    <Text
                      style={{
                        fontFamily: regular,
                        color: MUTED,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Vence {cycle.dueDate} ·{' '}
                      {cycle.cutoffDate > todayKey ? 'Importe del ciclo' : 'Facturado'}{' '}
                      {formatMoney(statement)} · Pagado {formatMoney(cycle.paidAmountCents)}
                    </Text>
                    {installmentShares.map((share) => (
                      <Text
                        key={share.id}
                        style={{
                          fontFamily: regular,
                          color: MUTED,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        MSI · {share.label} · {formatMoney(share.amountCents)}
                      </Text>
                    ))}
                    {(cycle.paymentToAvoidInterestCents !== undefined ||
                      cycle.minimumPaymentCents !== undefined) && (
                      <Text
                        style={{
                          fontFamily: regular,
                          color: MUTED,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {cycle.paymentToAvoidInterestCents !== undefined
                          ? `PPNGI ${formatMoney(cycle.paymentToAvoidInterestCents)} `
                          : ''}
                        {cycle.minimumPaymentCents !== undefined
                          ? `Mínimo ${formatMoney(cycle.minimumPaymentCents)}`
                          : ''}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontFamily: medium,
                        color: pending ? INK : MUTED,
                        fontSize: 12,
                        marginTop: 7,
                      }}
                    >
                      {pending
                        ? `Pago previsto ${formatMoney(pending)} · ${cycle.scheduledDate}`
                        : 'Toca para programar un pago'}
                    </Text>
                  </Pressable>
                )
              })}
              {activity.map((item) => (
                <View
                  key={item.id}
                  style={{
                    marginTop: 8,
                    padding: 16,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Pressable
                    onPress={() =>
                      item.type === 'purchase' && open('reassign', card.id, item.cycleId, item)
                    }
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: medium,
                        color: INK,
                        fontSize: 14,
                      }}
                    >
                      {item.description || (item.type === 'purchase' ? 'Compra' : 'Pago realizado')}
                    </Text>
                    <Text
                      style={{
                        fontFamily: regular,
                        color: MUTED,
                        fontSize: 12,
                        marginTop: 3,
                      }}
                    >
                      {item.effectiveDate} ·{' '}
                      {item.installments
                        ? `${item.installments.length} MSI · Cambiar plan`
                        : item.type === 'purchase'
                          ? 'Cambiar ciclo'
                          : 'Pago'}
                    </Text>
                  </Pressable>
                  <Text
                    style={{
                      fontFamily: medium,
                      color: INK,
                      fontSize: 13,
                      marginRight: 12,
                    }}
                  >
                    {formatMoney(item.amountCents)}
                  </Text>
                  <Pressable
                    onPress={() => removeActivity(item)}
                    hitSlop={10}
                    accessibilityLabel='Eliminar registro'
                  >
                    <Feather name='trash-2' size={16} color={MUTED} />
                  </Pressable>
                </View>
              ))}
            </View>
          )
        })}
      </ScrollView>
      <AppBottomSheet
        visible={mode !== null}
        onClose={() => setMode(null)}
        snapPoints={[
          '84%',
          '94%',
        ]}
      >
        <View>
          <Text
            style={{
              fontFamily: semibold,
              fontSize: 21,
              color: INK,
            }}
          >
            {mode === 'card'
              ? 'Nueva tarjeta'
              : mode === 'settings'
                ? 'Editar tarjeta'
                : mode === 'cycle'
                  ? 'Nuevo ciclo'
                  : mode === 'purchase'
                    ? 'Compra con tarjeta'
                    : mode === 'payment'
                      ? 'Pago realizado'
                      : mode === 'plan'
                        ? 'Programar pago'
                        : 'Cambiar ciclo'}
          </Text>
          {mode === 'card' && (
            <>
              <Label>Nombre</Label>
              <Field value={name} onChangeText={setName} placeholder='Ej. Tarjeta principal' />
              <Label>Día de corte (1–31)</Label>
              <Field value={cutoffDay} onChangeText={setCutoffDay} placeholder='12' />
              <Label>Deuda actual</Label>
              <Field value={debt} onChangeText={setDebt} placeholder='0.00' decimal />
              <Label>Saldo facturado pendiente</Label>
              <Field value={billed} onChangeText={setBilled} placeholder='0.00' decimal />
              <Text
                style={{
                  marginTop: 6,
                  color: MUTED,
                  fontFamily: regular,
                  fontSize: 12,
                }}
              >
                La diferencia es deuda aún no facturada.
              </Text>
              <Label>Último corte (AAAA-MM-DD), si hay saldo facturado</Label>
              <Field value={cutoffDate} onChangeText={setCutoffDate} placeholder='AAAA-MM-DD' />
              <Label>Fecha límite (AAAA-MM-DD)</Label>
              <Field value={dueDate} onChangeText={setDueDate} placeholder='AAAA-MM-DD' />
            </>
          )}
          {mode === 'settings' && (
            <>
              <Label>Nombre</Label>
              <Field value={name} onChangeText={setName} placeholder='Nombre de tarjeta' />
              <Label>Día habitual de corte</Label>
              <Field value={cutoffDay} onChangeText={setCutoffDay} placeholder='12' />
            </>
          )}
          {mode === 'cycle' && (
            <>
              <Label>Fecha de corte (AAAA-MM-DD)</Label>
              <Field value={cutoffDate} onChangeText={setCutoffDate} placeholder='AAAA-MM-DD' />
              <Label>Fecha límite de pago (AAAA-MM-DD)</Label>
              <Field value={dueDate} onChangeText={setDueDate} placeholder='AAAA-MM-DD' />
              <Label>Deuda previa que se factura en este ciclo (opcional)</Label>
              <Field value={billed} onChangeText={setBilled} placeholder='0.00' decimal />
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: regular,
                  color: MUTED,
                  fontSize: 12,
                }}
              >
                Pendiente de asignar: {formatMoney(selectedCard?.unbilledOpeningCents ?? 0)}
              </Text>
            </>
          )}
          {(mode === 'card' || mode === 'settings' || mode === 'payment') && (
            <>
              <Label>Cuenta para pagar</Label>
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
                    onPress={() => setSourceAccountId(account.id)}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 9,
                      backgroundColor: sourceAccountId === account.id ? INK : '#f3f3f3',
                    }}
                  >
                    <Text
                      style={{
                        color: sourceAccountId === account.id ? '#fff' : INK,
                        fontFamily: medium,
                      }}
                    >
                      {account.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          {(mode === 'purchase' || mode === 'payment' || mode === 'reassign') && (
            <>
              <Label>Ciclo de facturación</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  marginTop: 10,
                }}
              >
                {cycles.map((cycle) => (
                  <Pressable
                    key={cycle.id}
                    onPress={() => setSelectedCycleId(cycle.id)}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 9,
                      backgroundColor: selectedCycleId === cycle.id ? INK : '#f3f3f3',
                    }}
                  >
                    <Text
                      style={{
                        color: selectedCycleId === cycle.id ? '#fff' : INK,
                        fontFamily: medium,
                      }}
                    >
                      {cycle.cutoffDate}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
          {(mode === 'purchase' || mode === 'payment') && (
            <>
              <Label>Importe</Label>
              <Field value={amount} onChangeText={setAmount} placeholder='0.00' decimal />
              {mode === 'purchase' && (
                <>
                  <Label>Modalidad</Label>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    {(
                      [
                        [
                          false,
                          'Una exhibición',
                        ],
                        [
                          true,
                          'Meses sin intereses',
                        ],
                      ] as const
                    ).map(([value, label]) => (
                      <Pressable
                        key={label}
                        onPress={() => setIsInstallment(value)}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 9,
                          backgroundColor: isInstallment === value ? INK : '#f3f3f3',
                        }}
                      >
                        <Text
                          style={{
                            color: isInstallment === value ? '#fff' : INK,
                            fontFamily: medium,
                            fontSize: 12,
                          }}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              <Label>Fecha realizada (AAAA-MM-DD)</Label>
              <Field value={activityDate} onChangeText={setActivityDate} placeholder='AAAA-MM-DD' />
              <Label>Concepto (opcional)</Label>
              <Field
                value={description}
                onChangeText={setDescription}
                placeholder='¿De qué se trata?'
              />
            </>
          )}
          {((mode === 'purchase' && isInstallment) ||
            (mode === 'reassign' && selectedActivity?.installments)) && (
            <>
              <Label>Número de mensualidades (2–36)</Label>
              <Field
                value={installmentMonths}
                onChangeText={setInstallmentMonths}
                placeholder='3'
              />
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: regular,
                  color: MUTED,
                  fontSize: 12,
                }}
              >
                Elige arriba el primer ciclo. Deben existir todos los ciclos mensuales consecutivos.
              </Text>
            </>
          )}
          {mode === 'plan' && (
            <>
              <Text
                style={{
                  marginTop: 10,
                  fontFamily: regular,
                  color: MUTED,
                  fontSize: 13,
                }}
              >
                {selectedCycle && selectedCycle.cutoffDate > todayKey
                  ? 'Importe del ciclo'
                  : 'Facturado'}{' '}
                {formatMoney(statementAmountCents(ledger, selectedCycleId))} · Ya pagado{' '}
                {formatMoney(selectedCycle?.paidAmountCents ?? 0)}
              </Text>
              <Label>Fecha límite confirmada (AAAA-MM-DD)</Label>
              <Field value={dueDate} onChangeText={setDueDate} placeholder='AAAA-MM-DD' />
              <Label>Monto total previsto (0 para quitar)</Label>
              <Field value={amount} onChangeText={setAmount} placeholder='0.00' decimal />
              <Label>Fecha prevista (AAAA-MM-DD)</Label>
              <Field
                value={scheduledDate}
                onChangeText={setScheduledDate}
                placeholder='AAAA-MM-DD'
              />
              <Label>Pago para no generar intereses (informativo)</Label>
              <Field
                value={paymentToAvoidInterest}
                onChangeText={setPaymentToAvoidInterest}
                placeholder='Opcional'
                decimal
              />
              <Label>Pago mínimo (informativo)</Label>
              <Field
                value={minimumPayment}
                onChangeText={setMinimumPayment}
                placeholder='Opcional'
                decimal
              />
            </>
          )}
          {!!error && (
            <Text
              style={{
                marginTop: 14,
                color: '#c84242',
                fontFamily: regular,
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
              onPress={() => setMode(null)}
              style={{
                flex: 1,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
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
                borderRadius: 12,
                backgroundColor: INK,
                justifyContent: 'center',
                alignItems: 'center',
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
