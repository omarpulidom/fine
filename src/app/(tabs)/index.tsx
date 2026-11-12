import { Feather } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle, Line } from 'react-native-svg'
import { getCurrentBalanceCents, setCurrentBalanceCents } from '@/features/finance/currentAccount'

const BACKGROUND = '#f6f6f6'
const INK = '#101010'
const MUTED = '#898989'
const HORIZON_DAYS = 30
const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const

function formatMoney(cents: number): string {
  return `$${new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)}`
}

function formatDay(date: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
  }).format(date)
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '')
  if (!/^\d+([.,]\d{1,2})?$/.test(trimmed)) return null
  const cents = Math.round(Number(trimmed.replace(',', '.')) * 100)
  return Number.isSafeInteger(cents) ? cents : null
}

export default function HomeTab() {
  const { width: screenWidth } = useWindowDimensions()
  const chartWidth = screenWidth - 48
  const [balanceCents, setBalanceCents] = useState<number | null>(getCurrentBalanceCents)
  const [selectedDay, setSelectedDay] = useState(0)
  const [balanceModalVisible, setBalanceModalVisible] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')
  const [inputError, setInputError] = useState(false)
  const today = useMemo(() => new Date(), [])
  const selectedDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + selectedDay,
  )

  const chartPadding = 12
  const selectedX = chartPadding + (selectedDay / HORIZON_DAYS) * (chartWidth - chartPadding * 2)
  const lineY = 126
  const baselineY = 216

  function selectAt(x: number) {
    const ratio = (x - chartPadding) / (chartWidth - chartPadding * 2)
    setSelectedDay(Math.max(0, Math.min(HORIZON_DAYS, Math.round(ratio * HORIZON_DAYS))))
  }

  function openBalanceModal() {
    setBalanceInput(balanceCents === null ? '' : (balanceCents / 100).toFixed(2))
    setInputError(false)
    setBalanceModalVisible(true)
  }

  function saveBalance() {
    const cents = parseAmount(balanceInput)
    if (cents === null) {
      setInputError(true)
      return
    }
    setCurrentBalanceCents(cents)
    setBalanceCents(cents)
    setBalanceModalVisible(false)
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: BACKGROUND,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 48,
        }}
      >
        <Text
          style={{
            marginTop: 20,
            textAlign: 'center',
            color: INK,
            fontFamily: font.medium,
            fontSize: 16,
          }}
        >
          Liquidez
        </Text>

        <View
          style={{
            alignItems: 'center',
            marginTop: 70,
          }}
        >
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 15,
            }}
          >
            {selectedDay === 0 ? 'Hoy' : formatDay(selectedDate)}
          </Text>
          <Text
            accessibilityLabel={
              balanceCents === null ? 'Saldo sin registrar' : formatMoney(balanceCents)
            }
            style={{
              color: INK,
              fontFamily: font.semibold,
              fontSize: 52,
              letterSpacing: -2.7,
              marginTop: 7,
            }}
          >
            {balanceCents === null ? '—' : formatMoney(balanceCents)}
          </Text>
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 14,
              marginTop: 3,
              textAlign: 'center',
            }}
          >
            {balanceCents === null
              ? 'Registra tu saldo disponible'
              : selectedDay === 0
                ? 'Saldo disponible actual'
                : 'Sin cambios programados hasta esta fecha'}
          </Text>
        </View>

        <View
          accessibilityLabel='Gráfica de liquidez de los próximos 30 días. Desliza para seleccionar una fecha.'
          style={{
            marginTop: 48,
            height: 258,
          }}
          onStartShouldSetResponder={() => balanceCents !== null}
          onMoveShouldSetResponder={() => balanceCents !== null}
          onResponderGrant={(event) => selectAt(event.nativeEvent.locationX)}
          onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
        >
          <Svg width={chartWidth} height={236}>
            <Line
              x1={chartPadding}
              x2={chartWidth - chartPadding}
              y1={baselineY}
              y2={baselineY}
              stroke='#c8c8c8'
              strokeWidth={1.5}
              strokeDasharray='1 10'
              strokeLinecap='round'
            />
            {balanceCents !== null && (
              <>
                <Line
                  x1={chartPadding}
                  x2={chartWidth - chartPadding}
                  y1={lineY}
                  y2={lineY}
                  stroke='#d4d4d4'
                  strokeWidth={3.5}
                  strokeLinecap='round'
                />
                <Line
                  x1={selectedX}
                  x2={selectedX}
                  y1={28}
                  y2={baselineY}
                  stroke='#c5c5c5'
                  strokeWidth={1}
                  strokeDasharray='2 5'
                />
                <Circle cx={selectedX} cy={lineY} r={5} fill={INK} />
              </>
            )}
          </Svg>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 12,
              }}
            >
              Hoy
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 12,
              }}
            >
              30 días
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 34,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 14,
              }}
            >
              Cuenta disponible
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 14,
              }}
            >
              {balanceCents === null ? '—' : formatMoney(balanceCents)}
            </Text>
          </View>
          <Pressable
            onPress={openBalanceModal}
            style={{
              marginTop: 9,
              height: 56,
              borderRadius: 12,
              backgroundColor: '#fff',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 18,
            }}
            accessibilityRole='button'
            accessibilityLabel={balanceCents === null ? 'Registrar saldo' : 'Editar saldo'}
          >
            <View
              style={{
                width: 27,
                height: 27,
                borderRadius: 14,
                backgroundColor: '#f1f1f1',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Feather name='credit-card' size={14} color={INK} />
            </View>
            <Text
              style={{
                flex: 1,
                color: INK,
                fontFamily: font.medium,
                fontSize: 15,
              }}
            >
              Efectivo y débito
            </Text>
            <Feather name={balanceCents === null ? 'plus' : 'edit-2'} size={17} color={MUTED} />
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 35,
          }}
        >
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 14,
            }}
          >
            Próximos movimientos
          </Text>
          <View
            style={{
              marginTop: 9,
              minHeight: 74,
              borderRadius: 12,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              Aún no hay movimientos programados
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={balanceModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.28)',
            padding: 24,
          }}
        >
          <View
            style={{
              borderRadius: 22,
              backgroundColor: '#fff',
              padding: 24,
            }}
          >
            <Text
              style={{
                color: INK,
                fontFamily: font.semibold,
                fontSize: 21,
              }}
            >
              Saldo disponible
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: font.regular,
                fontSize: 14,
                marginTop: 8,
                lineHeight: 21,
              }}
            >
              Ingresa el dinero que tienes hoy en efectivo y cuentas de débito.
            </Text>
            <TextInput
              autoFocus
              keyboardType='decimal-pad'
              placeholder='0.00'
              placeholderTextColor='#b0b0b0'
              value={balanceInput}
              onChangeText={(value) => {
                setBalanceInput(value)
                setInputError(false)
              }}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: inputError ? '#c84242' : '#ddd',
                color: INK,
                fontFamily: font.medium,
                fontSize: 34,
                marginTop: 22,
                paddingVertical: 10,
              }}
            />
            {inputError && (
              <Text
                style={{
                  color: '#c84242',
                  fontFamily: font.regular,
                  marginTop: 6,
                }}
              >
                Ingresa un importe válido con hasta dos decimales.
              </Text>
            )}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 28,
              }}
            >
              <Pressable
                onPress={() => setBalanceModalVisible(false)}
                style={{
                  flex: 1,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: font.medium,
                    color: MUTED,
                  }}
                >
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={saveBalance}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: INK,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: font.medium,
                    color: '#fff',
                  }}
                >
                  Guardar
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}
