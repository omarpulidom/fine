import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { addMonthsKey, localDateKey } from '@/features/finance/dates'
import { getLedger } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'
import { monthlyStatistics } from '@/features/finance/statistics'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export default function StatsScreen() {
  const router = useRouter()
  const [ledger, setLedger] = useState(getLedger)
  const [month, setMonth] = useState(() => localDateKey(new Date()).slice(0, 7))
  useFocusEffect(useCallback(() => setLedger(getLedger()), []))
  const stats = monthlyStatistics(ledger, month)
  const monthLabel = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T12:00:00Z`))
  const max = Math.max(stats.incomeCents, stats.expenseCents, 1)
  const shiftMonth = (offset: number) => setMonth(addMonthsKey(`${month}-01`, offset).slice(0, 7))

  function totalRow(label: string, amountCents: number, detail?: string) {
    return (
      <View
        style={{
          padding: 18,
          backgroundColor: '#fff',
          borderRadius: 12,
          marginTop: 9,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text
            style={{
              fontFamily: medium,
              color: ink,
              fontSize: 14,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: semibold,
              color: ink,
              fontSize: 14,
            }}
          >
            {formatMoney(amountCents)}
          </Text>
        </View>
        {!!detail && (
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 12,
              marginTop: 5,
            }}
          >
            {detail}
          </Text>
        )}
      </View>
    )
  }

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
          Estadísticas
        </Text>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            marginTop: 8,
            lineHeight: 21,
          }}
        >
          Movimientos realizados y salidas de liquidez del mes.
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 28,
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Pressable onPress={() => shiftMonth(-1)} accessibilityLabel='Mes anterior' hitSlop={10}>
            <Feather name='chevron-left' size={22} color={ink} />
          </Pressable>
          <Text
            style={{
              fontFamily: medium,
              color: ink,
              fontSize: 16,
              textTransform: 'capitalize',
            }}
          >
            {monthLabel}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} accessibilityLabel='Mes siguiente' hitSlop={10}>
            <Feather name='chevron-right' size={22} color={ink} />
          </Pressable>
        </View>
        <View
          style={{
            marginTop: 20,
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 13,
            }}
          >
            Diferencia neta
          </Text>
          <Text
            style={{
              fontFamily: semibold,
              color: ink,
              fontSize: 35,
              letterSpacing: -1,
              marginTop: 7,
            }}
          >
            {formatMoney(stats.netCents)}
          </Text>
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 12,
              marginTop: 7,
            }}
          >
            Ingresos menos gastos y pagos de tarjeta realizados
          </Text>
        </View>
        <View
          style={{
            marginTop: 30,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: medium,
                color: ink,
              }}
            >
              Ingresos
            </Text>
            <Text
              style={{
                fontFamily: regular,
                color: muted,
              }}
            >
              {formatMoney(stats.incomeCents)}
            </Text>
          </View>
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e9e9e9',
              marginTop: 9,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${(stats.incomeCents / max) * 100}%`,
                height: 8,
                backgroundColor: ink,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 22,
            }}
          >
            <Text
              style={{
                fontFamily: medium,
                color: ink,
              }}
            >
              Gastos
            </Text>
            <Text
              style={{
                fontFamily: regular,
                color: muted,
              }}
            >
              {formatMoney(stats.expenseCents)}
            </Text>
          </View>
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e9e9e9',
              marginTop: 9,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${(stats.expenseCents / max) * 100}%`,
                height: 8,
                backgroundColor: '#aaa',
              }}
            />
          </View>
        </View>
        <View
          style={{
            marginTop: 34,
          }}
        >
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 13,
              marginBottom: 3,
            }}
          >
            Detalle del mes
          </Text>
          {totalRow(
            'Ingresos realizados',
            stats.incomeCents,
            `${stats.incomeCount} movimiento${stats.incomeCount === 1 ? '' : 's'}`,
          )}
          {totalRow(
            'Gastos directos',
            stats.directExpenseCents,
            `${stats.expenseCount} movimiento${stats.expenseCount === 1 ? '' : 's'}`,
          )}
          {totalRow(
            'Pagos de tarjeta',
            stats.cardPaymentsCents,
            `${stats.cardPaymentCount} pago${stats.cardPaymentCount === 1 ? '' : 's'} · incluidos en gastos`,
          )}
        </View>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 12,
            lineHeight: 18,
            marginTop: 22,
          }}
        >
          Las compras a crédito se reflejan cuando pagas la tarjeta. Las transferencias entre tus
          cuentas, movimientos programados y simulaciones no se suman aquí.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
