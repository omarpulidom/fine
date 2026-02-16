import { View, Text, TouchableOpacity } from "react-native";

/** Weekday labels starting from Sunday */
const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

/** Fixed key financial dates displayed with labels */
const KEY_DATES = [1, 15, 29];

interface PaymentCalendarProps {
  /** Calendar year. Defaults to current year */
  year?: number;
  /** Calendar month (0-indexed: January = 0). Defaults to current month */
  month?: number;
  /** Array of days with scheduled payments */
  paymentDays: number[];
  /** Callback triggered when a payment day is pressed */
  onPaymentPress?: (day: number) => void;
}

export const PaymentCalendar = ({
  year,
  month,
  paymentDays,
  onPaymentPress,
}: PaymentCalendarProps) => {
  const now = new Date();
  const currentYear = year ?? now.getFullYear();
  const currentMonth = month ?? now.getMonth();
  const today =
    currentYear === now.getFullYear() && currentMonth === now.getMonth()
      ? now.getDate()
      : null;

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Build calendar grid with leading empty cells for alignment
  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad trailing cells to complete the final week
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    calendarDays.push(...Array(remainingDays).fill(null));
  }

  // Group days into weeks for row rendering
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getDayStyle = (day: number | null): string => {
    if (day === null) return "";

    const isPayment = paymentDays.includes(day);
    const isToday = day === today;
    const isKeyDate = KEY_DATES.includes(day);

    if (isPayment) return "bg-primary";
    if (isToday) return "bg-primary-600/75";
    if (isKeyDate) return "bg-primary/50";
    return "bg-secondary-900";
  };

  const shouldShowLabel = (day: number | null): boolean => {
    if (day === null) return false;
    return (
      KEY_DATES.includes(day) || day === today || paymentDays.includes(day)
    );
  };

  const isPaymentDay = (day: number | null): day is number => {
    return day !== null && paymentDays.includes(day);
  };

  return (
    <View className="mb-4">
      {/* Weekday header row */}
      <View className="flex-row justify-around my-4">
        {DAYS_OF_WEEK.map((day, idx) => (
          <Text
            key={idx}
            className="text-[12px] font-montserrat-medium text-light-900 flex-1 text-center"
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="border border-secondary-700 bg-secondary-800 rounded-3xl p-1">
        {weeks.map((week, weekIdx) => (
          <View key={weekIdx} className="flex-row">
            {week.map((day, dayIdx) => {
              const style = getDayStyle(day);
              const showLabel = shouldShowLabel(day);

              const content = (
                <View
                  className={`flex-1 aspect-square rounded-full items-center justify-center ${style}`}
                >
                  {showLabel && day !== null && (
                    <Text className="font-montserrat-semibold text-[14px] text-light-900">
                      {day}
                    </Text>
                  )}
                </View>
              );

              if (isPaymentDay(day) && onPaymentPress) {
                return (
                  <TouchableOpacity
                    key={`${weekIdx}-${dayIdx}`}
                    className="flex-1"
                    onPress={() => onPaymentPress(day)}
                    activeOpacity={0.7}
                  >
                    {content}
                  </TouchableOpacity>
                );
              }

              return (
                <View key={`${weekIdx}-${dayIdx}`} className="flex-1">
                  {content}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};
