import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { AccountsHub, getAccountsHubHeight } from "@/components/finance/AccountsHub";
import { ScheduledMovementsList } from "@/components/finance/ScheduledMovementsList";
import { formatDateDisplay, localDateKey } from "@/features/finance/dates";
import { liquidityHistory } from "@/features/finance/history";
import {
  getLedger,
  newMovementId,
  totalLiquidity,
  upsertCompletedMovement,
} from "@/features/finance/ledger";
import { formatMoney } from "@/features/finance/money";
import { projectLiquidityBreakdown } from "@/features/finance/projection";
import { ScheduledMovementModal } from "@/features/finance/ScheduledMovementModal";
import {
  deleteScheduledMovement,
  getScheduledMovements,
  nextOccurrenceDate,
  type ScheduledMovement,
  saveScheduledMovement,
} from "@/features/finance/scheduledMovements";

const BACKGROUND = "#f6f6f6";
const INK = "#101010";
const MUTED = "#898989";
const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
} as const;

function formatDay(date: Date): string {
  return formatDateDisplay(date);
}

export default function HomeTab() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 48;
  const carouselRef = useRef<ScrollView>(null);
  const [carouselPage, setCarouselPage] = useState<0 | 1>(0);
  const carouselHeight = Math.max(340, getAccountsHubHeight(chartWidth) + 16);
  const [ledger, setLedger] = useState(getLedger);
  const balanceCents = ledger.accounts.length ? totalLiquidity(ledger) : null;
  const [movements, setMovements] = useState<ScheduledMovement[]>(
    getScheduledMovements,
  );
  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [editingScheduled, setEditingScheduled] =
    useState<ScheduledMovement | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [badgeWidth, setBadgeWidth] = useState(80);
  const [horizonDays, setHorizonDays] = useState<7 | 30 | 60 | 90>(30);
  const [today, setToday] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setToday(new Date());
      setLedger(getLedger());
      setSelectedDay(0);
    }, []),
  );
  const todayKey = localDateKey(today);
  const completedOccurrences = useMemo(
    () =>
      new Set(
        ledger.completedMovements
          .filter((item) => item.sourceScheduledId && item.sourceOccurrenceDate)
          .map(
            (item) => `${item.sourceScheduledId}:${item.sourceOccurrenceDate}`,
          ),
      ),
    [ledger.completedMovements],
  );
  const cardPayments = useMemo(
    () =>
      ledger.cycles.flatMap((cycle) =>
        cycle.scheduledDate &&
        cycle.scheduledAmountCents > cycle.paidAmountCents
          ? [
              {
                date: cycle.scheduledDate,
                amountCents: cycle.scheduledAmountCents - cycle.paidAmountCents,
              },
            ]
          : [],
      ),
    [ledger.cycles],
  );
  const projection = useMemo(
    () =>
      balanceCents === null
        ? []
        : projectLiquidityBreakdown(
            balanceCents,
            todayKey,
            movements,
            horizonDays,
            cardPayments,
            completedOccurrences,
          ),
    [
      balanceCents,
      todayKey,
      movements,
      horizonDays,
      cardPayments,
      completedOccurrences,
    ],
  );
  const history = useMemo(
    () => liquidityHistory(ledger, todayKey),
    [ledger, todayKey],
  );
  const selectedDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + selectedDay,
  );
  const selectedDateKey = localDateKey(selectedDate);
  const selectedProjection = selectedDay > 0 ? projection[selectedDay] : undefined;
  const previousProjection = selectedDay > 0 ? projection[selectedDay - 1] : undefined;
  const selectedIncomeCents = selectedProjection
    ? selectedProjection.incomeCents - (previousProjection?.incomeCents ?? 0)
    : ledger.completedMovements
        .filter((movement) => movement.effectiveDate === selectedDateKey && movement.type === "income")
        .reduce((sum, movement) => sum + movement.amountCents, 0);
  const selectedExpenseCents = selectedProjection
    ? selectedProjection.expenseCents - (previousProjection?.expenseCents ?? 0)
    : ledger.completedMovements
        .filter((movement) => movement.effectiveDate === selectedDateKey && movement.type === "expense")
        .reduce((sum, movement) => sum + movement.amountCents, 0) +
      ledger.cardActivity
        .filter((activity) => activity.effectiveDate === selectedDateKey && activity.type === "payment")
        .reduce((sum, activity) => sum + activity.amountCents, 0);

  const chartPadding = 12;
  const todayX = chartPadding + (chartWidth - chartPadding * 2) * 0.38;
  const historyDays = history.length - 1;
  const selectedX =
    selectedDay < 0 && historyDays > 0
      ? todayX + (selectedDay / historyDays) * (todayX - chartPadding)
      : todayX +
        (selectedDay / horizonDays) * (chartWidth - chartPadding - todayX);
  const baselineY = 216;
  const balances = [...history, ...projection].map(
    (point) => point.balanceCents,
  );
  if (balanceCents !== null) {
    for (const point of projection) {
      balances.push(balanceCents + point.incomeCents);
      balances.push(balanceCents - point.expenseCents);
    }
  }
  const minimumBalance = balances.length ? Math.min(...balances) : 0;
  const maximumBalance = balances.length ? Math.max(...balances) : 0;
  const range = maximumBalance - minimumBalance;
  const yForBalance = (value: number) =>
    range === 0 ? 126 : 183 - ((value - minimumBalance) / range) * 138;
  const selectedBalance =
    selectedDay < 0
      ? (history[historyDays + selectedDay]?.balanceCents ?? null)
      : (projection[selectedDay]?.balanceCents ?? null);
  const historyPath = history
    .map((point, index) => {
      const x =
        historyDays === 0
          ? todayX
          : chartPadding + (index / historyDays) * (todayX - chartPadding);
      const y = yForBalance(point.balanceCents);
      return index === 0 ? `M ${x} ${y}` : `H ${x} V ${y}`;
    })
    .join(" ");
  const futurePath = (
    valueForPoint: (point: (typeof projection)[number]) => number,
  ) =>
    projection
      .map((point, index) => {
        const x =
          todayX + (index / horizonDays) * (chartWidth - chartPadding - todayX);
        const y = yForBalance(valueForPoint(point));
        return index === 0 ? `M ${x} ${y}` : `H ${x} V ${y}`;
      })
      .join(" ");
  const chartPath = futurePath((point) => point.balanceCents);
  const incomePath = futurePath(
    (point) => (balanceCents ?? 0) + point.incomeCents,
  );
  const expensePath = futurePath(
    (point) => (balanceCents ?? 0) - point.expenseCents,
  );

  function selectAt(x: number) {
    if (x < todayX && historyDays > 0) {
      const offset = Math.round(
        ((x - todayX) / (todayX - chartPadding)) * historyDays,
      );
      setSelectedDay(Math.max(-historyDays, Math.min(0, offset)));
    } else {
      const ratio = (x - todayX) / (chartWidth - chartPadding - todayX);
      setSelectedDay(
        Math.max(0, Math.min(horizonDays, Math.round(ratio * horizonDays))),
      );
    }
  }

  function selectCarouselPage(page: 0 | 1) {
    setCarouselPage(page);
    if (page === 1) setSelectedDay(0);
  }

  function addMovement(draft: Omit<ScheduledMovement, "id">) {
    setMovements(
      saveScheduledMovement({
        ...draft,
        id:
          editingScheduled?.id ??
          `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      }),
    );
  }

  function confirmDeleteMovement(movement: ScheduledMovement) {
    Alert.alert(
      "Eliminar movimiento",
      "Este movimiento dejará de afectar la proyección.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => setMovements(deleteScheduledMovement(movement.id)),
        },
      ],
    );
  }

  function confirmCompleteMovement(movement: ScheduledMovement) {
    const occurrenceDate = nextOccurrenceDate(movement, completedOccurrences);
    const accountId = movement.accountId ?? ledger.accounts[0]?.id;
    if (!occurrenceDate || !accountId) return;
    Alert.alert(
      "Registrar como realizado",
      "Se aplicará al saldo actual y dejará de proyectarse.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Registrar",
          onPress: () => {
            try {
              setLedger(
                upsertCompletedMovement(
                  {
                    id: newMovementId(),
                    type: movement.type,
                    accountId,
                    counterpartyAccountId: movement.counterpartyAccountId,
                    amountCents: movement.amountCents,
                    effectiveDate: todayKey,
                    description: movement.description,
                    sourceScheduledId: movement.id,
                    sourceOccurrenceDate: occurrenceDate,
                  },
                  todayKey,
                ),
              );
            } catch (caught) {
              Alert.alert(
                "No se pudo registrar",
                caught instanceof Error ? caught.message : "",
              );
            }
          },
        },
      ],
    );
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
        <View
          style={{
            alignItems: "center",
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
            {selectedDay === 0 ? "Hoy" : formatDay(selectedDate)}
          </Text>
          <Text
            accessibilityLabel={
              selectedBalance === null
                ? "Saldo sin registrar"
                : formatMoney(selectedBalance)
            }
            style={{
              color: INK,
              fontFamily: font.semibold,
              fontSize: 52,
              letterSpacing: -2.7,
              marginTop: 7,
            }}
          >
            {selectedBalance === null ? "—" : formatMoney(selectedBalance)}
          </Text>
          <Text
            style={{
              color: MUTED,
              fontFamily: font.regular,
              fontSize: 14,
              marginTop: 3,
              textAlign: "center",
            }}
          >
            {balanceCents === null
              ? "Registra tu saldo disponible"
              : selectedDay === 0
                ? "Saldo disponible actual"
                : selectedDay < 0
                  ? "Saldo histórico"
                  : "Saldo proyectado"}
          </Text>
        </View>

        <View style={{ height: carouselHeight, marginTop: -20 }}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width: chartWidth, height: carouselHeight }}
            onMomentumScrollEnd={(event) => {
              selectCarouselPage(
                Math.round(event.nativeEvent.contentOffset.x / chartWidth) === 1 ? 1 : 0,
              );
            }}
          >
            <View style={{ width: chartWidth, height: carouselHeight }}>
              <View style={{ flex: 1, justifyContent: "center" }}>
                <View
                  accessibilityLabel={`Gráfica de liquidez de los próximos ${horizonDays} días. Desliza para seleccionar una fecha.`}
                  style={{
                    marginTop: 10,
                    height: 258,
                  }}
                  onTouchStart={(event) => {
                    if (balanceCents !== null) selectAt(event.nativeEvent.locationX);
                  }}
                  onTouchMove={(event) => {
                    if (balanceCents !== null) selectAt(event.nativeEvent.locationX);
                  }}
                >
                  <Svg width={chartWidth} height={236}>
                    <Line
                      x1={chartPadding}
                      x2={chartWidth - chartPadding}
                      y1={baselineY}
                      y2={baselineY}
                      stroke="#c8c8c8"
                      strokeWidth={1.5}
                      strokeDasharray="1 10"
                      strokeLinecap="round"
                    />
                    {balanceCents !== null && (
                      <>
                        <Path
                          d={historyPath}
                          stroke={INK}
                          strokeWidth={3.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <Path
                          d={incomePath}
                          stroke="#c6c6c6"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <Path
                          d={expensePath}
                          stroke="#a4a4a4"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <Path
                          d={chartPath}
                          stroke={INK}
                          strokeWidth={3.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <Line
                          x1={selectedX}
                          x2={selectedX}
                          y1={28}
                          y2={baselineY}
                          stroke="#c5c5c5"
                          strokeWidth={1}
                          strokeDasharray="2 5"
                        />
                        <Circle
                          cx={selectedX}
                          cy={yForBalance(selectedBalance ?? 0)}
                          r={5}
                          fill={INK}
                        />
                      </>
                    )}
                  </Svg>
                  {balanceCents !== null && (selectedIncomeCents > 0 || selectedExpenseCents > 0) && (
                    <View
                      pointerEvents="none"
                      accessible
                      accessibilityLabel={[
                        selectedIncomeCents > 0 ? `Ingresos ${formatMoney(selectedIncomeCents)}` : null,
                        selectedExpenseCents > 0 ? `Gastos ${formatMoney(selectedExpenseCents)}` : null,
                      ].filter(Boolean).join(", ")}
                      onLayout={(event) => setBadgeWidth(event.nativeEvent.layout.width)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: Math.max(0, Math.min(chartWidth - badgeWidth, selectedX - badgeWidth / 2)),
                        alignItems: "flex-start",
                        maxWidth: chartWidth,
                        borderRadius: 999,
                        backgroundColor: INK,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      {selectedIncomeCents > 0 && (
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={{ color: "#fff", fontFamily: "Inter_300Light", fontSize: 14 }}
                        >
                          +{formatMoney(selectedIncomeCents)}
                        </Text>
                      )}
                      {selectedExpenseCents > 0 && (
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={{
                            color: "#aaa",
                            fontFamily: "Inter_300Light",
                            fontSize: 14,
                            marginTop: selectedIncomeCents > 0 ? 2 : 0,
                          }}
                        >
                          −{formatMoney(selectedExpenseCents)}
                        </Text>
                      )}
                    </View>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
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
                      Historial
                    </Text>
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
                      {horizonDays} días
                    </Text>
                  </View>
                </View>
              </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 20,
                    marginTop: 0,
                  }}
                >
                  {(
                    [
                      ["#101010", "Saldo"],
                      ["#c6c6c6", "Ingresos"],
                      ["#a4a4a4", "Gastos"],
                    ] as const
                  ).map(([color, label]) => (
                    <View
                      key={label}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 15,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: color,
                        }}
                      />
                      <Text
                        style={{
                          color: MUTED,
                          fontFamily: font.regular,
                          fontSize: 11,
                        }}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  {([7, 30, 60, 90] as const).map((days) => (
                    <Pressable
                      key={days}
                      onPress={() => {
                        setHorizonDays(days);
                        setSelectedDay((current) => Math.min(current, days));
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 9,
                        backgroundColor:
                          horizonDays === days ? "#e3e3e3" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: horizonDays === days ? INK : MUTED,
                          fontFamily: font.medium,
                          fontSize: 12,
                        }}
                      >
                        {days} días
                      </Text>
                    </Pressable>
                  ))}
                </View>

            </View>
            <View style={{ width: chartWidth, height: carouselHeight, justifyContent: "center" }}>
                <AccountsHub
                  accounts={ledger.accounts}
                  cards={ledger.cards}
                  balanceCents={balanceCents}
                  onSelectAccount={(accountId) =>
                    router.push({ pathname: '/accounts', params: { accountId } })
                  }
                  onSelectCard={(cardId) =>
                    router.push({ pathname: '/cards', params: { cardId } })
                  }
                  onAdd={() => router.push('/accounts-and-cards')}
                  onSimulate={() => router.push('/simulator')}
                  onStatistics={() => router.push('/stats')}
                  onHistory={() => router.push('/movements')}
                  onRegisterMovement={() => router.push(
                    ledger.accounts.length
                      ? { pathname: '/movements', params: { create: '1' } }
                      : '/accounts',
                  )}
                />
            </View>
          </ScrollView>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 0, marginTop: 4 }}>
          {([0, 1] as const).map((page) => (
            <Pressable
              key={page}
              onPress={() => {
                selectCarouselPage(page);
                carouselRef.current?.scrollTo({ x: chartWidth * page, animated: true });
              }}
              accessibilityRole="button"
              accessibilityLabel={page === 0 ? "Mostrar gráfica" : "Mostrar cartera"}
              accessibilityState={{ selected: carouselPage === page }}
              style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: carouselPage === page ? INK : "#c8c8c8",
                }}
              />
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 35 }}>
          <ScheduledMovementsList
            ledger={ledger}
            movements={movements}
            completedOccurrences={completedOccurrences}
            todayKey={todayKey}
            onEdit={(movement) => {
              setEditingScheduled(movement);
              setMovementModalVisible(true);
            }}
            onComplete={confirmCompleteMovement}
            onDelete={confirmDeleteMovement}
            onOpenCard={(cardId) => router.push({ pathname: "/cards", params: { cardId } })}
          />
          <Pressable
            onPress={() => {
              if (!ledger.accounts.length) {
                router.push("/accounts");
                return;
              }
              setEditingScheduled(null);
              setMovementModalVisible(true);
            }}
            accessibilityRole="button"
            style={{
              marginTop: 16,
              minHeight: 52,
              borderRadius: 12,
              backgroundColor: INK,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text
              style={{
                color: "#fff",
                fontFamily: font.medium,
                fontSize: 14,
              }}
            >
              {ledger.accounts.length
                ? "Programar movimiento"
                : "Añadir cuenta primero"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ScheduledMovementModal
        visible={movementModalVisible}
        todayKey={todayKey}
        accounts={ledger.accounts}
        initial={editingScheduled}
        onClose={() => {
          setMovementModalVisible(false);
          setEditingScheduled(null);
        }}
        onSave={addMovement}
      />

    </SafeAreaView>
  );
}
