import { Feather } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { formatDateDisplay, formatShortDateKey } from '@/features/finance/dates'
import { type Ledger, statementAmountCents } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'
import { nextOccurrenceDate, type ScheduledMovement } from '@/features/finance/scheduledMovements'

type Filter = 'all' | 'income' | 'expense'
type ListItem =
  | {
      kind: 'movement'
      date: string
      movement: ScheduledMovement
    }
  | {
      kind: 'card'
      date: string
      amountCents: number
      cycle: Ledger['cycles'][number]
    }

type Props = {
  ledger: Ledger
  movements: ScheduledMovement[]
  completedOccurrences: ReadonlySet<string>
  todayKey: string
  onEdit: (movement: ScheduledMovement) => void
  onComplete: (movement: ScheduledMovement) => void
  onDelete: (movement: ScheduledMovement, occurrenceDate: string) => void
  onOpenCard: (cardId: string) => void
}

const ink = '#101010'
const muted = '#898989'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'

function displayDate(date: string) {
  return formatDateDisplay(new Date(`${date}T12:00:00`))
}

function recurrenceLabel(movement: ScheduledMovement) {
  if (movement.recurrence === 'weekly') return 'Semanal'
  if (movement.recurrence === 'biweekly') return 'Quincenal'
  if (movement.recurrence === 'monthly') return 'Mensual'
  return null
}

export function ScheduledMovementsList({
  ledger,
  movements,
  completedOccurrences,
  todayKey,
  onEdit,
  onComplete,
  onDelete,
  onOpenCard,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState(false)
  const items = useMemo<ListItem[]>(() => {
    const movementItems: ListItem[] = movements.flatMap((movement) => {
      const date = nextOccurrenceDate(movement, completedOccurrences)
      return date
        ? [
            {
              kind: 'movement',
              date,
              movement,
            },
          ]
        : []
    })
    const cardItems: ListItem[] = ledger.cycles.flatMap((cycle) => {
      const automatic = cycle.paymentMode === 'automatic'
      const total = automatic
        ? statementAmountCents(ledger, cycle.id)
        : cycle.scheduledAmountCents
      const amountCents = Math.max(0, total - cycle.paidAmountCents)
      const date = automatic ? cycle.dueDate : cycle.scheduledDate
      return amountCents > 0 && date
        ? [{ kind: 'card', date, amountCents, cycle }]
        : []
    })
    return [
      ...movementItems,
      ...cardItems,
    ].sort((a, b) => a.date.localeCompare(b.date))
  }, [
    movements,
    completedOccurrences,
    ledger,
  ])
  const visibleItems = items.filter((item) => {
    if (filter === 'all') return true
    if (item.kind === 'card') return filter === 'expense'
    return item.movement.type === filter
  })
  const filters = [
    {
      value: 'all',
      label: 'Todos',
    },
    {
      value: 'income',
      label: 'Ingresos',
    },
    {
      value: 'expense',
      label: 'Gastos',
    },
  ] as const

  function details(item: ListItem) {
    const movement = item.kind === 'movement' ? item.movement : null
    const cycle = item.kind === 'card' ? item.cycle : null
    const type = movement?.type ?? 'expense'
    const title = movement
      ? movement.description ||
        (type === 'income' ? 'Ingreso' : type === 'expense' ? 'Gasto' : 'Transferencia')
      : `Pago de ${ledger.cards.find((card) => card.id === cycle?.cardId)?.name ?? 'tarjeta'}`
    const amount = movement ? movement.amountCents : item.kind === 'card' ? item.amountCents : 0
    const accountName = movement?.accountId
      ? ledger.accounts.find((account) => account.id === movement.accountId)?.name
      : null
    const metadata = [
      item.date < todayKey ? `Pendiente desde ${displayDate(item.date)}` : displayDate(item.date),
      movement ? recurrenceLabel(movement) : 'Tarjeta de crédito',
      accountName,
    ]
      .filter(Boolean)
      .join(' · ')
    return { movement, cycle, type, title, amount, metadata }
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: muted, fontFamily: regular, fontSize: 14 }}>
          Movimientos programados
        </Text>
        {expanded && (
          <Pressable onPress={() => setExpanded(false)} accessibilityRole='button'>
            <Text style={{ color: ink, fontFamily: medium, fontSize: 12 }}>Mostrar menos</Text>
          </Pressable>
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 7,
          marginTop: 13,
          marginBottom: 3,
        }}
      >
        {filters.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setFilter(option.value)}
            accessibilityRole='button'
            accessibilityState={{
              selected: filter === option.value,
            }}
            style={{
              borderRadius: 999,
              backgroundColor: filter === option.value ? ink : '#e8e8e8',
              paddingHorizontal: 13,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: filter === option.value ? '#fff' : muted,
                fontFamily: medium,
                fontSize: 12,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {visibleItems.length === 0 ? (
        <View
          style={{
            marginTop: 9,
            minHeight: 74,
            borderRadius: 13,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              color: muted,
              fontFamily: regular,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {filter === 'income'
              ? 'Aún no hay ingresos programados'
              : filter === 'expense'
                ? 'Aún no hay gastos programados'
                : 'Aún no hay movimientos programados'}
          </Text>
        </View>
      ) : !expanded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 9, paddingBottom: 4 }}
        >
          {visibleItems.slice(0, 4).map((item) => {
            const { movement, cycle, type, title, amount } = details(item)
            return (
              <Pressable
                key={movement ? `movement-${movement.id}` : `card-${cycle?.id}`}
                onPress={() => {
                  if (movement) onEdit(movement)
                  else if (cycle) onOpenCard(cycle.cardId)
                }}
                accessibilityRole='button'
                accessibilityLabel={`${title}, ${formatShortDateKey(item.date)}, ${formatMoney(amount)}`}
                style={{
                  width: 188,
                  height: 150,
                  borderRadius: 18,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#ebebeb',
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15,
                    backgroundColor: '#f1f1f1', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name={cycle ? 'credit-card' : type === 'income' ? 'arrow-down-left'
                      : type === 'transfer' ? 'repeat' : 'arrow-up-right'} size={15} color={ink} />
                  </View>
                  <Text numberOfLines={1}
                    style={{ flex: 1, color: muted, fontFamily: medium, fontSize: 11 }}>
                    {movement ? recurrenceLabel(movement) ?? 'Único' : 'Tarjeta'}
                  </Text>
                  {movement && (
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation()
                        onDelete(movement, item.date)
                      }}
                      accessibilityRole='button'
                      accessibilityLabel={`Eliminar ${title} del ${formatShortDateKey(item.date)}`}
                      hitSlop={8}
                      style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Feather name='x' size={16} color={muted} />
                    </Pressable>
                  )}
                </View>
                <Text numberOfLines={2}
                  style={{ color: ink, fontFamily: medium, fontSize: 15, lineHeight: 20 }}>
                  {title}
                </Text>
                <View>
                  <Text numberOfLines={1}
                    style={{ color: muted, fontFamily: regular, fontSize: 11, marginBottom: 3 }}>
                    {formatShortDateKey(item.date)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ color: muted, fontFamily: regular, fontSize: 21 }}>
                      {type === 'income' ? '+' : type === 'transfer' ? '↔' : '−'}
                    </Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
                      style={{ flex: 1, color: ink, fontFamily: medium, fontSize: 21 }}>
                      {formatMoney(amount)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )
          })}
          <Pressable
            onPress={() => setExpanded(true)}
            accessibilityRole='button'
            accessibilityLabel='Ver todos los movimientos programados'
            style={{
              width: 138,
              height: 150,
              borderRadius: 18,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#ebebeb',
              paddingHorizontal: 15,
              paddingVertical: 12,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 15,
              backgroundColor: '#f1f1f1', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name='arrow-right' size={16} color={ink} />
            </View>
            <View>
              <Text style={{ color: ink, fontFamily: medium, fontSize: 15 }}>Ver todos</Text>
              {visibleItems.length > 4 && (
                <Text style={{ color: muted, fontFamily: regular, fontSize: 11, marginTop: 4 }}>
                  +{visibleItems.length - 4} más
                </Text>
              )}
            </View>
          </Pressable>
        </ScrollView>
      ) : (
        visibleItems.map((item) => {
          const { movement, cycle, type, title, amount, metadata } = details(item)
          return (
            <View
              key={movement ? `movement-${movement.id}` : `card-${cycle?.id}`}
              style={{
                marginTop: 9,
                borderRadius: 13,
                backgroundColor: '#fff',
                paddingHorizontal: 15,
                paddingTop: 14,
                paddingBottom: 11,
              }}
            >
              <Pressable
                onPress={() => {
                  if (movement) onEdit(movement)
                  else if (cycle) onOpenCard(cycle.cardId)
                }}
                accessibilityRole='button'
                accessibilityLabel={`${title}, ${type === 'income' ? 'más' : 'menos'} ${formatMoney(amount)}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    color: ink,
                    fontFamily: medium,
                    fontSize: 14,
                  }}
                >
                  {title}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    color: ink,
                    fontFamily: medium,
                    fontSize: 14,
                    maxWidth: '46%',
                  }}
                >
                  {type === 'income' ? '+' : type === 'transfer' ? '↔ ' : '−'}
                  {formatMoney(amount)}
                </Text>
              </Pressable>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 10,
                  paddingTop: 9,
                  borderTopWidth: 1,
                  borderTopColor: '#f1f1f1',
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    flex: 1,
                    color: muted,
                    fontFamily: regular,
                    fontSize: 11,
                    lineHeight: 16,
                  }}
                >
                  {metadata}
                </Text>
                {movement ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Pressable
                      onPress={() => onComplete(movement)}
                      accessibilityRole='button'
                      accessibilityLabel={`Registrar ${title} como realizado`}
                      style={{
                        width: 31,
                        height: 31,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name='check-circle' size={17} color={muted} />
                    </Pressable>
                    <Pressable
                      onPress={() => onDelete(movement, item.date)}
                      accessibilityRole='button'
                      accessibilityLabel={`Eliminar ${title}`}
                      style={{
                        width: 31,
                        height: 31,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name='trash-2' size={16} color={muted} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => cycle && onOpenCard(cycle.cardId)}
                    accessibilityRole='button'
                    accessibilityLabel={`Abrir ${title}`}
                    style={{
                      width: 31,
                      height: 31,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name='chevron-right' size={17} color={muted} />
                  </Pressable>
                )}
              </View>
            </View>
          )
        })
      )}
    </View>
  )
}
