import { Feather } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import type { CreditCard, LiquidAccount } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'

type Props = {
  accounts: LiquidAccount[]
  cards: CreditCard[]
  balanceCents: number | null
  onSelectAccount: (id: string) => void
  onSelectCard: (id: string) => void
  onAddAccount: () => void
  onAddCard: () => void
  onSimulate: () => void
  onStatistics: () => void
  onHistory: () => void
  onRegisterMovement: () => void
}

const ink = '#101010'
const muted = '#858585'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export function AccountsHub({
  accounts,
  cards,
  balanceCents,
  onSelectAccount,
  onSelectCard,
  onAddAccount,
  onAddCard,
  onSimulate,
  onStatistics,
  onHistory,
  onRegisterMovement,
}: Props) {
  const { width } = useWindowDimensions()
  const [expanded, setExpanded] = useState(false)
  const progress = useSharedValue(0)
  const available = width - 48
  const gap = 16
  const walletWidth = (available - gap) / 2
  const actionsWidth = walletWidth
  const actionSize = Math.min(50, Math.floor((actionsWidth - 10) / 2))
  const frontTop = walletWidth * 0.44
  const tabPath = `M 0 30 L 0 22 H 18 Q 26 22 33 17 L 45 7 Q 50 2 57 2 H ${walletWidth - 57} Q ${walletWidth - 50} 2 ${walletWidth - 45} 7 L ${walletWidth - 33} 17 Q ${walletWidth - 26} 22 ${walletWidth - 18} 22 H ${walletWidth} V 30 Z`
  const entryCount = accounts.length + cards.length + 1 + Number(accounts.length > 0)
  const expandedHeight = Math.min(entryCount * 70 + 8, 292)
  const panelStyle = useAnimatedStyle(
    () => ({
      height: progress.value * expandedHeight,
      opacity: progress.value,
    }),
    [
      expandedHeight,
    ],
  )
  const cardsStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * 36,
      },
    ],
  }))

  function toggle() {
    const next = !expanded
    setExpanded(next)
    progress.value = withTiming(next ? 1 : 0, {
      duration: 290,
      reduceMotion: ReduceMotion.System,
    })
  }

  function select(callback: () => void) {
    setExpanded(false)
    progress.value = 0
    callback()
  }

  const actions = [
    {
      key: 'simulate',
      icon: 'activity',
      label: 'Simular compra',
      onPress: onSimulate,
    },
    {
      key: 'statistics',
      icon: 'bar-chart-2',
      label: 'Estadísticas',
      onPress: onStatistics,
    },
    {
      key: 'history',
      icon: 'clock',
      label: 'Historial de movimientos',
      onPress: onHistory,
    },
    {
      key: 'register',
      icon: 'plus',
      label: 'Registrar movimiento',
      onPress: onRegisterMovement,
    },
  ] as const

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap,
        marginTop: 32,
      }}
    >
      <View
        style={{
          width: actionsWidth,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            accessibilityRole='button'
            accessibilityLabel={action.label}
            hitSlop={4}
            style={{
              width: actionSize,
              height: actionSize,
              borderRadius: actionSize / 2,
              backgroundColor: '#dedede',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather
              name={action.icon}
              size={Math.max(17, Math.min(21, actionSize * 0.4))}
              color={ink}
            />
          </Pressable>
        ))}
      </View>
      <View
        style={{
          width: walletWidth,
        }}
      >
        <Animated.View
          pointerEvents={expanded ? 'auto' : 'none'}
          style={[
            {
              overflow: 'hidden',
            },
            panelStyle,
          ]}
        >
          <Animated.View style={cardsStyle}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={{
                maxHeight: expandedHeight,
              }}
              contentContainerStyle={{
                paddingBottom: 8,
              }}
            >
              {accounts.map((account) => (
                <Pressable
                  key={`account-${account.id}`}
                  onPress={() => select(() => onSelectAccount(account.id))}
                  accessibilityRole='button'
                  accessibilityLabel={`${account.name}, ${formatMoney(account.balanceCents)}`}
                  style={{
                    height: 64,
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    paddingHorizontal: 11,
                    marginBottom: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Feather
                    name={account.type === 'cash' ? 'dollar-sign' : 'briefcase'}
                    size={17}
                    color={ink}
                    style={{
                      marginRight: 9,
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: medium,
                        color: ink,
                        fontSize: 12,
                      }}
                    >
                      {account.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: regular,
                        color: muted,
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      {formatMoney(account.balanceCents)}
                    </Text>
                  </View>
                </Pressable>
              ))}
              {cards.map((card) => (
                <Pressable
                  key={`card-${card.id}`}
                  onPress={() => select(() => onSelectCard(card.id))}
                  accessibilityRole='button'
                  accessibilityLabel={`${card.name}, deuda ${formatMoney(card.currentDebtCents)}`}
                  style={{
                    height: 64,
                    backgroundColor: '#e9e9e9',
                    borderRadius: 14,
                    paddingHorizontal: 11,
                    marginBottom: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Feather
                    name='credit-card'
                    size={17}
                    color={ink}
                    style={{
                      marginRight: 9,
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: medium,
                        color: ink,
                        fontSize: 12,
                      }}
                    >
                      {card.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: regular,
                        color: muted,
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      Deuda {formatMoney(card.currentDebtCents)}
                    </Text>
                  </View>
                </Pressable>
              ))}
              <Pressable
                onPress={() => select(onAddAccount)}
                accessibilityRole='button'
                accessibilityLabel='Añadir cuenta'
                style={{
                  height: 64,
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  paddingHorizontal: 11,
                  marginBottom: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Feather
                  name='plus'
                  size={17}
                  color={ink}
                  style={{
                    marginRight: 9,
                  }}
                />
                <Text
                  style={{
                    fontFamily: medium,
                    color: ink,
                    fontSize: 12,
                  }}
                >
                  Añadir cuenta
                </Text>
              </Pressable>
              {!!accounts.length && (
                <Pressable
                  onPress={() => select(onAddCard)}
                  accessibilityRole='button'
                  accessibilityLabel='Añadir tarjeta'
                  style={{
                    height: 64,
                    backgroundColor: '#e9e9e9',
                    borderRadius: 14,
                    paddingHorizontal: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Feather
                    name='plus'
                    size={17}
                    color={ink}
                    style={{
                      marginRight: 9,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: medium,
                      color: ink,
                      fontSize: 12,
                    }}
                  >
                    Añadir tarjeta
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
        <Pressable
          onPress={toggle}
          accessibilityRole='button'
          accessibilityLabel={expanded ? 'Ocultar cuentas' : 'Mostrar cuentas y tarjetas'}
          accessibilityState={{
            expanded,
          }}
          style={{
            width: walletWidth,
            height: walletWidth,
            borderRadius: 21,
            backgroundColor: ink,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 12,
              right: 12,
              height: walletWidth * 0.4,
              backgroundColor: '#7c87bf',
              borderRadius: 15,
              alignItems: 'flex-end',
              padding: 10,
            }}
          >
            <Feather name='credit-card' size={16} color='#fff' />
          </View>
          <View
            style={{
              position: 'absolute',
              top: walletWidth * 0.24,
              left: 12,
              right: 12,
              height: walletWidth * 0.38,
              backgroundColor: '#f5f5f5',
              borderRadius: 15,
              alignItems: 'flex-end',
              padding: 10,
            }}
          >
            <Feather name='briefcase' size={15} color={ink} />
          </View>
          <Svg
            width={walletWidth}
            height={30}
            pointerEvents='none'
            style={{
              position: 'absolute',
              top: frontTop - 22,
              left: 0,
            }}
          >
            <Path d={tabPath} fill={ink} />
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: frontTop,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: ink,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              justifyContent: 'flex-end',
              padding: 12,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              style={{
                fontFamily: semibold,
                fontSize: 22,
                color: '#fff',
                letterSpacing: -0.7,
              }}
            >
              {balanceCents === null ? '—' : formatMoney(balanceCents)}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: regular,
                fontSize: 10,
                color: '#adadad',
                marginTop: 3,
              }}
            >
              {balanceCents === null ? 'Añadir primera cuenta' : 'Saldo disponible'}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  )
}
