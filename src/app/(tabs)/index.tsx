import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { localDateKey } from '@/features/finance/dates'
import { liquidityHistory } from '@/features/finance/history'
import {
  getLedger,
  newAccountId,
  newMovementId,
  totalLiquidity,
  upsertAccount,
  upsertCompletedMovement,
} from '@/features/finance/ledger'
import { formatMoney, parseAmount } from '@/features/finance/money'
import { projectLiquidityBreakdown } from '@/features/finance/projection'
import { ScheduledMovementModal } from '@/features/finance/ScheduledMovementModal'
import {
  deleteScheduledMovement,
  getScheduledMovements,
  nextOccurrenceDate,
  type ScheduledMovement,
  saveScheduledMovement,
} from '@/features/finance/scheduledMovements'

const BACKGROUND = '#f6f6f6'
const INK = '#101010'
const MUTED = '#898989'
const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export default function HomeTab() {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const chartWidth = screenWidth - 48
  const [ledger, setLedger] = useState(getLedger)
  const balanceCents = ledger.accounts.length ? totalLiquidity(ledger) : null
  const [movements, setMovements] = useState<ScheduledMovement[]>(getScheduledMovements)
  const [movementModalVisible, setMovementModalVisible] = useState(false)
  const [editingScheduled, setEditingScheduled] = useState<ScheduledMovement | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const [horizonDays, setHorizonDays] = useState<7 | 30 | 60 | 90>(30)
  const [balanceModalVisible, setBalanceModalVisible] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const [today, setToday] = useState(() => new Date())
  useFocusEffect(
    useCallback(() => {
      setToday(new Date())
      setLedger(getLedger())
      setSelectedDay(0)
    }, []),
  )
  const todayKey = localDateKey(today)
  const completedOccurrences = useMemo(
    () =>
      new Set(
        ledger.completedMovements
          .filter((item) => item.sourceScheduledId && item.sourceOccurrenceDate)
          .map((item) => `${item.sourceScheduledId}:${item.sourceOccurrenceDate}`),
      ),
    [
      ledger.completedMovements,
    ],
  )
  const cardPayments = useMemo(
    () =>
      ledger.cycles.flatMap((cycle) =>
        cycle.scheduledDate && cycle.scheduledAmountCents > cycle.paidAmountCents
          ? [
              {
                date: cycle.scheduledDate,
                amountCents: cycle.scheduledAmountCents - cycle.paidAmountCents,
              },
            ]
          : [],
      ),
    [
      ledger.cycles,
    ],
  )
  const projection = useMemo(
    () =>
      balanceCents === null
        ? []
        : projectLiquidityBreakdown(
            balanceCents,
            todayKey,
            movements,
            horizonDays,
            cardPayments,
            completedOccurrences,
          ),
    [
      balanceCents,
      todayKey,
      movements,
      horizonDays,
      cardPayments,
      completedOccurrences,
    ],
  )
  const history = useMemo(
    () => liquidityHistory(ledger, todayKey),
    [
      ledger,
      todayKey,
    ],
  )
  const sortedMovements = useMemo(
    () =>
      [
        ...movements.filter((movement) => nextOccurrenceDate(movement, completedOccurrences)),
      ].sort((a, b) =>
        (nextOccurrenceDate(a, completedOccurrences) ?? a.effectiveDate).localeCompare(
          nextOccurrenceDate(b, completedOccurrences) ?? b.effectiveDate,
        ),
      ),
    [
      movements,
      completedOccurrences,
    ],
  )
  const selectedDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + selectedDay,
  )

  const chartPadding = 12
  const todayX = chartPadding + (chartWidth - chartPadding * 2) * 0.38
  const historyDays = history.length - 1
  const selectedX =
    selectedDay < 0 && historyDays > 0
      ? todayX + (selectedDay / historyDays) * (todayX - chartPadding)
      : todayX + (selectedDay / horizonDays) * (chartWidth - chartPadding - todayX)
  const baselineY = 216
  const balances = [
    ...history,
    ...projection,
  ].map((point) => point.balanceCents)
  if (balanceCents !== null) {
    for (const point of projection) {
      balances.push(balanceCents + point.incomeCents)
      balances.push(balanceCents - point.expenseCents)
    }
  }
  const minimumBalance = balances.length ? Math.min(...balances) : 0
  const maximumBalance = balances.length ? Math.max(...balances) : 0
  const range = maximumBalance - minimumBalance
  const yForBalance = (value: number) =>
    range === 0 ? 126 : 183 - ((value - minimumBalance) / range) * 138
  const selectedBalance =
    selectedDay < 0
      ? (history[historyDays + selectedDay]?.balanceCents ?? null)
      : (projection[selectedDay]?.balanceCents ?? null)
  const historyPath = history
    .map((point, index) => {
      const x =
        historyDays === 0 ? todayX : chartPadding + (index / historyDays) * (todayX - chartPadding)
      const y = yForBalance(point.balanceCents)
      return index === 0 ? `M ${x} ${y}` : `H ${x} V ${y}`
    })
    .join(' ')
  const futurePath = (valueForPoint: (point: (typeof projection)[number]) => number) =>
    projection
      .map((point, index) => {
        const x = todayX + (index / horizonDays) * (chartWidth - chartPadding - todayX)
        const y = yForBalance(valueForPoint(point))
        return index === 0 ? `M ${x} ${y}` : `H ${x} V ${y}`
      })
      .join(' ')
  const chartPath = futurePath((point) => point.balanceCents)
  const incomePath = futurePath((point) => (balanceCents ?? 0) + point.incomeCents)
  const expensePath = futurePath((point) => (balanceCents ?? 0) - point.expenseCents)

  function selectAt(x: number) {
    if (x < todayX && historyDays > 0) {
      const offset = Math.round(((x - todayX) / (todayX - chartPadding)) * historyDays)
      setSelectedDay(Math.max(-historyDays, Math.min(0, offset)))
    } else {
      const ratio = (x - todayX) / (chartWidth - chartPadding - todayX)
      setSelectedDay(Math.max(0, Math.min(horizonDays, Math.round(ratio * horizonDays))))
    }
  }

  function openBalanceModal() {
    setBalanceInput('')
    setInputError(false)
    setBalanceModalVisible(true)
  }

  function saveBalance() {
    const cents = parseAmount(balanceInput)
    if (cents === null) {
      setInputError(true)
      return
    }
    setLedger(
      upsertAccount({
        id: newAccountId(),
        name: 'Cuenta principal',
        type: 'bank',
        balanceCents: cents,
        asOfDate: todayKey,
      }),
    )
    setBalanceModalVisible(false)
  }

  function addMovement(draft: Omit<ScheduledMovement, 'id'>) {
    setMovements(
      saveScheduledMovement({
        ...draft,
        id:
          editingScheduled?.id ??
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      }),
    )
  }

  function confirmDeleteMovement(movement: ScheduledMovement) {
    Alert.alert('Eliminar movimiento', 'Este movimiento dejará de afectar la proyección.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setMovements(deleteScheduledMovement(movement.id)),
      },
    ])
  }

  function confirmCompleteMovement(movement: ScheduledMovement) {
    const occurrenceDate = nextOccurrenceDate(movement, completedOccurrences)
    const accountId = movement.accountId ?? ledger.accounts[0]?.id
    if (!occurrenceDate || !accountId) return
    Alert.alert(
      'Registrar como realizado',
      'Se aplicará al saldo actual y dejará de proyectarse.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Registrar',
          onPress: () => {
            try {
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
        backgroundColor: BACKGROUND,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 48,
        }}
      >
        <Text
          style={{
            marginTop: 20,
            textAlign: 'center',
            color: INK,
            fontFamily: font.medium,
            fontSize: 16,
          }}
        >
          Liquidez
        </Text>

        <View
          style={{
            alignItems: 'center',
            marginTop: 70,
          }}
        >
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 15,
            }}
          >
            {selectedDay === 0 ? 'Hoy' : formatDay(selectedDate)}
          </Text>
          <Text
            accessibilityLabel={
              selectedBalance === null ? 'Saldo sin registrar' : formatMoney(selectedBalance)
            }
            style={{
              color: INK,
              fontFamily: font.semibold,
              fontSize: 52,
              letterSpacing: -2.7,
              marginTop: 7,
            }}
          >
            {selectedBalance === null ? '—' : formatMoney(selectedBalance)}
          </Text>
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 14,
              marginTop: 3,
              textAlign: 'center',
            }}
          >
            {balanceCents === null
              ? 'Registra tu saldo disponible'
              : selectedDay === 0
                ? 'Saldo disponible actual'
                : selectedDay < 0
                  ? 'Saldo histórico'
                  : 'Saldo proyectado'}
          </Text>
        </View>

        <View
          accessibilityLabel={`Gráfica de liquidez de los próximos ${horizonDays} días. Desliza para seleccionar una fecha.`}
          style={{
            marginTop: 48,
            height: 258,
          }}
          onStartShouldSetResponder={() => balanceCents !== null}
          onMoveShouldSetResponder={() => balanceCents !== null}
          onResponderGrant={(event) => selectAt(event.nativeEvent.locationX)}
          onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
        >
          <Svg width={chartWidth} height={236}>
            <Line
              x1={chartPadding}
              x2={chartWidth - chartPadding}
              y1={baselineY}
              y2={baselineY}
              stroke='#c8c8c8'
              strokeWidth={1.5}
              strokeDasharray='1 10'
              strokeLinecap='round'
            />
            {balanceCents !== null && (
              <>
                <Path
                  d={historyPath}
                  stroke={INK}
                  strokeWidth={3.5}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <Path
                  d={incomePath}
                  stroke='#c6c6c6'
                  strokeWidth={2.5}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <Path
                  d={expensePath}
                  stroke='#a4a4a4'
                  strokeWidth={2.5}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <Path
                  d={chartPath}
                  stroke={INK}
                  strokeWidth={3.5}
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
                <Line
                  x1={selectedX}
                  x2={selectedX}
                  y1={28}
                  y2={baselineY}
                  stroke='#c5c5c5'
                  strokeWidth={1}
                  strokeDasharray='2 5'
                />
                <Circle cx={selectedX} cy={yForBalance(selectedBalance ?? 0)} r={5} fill={INK} />
              </>
            )}
          </Svg>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 12,
              }}
            >
              Historial
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 12,
              }}
            >
              Hoy
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 12,
              }}
            >
              {horizonDays} días
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 13,
            marginTop: 7,
          }}
        >
          {(
            [
              [
                '#101010',
                'Saldo',
              ],
              [
                '#c6c6c6',
                '+ Ingresos',
              ],
              [
                '#a4a4a4',
                '− Gastos',
              ],
            ] as const
          ).map(([color, label]) => (
            <View
              key={label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 15,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: color,
                }}
              />
              <Text
                style={{
                  color: MUTED,
                  fontFamily: font.regular,
                  fontSize: 11,
                }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
        {selectedDay > 0 && projection[selectedDay] && (
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 9,
            }}
          >
            Acumulado: +{formatMoney(projection[selectedDay].incomeCents)} ingresos ·{' −'}
            {formatMoney(projection[selectedDay].expenseCents)} gastos
          </Text>
        )}

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 7,
            marginTop: 4,
          }}
        >
          {(
            [
              7,
              30,
              60,
              90,
            ] as const
          ).map((days) => (
            <Pressable
              key={days}
              onPress={() => {
                setHorizonDays(days)
                setSelectedDay((current) => Math.min(current, days))
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 9,
                backgroundColor: horizonDays === days ? '#e3e3e3' : 'transparent',
              }}
            >
              <Text
                style={{
                  color: horizonDays === days ? INK : MUTED,
                  fontFamily: font.medium,
                  fontSize: 12,
                }}
              >
                {days} días
              </Text>
            </Pressable>
          ))}
        </View>

        <View
          style={{
            marginTop: 34,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 14,
              }}
            >
              Cuenta disponible
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 14,
              }}
            >
              {balanceCents === null ? '—' : formatMoney(balanceCents)}
            </Text>
          </View>
          <Pressable
            onPress={() => (balanceCents === null ? openBalanceModal() : router.push('/accounts'))}
            style={{
              marginTop: 9,
              height: 56,
              borderRadius: 12,
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
            }}
            accessibilityRole='button'
            accessibilityLabel={balanceCents === null ? 'Registrar saldo' : 'Administrar cuentas'}
          >
            <View
              style={{
                width: 27,
                height: 27,
                borderRadius: 14,
                backgroundColor: '#f1f1f1',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Feather name='dollar-sign' size={14} color={INK} />
            </View>
            <Text
              style={{
                flex: 1,
                color: INK,
                fontFamily: font.medium,
                fontSize: 15,
              }}
            >
              {balanceCents === null ? 'Registrar cuenta principal' : 'Administrar cuentas'}
            </Text>
            <Feather
              name={balanceCents === null ? 'plus' : 'arrow-right'}
              size={17}
              color={MUTED}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push('/cards')}
            accessibilityRole='button'
            style={{
              marginTop: 9,
              height: 56,
              borderRadius: 12,
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
            }}
          >
            <Feather
              name='credit-card'
              size={17}
              color={INK}
              style={{
                marginRight: 18,
              }}
            />
            <Text
              style={{
                flex: 1,
                color: INK,
                fontFamily: font.medium,
                fontSize: 15,
              }}
            >
              Tarjetas de crédito
            </Text>
            <Feather name='arrow-right' size={17} color={MUTED} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/simulator')}
            accessibilityRole='button'
            style={{
              marginTop: 9,
              height: 56,
              borderRadius: 12,
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
            }}
          >
            <Feather
              name='activity'
              size={17}
              color={INK}
              style={{
                marginRight: 18,
              }}
            />
            <Text
              style={{
                flex: 1,
                color: INK,
                fontFamily: font.medium,
                fontSize: 15,
              }}
            >
              Simular una compra
            </Text>
            <Feather name='arrow-right' size={17} color={MUTED} />
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 35,
          }}
        >
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 14,
            }}
          >
            Movimientos programados
          </Text>
          {sortedMovements.length === 0 && cardPayments.length === 0 ? (
            <View
              style={{
                marginTop: 9,
                minHeight: 74,
                borderRadius: 12,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 20,
              }}
            >
              <Text
                style={{
                  color: MUTED,
                  fontFamily: font.regular,
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                Aún no hay movimientos programados
              </Text>
            </View>
          ) : (
            sortedMovements.map((movement) => (
              <View
                key={movement.id}
                style={{
                  marginTop: 9,
                  minHeight: 64,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <Pressable
                  onPress={() => {
                    setEditingScheduled(movement)
                    setMovementModalVisible(true)
                  }}
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: INK,
                      fontFamily: font.medium,
                      fontSize: 14,
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
                      color: MUTED,
                      fontFamily: font.regular,
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {movement.recurrence
                      ? `${movement.recurrence === 'weekly' ? 'Semanal' : movement.recurrence === 'biweekly' ? 'Quincenal' : 'Mensual'} · ${nextOccurrenceDate(movement, completedOccurrences) ?? 'Finalizada'}`
                      : `${movement.effectiveDate < todayKey ? 'Pendiente desde ' : ''}${movement.effectiveDate}`}
                    {movement.accountId
                      ? ` · ${ledger.accounts.find((account) => account.id === movement.accountId)?.name ?? 'Cuenta'}`
                      : ''}
                  </Text>
                </Pressable>
                <Text
                  style={{
                    color: INK,
                    fontFamily: font.medium,
                    fontSize: 14,
                    marginRight: 14,
                  }}
                >
                  {movement.type === 'income' ? '+' : movement.type === 'transfer' ? '↔ ' : '−'}
                  {formatMoney(movement.amountCents)}
                </Text>
                <Pressable
                  onPress={() => confirmCompleteMovement(movement)}
                  accessibilityRole='button'
                  accessibilityLabel='Registrar movimiento como realizado'
                  hitSlop={8}
                  style={{
                    marginRight: 14,
                  }}
                >
                  <Feather name='check-circle' size={17} color={MUTED} />
                </Pressable>
                <Pressable
                  onPress={() => confirmDeleteMovement(movement)}
                  accessibilityRole='button'
                  accessibilityLabel='Eliminar movimiento'
                  hitSlop={10}
                >
                  <Feather name='trash-2' size={16} color={MUTED} />
                </Pressable>
              </View>
            ))
          )}
          {ledger.cycles
            .filter(
              (cycle) => cycle.scheduledDate && cycle.scheduledAmountCents > cycle.paidAmountCents,
            )
            .map((cycle) => (
              <Pressable
                key={cycle.id}
                onPress={() => router.push('/cards')}
                style={{
                  marginTop: 9,
                  minHeight: 64,
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: INK,
                      fontFamily: font.medium,
                      fontSize: 14,
                    }}
                  >
                    Pago de{' '}
                    {ledger.cards.find((card) => card.id === cycle.cardId)?.name ?? 'tarjeta'}
                  </Text>
                  <Text
                    style={{
                      color: MUTED,
                      fontFamily: font.regular,
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {cycle.scheduledDate}
                  </Text>
                </View>
                <Text
                  style={{
                    color: INK,
                    fontFamily: font.medium,
                    fontSize: 14,
                  }}
                >
                  −{formatMoney(cycle.scheduledAmountCents - cycle.paidAmountCents)}
                </Text>
              </Pressable>
            ))}
          <Pressable
            onPress={() => {
              if (!ledger.accounts.length) {
                router.push('/accounts')
                return
              }
              setEditingScheduled(null)
              setMovementModalVisible(true)
            }}
            accessibilityRole='button'
            style={{
              marginTop: 16,
              minHeight: 52,
              borderRadius: 12,
              backgroundColor: INK,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Feather name='plus' size={18} color='#fff' />
            <Text
              style={{
                color: '#fff',
                fontFamily: font.medium,
                fontSize: 14,
              }}
            >
              {ledger.accounts.length ? 'Programar movimiento' : 'Añadir cuenta primero'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/movements')}
            accessibilityRole='button'
            style={{
              marginTop: 10,
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: INK,
                fontFamily: font.medium,
                fontSize: 14,
              }}
            >
              Ver historial y registrar movimiento realizado
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ScheduledMovementModal
        visible={movementModalVisible}
        todayKey={todayKey}
        accounts={ledger.accounts}
        initial={editingScheduled}
        onClose={() => {
          setMovementModalVisible(false)
          setEditingScheduled(null)
        }}
        onSave={addMovement}
      />

      <AppBottomSheet
        visible={balanceModalVisible}
        onClose={() => setBalanceModalVisible(false)}
        snapPoints={[
          '50%',
          '68%',
        ]}
      >
        <View>
          <Text
            style={{
              color: INK,
              fontFamily: font.semibold,
              fontSize: 21,
            }}
          >
            Saldo disponible
          </Text>
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 14,
              marginTop: 8,
              lineHeight: 21,
            }}
          >
            Ingresa el dinero que tienes hoy en efectivo y cuentas de débito.
          </Text>
          <TextInput
            autoFocus
            keyboardType='decimal-pad'
            placeholder='0.00'
            placeholderTextColor='#b0b0b0'
            value={balanceInput}
            onChangeText={(value) => {
              setBalanceInput(value)
              setInputError(false)
            }}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: inputError ? '#c84242' : '#ddd',
              color: INK,
              fontFamily: font.medium,
              fontSize: 34,
              marginTop: 22,
              paddingVertical: 10,
            }}
          />
          {inputError && (
            <Text
              style={{
                color: '#c84242',
                fontFamily: font.regular,
                marginTop: 6,
              }}
            >
              Ingresa un importe válido con hasta dos decimales.
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginTop: 28,
            }}
          >
            <Pressable
              onPress={() => setBalanceModalVisible(false)}
              style={{
                flex: 1,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: font.medium,
                  color: MUTED,
                }}
              >
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={saveBalance}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                backgroundColor: INK,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: font.medium,
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
