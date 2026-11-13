import { Feather } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'

const ink = '#101010'
const muted = '#888'
const regular = 'Inter_400Regular'
const medium = 'Inter_500Medium'

type Props = {
  label: string
  detail: string
  icon: 'briefcase' | 'credit-card'
  onPress: () => void
  disabled?: boolean
}

export function InstrumentRow({ label, detail, icon, onPress, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{
        disabled,
      }}
      style={{
        backgroundColor: '#fff',
        borderRadius: 13,
        padding: 16,
        marginTop: 9,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Feather
        name={icon}
        size={19}
        color={ink}
        style={{
          marginRight: 15,
        }}
      />
      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={{
            fontFamily: medium,
            color: ink,
            fontSize: 15,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: regular,
            color: muted,
            fontSize: 12,
            marginTop: 3,
          }}
        >
          {detail}
        </Text>
      </View>
      <Feather name='arrow-right' size={17} color={muted} />
    </Pressable>
  )
}
