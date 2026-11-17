import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface CustomCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: string | null;
  onSelectDate: (dateStr: string) => void;
  title?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  format?: "DD/MM/YYYY" | "YYYY/MM/DD" | "YYYY-MM-DD";
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const THEME = {
  cardBg: "#202023",
  cardBorder: "#2D2D32",
  primaryYellow: "#F7CA21",
  textWhite: "#FFFFFF",
  textSub: "#9CA3AF",
  btnDisabled: "#2D2D32",
  textDisabled: "#4B5563",
  dayDisabled: "#3E3E42",
  headerBg: "#2A2A2E",
};

/**
 * Parses a date string in DD/MM/YYYY, YYYY/MM/DD, or YYYY-MM-DD formats into a Date object.
 */
export const parseCalendarDate = (dateStr?: string | null): Date | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const str = dateStr.trim();

  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        const [y, m, d] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date;
      } else {
        // DD/MM/YYYY
        const [d, m, y] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        return isNaN(date.getTime()) ? null : date;
      }
    }
  }

  const d = new Date(str.replace(/\//g, "-"));
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a Date object to the requested string format. Default is DD/MM/YYYY.
 */
export const formatCalendarDate = (
  date: Date,
  format: "DD/MM/YYYY" | "YYYY/MM/DD" | "YYYY-MM-DD" = "DD/MM/YYYY"
): string => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  if (format === "YYYY/MM/DD") return `${yyyy}/${mm}/${dd}`;
  if (format === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`;
  return `${dd}/${mm}/${yyyy}`;
};

export const CustomCalendarModal: React.FC<CustomCalendarModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = "Select Date",
  minDate: customMinDate,
  maxDate: customMaxDate,
  format = "DD/MM/YYYY",
}) => {
  const minDate = useMemo(() => {
    if (customMinDate === null) return null;
    if (customMinDate) {
      const d = new Date(customMinDate);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null;
  }, [customMinDate]);

  const maxDate = useMemo(() => {
    if (customMaxDate === null) return null;
    if (customMaxDate) {
      const d = new Date(customMaxDate);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    // Default 10 years ahead
    const max = new Date();
    max.setFullYear(max.getFullYear() + 10);
    max.setHours(23, 59, 59, 999);
    return max;
  }, [customMaxDate]);

  // Initial reference date
  const referenceDate = useMemo(() => {
    const parsed = parseCalendarDate(selectedDate);
    if (parsed) return parsed;
    if (minDate && minDate > new Date()) return minDate;
    return new Date();
  }, [selectedDate, minDate]);

  const [currentYear, setCurrentYear] = useState<number>(referenceDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(referenceDate.getMonth());
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    parseCalendarDate(selectedDate)
  );

  useEffect(() => {
    if (visible) {
      const parsed = parseCalendarDate(selectedDate);
      if (parsed) {
        setInternalSelectedDate(parsed);
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
      } else {
        const fallback = minDate && minDate > new Date() ? minDate : new Date();
        setInternalSelectedDate(null);
        setCurrentYear(fallback.getFullYear());
        setCurrentMonth(fallback.getMonth());
      }
    }
  }, [visible, selectedDate, minDate]);

  const canGoPrev = useMemo(() => {
    if (!minDate) return true;
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0);
    return prevMonthLastDay >= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }, [currentYear, currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const nextMonthFirstDay = new Date(currentYear, currentMonth + 1, 1);
    return nextMonthFirstDay <= maxDate;
  }, [currentYear, currentMonth, maxDate]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

    const days: Array<{
      day: number;
      date: Date;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        day: 0,
        date: new Date(0),
        isCurrentMonth: false,
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);

      const isDisabled = Boolean(
        (minDate && date < minDate) || (maxDate && date > maxDate)
      );
      const isSelected =
        internalSelectedDate !== null &&
        internalSelectedDate.getFullYear() === date.getFullYear() &&
        internalSelectedDate.getMonth() === date.getMonth() &&
        internalSelectedDate.getDate() === date.getDate();

      const isToday =
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate();

      days.push({
        day,
        date,
        isCurrentMonth: true,
        isDisabled,
        isSelected,
        isToday,
      });
    }

    // Pad the END of the grid so the last row always has 7 slots
    const trailingBlanks = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < trailingBlanks; i++) {
      days.push({
        day: 0,
        date: new Date(0),
        isCurrentMonth: false,
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    return days;
  }, [currentYear, currentMonth, minDate, maxDate, internalSelectedDate]);

  const handleDayPress = (dayItem: { date: Date; isDisabled: boolean }) => {
    if (dayItem.isDisabled) return;
    setInternalSelectedDate(dayItem.date);
  };

  const handleConfirm = () => {
    if (!internalSelectedDate) return;
    const formatted = formatCalendarDate(internalSelectedDate, format);
    onSelectDate(formatted);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        {/* Backdrop touch area to dismiss */}
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: THEME.cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: THEME.cardBorder,
            width: "100%",
            maxWidth: 360,
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#2A2A2E",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={THEME.primaryYellow}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: THEME.textWhite,
                }}
              >
                {title}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: THEME.headerBg,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={18} color={THEME.textSub} />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigator */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              paddingHorizontal: 4,
            }}
          >
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={!canGoPrev}
              activeOpacity={0.7}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: canGoPrev ? THEME.headerBg : "#18181B",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={canGoPrev ? THEME.textWhite : THEME.textDisabled}
              />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: THEME.textWhite,
              }}
            >
              {`${MONTH_NAMES[currentMonth]} ${currentYear}`}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={!canGoNext}
              activeOpacity={0.7}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: canGoNext ? THEME.headerBg : "#18181B",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={canGoNext ? THEME.textWhite : THEME.textDisabled}
              />
            </TouchableOpacity>
          </View>

          {/* Days of Week Row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
              paddingHorizontal: 4,
            }}
          >
            {DAYS_OF_WEEK.map((d) => (
              <View
                key={d}
                style={{
                  width: 40,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: THEME.textSub,
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            {calendarDays.map((item, index) => {
              if (!item.isCurrentMonth) {
                return (
                  <View
                    key={`blank-${index}`}
                    style={{
                      width: 40,
                      height: 40,
                      marginVertical: 2,
                    }}
                  />
                );
              }

              return (
                <TouchableOpacity
                  key={`day-${item.day}`}
                  activeOpacity={item.isDisabled ? 1 : 0.7}
                  disabled={item.isDisabled}
                  onPress={() => handleDayPress(item)}
                  style={{
                    width: 40,
                    height: 40,
                    marginVertical: 2,
                    borderRadius: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: item.isSelected
                      ? THEME.primaryYellow
                      : "transparent",
                    borderWidth: item.isToday && !item.isSelected ? 1.5 : 0,
                    borderColor: THEME.primaryYellow,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: item.isSelected ? "800" : "500",
                      color: item.isDisabled
                        ? THEME.dayDisabled
                        : item.isSelected
                        ? "#0E0E0E"
                        : item.isToday
                        ? THEME.primaryYellow
                        : THEME.textWhite,
                    }}
                  >
                    {String(item.day)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Date Button */}
          <TouchableOpacity
            activeOpacity={internalSelectedDate ? 0.85 : 1}
            disabled={!internalSelectedDate}
            onPress={handleConfirm}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: internalSelectedDate
                ? THEME.primaryYellow
                : THEME.btnDisabled,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 18,
              shadowColor: THEME.primaryYellow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: internalSelectedDate ? 0.25 : 0,
              shadowRadius: 6,
              elevation: internalSelectedDate ? 3 : 0,
            }}
          >
            <Text
              style={{
                color: internalSelectedDate ? "#0E0E0E" : "#6B7280",
                fontSize: 15,
                fontWeight: "800",
              }}
            >
              Confirm Date
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomCalendarModal;

