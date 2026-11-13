import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getLedger } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export default function AccountsAndCardsScreen() {
  const router = useRouter()
  const [ledger, setLedger] = useState(getLedger)
  useFocusEffect(useCallback(() => setLedger(getLedger()), []))

  function choice(
    label: string,
    detail: string,
    icon: 'briefcase' | 'credit-card',
    onPress: () => void,
    disabled = false,
    key?: string,
  ) {
    return (
      <Pressable
        key={key}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole='button'
        accessibilityLabel={label}
        accessibilityState={{
          disabled,
        }}
        style={{
          backgroundColor: '#fff',
          borderRadius: 13,
          padding: 16,
          marginTop: 9,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Feather
          name={icon}
          size={19}
          color={ink}
          style={{
            marginRight: 15,
          }}
        />
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              fontFamily: medium,
              color: ink,
              fontSize: 15,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: regular,
              color: muted,
              fontSize: 12,
              marginTop: 3,
            }}
          >
            {detail}
          </Text>
        </View>
        <Feather name='arrow-right' size={17} color={muted} />
      </Pressable>
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
          Elige qué quieres agregar. Las tarjetas de crédito muestran su deuda por separado.
        </Text>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 13,
            marginTop: 30,
          }}
        >
          Agregar
        </Text>
        {choice('Cuenta', 'Efectivo o banco / débito', 'briefcase', () =>
          router.push({
            pathname: '/accounts',
            params: {
              create: '1',
            },
          }),
        )}
        {choice(
          'Tarjeta de crédito',
          ledger.accounts.length ? 'Compras, ciclos y pagos' : 'Añade primero una cuenta bancaria',
          'credit-card',
          () =>
            router.push({
              pathname: '/cards',
              params: {
                create: '1',
              },
            }),
          !ledger.accounts.length,
        )}

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
        {ledger.accounts.map((account) =>
          choice(
            account.name,
            `${account.type === 'cash' ? 'Efectivo' : 'Banco / débito'} · ${formatMoney(account.balanceCents)}`,
            'briefcase',
            () =>
              router.push({
                pathname: '/accounts',
                params: {
                  accountId: account.id,
                },
              }),
            false,
            account.id,
          ),
        )}
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
        {ledger.cards.map((card) =>
          choice(
            card.name,
            `Deuda ${formatMoney(card.currentDebtCents)}`,
            'credit-card',
            () =>
              router.push({
                pathname: '/cards',
                params: {
                  cardId: card.id,
                },
              }),
            false,
            card.id,
          ),
        )}
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
