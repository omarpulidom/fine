import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InstrumentRow } from '@/components/finance/InstrumentRow'
import { getLedger } from '@/features/finance/ledger'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const semibold = 'Inter_600SemiBold'

export default function AddInstrumentScreen() {
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
          Agregar
        </Text>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 14,
            lineHeight: 21,
            marginTop: 8,
            marginBottom: 21,
          }}
        >
          Elige qué quieres agregar. Las tarjetas de crédito muestran su deuda por separado.
        </Text>
        <InstrumentRow
          label='Cuenta'
          detail='Efectivo o banco / débito'
          icon='briefcase'
          onPress={() =>
            router.push({
              pathname: '/accounts',
              params: {
                create: '1',
              },
            })
          }
        />
        <InstrumentRow
          label='Tarjeta de crédito'
          detail={ledger.accounts.length ? 'Compras, ciclos y pagos' : 'Añade primero una cuenta'}
          icon='credit-card'
          onPress={() =>
            router.push({
              pathname: '/cards',
              params: {
                create: '1',
              },
            })
          }
          disabled={!ledger.accounts.length}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
