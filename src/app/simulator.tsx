import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Line, Path } from 'react-native-svg'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { addDaysKey, localDateKey } from '@/features/finance/dates'
import { allocateInstallments } from '@/features/finance/installments'
import { getLedger, totalLiquidity } from '@/features/finance/ledger'
import { formatMoney, parseAmount } from '@/features/finance/money'
import { projectLiquidity } from '@/features/finance/projection'
import { getScheduledMovements } from '@/features/finance/scheduledMovements'
import { type PurchaseScenario, simulatePurchase } from '@/features/finance/simulation'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export default function SimulatorScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ledger, setLedger] = useState(getLedger)
  const [movements, setMovements] = useState(getScheduledMovements)
  const [todayKey, setTodayKey] = useState(localDateKey(new Date()))
  const [open, setOpen] = useState(false)
  const [scenario, setScenario] = useState<PurchaseScenario | null>(null)
  const [amount, setAmount] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayKey)
  const [method, setMethod] = useState<'cash' | 'card' | 'msi'>('cash')
  const [cardId, setCardId] = useState('')
  const [firstCycleId, setFirstCycleId] = useState('')
  const [months, setMonths] = useState('3')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [includePayments, setIncludePayments] = useState(false)
  const [selectedDay, setSelectedDay] = useState(30)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      setLedger(getLedger())
      setMovements(getScheduledMovements())
      setTodayKey(localDateKey(new Date()))
    }, []),
  )

  const completed = useMemo(
    () =>
      new Set(
        ledger.completedMovements
          .filter((item) => item.sourceScheduledId && item.sourceOccurrenceDate)
          .map((item) => `${item.sourceScheduledId}:${item.sourceOccurrenceDate}`),
      ),
    [
      ledger,
    ],
  )
  const cardPayments = ledger.cycles.flatMap((cycle) =>
    cycle.scheduledDate && cycle.scheduledAmountCents > cycle.paidAmountCents
      ? [
          {
            date: cycle.scheduledDate,
            amountCents: cycle.scheduledAmountCents - cycle.paidAmountCents,
          },
        ]
      : [],
  )
  const baseline = projectLiquidity(
    totalLiquidity(ledger),
    todayKey,
    movements,
    90,
    cardPayments,
    completed,
  )
  const simulation = useMemo(() => {
    if (!scenario) return null
    try {
      return simulatePurchase(baseline, todayKey, ledger, scenario)
    } catch {
      return null
    }
  }, [
    baseline,
    todayKey,
    ledger,
    scenario,
  ])
  const cycles = ledger.cycles
    .filter((cycle) => cycle.cardId === cardId)
    .sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate))
  let previewPayments: {
    date: string
    amountCents: number
  }[] = []
  if (method === 'msi' && includePayments && cardId && firstCycleId) {
    try {
      const cents = parseAmount(amount)
      if (cents) {
        previewPayments = allocateInstallments(
          ledger.cycles,
          cardId,
          firstCycleId,
          Number(months),
          cents,
        ).map((part) => ({
          date: ledger.cycles.find((cycle) => cycle.id === part.cycleId)?.dueDate ?? '',
          amountCents: part.amountCents,
        }))
      }
    } catch {
      /* The form displays the validation error when applied. */
    }
  }

  function apply() {
    try {
      const amountCents = parseAmount(amount)
      if (!amountCents || amountCents <= 0) throw new Error('Ingresa un importe mayor que cero')
      if (purchaseDate > addDaysKey(todayKey, 90)) {
        throw new Error('Elige una fecha dentro de los próximos 90 días')
      }
      let next: PurchaseScenario
      if (method === 'cash')
        next = {
          method,
          amountCents,
          purchaseDate,
        }
      else if (method === 'card') {
        const cents = paymentAmount.trim() ? parseAmount(paymentAmount) : null
        if (paymentAmount.trim() && (!cents || !paymentDate)) {
          throw new Error('Revisa el importe y la fecha del pago hipotético')
        }
        next = {
          method,
          amountCents,
          purchaseDate,
          cardId,
          payments: cents
            ? [
                {
                  date: paymentDate,
                  amountCents: cents,
                },
              ]
            : [],
        }
      } else
        next = {
          method,
          amountCents,
          purchaseDate,
          cardId,
          firstCycleId,
          months: Number(months),
          includePayments,
        }
      simulatePurchase(baseline, todayKey, ledger, next)
      setScenario(next)
      setOpen(false)
      setSelectedDay(30)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo simular la compra')
    }
  }

  const chartWidth = width - 48
  const chartHeight = 220
  const all = [
    ...baseline,
    ...(simulation?.points ?? []),
  ].map((point) => point.balanceCents)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const y = (value: number) =>
    max === min ? chartHeight / 2 : 20 + ((max - value) / (max - min)) * (chartHeight - 44)
  const path = (points: typeof baseline) =>
    points
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'} ${12 + (index / 90) * (chartWidth - 24)} ${y(point.balanceCents)}`,
      )
      .join(' ')
  const baseValue = baseline[selectedDay]?.balanceCents ?? 0
  const scenarioValue = simulation?.points[selectedDay]?.balanceCents ?? baseValue
  const field = (
    label: string,
    value: string,
    change: (value: string) => void,
    placeholder: string,
    decimal = false,
  ) => (
    <View
      style={{
        marginTop: 18,
      }}
    >
      <Text
        style={{
          fontFamily: medium,
          fontSize: 13,
          color: muted,
        }}
      >
        {label}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={change}
        placeholder={placeholder}
        keyboardType={decimal ? 'decimal-pad' : 'default'}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#ddd',
          paddingVertical: 10,
          fontFamily: regular,
          fontSize: 16,
          color: ink,
        }}
      />
    </View>
  )
  const choice = (label: string, selected: boolean, press: () => void) => (
    <Pressable
      onPress={press}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 9,
        backgroundColor: selected ? ink : '#f1f1f1',
      }}
    >
      <Text
        style={{
          color: selected ? '#fff' : ink,
          fontFamily: medium,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  )

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#f6f6f6',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 60,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            marginBottom: 38,
          }}
        >
          <Feather name='arrow-left' size={22} color={ink} />
        </Pressable>
        <Text
          style={{
            fontFamily: semibold,
            fontSize: 29,
            color: ink,
          }}
        >
          Simular compra
        </Text>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            marginTop: 8,
            lineHeight: 21,
          }}
        >
          Explora cómo cambiaría tu liquidez. Este escenario no se guarda.
        </Text>
        <Pressable
          onPress={() => {
            setError('')
            setOpen(true)
          }}
          style={{
            marginTop: 26,
            backgroundColor: ink,
            borderRadius: 12,
            padding: 17,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontFamily: medium,
            }}
          >
            {scenario ? 'Editar escenario' : 'Crear escenario'}
          </Text>
        </Pressable>
        {scenario && (
          <Pressable
            onPress={() => setScenario(null)}
            style={{
              alignItems: 'center',
              padding: 15,
            }}
          >
            <Text
              style={{
                color: muted,
                fontFamily: medium,
              }}
            >
              Descartar escenario
            </Text>
          </Pressable>
        )}
        <View
          style={{
            marginTop: 30,
            padding: 18,
            backgroundColor: '#fff',
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              fontFamily: regular,
              color: muted,
            }}
          >
            Día {selectedDay} · {baseline[selectedDay]?.date}
          </Text>
          <Text
            style={{
              fontFamily: semibold,
              color: ink,
              fontSize: 25,
              marginTop: 7,
            }}
          >
            {formatMoney(scenarioValue)}
          </Text>
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              marginTop: 4,
            }}
          >
            Base {formatMoney(baseValue)} · Diferencia {formatMoney(scenarioValue - baseValue)}
          </Text>
          {simulation && (
            <Text
              style={{
                fontFamily: regular,
                color: muted,
                marginTop: 7,
              }}
            >
              Compra cargada a tarjeta: {formatMoney(simulation.debtIncreaseCents)}
            </Text>
          )}
        </View>
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(event) =>
            setSelectedDay(
              Math.max(
                0,
                Math.min(
                  90,
                  Math.round(((event.nativeEvent.locationX - 12) / (chartWidth - 24)) * 90),
                ),
              ),
            )
          }
          onResponderMove={(event) =>
            setSelectedDay(
              Math.max(
                0,
                Math.min(
                  90,
                  Math.round(((event.nativeEvent.locationX - 12) / (chartWidth - 24)) * 90),
                ),
              ),
            )
          }
          style={{
            marginTop: 30,
          }}
        >
          <Svg width={chartWidth} height={chartHeight}>
            <Path d={path(baseline)} fill='none' stroke='#bdbdbd' strokeWidth={3} />
            {simulation && (
              <Path d={path(simulation.points)} fill='none' stroke={ink} strokeWidth={3} />
            )}
            <Line
              x1={12 + (selectedDay / 90) * (chartWidth - 24)}
              x2={12 + (selectedDay / 90) * (chartWidth - 24)}
              y1={12}
              y2={chartHeight - 12}
              stroke='#ddd'
              strokeDasharray='3 5'
            />
          </Svg>
        </View>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 12,
          }}
        >
          Gris: liquidez base · Negro: escenario · Desliza para elegir fecha
        </Text>
        {simulation && (
          <View
            style={{
              marginTop: 28,
            }}
          >
            <Text
              style={{
                fontFamily: medium,
                color: ink,
                fontSize: 15,
              }}
            >
              Pagos hipotéticos
            </Text>
            {simulation.payments.length ? (
              simulation.payments.map((payment, index) => (
                <Text
                  key={`${payment.date}-${index}`}
                  style={{
                    fontFamily: regular,
                    color: muted,
                    marginTop: 10,
                  }}
                >
                  {payment.date} · {formatMoney(payment.amountCents)}
                </Text>
              ))
            ) : (
              <Text
                style={{
                  fontFamily: regular,
                  color: muted,
                  marginTop: 10,
                }}
              >
                Sin pagos simulados; la liquidez no cambia.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
      <AppBottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text
          style={{
            fontFamily: semibold,
            fontSize: 20,
            color: ink,
          }}
        >
          Compra hipotética
        </Text>
        {field('Importe', amount, setAmount, '0.00', true)}
        {field('Fecha de compra (AAAA-MM-DD)', purchaseDate, setPurchaseDate, 'AAAA-MM-DD')}
        <Text
          style={{
            fontFamily: medium,
            color: muted,
            fontSize: 13,
            marginTop: 20,
          }}
        >
          Medio de pago
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 7,
            marginTop: 9,
          }}
        >
          {choice('Efectivo/débito', method === 'cash', () => setMethod('cash'))}
          {choice('Tarjeta', method === 'card', () => setMethod('card'))}
          {choice('MSI', method === 'msi', () => setMethod('msi'))}
        </View>
        {method !== 'cash' && (
          <>
            <Text
              style={{
                fontFamily: medium,
                color: muted,
                fontSize: 13,
                marginTop: 20,
              }}
            >
              Tarjeta
            </Text>
            <ScrollView
              horizontal
              style={{
                marginTop: 9,
              }}
            >
              {ledger.cards.map((card) =>
                choice(card.name, card.id === cardId, () => {
                  setCardId(card.id)
                  setFirstCycleId('')
                }),
              )}
            </ScrollView>
          </>
        )}
        {method === 'card' && (
          <>
            <Text
              style={{
                fontFamily: regular,
                color: muted,
                fontSize: 12,
                marginTop: 16,
              }}
            >
              El pago es opcional. Solo un pago con fecha e importe explícitos reduce la liquidez.
            </Text>
            {field('Pago hipotético (opcional)', paymentAmount, setPaymentAmount, '0.00', true)}
            {field('Fecha del pago (AAAA-MM-DD)', paymentDate, setPaymentDate, 'AAAA-MM-DD')}
          </>
        )}
        {method === 'msi' && (
          <>
            {field('Número de mensualidades (2–36)', months, setMonths, '3')}
            <Text
              style={{
                fontFamily: medium,
                color: muted,
                fontSize: 13,
                marginTop: 20,
              }}
            >
              Primer ciclo confirmado
            </Text>
            <ScrollView
              horizontal
              style={{
                marginTop: 9,
              }}
            >
              {cycles.map((cycle) =>
                choice(cycle.cutoffDate, cycle.id === firstCycleId, () =>
                  setFirstCycleId(cycle.id),
                ),
              )}
            </ScrollView>
            <Pressable
              onPress={() => setIncludePayments(!includePayments)}
              style={{
                marginTop: 18,
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: ink,
                }}
              >
                {includePayments ? '●' : '○'} Simular pago de cada cuota en su fecha límite
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: regular,
                color: muted,
                fontSize: 12,
                marginTop: 8,
              }}
            >
              Usa los importes y vencimientos de los ciclos confirmados. Revísalos en Tarjetas.
            </Text>
            {previewPayments.map((payment, index) => (
              <Text
                key={`${payment.date}-${index}`}
                style={{
                  fontFamily: regular,
                  color: muted,
                  fontSize: 12,
                  marginTop: 7,
                }}
              >
                {payment.date} · {formatMoney(payment.amountCents)}
              </Text>
            ))}
          </>
        )}
        {!!error && (
          <Text
            style={{
              fontFamily: regular,
              color: '#b83232',
              marginTop: 16,
            }}
          >
            {error}
          </Text>
        )}
        <Pressable
          onPress={apply}
          style={{
            backgroundColor: ink,
            borderRadius: 12,
            alignItems: 'center',
            padding: 16,
            marginTop: 24,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontFamily: medium,
            }}
          >
            Comparar escenario
          </Text>
        </Pressable>
      </AppBottomSheet>
    </SafeAreaView>
  )
}
