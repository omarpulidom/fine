import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { getAccountDesign } from '@/features/finance/accountDesigns'
import { getCardDesign } from '@/features/finance/cardDesigns'
import type { Ledger } from '@/features/finance/ledger'
import { InstrumentCardArt } from './InstrumentDetailHeader'

export type Instrument = {
  id: string
  kind: 'account' | 'card'
}

export function InstrumentCardCarousel({
  ledger,
  instrumentId,
  kind,
  progress,
}: {
  ledger: Ledger
  instrumentId: string
  kind: Instrument['kind']
  progress: SharedValue<number>
}) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const navigating = useRef<string | null>(null)
  const instruments = useMemo<Instrument[]>(
    () => [
      ...ledger.accounts.map((account) => ({
        id: account.id,
        kind: 'account' as const,
      })),
      ...ledger.cards.map((card) => ({
        id: card.id,
        kind: 'card' as const,
      })),
    ],
    [
      ledger.accounts,
      ledger.cards,
    ],
  )
  const selectedIndex = instruments.findIndex(
    (item) => item.id === instrumentId && item.kind === kind,
  )
  const cardWidth = width - (instruments.length > 1 ? 52 : 48)
  const gap = 12
  const interval = cardWidth + gap
  const sidePadding = (width - cardWidth) / 2
  const currentKey = `${kind}:${instrumentId}`

  useEffect(() => {
    if (selectedIndex >= 0) {
      progress.value = selectedIndex
      scrollRef.current?.scrollTo({
        x: selectedIndex * interval,
        animated: false,
      })
    }
  }, [
    selectedIndex,
    interval,
    progress,
  ])

  const selectPage = useCallback(
    (index: number) => {
      const target = instruments[index]
      if (!target || index === selectedIndex || navigating.current === currentKey) return
      navigating.current = currentKey
      if (target.kind === kind) {
        router.setParams(
          target.kind === 'account'
            ? {
                accountId: target.id,
              }
            : {
                cardId: target.id,
              },
        )
      } else {
        router.replace(
          target.kind === 'account'
            ? {
                pathname: '/accounts',
                params: {
                  accountId: target.id,
                  swipe: '1',
                },
              }
            : {
                pathname: '/cards',
                params: {
                  cardId: target.id,
                  swipe: '1',
                },
              },
        )
      }
    },
    [
      currentKey,
      instruments,
      kind,
      router,
      selectedIndex,
    ],
  )

  if (selectedIndex < 0) return null

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      snapToInterval={interval}
      decelerationRate='fast'
      nestedScrollEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      style={{
        marginHorizontal: -24,
        backgroundColor: '#f6f6f6',
      }}
      contentOffset={{
        x: selectedIndex * interval,
        y: 0,
      }}
      scrollEventThrottle={16}
      onScroll={(event) => {
        const position = Math.max(
          0,
          Math.min(instruments.length - 1, event.nativeEvent.contentOffset.x / interval),
        )
        progress.value = position
      }}
      contentContainerStyle={{
        paddingHorizontal: sidePadding,
        paddingVertical: 12,
        backgroundColor: '#f6f6f6',
      }}
      onMomentumScrollEnd={(event) => {
        const page = Math.round(event.nativeEvent.contentOffset.x / interval)
        progress.value = page
        selectPage(page)
      }}
      onScrollEndDrag={(event) => {
        const offset = event.nativeEvent.contentOffset.x
        const page = Math.round(offset / interval)
        if (Math.abs(offset - page * interval) < 5) {
          progress.value = page
          selectPage(page)
        }
      }}
    >
      {instruments.map((instrument, index) => {
        const account =
          instrument.kind === 'account'
            ? ledger.accounts.find((item) => item.id === instrument.id)
            : undefined
        const card =
          instrument.kind === 'card'
            ? ledger.cards.find((item) => item.id === instrument.id)
            : undefined
        const image = account
          ? getAccountDesign(account.accountDesignId)?.image
          : getCardDesign(card?.cardDesignId)?.image
        return (
          <View
            key={`${instrument.kind}:${instrument.id}`}
            style={{
              width: cardWidth,
              marginRight: index === instruments.length - 1 ? 0 : gap,
            }}
          >
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`${account?.name ?? card?.name}, ${index + 1} de ${instruments.length}`}
              onPress={() => {
                if (index !== selectedIndex)
                  scrollRef.current?.scrollTo({
                    x: index * interval,
                    animated: true,
                  })
              }}
            >
              <InstrumentCardArt
                name={account?.name ?? card?.name ?? ''}
                isCreditCard={Boolean(card)}
                image={image}
              />
            </Pressable>
          </View>
        )
      })}
    </ScrollView>
  )
}
