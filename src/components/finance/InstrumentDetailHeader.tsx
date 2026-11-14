import { Feather } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { Image, type ImageSourcePropType, Pressable, Text, View } from 'react-native'
import { formatMoney } from '@/features/finance/money'

type Action = {
  label: string
  icon: ComponentProps<typeof Feather>['name']
  onPress: () => void
  disabled?: boolean
}

type Props = {
  name: string
  bank: string
  amountCents: number
  isCreditCard: boolean
  image?: ImageSourcePropType | null
  actions: Action[]
  showImage?: boolean
}

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'
const semibold = 'Inter_600SemiBold'

export function InstrumentCardArt({
  name,
  isCreditCard,
  image,
}: Pick<Props, 'name' | 'isCreditCard' | 'image'>) {
  return (
    <View
      style={{
        width: '100%',
        aspectRatio: 817 / 511,
        borderRadius: 18,
        backgroundColor: '#e8e8e8',
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 18,
          overflow: 'hidden',
        }}
      >
        {image ? (
          <Image
            source={image}
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
              padding: 22,
              justifyContent: 'space-between',
            }}
          >
            <Feather name={isCreditCard ? 'credit-card' : 'briefcase'} size={29} color={ink} />
            <Text
              style={{
                fontFamily: medium,
                fontSize: 18,
                color: ink,
              }}
            >
              {name}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export function InstrumentDetailHeader({
  name,
  bank,
  amountCents,
  isCreditCard,
  image,
  actions,
  showImage = true,
}: Props) {
  return (
    <>
      {showImage && <InstrumentCardArt name={name} isCreditCard={isCreditCard} image={image} />}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginTop: 18,
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: semibold,
              fontSize: 21,
              color: ink,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: regular,
              fontSize: 13,
              color: muted,
              marginTop: 3,
            }}
          >
            {bank}
          </Text>
        </View>
        <View
          style={{
            alignItems: 'flex-end',
          }}
        >
          <Text
            style={{
              fontFamily: regular,
              fontSize: 11,
              color: muted,
            }}
          >
            {isCreditCard ? 'Deuda actual' : 'Saldo actual'}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              fontFamily: semibold,
              fontSize: 19,
              color: ink,
              marginTop: 3,
            }}
          >
            {formatMoney(amountCents)}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: 28,
          marginBottom: 28,
        }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            disabled={action.disabled}
            accessibilityRole='button'
            accessibilityLabel={action.label}
            style={{
              minWidth: 83,
              alignItems: 'center',
              opacity: action.disabled ? 0.42 : 1,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#e8e8e8',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name={action.icon} size={20} color={ink} />
            </View>
            <Text
              style={{
                fontFamily: medium,
                fontSize: 12,
                color: ink,
                marginTop: 8,
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  )
}
