import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable, type StyleProp, Text, View, type ViewStyle } from 'react-native'
import { AppBottomSheet } from '@/components/ui/AppBottomSheet'
import { formatDateDisplay, isDateKey, localDateKey } from '@/features/finance/dates'

type Props = {
  label: string
  value: string
  onChange: (dateKey: string) => void
  minimumDate?: string
  maximumDate?: string
  placeholder?: string
  clearable?: boolean
  compact?: boolean
  style?: StyleProp<ViewStyle>
}

function toDate(value: string): Date | undefined {
  return isDateKey(value) ? new Date(`${value}T12:00:00`) : undefined
}

export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder = 'Seleccionar fecha',
  clearable = false,
  compact = false,
  style,
}: Props) {
  const [visible, setVisible] = useState(false)
  const [draft, setDraft] = useState(new Date())
  const min = minimumDate ? toDate(minimumDate) : undefined
  const max = maximumDate ? toDate(maximumDate) : undefined

  function open() {
    let initial = toDate(value) ?? min ?? new Date()
    if (min && initial < min) initial = min
    if (max && initial > max) initial = max
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        minimumDate: min,
        maximumDate: max,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(localDateKey(selected))
        },
      })
    } else {
      setDraft(initial)
      setVisible(true)
    }
  }

  const display = toDate(value)
  const formatted = display ? formatDateDisplay(display) : placeholder

  return (
    <View
      style={[
        {
          marginTop: 20,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 13,
          color: '#888',
        }}
      >
        {label}
      </Text>
      <Pressable
        onPress={open}
        accessibilityRole='button'
        accessibilityLabel={`${label}: ${formatted}`}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#ddd',
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: compact ? 13 : 16,
            lineHeight: compact ? 19 : 22,
            flexShrink: 1,
            color: display ? '#101010' : '#bbb',
            textTransform: 'capitalize',
          }}
        >
          {formatted}
        </Text>
      </Pressable>
      {clearable && !!value && (
        <Pressable
          onPress={() => onChange('')}
          style={{
            paddingTop: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 12,
              color: '#888',
            }}
          >
            Quitar fecha
          </Text>
        </Pressable>
      )}
      {Platform.OS === 'ios' && (
        <AppBottomSheet
          visible={visible}
          onClose={() => setVisible(false)}
          snapPoints={[
            '48%',
          ]}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              color: '#101010',
              fontSize: 19,
            }}
          >
            {label}
          </Text>
          <DateTimePicker
            value={draft}
            mode='date'
            display='spinner'
            locale='es-MX'
            minimumDate={min}
            maximumDate={max}
            onChange={(_, date) => {
              if (date) setDraft(date)
            }}
            style={{
              marginTop: 8,
            }}
          />
          <Pressable
            onPress={() => {
              onChange(localDateKey(draft))
              setVisible(false)
            }}
            style={{
              backgroundColor: '#101010',
              borderRadius: 12,
              padding: 15,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_500Medium',
                color: '#fff',
              }}
            >
              Elegir fecha
            </Text>
          </Pressable>
        </AppBottomSheet>
      )}
    </View>
  )
}
