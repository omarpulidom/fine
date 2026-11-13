import { Feather } from '@expo/vector-icons'
import { useState } from 'react'
import { Image, Pressable, Text, useWindowDimensions, View } from 'react-native'
import Animated, {
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { type AccountDesignId, getAccountDesign } from '@/features/finance/accountDesigns'
import { type CardDesignId, getCardDesign } from '@/features/finance/cardDesigns'
import type { CreditCard, LiquidAccount } from '@/features/finance/ledger'
import { formatMoney } from '@/features/finance/money'

type Props = {
  accounts: LiquidAccount[]
  cards: CreditCard[]
  balanceCents: number | null
  onSelectAccount: (id: string) => void
  onSelectCard: (id: string) => void
  onAdd: () => void
  onSimulate: () => void
  onStatistics: () => void
  onHistory: () => void
  onRegisterMovement: () => void
}

type WalletEntry = {
  id: string
  kind: 'account' | 'card'
  name: string
  amountCents: number
  icon: 'briefcase' | 'dollar-sign' | 'credit-card'
  cardDesignId?: CardDesignId
  accountDesignId?: AccountDesignId
}

const ink = '#101010'
const medium = 'Inter_500Medium'
const regular = 'Inter_400Regular'
const semibold = 'Inter_600SemiBold'
const hubTopMargin = 0
const liftSpace = 64
const actionRowGap = 16
const walletHeightRatio = 0.66

function getActionSize(width: number) {
  return Math.min(50, Math.floor((width - 36) / 4))
}

export function getAccountsHubHeight(width: number) {
  return hubTopMargin + liftSpace + width * walletHeightRatio + actionRowGap + getActionSize(width)
}

function WalletInstrumentCard({
  entry,
  index,
  color,
  iconColor,
  baseTop,
  lift,
  width,
  liftSpace,
  expanded,
  progress,
  onPress,
}: {
  entry: WalletEntry
  index: number
  color: string
  iconColor: string
  baseTop: number
  lift: number
  width: number
  liftSpace: number
  expanded: boolean
  progress: SharedValue<number>
  onPress: () => void
}) {
  const cardImage =
    entry.kind === 'card'
      ? getCardDesign(entry.cardDesignId)?.image
      : getAccountDesign(entry.accountDesignId)?.image
  const animatedStyle = useAnimatedStyle(
    () => ({
      height: width * (index === 0 ? 0.4 : 0.38) + 42 * progress.value,
      transform: [
        {
          translateY: -lift * progress.value,
        },
      ],
    }),
    [
      lift,
      width,
      index,
    ],
  )

  return (
    <Animated.View
      pointerEvents={expanded ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          top: liftSpace + baseTop,
          left: 12,
          width: width - 24,
          zIndex: index + 2,
          backgroundColor: color,
          borderRadius: 15,
          overflow: 'hidden',
        },
        animatedStyle,
      ]}
    >
      <Pressable
        pointerEvents={expanded ? 'auto' : 'none'}
        onPress={onPress}
        accessibilityRole='button'
        accessibilityLabel={`${entry.name}, ${formatMoney(entry.amountCents)}`}
        style={{
          flex: 1,
          alignItems: 'flex-end',
          padding: 10,
        }}
      >
        {cardImage ? (
          <Image
            source={cardImage}
            resizeMode='cover'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: width - 24,
              height: ((width - 24) * 511) / 817,
              borderRadius: 15,
            }}
          />
        ) : (
          <Feather name={entry.icon} size={index === 0 ? 16 : 15} color={iconColor} />
        )}
      </Pressable>
    </Animated.View>
  )
}

export function AccountsHub({
  accounts,
  cards,
  balanceCents,
  onSelectAccount,
  onSelectCard,
  onAdd,
  onSimulate,
  onStatistics,
  onHistory,
  onRegisterMovement,
}: Props) {
  const { width } = useWindowDimensions()
  const [expanded, setExpanded] = useState(false)
  const progress = useSharedValue(0)
  const available = width - 48
  const walletWidth = available
  const actionSize = getActionSize(walletWidth)
  const actionGap = Math.min(20, (walletWidth - actionSize * 4) / 3)
  const walletHeight = walletWidth * walletHeightRatio
  const visibleCards = cards.slice(accounts.length ? -2 : -3)
  const visibleAccounts = accounts.slice(-(3 - visibleCards.length))
  const productSummary = [
    accounts.length ? `${accounts.length} ${accounts.length === 1 ? 'cuenta' : 'cuentas'}` : null,
    cards.length ? `${cards.length} ${cards.length === 1 ? 'tarjeta' : 'tarjetas'}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const visibleEntries: WalletEntry[] = [
    ...visibleCards.map(
      (card): WalletEntry => ({
        id: card.id,
        kind: 'card',
        name: card.name,
        amountCents: card.currentDebtCents,
        icon: 'credit-card',
        cardDesignId: card.cardDesignId,
      }),
    ),
    ...visibleAccounts.map(
      (account): WalletEntry => ({
        id: account.id,
        kind: 'account',
        name: account.name,
        amountCents: account.balanceCents,
        icon: account.type === 'cash' ? 'dollar-sign' : 'briefcase',
        accountDesignId: account.accountDesignId,
      }),
    ),
  ]
  const extraCount = accounts.length + cards.length - visibleEntries.length
  const frontTop = walletWidth * 0.36
  const addStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: 0.7 + progress.value * 0.3,
      },
    ],
  }))
  const tabPath = `M 0 30 L 0 22 H 18 Q 26 22 33 17 L 45 7 Q 50 2 57 2 H ${walletWidth - 57} Q ${walletWidth - 50} 2 ${walletWidth - 45} 7 L ${walletWidth - 33} 17 Q ${walletWidth - 26} 22 ${walletWidth - 18} 22 H ${walletWidth} V 30 Z`
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

  function toggle() {
    const next = !expanded
    setExpanded(next)
    progress.value = withTiming(next ? 1 : 0, {
      duration: 320,
      reduceMotion: ReduceMotion.System,
    })
  }

  function select(callback: () => void) {
    setExpanded(false)
    progress.value = 0
    callback()
  }

  return (
    <View
      style={{
        marginTop: hubTopMargin,
        height: liftSpace + walletHeight + actionRowGap + actionSize,
      }}
    >
      <View
        style={{
          width: walletWidth,
          height: liftSpace + walletHeight,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {extraCount > 0 && expanded && (
          <Pressable
            onPress={() => select(onAdd)}
            accessibilityRole='button'
            accessibilityLabel='Ver todas las cuentas y tarjetas'
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              zIndex: 15,
              paddingVertical: 3,
              paddingHorizontal: 7,
              borderRadius: 7,
              backgroundColor: '#e5e5e5',
            }}
          >
            <Text
              style={{
                fontFamily: medium,
                fontSize: 10,
                color: ink,
              }}
            >
              Ver todas
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={toggle}
          accessibilityRole='button'
          accessibilityLabel={expanded ? 'Ocultar cuentas' : 'Mostrar cuentas y tarjetas'}
          accessibilityState={{
            expanded,
          }}
          style={{
            position: 'absolute',
            top: liftSpace,
            left: 0,
            width: walletWidth,
            height: walletHeight,
            borderRadius: 21,
            backgroundColor: ink,
          }}
        />
        {visibleEntries.map((entry, index) => (
          <WalletInstrumentCard
            key={`${entry.kind}-${entry.id}`}
            entry={entry}
            index={index}
            color={index === 0 ? '#7c87bf' : index === 1 ? '#f5f5f5' : '#e7e7e7'}
            iconColor={index === 0 ? '#fff' : ink}
            baseTop={
              visibleEntries.length === 3
                ? index === 0
                  ? 10
                  : walletWidth * index * 0.115
                : index === 0
                  ? 10
                  : walletWidth * 0.18
            }
            lift={visibleEntries.length === 3 && index === 1 ? 50 : index === 0 ? 72 : 28}
            width={walletWidth}
            liftSpace={liftSpace}
            expanded={expanded}
            progress={progress}
            onPress={() => {
              if (entry.id) {
                select(() =>
                  entry.kind === 'account' ? onSelectAccount(entry.id) : onSelectCard(entry.id),
                )
              }
            }}
          />
        ))}
        <Pressable
          onPress={toggle}
          accessibilityRole='button'
          accessibilityLabel={expanded ? 'Ocultar cuentas' : 'Mostrar cuentas y tarjetas'}
          accessibilityState={{
            expanded,
          }}
          style={{
            position: 'absolute',
            top: liftSpace + frontTop - 22,
            left: 0,
            width: walletWidth,
            height: 30,
            zIndex: 12,
          }}
        >
          <Svg width={walletWidth} height={30} pointerEvents='none'>
            <Path d={tabPath} fill={ink} />
          </Svg>
        </Pressable>
        <Pressable
          onPress={toggle}
          accessibilityRole='button'
          accessibilityLabel={expanded ? 'Ocultar cuentas' : 'Mostrar cuentas y tarjetas'}
          accessibilityState={{
            expanded,
          }}
          style={{
            position: 'absolute',
            top: liftSpace + frontTop,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 11,
            backgroundColor: ink,
            borderBottomLeftRadius: 21,
            borderBottomRightRadius: 21,
            justifyContent: 'flex-end',
            padding: 20,
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
              paddingRight: 46,
            }}
          >
            {balanceCents === null ? 'Añadir primera cuenta' : productSummary}
          </Text>
        </Pressable>
        {expanded && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                right: 16,
                bottom: 16,
                zIndex: 12,
              },
              addStyle,
            ]}
          >
            <Pressable
              onPress={() => select(onAdd)}
              accessibilityRole='button'
              accessibilityLabel='Agregar cuenta o tarjeta de crédito'
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#eeeeee',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name='plus' size={20} color={ink} />
            </Pressable>
          </Animated.View>
        )}
      </View>
      <View
        style={{
          height: actionSize,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: actionGap,
          marginTop: actionRowGap,
        }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            accessibilityRole='button'
            accessibilityLabel={action.label}
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
    </View>
  )
}
