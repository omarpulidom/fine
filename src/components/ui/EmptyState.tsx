import { Text, View } from 'react-native'

export function EmptyState({
  message,
  compact = false,
}: {
  message: string
  compact?: boolean
}) {
  return (
    <View style={{ paddingVertical: compact ? 12 : 20 }}>
      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          color: '#888',
          fontSize: 13,
          lineHeight: 19,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  )
}
