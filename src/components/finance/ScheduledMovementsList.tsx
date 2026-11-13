import { Feather } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { formatDateDisplay } from '@/features/finance/dates'
import type { Ledger } from '@/features/finance/ledger'
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
      cycle: Ledger['cycles'][number]
    }

type Props = {
  ledger: Ledger
  movements: ScheduledMovement[]
  completedOccurrences: ReadonlySet<string>
  todayKey: string
  onEdit: (movement: ScheduledMovement) => void
  onComplete: (movement: ScheduledMovement) => void
  onDelete: (movement: ScheduledMovement) => void
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
    const cardItems: ListItem[] = ledger.cycles.flatMap((cycle) =>
      cycle.scheduledDate && cycle.scheduledAmountCents > cycle.paidAmountCents
        ? [
            {
              kind: 'card',
              date: cycle.scheduledDate,
              cycle,
            },
          ]
        : [],
    )
    return [
      ...movementItems,
      ...cardItems,
    ].sort((a, b) => a.date.localeCompare(b.date))
  }, [
    movements,
    completedOccurrences,
    ledger.cycles,
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

  return (
    <View>
      <Text
        style={{
          color: muted,
          fontFamily: regular,
          fontSize: 14,
        }}
      >
        Movimientos programados
      </Text>
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
      ) : (
        visibleItems.map((item) => {
          const movement = item.kind === 'movement' ? item.movement : null
          const cycle = item.kind === 'card' ? item.cycle : null
          const type = movement?.type ?? 'expense'
          const title = movement
            ? movement.description ||
              (type === 'income' ? 'Ingreso' : type === 'expense' ? 'Gasto' : 'Transferencia')
            : `Pago de ${ledger.cards.find((card) => card.id === cycle?.cardId)?.name ?? 'tarjeta'}`
          const amount = movement
            ? movement.amountCents
            : (cycle?.scheduledAmountCents ?? 0) - (cycle?.paidAmountCents ?? 0)
          const accountName = movement?.accountId
            ? ledger.accounts.find((account) => account.id === movement.accountId)?.name
            : null
          const metadata = [
            item.date < todayKey
              ? `Pendiente desde ${displayDate(item.date)}`
              : displayDate(item.date),
            movement ? recurrenceLabel(movement) : 'Tarjeta de crédito',
            accountName,
          ]
            .filter(Boolean)
            .join(' · ')
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
                      onPress={() => onDelete(movement)}
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
