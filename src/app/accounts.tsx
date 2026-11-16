import * as Icon from '@/components/ui/PhosphorIcons'
import { FinanceIcon } from '@/components/ui/FinanceIcon'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSharedValue } from 'react-native-reanimated'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { InstrumentCardCarousel } from '@/components/finance/InstrumentCardCarousel'
import type { Instrument } from '@/components/finance/InstrumentCardCarousel'
import { InstrumentDetailHeader } from '@/components/finance/InstrumentDetailHeader'
import { InstrumentDetailMorph } from '@/components/finance/InstrumentDetailMorph'
import { useInstrumentDetailTransition } from '@/components/finance/InstrumentDetailTransition'
import {
  type AccountDesignId,
  accountDesigns,
  getAccountDesign,
} from '@/features/finance/accountDesigns'
import { formatShortDateKey, localDateKey } from '@/features/finance/dates'
import {
  deleteAccount,
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
  const { accountId, create, swipe, fromList, returnTo } = useLocalSearchParams<{
    accountId?: string
    create?: string
    swipe?: string
    fromList?: string
    returnTo?: string
  }>()
  const { hasListOrigin, closeToList } = useInstrumentDetailTransition()
  const [ledger, setLedger] = useState(getLedger)
  const [pendingDeletion, setPendingDeletion] = useState<{ id: string; target: Instrument } | null>(null)
  useFocusEffect(useCallback(() => setLedger(getLedger()), []))
  const [editing, setEditing] = useState<LiquidAccount | null | undefined>(
    create === '1' ? null : undefined,
  )
  const [accountStep, setAccountStep] = useState<'details' | 'design'>('details')
  const [selectedDesignId, setSelectedDesignId] = useState<AccountDesignId | null>(null)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')
  const [showAllHistory, setShowAllHistory] = useState(false)
  const FormTextInput = create === '1' ? TextInput : BottomSheetTextInput
  const progress = useSharedValue(Math.max(0,
    ledger.accounts.findIndex((account) => account.id === accountId)))
  const selectedAccount = ledger.accounts.find((account) => account.id === accountId)
  const history = ledger.completedMovements
    .filter((movement) => movement.accountId === accountId ||
      movement.counterpartyAccountId === accountId)
    .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate))

  function closeDetail() {
    if (selectedAccount && hasListOrigin && closeToList({
      instrument: { kind: 'account', id: selectedAccount.id },
      name: selectedAccount.name,
      image: getAccountDesign(selectedAccount.accountDesignId)?.image,
      navigate: () => router.back(),
    })) return
    if (returnTo === 'movements') router.dismissTo('/movements')
    else if (create === '1' || returnTo === 'accounts-and-cards') router.dismissTo('/accounts-and-cards')
    else if (accountId) router.back()
    else router.replace('/accounts-and-cards')
  }

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
    setSelectedDesignId((current) => current ?? accountDesigns[0]?.id ?? null)
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
      const savedId = editing?.id ?? newAccountId()
      setLedger(
        upsertAccount({
          id: savedId,
          name: name.trim(),
          type: selectedDesignId === 'cash' ? 'cash' : 'bank',
          accountDesignId: selectedDesignId,
          balanceCents: cents,
          asOfDate: editing?.asOfDate ?? localDateKey(new Date()),
        }),
      )
      setEditing(undefined)
      if (!editing) router.replace({
        pathname: '/accounts',
        params: {
          accountId: savedId,
          ...(create === '1' ? { returnTo: returnTo ?? 'accounts-and-cards' } : {}),
        },
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la cuenta.')
    }
  }

  function confirmDeleteAccount(account: LiquidAccount) {
    Alert.alert(
      'Eliminar cuenta',
      `Se eliminará «${account.name}» y su saldo de la cartera. Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              const instruments: Instrument[] = [
                ...ledger.accounts.map((item) => ({ id: item.id, kind: 'account' as const })),
                ...ledger.cards.map((item) => ({ id: item.id, kind: 'card' as const })),
              ]
              const index = instruments.findIndex((item) => item.id === account.id && item.kind === 'account')
              const target = instruments[index + 1] ?? instruments[index - 1]
              if (target && selectedAccount?.id === account.id) {
                setPendingDeletion({ id: account.id, target })
              } else {
                setLedger(deleteAccount(account.id))
                setEditing(undefined)
                if (!target) router.dismissTo('/accounts-and-cards')
              }
            } catch (caught) {
              Alert.alert(
                'No se puede eliminar',
                caught instanceof Error ? caught.message : 'Inténtalo de nuevo.',
              )
            }
          },
        },
      ],
    )
  }

  function renderAccountForm() {
    return (
        <View>
          <Text
            style={{
              fontFamily: semibold,
              color: INK,
              fontSize: create === '1' ? 28 : 21,
              marginTop: create === '1' ? 12 : 0,
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
                <FormTextInput
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
              <FormTextInput
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
                            <FinanceIcon
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
                  if (create === '1') router.back()
                  else setEditing(undefined)
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
          {editing && accountStep === 'details' && (
            <Pressable
              onPress={() => confirmDeleteAccount(editing)}
              accessibilityRole='button'
              accessibilityLabel={`Eliminar cuenta ${editing.name}`}
              style={{
                alignSelf: 'center',
                marginTop: 18,
                padding: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: medium,
                  fontSize: 13,
                  color: '#c84242',
                }}
              >
                Eliminar cuenta
              </Text>
            </Pressable>
          )}
        </View>
    )
  }

  return (
    <>
    <Stack.Screen options={{ animation: swipe === '1' || fromList === '1' || hasListOrigin
      ? 'none' : 'default' }} />
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BACKGROUND,
      }}
    >
      <View style={{ height: 70, paddingHorizontal: 24, justifyContent: 'center' }}>
        <Pressable
          onPress={closeDetail}
          accessibilityRole='button'
          accessibilityLabel='Cerrar detalle'
          style={{ alignSelf: 'flex-start', padding: 3 }}
        >
          <Icon.XIcon size={23} color={INK} />
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: BACKGROUND }}
        nestedScrollEnabled
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
      >
        {!!accountId && (
          <InstrumentCardCarousel ledger={ledger} instrumentId={accountId} kind='account'
            progress={progress} transitionTo={pendingDeletion?.target} returnTo={returnTo}
            onTransitionEnd={() => {
              if (!pendingDeletion) return
              const { id, target } = pendingDeletion
              try {
                setLedger(deleteAccount(id))
                setEditing(undefined)
                setPendingDeletion(null)
                if (target.kind === 'account') router.setParams({ accountId: target.id })
                else router.replace({ pathname: '/cards', params: { cardId: target.id, swipe: '1', ...(returnTo ? { returnTo } : {}) } })
              } catch (caught) {
                setPendingDeletion(null)
                Alert.alert('No se puede eliminar', caught instanceof Error ? caught.message : 'Inténtalo de nuevo.')
              }
            }} />
        )}
        {selectedAccount ? (
          <InstrumentDetailMorph ledger={ledger} instrumentId={selectedAccount.id}
            kind='account' progress={progress}>
            <View>
            <InstrumentDetailHeader
              name={selectedAccount.name}
              bank={selectedAccount.type === 'cash' ? 'Efectivo' :
                (getAccountDesign(selectedAccount.accountDesignId)?.label ?? 'Banco no especificado')}
              amountCents={selectedAccount.balanceCents}
              isCreditCard={false}
              image={getAccountDesign(selectedAccount.accountDesignId)?.image}
              showImage={false}
              actions={[
                { label: 'Movimientos', icon: 'list', onPress: () => router.push('/movements') },
                { label: 'Editar', icon: 'edit-2', onPress: () => open(selectedAccount) },
                { label: 'Eliminar', icon: 'trash-2',
                  onPress: () => confirmDeleteAccount(selectedAccount) },
              ]}
            />
            <View style={{ backgroundColor: history.length ? '#fff' : 'transparent',
              borderRadius: history.length ? 18 : 0,
              paddingHorizontal: history.length ? 16 : 0,
              paddingVertical: history.length ? 4 : 0 }}>
              <Text style={{ fontFamily: medium, color: INK, fontSize: 16,
                marginTop: 16, marginBottom: 4 }}>Historial</Text>
              {history.length ? (showAllHistory ? history : history.slice(0, 3)).map((movement) => (
                <View key={movement.id} style={{ flexDirection: 'row', alignItems: 'center',
                  minHeight: 68, gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19,
                    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
                    <FinanceIcon name={movement.type === 'income' ? 'arrow-down-left' :
                      movement.type === 'expense' ? 'arrow-up-right' : 'repeat'}
                      size={18} color={INK} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontFamily: medium, fontSize: 14,
                      color: INK }}>{movement.description ||
                        (movement.type === 'income' ? 'Ingreso' :
                          movement.type === 'expense' ? 'Gasto' : 'Transferencia')}</Text>
                    <Text style={{ fontFamily: regular, fontSize: 12, color: MUTED,
                      marginTop: 3 }}>{formatShortDateKey(movement.effectiveDate)}</Text>
                  </View>
                  <Text style={{ fontFamily: medium, fontSize: 13, color: INK }}>
                    {movement.type === 'income' ? '+' : movement.type === 'expense' ? '−' : '↔'}
                    {formatMoney(movement.amountCents)}
                  </Text>
                </View>
              )) : (
                <EmptyState message='Los ingresos y gastos de esta cuenta aparecerán aquí.' />
              )}
              {history.length > 3 && (
                <Pressable onPress={() => setShowAllHistory((current) => !current)}
                  style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={{ fontFamily: medium, fontSize: 13, color: INK }}>
                    {showAllHistory ? 'Mostrar menos' : 'Ver todos'}
                  </Text>
                </Pressable>
              )}
            </View>
            </View>
          </InstrumentDetailMorph>
        ) : create === '1' ? (
          renderAccountForm()
        ) : (
          <View>
            <Text style={{ fontFamily: semibold, fontSize: 28, color: INK,
              marginTop: 12 }}>Cuenta no disponible</Text>
            <Text style={{ fontFamily: regular, color: MUTED,
              marginTop: 12 }}>Vuelve a Cuentas y tarjetas para elegir otra cuenta.</Text>
          </View>
        )}
      </ScrollView>
      {create !== '1' && (
        <AppBottomSheet visible={editing !== undefined} onClose={() => setEditing(undefined)}>
          {renderAccountForm()}
        </AppBottomSheet>
      )}
    </SafeAreaView>
    </>
  )
}
