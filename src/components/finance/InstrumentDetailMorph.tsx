import type { ReactNode } from 'react'
import { View } from 'react-native'
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import type { Ledger } from '@/features/finance/ledger'
import type { Instrument } from './InstrumentCardCarousel'
import { InstrumentDetailPreview } from './InstrumentDetailPreview'

function MorphLayer({
  index,
  progress,
  current = false,
  children,
}: {
  index: number
  progress: SharedValue<number>
  current?: boolean
  children: ReactNode
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(progress.value - index)),
  }))

  return (
    <Animated.View
      pointerEvents={current ? 'auto' : 'none'}
      style={[
        current
          ? undefined
          : {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  )
}

export function InstrumentDetailMorph({
  ledger,
  instrumentId,
  kind,
  progress,
  children,
}: {
  ledger: Ledger
  instrumentId: string
  kind: Instrument['kind']
  progress: SharedValue<number>
  children: ReactNode
}) {
  const instruments: Instrument[] = [
    ...ledger.accounts.map((account) => ({
      id: account.id,
      kind: 'account' as const,
    })),
    ...ledger.cards.map((card) => ({
      id: card.id,
      kind: 'card' as const,
    })),
  ]
  const index = instruments.findIndex((item) => item.id === instrumentId && item.kind === kind)

  if (index < 0) return <>{children}</>

  return (
    <View
      style={{
        backgroundColor: '#f6f6f6',
      }}
    >
      <MorphLayer index={index} progress={progress} current>
        {children}
      </MorphLayer>
      {instruments.map((instrument, itemIndex) =>
        itemIndex === index ? null : (
          <MorphLayer
            key={`${instrument.kind}:${instrument.id}`}
            index={itemIndex}
            progress={progress}
          >
            <InstrumentDetailPreview ledger={ledger} instrument={instrument} />
          </MorphLayer>
        ),
      )}
    </View>
  )
}
