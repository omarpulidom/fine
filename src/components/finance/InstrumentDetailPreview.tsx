import { Feather } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { getAccountDesign } from '@/features/finance/accountDesigns'
import { getCardDesign } from '@/features/finance/cardDesigns'
import { formatShortDateKey, localDateKey } from '@/features/finance/dates'
import { type BillingCycle, type Ledger, statementAmountCents } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'
import type { Instrument } from './InstrumentCardCarousel'
import { InstrumentDetailHeader } from './InstrumentDetailHeader'

function comparePaymentCycles(left: BillingCycle, right: BillingCycle, todayKey: string): number {
  const leftUpcoming = left.dueDate >= todayKey
  const rightUpcoming = right.dueDate >= todayKey
  if (leftUpcoming !== rightUpcoming) return leftUpcoming ? -1 : 1
  return leftUpcoming
    ? left.dueDate.localeCompare(right.dueDate)
    : right.dueDate.localeCompare(left.dueDate)
}

export function InstrumentDetailPreview({
  ledger,
  instrument,
}: {
  ledger: Ledger
  instrument: Instrument
}) {
  const account =
    instrument.kind === 'account'
      ? ledger.accounts.find((item) => item.id === instrument.id)
      : undefined
  const card =
    instrument.kind === 'card' ? ledger.cards.find((item) => item.id === instrument.id) : undefined
  if (!account && !card) return null

  const accountDesign = account ? getAccountDesign(account.accountDesignId) : undefined
  const cardDesign = card ? getCardDesign(card.cardDesignId) : undefined
  const todayKey = localDateKey(new Date())
  const cardCycles = card
    ? ledger.cycles
        .filter((cycle) => cycle.cardId === card.id)
        .sort((left, right) => right.cutoffDate.localeCompare(left.cutoffDate))
    : []
  const purchaseCycle = [
    ...cardCycles,
  ]
    .reverse()
    .find((cycle) => cycle.cutoffDate >= todayKey)
  const paymentCycle = cardCycles
    .filter((cycle) => statementAmountCents(ledger, cycle.id) > cycle.paidAmountCents)
    .sort((left, right) => comparePaymentCycles(left, right, todayKey))[0]
  const nextPaymentCycle = [
    ...cardCycles,
  ]
    .filter(
      (cycle) =>
        cycle.dueDate >= todayKey &&
        (cycle.paymentMode === 'automatic'
          ? statementAmountCents(ledger, cycle.id)
          : cycle.scheduledAmountCents) > cycle.paidAmountCents,
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0]
  const nextCycle = nextPaymentCycle ?? purchaseCycle ?? paymentCycle
  const activity = account
    ? ledger.completedMovements
        .filter(
          (item) => item.accountId === account.id || item.counterpartyAccountId === account.id,
        )
        .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate))
        .map((item) => ({
          id: item.id,
          description:
            item.description ||
            (item.type === 'income'
              ? 'Ingreso'
              : item.type === 'expense'
                ? 'Gasto'
                : 'Transferencia'),
          date: item.effectiveDate,
          amountCents: item.amountCents,
          positive: item.type === 'income',
          icon:
            item.type === 'income'
              ? ('arrow-down-left' as const)
              : item.type === 'expense'
                ? ('arrow-up-right' as const)
                : ('repeat' as const),
          subtitle: formatShortDateKey(item.effectiveDate),
          sign: item.type === 'transfer' ? '↔' : item.type === 'income' ? '+' : '−',
        }))
    : ledger.cardActivity
        .filter((item) => item.cardId === card?.id)
        .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate))
        .map((item) => ({
          id: item.id,
          description: item.description || (item.type === 'purchase' ? 'Compra' : 'Pago realizado'),
          date: item.effectiveDate,
          amountCents: item.amountCents,
          positive: item.type === 'payment',
          icon: item.type === 'purchase' ? ('shopping-bag' as const) : ('arrow-down-left' as const),
          subtitle: `${formatShortDateKey(item.effectiveDate)} · ${
            item.installments
              ? `${item.installments.length} MSI · Cambiar plan`
              : item.type === 'purchase'
                ? 'Cambiar ciclo'
                : 'Pago'
          }`,
          sign: item.type === 'purchase' ? '−' : '+',
        }))

  return (
    <View pointerEvents='none'>
      <InstrumentDetailHeader
        name={account?.name ?? card?.name ?? ''}
        bank={
          account
            ? account.type === 'cash'
              ? 'Efectivo'
              : (accountDesign?.label ?? 'Banco no especificado')
            : (cardDesign?.bank ?? 'Banco no especificado')
        }
        amountCents={account?.balanceCents ?? card?.currentDebtCents ?? 0}
        isCreditCard={Boolean(card)}
        showImage={false}
        actions={
          account
            ? [
                {
                  label: 'Movimientos',
                  icon: 'list',
                  onPress: () => {},
                },
                {
                  label: 'Editar',
                  icon: 'edit-2',
                  onPress: () => {},
                },
                {
                  label: 'Eliminar',
                  icon: 'trash-2',
                  onPress: () => {},
                },
              ]
            : [
                {
                  label: 'Compra',
                  icon: 'shopping-bag',
                  onPress: () => {},
                  disabled: !purchaseCycle,
                },
                {
                  label: 'Pago',
                  icon: 'dollar-sign',
                  onPress: () => {},
                  disabled: !paymentCycle,
                },
                {
                  label: 'Ajustes',
                  icon: 'settings',
                  onPress: () => {},
                },
              ]
        }
      />
      {card && !card.billingRule && (
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            color: '#101010',
            fontSize: 13,
            alignSelf: 'flex-end',
            paddingVertical: 8,
          }}
        >
          + Ciclo
        </Text>
      )}
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: account ? 4 : 0,
          marginTop: card ? 10 : 0,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            color: '#888',
            fontSize: 13,
            marginTop: account ? 16 : 17,
            marginBottom: account ? 4 : 6,
          }}
        >
          {account ? 'Movimientos recientes' : 'Actividad reciente'}
        </Text>
        {activity.length ? (
          activity.slice(0, 3).map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 68,
                gap: card ? 10 : 12,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#f0f0f0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name={item.icon} size={card ? 17 : 18} color='#101010' />
              </View>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    color: '#101010',
                  }}
                >
                  {item.description}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    color: '#888',
                    marginTop: 3,
                  }}
                >
                  {item.subtitle}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: '#101010',
                }}
              >
                {item.sign}
                {formatMoney(item.amountCents)}
              </Text>
              {card && <Feather name='trash-2' size={16} color='#888' />}
            </View>
          ))
        ) : (
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 13,
              color: '#888',
              paddingVertical: 20,
            }}
          >
            Aún no hay movimientos.
          </Text>
        )}
        {activity.length > 3 && (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: '#101010',
              textAlign: 'center',
              paddingVertical: 16,
            }}
          >
            Ver todos
          </Text>
        )}
      </View>
      {nextCycle && (
        <View
          style={{
            marginTop: 10,
            padding: 16,
            backgroundColor: '#fff',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                color: '#888',
                fontSize: 12,
              }}
            >
              {nextCycle.cutoffDate < todayKey ? 'Próximo pago' : 'Siguiente corte'}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                color: '#101010',
                fontSize: 22,
                marginTop: 4,
              }}
            >
              {formatMoney(
                Math.max(
                  0,
                  (nextCycle.paymentMode === 'automatic'
                    ? statementAmountCents(ledger, nextCycle.id)
                    : nextCycle.scheduledAmountCents) - nextCycle.paidAmountCents,
                ),
              )}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                color: '#888',
                fontSize: 12,
                marginTop: 4,
              }}
            >
              Corte {formatShortDateKey(nextCycle.cutoffDate)} · Pago{' '}
              {formatShortDateKey(
                nextCycle.paymentMode === 'automatic'
                  ? nextCycle.dueDate
                  : (nextCycle.scheduledDate ?? nextCycle.dueDate),
              )}
              {nextCycle.automatic && !nextCycle.dueDateConfirmed ? ' estimado' : ''}
            </Text>
          </View>
          <Feather name='edit-2' size={17} color='#888' />
        </View>
      )}
    </View>
  )
}
