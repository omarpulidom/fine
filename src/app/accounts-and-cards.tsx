import { Feather } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Image, type ImageSourcePropType, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAccountDesign } from '@/features/finance/accountDesigns'
import { getCardDesign } from '@/features/finance/cardDesigns'
import { getLedger } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

function InstrumentListRow({
  name,
  bank,
  amountCents,
  isCreditCard,
  image,
  onPress,
}: {
  name: string
  bank: string
  amountCents: number
  isCreditCard: boolean
  image?: ImageSourcePropType | null
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`${name}, ${bank}, ${isCreditCard ? 'deuda actual' : 'saldo actual'} ${formatMoney(amountCents)}`}
      style={{
        minHeight: 78,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 13,
      }}
    >
      <View style={{
        width: 54,
        height: 35,
        borderRadius: 6,
        backgroundColor: '#ededed',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {image ? (
          <Image source={image} resizeMode='contain' style={{ width: 54, height: 35 }} />
        ) : (
          <Feather name={isCreditCard ? 'credit-card' : 'briefcase'} size={20} color={muted} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: medium, fontSize: 15, color: ink }}>
          {name}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: regular, fontSize: 12,
          color: muted, marginTop: 3 }}>
          {bank}
        </Text>
      </View>
      <View style={{ maxWidth: 112, alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: regular, fontSize: 10, color: muted }}>
          {isCreditCard ? 'Deuda actual' : 'Saldo actual'}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
          style={{ fontFamily: semibold, fontSize: 14, color: ink, marginTop: 4 }}>
          {formatMoney(amountCents)}
        </Text>
      </View>
    </Pressable>
  )
}

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
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole='button'
          accessibilityLabel='Volver'
          style={{
            marginTop: 18,
            marginBottom: 32,
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
            fontFamily: medium,
            color: muted,
            fontSize: 13,
            marginTop: 30,
            marginBottom: 10,
          }}
        >
          Tus cuentas
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 18,
          borderWidth: 1, borderColor: '#ededed', overflow: 'hidden' }}>
          {ledger.accounts.length ? ledger.accounts.map((account, index) => (
            <View key={account.id}>
              {index > 0 && <View style={{ height: 1, backgroundColor: '#f0f0f0', marginLeft: 83 }} />}
              <InstrumentListRow
                name={account.name}
                bank={account.type === 'cash' ? 'Efectivo' :
                  (getAccountDesign(account.accountDesignId)?.label ?? 'Banco no especificado')}
                amountCents={account.balanceCents}
                isCreditCard={false}
                image={getAccountDesign(account.accountDesignId)?.image}
                onPress={() => router.push({ pathname: '/accounts',
                  params: { accountId: account.id } })}
              />
            </View>
          )) : (
            <Text style={{ fontFamily: regular, color: muted, fontSize: 13, padding: 18 }}>
              Aún no hay cuentas.
            </Text>
          )}
        </View>

        <Text
          style={{
            fontFamily: medium,
            color: muted,
            fontSize: 13,
            marginTop: 26,
            marginBottom: 10,
          }}
        >
          Tarjetas de crédito
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 18,
          borderWidth: 1, borderColor: '#ededed', overflow: 'hidden' }}>
          {ledger.cards.length ? ledger.cards.map((card, index) => (
            <View key={card.id}>
              {index > 0 && <View style={{ height: 1, backgroundColor: '#f0f0f0', marginLeft: 83 }} />}
              <InstrumentListRow
                name={card.name}
                bank={getCardDesign(card.cardDesignId)?.bank ?? 'Banco no especificado'}
                amountCents={card.currentDebtCents}
                isCreditCard
                image={getCardDesign(card.cardDesignId)?.image}
                onPress={() => router.push({ pathname: '/cards',
                  params: { cardId: card.id } })}
              />
            </View>
          )) : (
            <Text style={{ fontFamily: regular, color: muted, fontSize: 13, padding: 18 }}>
              Aún no hay tarjetas.
            </Text>
          )}
        </View>
      </ScrollView>
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 12,
        backgroundColor: '#f6f6f6' }}>
        <Pressable
          onPress={() => router.push('/add-instrument')}
          accessibilityRole='button'
          accessibilityLabel='Agregar cuenta o tarjeta'
          style={{ height: 52, minWidth: 170, borderRadius: 999,
            backgroundColor: ink, flexDirection: 'row', alignItems: 'center',
            justifyContent: 'center', gap: 9, paddingHorizontal: 22 }}
        >
          <Feather name='plus' size={19} color='#fff' />
          <Text style={{ fontFamily: medium, fontSize: 15, color: '#fff' }}>Agregar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
