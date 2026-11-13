import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InstrumentRow } from '@/components/finance/InstrumentRow'
import { getAccountDesign } from '@/features/finance/accountDesigns'
import { getLedger } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const semibold = 'Inter_600SemiBold'

export default function AccountsAndCardsScreen() {
  const router = useRouter()
  const [ledger, setLedger] = useState(getLedger)
  useFocusEffect(useCallback(() => setLedger(getLedger()), []))

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
          accessibilityRole='button'
          accessibilityLabel='Volver'
          style={{
            marginTop: 18,
            marginBottom: 42,
          }}
        >
          <Feather name='arrow-left' size={23} color={ink} />
        </Pressable>
        <Text
          style={{
            fontFamily: semibold,
            fontSize: 30,
            color: ink,
          }}
        >
          Cuentas y tarjetas
        </Text>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 14,
            lineHeight: 21,
            marginTop: 8,
          }}
        >
          Consulta tus cuentas y tarjetas de crédito. La deuda de las tarjetas se muestra por
          separado.
        </Text>

        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 13,
            marginTop: 32,
          }}
        >
          Tus cuentas
        </Text>
        {ledger.accounts.map((account) => (
          <InstrumentRow
            key={account.id}
            label={account.name}
            detail={`${account.type === 'cash' ? 'Efectivo' : (getAccountDesign(account.accountDesignId)?.label ?? 'Banco / débito')} · ${formatMoney(account.balanceCents)}`}
            icon='briefcase'
            onPress={() =>
              router.push({
                pathname: '/accounts',
                params: {
                  accountId: account.id,
                },
              })
            }
          />
        ))}
        {!ledger.accounts.length && (
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 13,
              marginTop: 11,
            }}
          >
            Aún no hay cuentas.
          </Text>
        )}

        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 13,
            marginTop: 32,
          }}
        >
          Tarjetas de crédito
        </Text>
        {ledger.cards.map((card) => (
          <InstrumentRow
            key={card.id}
            label={card.name}
            detail={`Deuda ${formatMoney(card.currentDebtCents)}`}
            icon='credit-card'
            onPress={() =>
              router.push({
                pathname: '/cards',
                params: {
                  cardId: card.id,
                },
              })
            }
          />
        ))}
        {!ledger.cards.length && (
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 13,
              marginTop: 11,
            }}
          >
            Aún no hay tarjetas.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
