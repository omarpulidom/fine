import { Feather } from '@expo/vector-icons'
import { BottomSheetTextInput as TextInput } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import {
  type AccountDesignId,
  accountDesigns,
  getAccountDesign,
} from '@/features/finance/accountDesigns'
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
  const { width: screenWidth } = useWindowDimensions()
  const designPageWidth = screenWidth - 48
  const { accountId, create } = useLocalSearchParams<{
    accountId?: string
    create?: string
  }>()
  const [ledger, setLedger] = useState(getLedger)
  const [editing, setEditing] = useState<LiquidAccount | null | undefined>(
    create === '1' ? null : undefined,
  )
  const [accountStep, setAccountStep] = useState<'details' | 'design'>('details')
  const [selectedDesignId, setSelectedDesignId] = useState<AccountDesignId | null>(null)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')
  const visibleAccounts = accountId
    ? [
        ...ledger.accounts,
      ].sort((left, right) => Number(right.id === accountId) - Number(left.id === accountId))
    : ledger.accounts

  function open(account: LiquidAccount | null) {
    setEditing(account)
    setAccountStep('details')
    setSelectedDesignId(
      account ? (account.type === 'cash' ? 'cash' : (account.accountDesignId ?? 'other')) : null,
    )
    setName(account?.name ?? '')
    setBalance(account ? formatMoneyInput((account.balanceCents / 100).toFixed(2)) : '')
    setError('')
  }

  function nextAccountStep() {
    const cents = parseAmount(balance)
    if (!name.trim() || cents === null) {
      setError('Escribe un nombre y un saldo válido.')
      return
    }
    Keyboard.dismiss()
    setError('')
    setAccountStep('design')
  }

  function save() {
    const cents = parseAmount(balance)
    if (!name.trim() || cents === null) {
      setError('Escribe un nombre y un saldo válido.')
      return
    }
    if (!selectedDesignId) {
      setError('Selecciona un banco o «Efectivo».')
      return
    }
    try {
      setLedger(
        upsertAccount({
          id: editing?.id ?? newAccountId(),
          name: name.trim(),
          type: selectedDesignId === 'cash' ? 'cash' : 'bank',
          accountDesignId: selectedDesignId,
          balanceCents: cents,
          asOfDate: editing?.asOfDate ?? localDateKey(new Date()),
        }),
      )
      setEditing(undefined)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la cuenta.')
    }
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
                {account.type === 'cash'
                  ? 'Efectivo'
                  : (getAccountDesign(account.accountDesignId)?.label ?? 'Banco / débito')}
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
            {accountStep === 'design'
              ? 'Elige tu cuenta'
              : editing
                ? 'Editar cuenta'
                : 'Nueva cuenta'}
          </Text>
          {accountStep === 'details' && (
            <>
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
            </>
          )}
          {accountStep === 'design' && (
            <View
              style={{
                marginTop: 16,
              }}
            >
              <Text
                style={{
                  fontFamily: regular,
                  fontSize: 14,
                  color: MUTED,
                  marginBottom: 14,
                }}
              >
                Desliza o toca una opción para elegir cómo se verá en tu cartera.
              </Text>
              <ScrollView
                horizontal
                pagingEnabled
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{
                  x:
                    Math.max(
                      0,
                      accountDesigns.findIndex((design) => design.id === selectedDesignId),
                    ) * designPageWidth,
                  y: 0,
                }}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / designPageWidth)
                  const design = accountDesigns[index]
                  if (design) {
                    setSelectedDesignId(design.id)
                    setError('')
                  }
                }}
              >
                {accountDesigns.map((design) => (
                  <View
                    key={design.id}
                    style={{
                      width: designPageWidth,
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                    }}
                  >
                    <View
                      style={{
                        width: '100%',
                        aspectRatio: 817 / 511,
                        borderRadius: 16,
                        backgroundColor: '#fff',
                        shadowColor: '#000',
                        shadowOffset: {
                          width: 0,
                          height: 6,
                        },
                        shadowOpacity: 0.12,
                        shadowRadius: 14,
                        elevation: 5,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          setSelectedDesignId(design.id)
                          setError('')
                        }}
                        accessibilityRole='button'
                        accessibilityLabel={`Seleccionar ${design.label}`}
                        accessibilityState={{
                          selected: selectedDesignId === design.id,
                        }}
                        style={{
                          flex: 1,
                          borderRadius: 16,
                          overflow: 'hidden',
                        }}
                      >
                        {design.image ? (
                          <Image
                            source={design.image}
                            resizeMode='cover'
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: design.id === 'cash' ? '#f1f1f1' : '#e8e8e8',
                              justifyContent: 'space-between',
                              padding: 22,
                            }}
                          >
                            <Feather
                              name={design.id === 'cash' ? 'dollar-sign' : 'credit-card'}
                              size={30}
                              color={INK}
                            />
                            <Text
                              style={{
                                fontFamily: medium,
                                color: INK,
                                fontSize: 18,
                              }}
                            >
                              {design.id === 'cash' ? 'Efectivo' : 'Mi cuenta'}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
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
              onPress={() => {
                if (accountStep === 'design') {
                  setAccountStep('details')
                  setError('')
                } else {
                  setEditing(undefined)
                }
              }}
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
                {accountStep === 'design' ? 'Atrás' : 'Cancelar'}
              </Text>
            </Pressable>
            <Pressable
              onPress={accountStep === 'details' ? nextAccountStep : save}
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
                {accountStep === 'details' ? 'Siguiente' : 'Guardar'}
              </Text>
            </Pressable>
          </View>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  )
}
