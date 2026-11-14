import { Feather } from '@expo/vector-icons'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getLedger, type Ledger } from '@/features/finance/ledger'
import type { Instrument } from './InstrumentCardCarousel'
import { InstrumentDetailPreview } from './InstrumentDetailPreview'

export type InstrumentRect = {
  x: number
  y: number
  width: number
  height: number
}

type InstrumentKey = `${Instrument['kind']}:${string}`

type Transition = {
  direction: 'open' | 'close'
  instrument: Instrument
  rect: InstrumentRect
  image?: ImageSourcePropType | null
  name: string
  ledger: Ledger
  navigate: () => void
}

type TransitionContextValue = {
  hasListOrigin: boolean
  hiddenKey: InstrumentKey | null
  registerRow: (kind: Instrument['kind'], id: string, rect: InstrumentRect) => void
  openFromList: (args: Omit<Transition, 'direction' | 'ledger'>) => void
  closeToList: (args: Omit<Transition, 'direction' | 'ledger' | 'rect'>) => boolean
  clearOriginIfIdle: () => void
}

const TransitionContext = createContext<TransitionContextValue | null>(null)

function keyOf(instrument: Instrument): InstrumentKey {
  return `${instrument.kind}:${instrument.id}`
}

function TransitionOverlay({
  transition,
  progress,
}: {
  transition: Transition
  progress: SharedValue<number>
}) {
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const cardWidth =
    width - (transition.ledger.accounts.length + transition.ledger.cards.length > 1 ? 52 : 48)
  const target = {
    x: (width - cardWidth) / 2,
    y: insets.top + 70 + 12,
    width: cardWidth,
    height: (cardWidth * 511) / 817,
  }
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [
            0,
            1,
          ],
          [
            height,
            0,
          ],
        ),
      },
    ],
  }))
  const cardStyle = useAnimatedStyle(() => ({
    left: interpolate(
      progress.value,
      [
        0,
        1,
      ],
      [
        transition.rect.x,
        target.x,
      ],
    ),
    top: interpolate(
      progress.value,
      [
        0,
        1,
      ],
      [
        transition.rect.y,
        target.y,
      ],
    ),
    width: interpolate(
      progress.value,
      [
        0,
        1,
      ],
      [
        transition.rect.width,
        target.width,
      ],
    ),
    height: interpolate(
      progress.value,
      [
        0,
        1,
      ],
      [
        transition.rect.height,
        target.height,
      ],
    ),
    borderRadius: interpolate(
      progress.value,
      [
        0,
        1,
      ],
      [
        6,
        18,
      ],
    ),
  }))

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: 100,
          elevation: 100,
        },
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height,
            backgroundColor: '#f6f6f6',
          },
          sheetStyle,
        ]}
      >
        <View
          style={{
            position: 'absolute',
            left: 27,
            top: insets.top + 22,
          }}
        >
          <Feather name='x' size={23} color='#101010' />
        </View>
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: target.y + target.height + 12,
          }}
        >
          <InstrumentDetailPreview ledger={transition.ledger} instrument={transition.instrument} />
        </View>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            overflow: 'hidden',
            backgroundColor: '#e8e8e8',
          },
          cardStyle,
        ]}
      >
        {transition.image ? (
          <Image
            source={transition.image}
            resizeMode='contain'
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'space-between',
              padding: 8,
            }}
          >
            <Feather
              name={transition.instrument.kind === 'card' ? 'credit-card' : 'briefcase'}
              size={18}
              color='#101010'
            />
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'Inter_500Medium',
                color: '#101010',
              }}
            >
              {transition.name}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

export function InstrumentDetailTransitionProvider({ children }: { children: ReactNode }) {
  const { height: windowHeight } = useWindowDimensions()
  const [transition, setTransition] = useState<Transition | null>(null)
  const [hasListOrigin, setHasListOrigin] = useState(false)
  const rows = useRef(new Map<InstrumentKey, InstrumentRect>())
  const origin = useRef<{
    instrument: Instrument
    rect: InstrumentRect
  } | null>(null)
  const transitionRef = useRef<Transition | null>(null)
  const progress = useSharedValue(0)

  const registerRow = useCallback((kind: Instrument['kind'], id: string, rect: InstrumentRect) => {
    if (rect.width > 0 && rect.height > 0) rows.current.set(`${kind}:${id}`, rect)
  }, [])

  const openFromList = useCallback((args: Omit<Transition, 'direction' | 'ledger'>) => {
    if (transitionRef.current) return
    progress.value = 0
    rows.current.set(keyOf(args.instrument), args.rect)
    origin.current = {
      instrument: args.instrument,
      rect: args.rect,
    }
    setHasListOrigin(true)
    const next: Transition = {
      ...args,
      direction: 'open',
      ledger: getLedger(),
    }
    transitionRef.current = next
    setTransition(next)
  }, [progress])

  const closeToList = useCallback(
    (args: Omit<Transition, 'direction' | 'ledger' | 'rect'>) => {
      if (!origin.current || transitionRef.current) return false
      const rect =
        rows.current.get(keyOf(args.instrument)) ??
        (keyOf(origin.current.instrument) === keyOf(args.instrument) ? origin.current.rect : null)
      if (!rect || rect.y + rect.height < 0 || rect.y > windowHeight) return false
      progress.value = 1
      const next: Transition = {
        ...args,
        rect,
        direction: 'close',
        ledger: getLedger(),
      }
      transitionRef.current = next
      setTransition(next)
      return true
    },
    [
      windowHeight,
      progress,
    ],
  )

  const clearOriginIfIdle = useCallback(() => {
    if (transitionRef.current) return
    origin.current = null
    setHasListOrigin(false)
  }, [])

  const finish = useCallback(() => {
    const current = transitionRef.current
    if (!current) return
    if (current.direction === 'open') {
      current.navigate()
      setTimeout(() => {
        if (transitionRef.current === current) {
          transitionRef.current = null
          setTransition(null)
        }
      }, 80)
    } else {
      transitionRef.current = null
      setTransition(null)
      origin.current = null
      setHasListOrigin(false)
    }
  }, [])

  useEffect(() => {
    if (!transition) return
    const frame = requestAnimationFrame(() => {
      if (transition.direction === 'close') transition.navigate()
      progress.value = withTiming(
        transition.direction === 'open' ? 1 : 0,
        {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) runOnJS(finish)()
        },
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [
    transition,
    progress,
    finish,
  ])

  const value = useMemo<TransitionContextValue>(
    () => ({
      hasListOrigin,
      hiddenKey: transition ? keyOf(transition.instrument) : null,
      registerRow,
      openFromList,
      closeToList,
      clearOriginIfIdle,
    }),
    [
      hasListOrigin,
      transition,
      registerRow,
      openFromList,
      closeToList,
      clearOriginIfIdle,
    ],
  )

  return (
    <TransitionContext.Provider value={value}>
      <View
        style={{
          flex: 1,
        }}
      >
        {children}
        {transition && <TransitionOverlay transition={transition} progress={progress} />}
      </View>
    </TransitionContext.Provider>
  )
}

export function useInstrumentDetailTransition() {
  const context = useContext(TransitionContext)
  if (!context) throw new Error('InstrumentDetailTransitionProvider is missing.')
  return context
}
