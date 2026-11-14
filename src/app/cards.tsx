import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSharedValue } from 'react-native-reanimated'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { DateField } from '@/components/ui/DateField'
import { InstrumentCardCarousel } from '@/components/finance/InstrumentCardCarousel'
import { InstrumentDetailHeader } from '@/components/finance/InstrumentDetailHeader'
import { InstrumentDetailMorph } from '@/components/finance/InstrumentDetailMorph'
import { useInstrumentDetailTransition } from '@/components/finance/InstrumentDetailTransition'
import { cutoffForMonth, previousCutoffMonth } from '@/features/finance/billingCalendar'
import { type CardDesignId, cardDesigns, getCardDesign } from '@/features/finance/cardDesigns'
import { addDaysKey, addMonthsKey, formatShortDateKey, isDateKey, localDateKey } from '@/features/finance/dates'
import { allocateInstallments } from '@/features/finance/installments'
import {
  addCardActivity,
  activateAutomaticBilling,
  type BillingCycle,
  type CardActivity,
  confirmCycleStatement,
  createBillingCycle,
  createCreditCard,
  deleteCardActivity,
  deleteCreditCard,
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

function comparePaymentCycles(left: BillingCycle, right: BillingCycle, todayKey: string): number {
  const leftUpcoming = left.dueDate >= todayKey
  const rightUpcoming = right.dueDate >= todayKey
  if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1
  return leftUpcoming
    ? left.dueDate.localeCompare(right.dueDate)
    : right.dueDate.localeCompare(left.dueDate)
}

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

function CutoffDayInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <View style={{ width: 105, marginTop: 20 }}>
      <Text style={{ fontFamily: medium, fontSize: 13, color: MUTED }}>Día de corte</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 2))}
        placeholder='Ej. 12'
        placeholderTextColor='#bbb'
        keyboardType='number-pad'
        maxLength={2}
        accessibilityLabel='Día de corte, del 1 al 31'
        style={{ borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10,
          fontFamily: regular, fontSize: 16, color: INK }}
      />
    </View>
  )
}

export default function CardsScreen() {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const designPageWidth = screenWidth - 48
  const { cardId: focusedCardId, create, swipe, fromList } = useLocalSearchParams<{
    cardId?: string
    create?: string
    swipe?: string
    fromList?: string
  }>()
  const { hasListOrigin, closeToList } = useInstrumentDetailTransition()
  const [ledger, setLedger] = useState(getLedger)
  useFocusEffect(
    useCallback(() => {
      setLedger(getLedger())
    }, []),
  )
  const [mode, setMode] = useState<FormMode>(
    create === '1' && ledger.accounts.length ? 'card' : null,
  )
  const [cardStep, setCardStep] = useState<'details' | 'design'>('details')
  const [selectedDesignId, setSelectedDesignId] = useState<CardDesignId | null>(null)
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
  const [sourceAccountId, setSourceAccountId] = useState(
    create === '1' ? (ledger.accounts[0]?.id ?? '') : '',
  )
  const [scheduledDate, setScheduledDate] = useState('')
  const [useAutomaticPayment, setUseAutomaticPayment] = useState(false)
  const [showCyclePicker, setShowCyclePicker] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [error, setError] = useState('')
  const progress = useSharedValue(ledger.accounts.length + Math.max(0,
    ledger.cards.findIndex((card) => card.id === focusedCardId)))
  const todayKey = localDateKey(new Date())
  const selectedCard = ledger.cards.find((card) => card.id === selectedCardId)
  const selectedCycle = ledger.cycles.find((cycle) => cycle.id === selectedCycleId)
  const cycles = ledger.cycles
    .filter((cycle) => cycle.cardId === selectedCardId)
    .sort((a, b) => b.cutoffDate.localeCompare(a.cutoffDate))
  const paymentChoices = cycles
    .filter((cycle) => statementAmountCents(ledger, cycle.id) > cycle.paidAmountCents)
    .sort((a, b) => comparePaymentCycles(a, b, todayKey))
  const visibleCards = ledger.cards.filter((card) => card.id === focusedCardId)

  function closeDetail() {
    const card = visibleCards[0]
    if (card && hasListOrigin && closeToList({
      instrument: { kind: 'card', id: card.id },
      name: card.name,
      image: getCardDesign(card.cardDesignId)?.image,
      navigate: () => router.back(),
    })) return
    if (focusedCardId || create === '1') router.back()
    else router.replace('/accounts-and-cards')
  }

  function open(
    nextMode: FormMode,
    cardId = '',
    cycleId = '',
    activity: CardActivity | null = null,
  ) {
    setMode(nextMode)
    setCardStep('details')
    setSelectedDesignId(null)
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
    setUseAutomaticPayment(false)
    setShowCyclePicker(false)
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
      setDueDate(card?.billingRule?.anchorDueDate ?? '')
    }
    if (nextMode === 'plan') {
      const cycle = ledger.cycles.find((item) => item.id === cycleId)
      setBilled(cycle?.openingStatementCents
        ? formatMoneyInput((cycle.openingStatementCents / 100).toFixed(2))
        : '')
      setAmount(
        cycle?.paymentMode === 'automatic'
          ? formatMoneyInput((statementAmountCents(ledger, cycleId) / 100).toFixed(2))
          : cycle?.scheduledAmountCents
          ? formatMoneyInput((cycle.scheduledAmountCents / 100).toFixed(2))
          : '',
      )
      setUseAutomaticPayment(cycle?.paymentMode === 'automatic')
      setDueDate(cycle?.dueDate ?? '')
    }
  }

  function readCardDetails() {
    const debtCents = debt.trim() ? parseAmount(debt) : 0
    const billedCents = billed.trim() ? parseAmount(billed) : 0
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
      !isDateKey(dueDate) || dueDate <= todayKey
    ) {
      throw new Error('Revisa nombre, corte, deuda, próximo pago y fecha límite futura.')
    }
    return {
      day,
      debtCents,
      billedCents,
    }
  }

  function nextCardStep() {
    try {
      readCardDetails()
      Keyboard.dismiss()
      setError('')
      setCardStep('design')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Revisa los datos de la tarjeta.')
    }
  }

  function save() {
    try {
      if (mode === 'card') {
        const { debtCents, billedCents, day } = readCardDetails()
        if (!selectedDesignId) throw new Error('Selecciona un banco o «Otro banco».')
        const id = newCardId()
        let cutoffMonth = previousCutoffMonth(dueDate, day)
        if (billedCents > 0) {
          while (cutoffForMonth(cutoffMonth, day) > todayKey) {
            cutoffMonth = addMonthsKey(`${cutoffMonth}-01`, -1).slice(0, 7)
          }
        }
        const initialCutoff = cutoffForMonth(cutoffMonth, day)
        setLedger(
          createCreditCard(
            {
              id,
              name: name.trim(),
              cardDesignId: selectedDesignId,
              cutoffDay: day,
              currentDebtCents: debtCents,
              unbilledOpeningCents: debtCents - billedCents,
              paymentSourceAccountId: sourceAccountId,
              createdDate: todayKey,
              billingRule: { anchorCutoffMonth: cutoffMonth, anchorDueDate: dueDate },
            },
              {
                  id: newCycleId(),
                  cardId: id,
                  cutoffDate: initialCutoff,
                  dueDate,
                  openingStatementCents: billedCents,
                  scheduledAmountCents: 0,
                  paidAmountCents: 0,
                  automatic: true,
                  paymentMode: 'automatic',
                  dueDateConfirmed: true,
                },
          ),
        )
        router.replace({ pathname: '/cards', params: { cardId: id } })
      } else if (mode === 'settings') {
        if (!selectedCard) throw new Error('Selecciona una tarjeta.')
        if (!selectedCard.billingRule && (!isDateKey(dueDate) || dueDate <= todayKey)) {
          throw new Error('Confirma la próxima fecha límite de pago.')
        }
        updateCreditCardSettings(selectedCard.id, name, Number(cutoffDay), sourceAccountId)
        setLedger(!selectedCard.billingRule && dueDate
          ? activateAutomaticBilling(selectedCard.id, dueDate)
          : getLedger())
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
        if (
          !selectedCycle ||
          cents === null ||
          (!useAutomaticPayment && cents > 0 && (!isDateKey(scheduledDate) || scheduledDate <= todayKey))
        ) {
          throw new Error('Ingresa un importe y una fecha futura válidos.')
        }
        if (selectedCycle.automatic) {
          const openingCents = billed.trim() ? parseAmount(billed) : 0
          if (openingCents === null) throw new Error('Saldo pendiente inválido.')
          const nextStatement = statementAmountCents(ledger, selectedCycle.id)
            - selectedCycle.openingStatementCents + openingCents
          if (dueDate <= selectedCycle.cutoffDate ||
              (!useAutomaticPayment && cents > nextStatement)) {
            throw new Error('Revisa el saldo y la fecha de este corte.')
          }
          confirmCycleStatement(selectedCycle.id, openingCents, dueDate)
        }
        if (useAutomaticPayment) {
          setLedger(getLedger())
        } else {
          setLedger(scheduleCyclePayment(selectedCycle.id,
            cents > 0 ? scheduledDate : undefined,
            cents,
            dueDate,
          ))
        }
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

  function confirmDeleteCard(cardId: string, cardName: string) {
    Alert.alert(
      'Eliminar tarjeta',
      `Se eliminará «${cardName}», su deuda y sus ciclos. Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              setLedger(deleteCreditCard(cardId))
              setSelectedCardId('')
              setSelectedCycleId('')
              router.replace('/accounts-and-cards')
            } catch (caught) {
              Alert.alert(
                'No se puede eliminar',
                caught instanceof Error ? caught.message : 'Inténtalo de nuevo.',
              )
            }
          },
        },
      ],
    )
  }

  return (
    <>
    <Stack.Screen options={{ animation: swipe === '1' || fromList === '1' || hasListOrigin
      ? 'none' : 'default' }} />
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BACKGROUND,
      }}
    >
      <View style={{ height: 70, paddingHorizontal: 24, justifyContent: 'center' }}>
        <Pressable
          onPress={closeDetail}
          accessibilityRole='button'
          accessibilityLabel='Cerrar detalle'
          style={{ alignSelf: 'flex-start', padding: 3 }}
        >
          <Feather name='x' size={23} color={INK} />
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: BACKGROUND }}
        nestedScrollEnabled
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 42,
        }}
      >
        {!visibleCards.length && (
          <View>
            <Text style={{ fontFamily: semibold, fontSize: 28, color: INK,
              marginTop: 12 }}>{create === '1' ? 'Nueva tarjeta' : 'Tarjeta no disponible'}</Text>
            <Text style={{ fontFamily: regular, color: MUTED,
              marginTop: 12 }}>{create === '1' ? 'Completa los datos para añadirla a tu cartera.' :
                'Vuelve a Cuentas y tarjetas para elegir otra tarjeta.'}</Text>
          </View>
        )}
        {!!focusedCardId && (
          <InstrumentCardCarousel ledger={ledger} instrumentId={focusedCardId} kind='card'
            progress={progress} />
        )}
        {!!visibleCards.length && focusedCardId && (
          <InstrumentDetailMorph ledger={ledger} instrumentId={focusedCardId}
            kind='card' progress={progress}>
        {visibleCards.map((card) => {
          const cardCycles = ledger.cycles
            .filter((cycle) => cycle.cardId === card.id)
            .sort((a, b) => b.cutoffDate.localeCompare(a.cutoffDate))
          const purchaseCycle = [...cardCycles].reverse().find((cycle) => cycle.cutoffDate >= todayKey)
          const paymentCycle = cardCycles
            .filter((cycle) => statementAmountCents(ledger, cycle.id) > cycle.paidAmountCents)
            .sort((a, b) => comparePaymentCycles(a, b, todayKey))[0]
          const nextPaymentCycle = [...cardCycles]
            .filter((cycle) => cycle.dueDate >= todayKey &&
              (cycle.paymentMode === 'automatic'
                ? statementAmountCents(ledger, cycle.id)
                : cycle.scheduledAmountCents) > cycle.paidAmountCents)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
          const nextCycle = nextPaymentCycle ?? purchaseCycle ?? paymentCycle
          const activity = ledger.cardActivity
            .filter((item) => item.cardId === card.id)
            .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
          return (
            <View key={card.id}>
              <InstrumentDetailHeader
                name={card.name}
                bank={getCardDesign(card.cardDesignId)?.bank ?? 'Banco no especificado'}
                amountCents={card.currentDebtCents}
                isCreditCard
                image={getCardDesign(card.cardDesignId)?.image}
                showImage={false}
                actions={[
                  { label: 'Compra', icon: 'shopping-bag',
                    disabled: !purchaseCycle,
                    onPress: () => purchaseCycle && open('purchase', card.id, purchaseCycle.id) },
                  { label: 'Pago', icon: 'dollar-sign',
                    disabled: !paymentCycle,
                    onPress: () => paymentCycle && open('payment', card.id, paymentCycle.id) },
                  { label: 'Ajustes', icon: 'settings',
                    onPress: () => open('settings', card.id) },
                ]}
              />
              {!card.billingRule && (
                <Pressable onPress={() => open('cycle', card.id)}
                  style={{ alignSelf: 'flex-end', paddingVertical: 8 }}>
                  <Text style={{ fontFamily: medium, fontSize: 13, color: INK }}>+ Ciclo</Text>
                </Pressable>
              )}
              <View style={{ backgroundColor: '#fff', borderRadius: 18,
                paddingHorizontal: 16, marginTop: 10 }}>
                <Text style={{ fontFamily: medium, fontSize: 13, color: MUTED,
                  paddingTop: 17, paddingBottom: 6 }}>Actividad reciente</Text>
              {(showAllActivity ? activity : activity.slice(0, 3)).map((item) => (
                <View
                  key={item.id}
                  style={{
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 19,
                    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={item.type === 'purchase' ? 'shopping-bag' : 'arrow-down-left'}
                      size={17} color={INK} />
                  </View>
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
                      {formatShortDateKey(item.effectiveDate)} ·{' '}
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
                    }}
                  >
                    {item.type === 'purchase' ? '−' : '+'}{formatMoney(item.amountCents)}
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
              {!activity.length && (
                <Text style={{ fontFamily: regular, color: MUTED, fontSize: 13,
                  paddingVertical: 20 }}>Aún no hay compras ni pagos.</Text>
              )}
              {activity.length > 3 && (
                <Pressable onPress={() => setShowAllActivity((current) => !current)}
                  style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={{ fontFamily: medium, fontSize: 13, color: INK }}>
                    {showAllActivity ? 'Mostrar menos' : 'Ver todos'}
                  </Text>
                </Pressable>
              )}
              </View>
              {nextCycle && (
                <Pressable
                  onPress={() => open('plan', card.id, nextCycle.id)}
                  accessibilityRole='button'
                  accessibilityLabel={`Editar ciclo de corte ${formatShortDateKey(nextCycle.cutoffDate)}`}
                  style={{ marginTop: 10, padding: 16, backgroundColor: '#fff',
                    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: medium, color: MUTED, fontSize: 12 }}>
                      {nextCycle.cutoffDate < todayKey ? 'Próximo pago' : 'Siguiente corte'}
                    </Text>
                    <Text style={{ fontFamily: semibold, color: INK, fontSize: 22, marginTop: 4 }}>
                      {formatMoney(Math.max(0,
                        (nextCycle.paymentMode === 'automatic'
                          ? statementAmountCents(ledger, nextCycle.id)
                          : nextCycle.scheduledAmountCents) - nextCycle.paidAmountCents))}
                    </Text>
                    <Text style={{ fontFamily: regular, color: MUTED, fontSize: 12, marginTop: 4 }}>
                      Corte {formatShortDateKey(nextCycle.cutoffDate)} · Pago {formatShortDateKey(nextCycle.paymentMode === 'automatic'
                        ? nextCycle.dueDate : nextCycle.scheduledDate ?? nextCycle.dueDate)}
                      {nextCycle.automatic && !nextCycle.dueDateConfirmed ? ' estimado' : ''}
                    </Text>
                  </View>
                  <Feather name='edit-2' size={17} color={MUTED} />
                </Pressable>
              )}
            </View>
          )
        })}
          </InstrumentDetailMorph>
        )}
      </ScrollView>
      <AppBottomSheet
        visible={mode !== null}
        onClose={() => setMode(null)}
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
              ? cardStep === 'details'
                ? 'Nueva tarjeta'
                : 'Elige tu banco'
              : mode === 'settings'
                ? 'Editar tarjeta'
                : mode === 'cycle'
                  ? 'Nuevo ciclo'
                  : mode === 'purchase'
                    ? 'Compra con tarjeta'
                    : mode === 'payment'
                      ? 'Pago realizado'
                      : mode === 'plan'
                        ? 'Editar corte'
                        : 'Cambiar ciclo'}
          </Text>
          {mode === 'card' && cardStep === 'details' && (
            <>
              <Label>Nombre</Label>
              <Field value={name} onChangeText={setName} placeholder='Ej. Tarjeta principal' />
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end' }}>
                <CutoffDayInput value={cutoffDay} onChange={setCutoffDay} />
                <DateField
                  label='Fecha límite'
                  value={dueDate}
                  onChange={setDueDate}
                  minimumDate={addDaysKey(todayKey, 1)}
                  compact
                  style={{ flex: 1 }}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ height: 54, paddingTop: 19, fontFamily: medium,
                    fontSize: 13, color: MUTED, textAlignVertical: 'bottom' }}>Deuda actual</Text>
                  <Field value={debt} onChangeText={setDebt} placeholder='0.00' decimal />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ height: 54, paddingTop: 19, fontFamily: medium,
                    fontSize: 13, color: MUTED, textAlignVertical: 'bottom' }}>Deuda del corte anterior</Text>
                  <Field value={billed} onChangeText={setBilled} placeholder='0.00' decimal />
                </View>
              </View>
              <Text
                style={{
                  marginTop: 6,
                  color: MUTED,
                  fontFamily: regular,
                  fontSize: 12,
                }}
              >
                La deuda actual incluye la del corte anterior. Esta última se proyecta en la fecha límite; el resto queda para próximos cortes.
              </Text>
            </>
          )}
          {mode === 'card' && cardStep === 'design' && (
            <View
              style={{
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: regular,
                  fontSize: 14,
                  color: MUTED,
                  marginBottom: 14,
                }}
              >
                Desliza o toca una tarjeta para elegir cómo se verá en tu cartera.
              </Text>
              <ScrollView
                horizontal
                pagingEnabled
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / designPageWidth)
                  const design = cardDesigns[index]
                  if (design) {
                    setSelectedDesignId(design.id)
                    setError('')
                  }
                }}
              >
                {cardDesigns.map((design) => {
                  const selected = selectedDesignId === design.id
                  return (
                    <View
                      key={design.id}
                      style={{
                        width: designPageWidth,
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                      }}
                    >
                      <View
                        style={{
                          width: '100%',
                          aspectRatio: 817 / 511,
                          borderRadius: 16,
                          backgroundColor: '#fff',
                          shadowColor: '#000',
                          shadowOffset: {
                            width: 0,
                            height: 6,
                          },
                          shadowOpacity: 0.12,
                          shadowRadius: 14,
                          elevation: 5,
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            setSelectedDesignId(design.id)
                            setError('')
                          }}
                          accessibilityRole='button'
                          accessibilityLabel={`Seleccionar ${design.bank}`}
                          accessibilityState={{
                            selected,
                          }}
                          style={{
                            flex: 1,
                            borderRadius: 16,
                            overflow: 'hidden',
                          }}
                        >
                          {design.image ? (
                            <Image
                              source={design.image}
                              resizeMode='cover'
                              style={{
                                width: '100%',
                                height: '100%',
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: '#e8e8e8',
                                justifyContent: 'space-between',
                                padding: 22,
                              }}
                            >
                              <Feather name='credit-card' size={30} color={INK} />
                              <Text
                                style={{
                                  fontFamily: medium,
                                  color: INK,
                                  fontSize: 18,
                                }}
                              >
                                Mi tarjeta
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )
                })}
              </ScrollView>
            </View>
          )}
          {mode === 'settings' && (
            <>
              <Label>Nombre</Label>
              <Field value={name} onChangeText={setName} placeholder='Nombre de tarjeta' />
              <CutoffDayInput value={cutoffDay} onChange={setCutoffDay} />
              {!selectedCard?.billingRule && (
                <>
                  <DateField label='Fecha límite' value={dueDate} onChange={setDueDate}
                    minimumDate={addDaysKey(todayKey, 1)} />
                  <Text style={{ fontFamily: regular, color: MUTED, fontSize: 12, marginTop: 8 }}>
                    Al guardar, se crearán ciclos futuros. Los ciclos y pagos que ya registraste se conservarán.
                  </Text>
                </>
              )}
            </>
          )}
          {mode === 'cycle' && (
            <>
              <DateField label='Fecha de corte' value={cutoffDate} onChange={setCutoffDate} />
              <DateField
                label='Fecha límite de pago'
                value={dueDate}
                onChange={setDueDate}
                minimumDate={cutoffDate ? addDaysKey(cutoffDate, 1) : undefined}
              />
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
          {((mode === 'card' && cardStep === 'details') ||
            mode === 'settings' ||
            mode === 'payment') && (
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
                {(mode === 'payment' ? paymentChoices : cycles).map((cycle) => (
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
                      {formatShortDateKey(cycle.cutoffDate)}
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
              <DateField
                label='Fecha realizada'
                value={activityDate}
                onChange={setActivityDate}
                minimumDate={selectedCard?.createdDate}
                maximumDate={todayKey}
              />
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
              <Pressable onPress={() => setShowCyclePicker((current) => !current)}
                style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                <Text style={{ fontFamily: medium, fontSize: 13, color: INK }}>
                  {showCyclePicker ? 'Ocultar ciclos' : 'Elegir otro ciclo'}
                </Text>
              </Pressable>
              {showCyclePicker && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}>
                  {[...cycles].reverse().map((cycle) => (
                    <Pressable key={cycle.id} onPress={() => open('plan', selectedCardId, cycle.id)}
                      style={{ marginRight: 8, paddingHorizontal: 10, paddingVertical: 8,
                        borderRadius: 8, backgroundColor: cycle.id === selectedCycleId ? INK : '#f3f3f3' }}>
                      <Text style={{ fontFamily: medium, fontSize: 12,
                        color: cycle.id === selectedCycleId ? '#fff' : INK }}>
                        {formatShortDateKey(cycle.cutoffDate)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
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
              <DateField
                label='Fecha límite de pago'
                value={dueDate}
                onChange={setDueDate}
                minimumDate={
                  selectedCycle?.cutoffDate ? addDaysKey(selectedCycle.cutoffDate, 1) : undefined
                }
              />
              {selectedCycle?.automatic && (
                <>
                  <Label>Deuda anterior en este corte</Label>
                  <Field value={billed} onChangeText={setBilled} placeholder='0.00' decimal />
                  <Text style={{ fontFamily: regular, color: MUTED, fontSize: 12, marginTop: 5 }}>
                    Sin asignar: {formatMoney((selectedCard?.unbilledOpeningCents ?? 0) +
                      (selectedCycle?.openingStatementCents ?? 0))}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                    {([['automatic', 'Proyección automática'], ['manual', 'Pago manual']] as const).map(([value, title]) => (
                      <Pressable key={value} onPress={() => setUseAutomaticPayment(value === 'automatic')}
                        style={{ padding: 10, borderRadius: 9, backgroundColor: useAutomaticPayment === (value === 'automatic') ? INK : '#f3f3f3' }}>
                        <Text style={{ fontFamily: medium, color: useAutomaticPayment === (value === 'automatic') ? '#fff' : INK, fontSize: 12 }}>{title}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              {!useAutomaticPayment && (
                <>
                  <Label>Monto previsto (0 para quitar)</Label>
                  <Field value={amount} onChangeText={setAmount} placeholder='0.00' decimal />
                  <DateField label='Fecha prevista' value={scheduledDate} onChange={setScheduledDate}
                    minimumDate={addDaysKey(todayKey, 1)} clearable />
                </>
              )}
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
              onPress={() => {
                if (mode === 'card' && cardStep === 'design') {
                  setCardStep('details')
                  setError('')
                } else {
                  setMode(null)
                }
              }}
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
                {mode === 'card' && cardStep === 'design' ? 'Atrás' : 'Cancelar'}
              </Text>
            </Pressable>
            <Pressable
              onPress={mode === 'card' && cardStep === 'details' ? nextCardStep : save}
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
                {mode === 'card' && cardStep === 'details' ? 'Siguiente' : 'Guardar'}
              </Text>
            </Pressable>
          </View>
          {mode === 'settings' && selectedCard && (
            <Pressable onPress={() => confirmDeleteCard(selectedCard.id, selectedCard.name)}
              accessibilityRole='button' accessibilityLabel='Eliminar tarjeta'
              style={{ alignItems: 'center', paddingVertical: 18, marginTop: 6 }}>
              <Text style={{ fontFamily: medium, color: '#c84242', fontSize: 13 }}>
                Eliminar tarjeta
              </Text>
            </Pressable>
          )}
        </View>
      </AppBottomSheet>
    </SafeAreaView>
    </>
  )
}
