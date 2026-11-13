import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { localDateKey } from '@/features/finance/dates'
import {
  getLedger,
  type LiquidAccount,
  newAccountId,
  upsertAccount,
} from '@/features/finance/ledger'
import { formatMoney, formatMoneyInput, parseAmount } from '@/features/finance/money'

const INK = '#101010'
const MUTED = '#888'
const BACKGROUND = '#f6f6f6'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export default function AccountsScreen() {
  const router = useRouter()
  const { accountId, create } = useLocalSearchParams<{
    accountId?: string
    create?: string
  }>()
  const [ledger, setLedger] = useState(getLedger)
  const [editing, setEditing] = useState<LiquidAccount | null | undefined>(
    create === '1' ? null : undefined,
  )
  const [name, setName] = useState('')
  const [type, setType] = useState<LiquidAccount['type']>('bank')
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')
  const visibleAccounts = accountId
    ? [
        ...ledger.accounts,
      ].sort((left, right) => Number(right.id === accountId) - Number(left.id === accountId))
    : ledger.accounts

  function open(account: LiquidAccount | null) {
    setEditing(account)
    setName(account?.name ?? '')
    setType(account?.type ?? 'bank')
    setBalance(account ? formatMoneyInput((account.balanceCents / 100).toFixed(2)) : '')
    setError('')
  }

  function save() {
    const cents = parseAmount(balance)
    if (!name.trim() || cents === null) {
      setError('Escribe un nombre y un saldo válido.')
      return
    }
    setLedger(
      upsertAccount({
        id: editing?.id ?? newAccountId(),
        name: name.trim(),
        type,
        balanceCents: cents,
        asOfDate: editing?.asOfDate ?? localDateKey(new Date()),
      }),
    )
    setEditing(undefined)
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BACKGROUND,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 18,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole='button'
            accessibilityLabel='Volver'
          >
            <Feather name='arrow-left' size={23} color={INK} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              marginRight: 23,
              fontFamily: medium,
              fontSize: 16,
              color: INK,
            }}
          >
            Cuentas
          </Text>
        </View>
        <Text
          style={{
            marginTop: 60,
            fontFamily: semibold,
            fontSize: 31,
            color: INK,
            letterSpacing: -1,
          }}
        >
          Tu dinero disponible
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontFamily: regular,
            fontSize: 14,
            lineHeight: 21,
            color: MUTED,
          }}
        >
          Saldos actuales en efectivo y cuentas bancarias. Ajusta un saldo cuando lo reconcilies con
          tu banco.
        </Text>
        {visibleAccounts.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => open(account)}
            style={{
              marginTop: 14,
              padding: 18,
              backgroundColor: '#fff',
              borderRadius: 12,
              borderWidth: account.id === accountId ? 1.5 : 0,
              borderColor: INK,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  fontSize: 16,
                  color: INK,
                }}
              >
                {account.name}
              </Text>
              <Text
                style={{
                  fontFamily: regular,
                  fontSize: 12,
                  color: MUTED,
                  marginTop: 4,
                }}
              >
                {account.type === 'cash' ? 'Efectivo' : 'Banco / débito'}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: medium,
                color: INK,
                fontSize: 15,
                marginRight: 10,
              }}
            >
              {formatMoney(account.balanceCents)}
            </Text>
            <Feather name='chevron-right' size={17} color={MUTED} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => open(null)}
          style={{
            marginTop: 18,
            height: 52,
            backgroundColor: INK,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Feather name='plus' size={18} color='#fff' />
          <Text
            style={{
              color: '#fff',
              fontFamily: medium,
            }}
          >
            Añadir cuenta
          </Text>
        </Pressable>
      </ScrollView>
      <AppBottomSheet visible={editing !== undefined} onClose={() => setEditing(undefined)}>
        <View>
          <Text
            style={{
              fontFamily: semibold,
              color: INK,
              fontSize: 21,
            }}
          >
            {editing ? 'Editar cuenta' : 'Nueva cuenta'}
          </Text>
          <Text
            style={{
              marginTop: 24,
              fontFamily: medium,
              fontSize: 13,
              color: MUTED,
            }}
          >
            Nombre
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder='Ej. Cuenta principal'
            placeholderTextColor='#bbb'
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#ddd',
              fontFamily: regular,
              fontSize: 16,
              paddingVertical: 11,
              color: INK,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginTop: 24,
            }}
          >
            {(
              [
                'bank',
                'cash',
              ] as const
            ).map((value) => (
              <Pressable
                key={value}
                onPress={() => setType(value)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: type === value ? INK : '#f3f3f3',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: medium,
                    color: type === value ? '#fff' : INK,
                  }}
                >
                  {value === 'bank' ? 'Banco / débito' : 'Efectivo'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={{
              marginTop: 24,
              fontFamily: medium,
              fontSize: 13,
              color: MUTED,
            }}
          >
            Saldo actual
          </Text>
          <TextInput
            value={balance}
            onChangeText={(value) => setBalance(formatMoneyInput(value))}
            keyboardType='decimal-pad'
            placeholder='0.00'
            placeholderTextColor='#bbb'
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#ddd',
              fontFamily: medium,
              fontSize: 30,
              paddingVertical: 10,
              color: INK,
            }}
          />
          {!!error && (
            <Text
              style={{
                marginTop: 12,
                fontFamily: regular,
                color: '#c84242',
              }}
            >
              {error}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 28,
              gap: 10,
            }}
          >
            <Pressable
              onPress={() => setEditing(undefined)}
              style={{
                flex: 1,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  color: MUTED,
                }}
              >
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={save}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                backgroundColor: INK,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
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
