import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import CustomHeader from "../common/CustomHeader";
import { useSelector } from "react-redux";
import { selectAuthToken } from "@/store/authSlice";
import { environment } from "@/environment/environment";
import LottieView from "lottie-react-native";

type MyEarningsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyEarnings"
>;

interface MyEarningsProps {
  navigation: MyEarningsNavigationProp;
}

interface EarningsSummary {
  fromDate: string;
  toDate: string;
  cashEarnings: number;
  cashOrders: number;
  cardEarnings: number;
  cardOrders: number;
}

interface OrderItem {
  orderId: string;
  dateTime: string; // ISO string
  method: "cash" | "card";
  earnings: number;
}

const formatLongDate = (date: Date | null) => {
  if (!date) return "";
  const monthNames = [
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
  return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(
    2,
    "0",
  )}, ${date.getFullYear()}`;
};

const formatOrderTimestamp = (isoString: string) => {
  try {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    const time = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `At ${time} | ${y}/${m}/${d}`;
  } catch {
    return "";
  }
};

const MyEarnings: React.FC<MyEarningsProps> = ({ navigation }) => {
  const token = useSelector(selectAuthToken);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(true);

  const canApply = !!fromDate && !!toDate;

  const onChangeFromDate = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowFromPicker(Platform.OS === "ios");
    if (event.type === "set" && selectedDate) {
      setFromDate(selectedDate);
    }
    if (Platform.OS === "android") setShowFromPicker(false);
  };

  const onChangeToDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === "ios");
    if (event.type === "set" && selectedDate) {
      setToDate(selectedDate);
    }
    if (Platform.OS === "android") setShowToPicker(false);
  };

  // NOTE: adjust endpoint & response shape to match your actual backend contract.
  const handleApply = async () => {
    if (!canApply || !token) return;

    try {
      setIsLoading(true);

      const from = fromDate!.toISOString().split("T")[0];
      const to = toDate!.toISOString().split("T")[0];

      const response = await fetch(
        `${environment.API_BASE_URL}api/auth/get-earnings-history?from=${from}&to=${to}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSummary(data.data.summary);
        setOrders(data.data.orders || []);
      } else {
        setSummary({
          fromDate: from,
          toDate: to,
          cashEarnings: 0,
          cashOrders: 0,
          cardEarnings: 0,
          cardOrders: 0,
        });
        setOrders([]);
      }
      setHasApplied(true);
      setShowAllOrders(true);
    } catch (error) {
      console.error("Error fetching earnings history:", error);
      setSummary({
        fromDate: fromDate!.toISOString().split("T")[0],
        toDate: toDate!.toISOString().split("T")[0],
        cashEarnings: 0,
        cashOrders: 0,
        cardEarnings: 0,
        cardOrders: 0,
      });
      setOrders([]);
      setHasApplied(true);
    } finally {
      setIsLoading(false);
    }
  };

  const totalOrders = orders.length;

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <CustomHeader
            title="My Earnings History"
            showBackButton={true}
            showLanguageSelector={false}
            navigation={navigation}
          />

          {/* Date range card */}
          <View className="mx-4 mt-4 bg-white rounded-2xl border border-[#EFEFEF] p-4 shadow-sm">
            <Text className="text-black font-bold text-base mb-3">
              Select Date Range
            </Text>

            <Text className="text-[#7A7A7A] text-xs mb-1">From</Text>
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              className="border border-[#E5E5E5] rounded-xl px-4 py-3 mb-4"
              activeOpacity={0.7}
            >
              <Text
                className={
                  fromDate
                    ? "text-black font-semibold text-sm"
                    : "text-[#9AA0A6] text-sm"
                }
              >
                {fromDate ? formatLongDate(fromDate) : "--Select Here--"}
              </Text>
            </TouchableOpacity>

            <Text className="text-[#7A7A7A] text-xs mb-1">To</Text>
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              className="border border-[#E5E5E5] rounded-xl px-4 py-3 mb-4"
              activeOpacity={0.7}
            >
              <Text
                className={
                  toDate
                    ? "text-black font-semibold text-sm"
                    : "text-[#9AA0A6] text-sm"
                }
              >
                {toDate ? formatLongDate(toDate) : "--Select Here--"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              disabled={!canApply || isLoading}
              className={`rounded-full py-3 items-center justify-center ${
                canApply ? "bg-[#FFC83D]" : "bg-[#D9D9D9]"
              }`}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text className="font-semibold text-black">Apply</Text>
              )}
            </TouchableOpacity>

            {showFromPicker && (
              <DateTimePicker
                value={fromDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeFromDate}
                maximumDate={toDate || undefined}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={toDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onChangeToDate}
                minimumDate={fromDate || undefined}
              />
            )}
          </View>

          {hasApplied && summary && (
            <>
              {/* Earnings summary highlight */}
              <View className="mx-4 mt-4 bg-[#FFF8E6] rounded-xl px-4 py-3">
                <Text className="text-black font-bold text-sm mb-1">
                  Earnings Summery
                </Text>
                <Text className="text-[#5B5B5B] text-xs">
                  {formatLongDate(fromDate)} - {formatLongDate(toDate)}
                </Text>
              </View>

              {/* Info note */}
              <View className="flex-row items-start mx-4 mt-3">
                <MaterialCommunityIcons
                  name="information-outline"
                  size={14}
                  color="#7A7A7A"
                  style={{ marginTop: 2, marginRight: 4 }}
                />
                <Text className="text-[#7A7A7A] text-xs flex-1">
                  Card payment order earnings will be transferred within 7 days
                  after the delivered date.
                </Text>
              </View>

              {/* Cash / Card earnings cards */}
              <View className="flex-row mx-4 mt-3" style={{ gap: 12 }}>
                <View className="flex-1 border border-[#EFEFEF] rounded-2xl items-center py-4 shadow-sm bg-white">
                  <LottieView
                    source={require("@/assets/json/coin.json")}
                    style={{
                      width: 40,
                      height: 40,
                    }}
                    autoPlay
                    loop
                  />
                  <Text className="text-[#7A7A7A] text-xs mb-1">
                    Cash Earnings
                  </Text>
                  <Text className="text-black font-bold text-base mb-2">
                    Rs. {summary.cashEarnings.toFixed(2)}
                  </Text>
                  <View className="bg-[#FEF3D4] rounded-lg px-3 py-1">
                    <Text className="text-[#7A4A0E] text-xs font-medium">
                      {summary.cashOrders} Order
                      {summary.cashOrders === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>

                <View className="flex-1 border border-[#EFEFEF] rounded-2xl items-center py-4 shadow-sm bg-white">
                  <LottieView
                    source={require("@/assets/json/card.json")}
                    style={{
                      width: 40,
                      height: 40,
                    }}
                    autoPlay
                    loop
                  />
                  <Text className="text-[#7A7A7A] text-xs mb-1">
                    Card Earnings
                  </Text>
                  <Text className="text-black font-bold text-base mb-2">
                    Rs. {summary.cardEarnings.toFixed(2)}
                  </Text>
                  <View className="bg-[#DAF2E2] rounded-lg px-3 py-1">
                    <Text className="text-[#0F6D40] text-xs font-medium">
                      {summary.cardOrders} Order
                      {summary.cardOrders === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* All orders expandable */}
              <View className="mx-4 mt-4 mb-8 border border-[#EFEFEF] rounded-2xl shadow-sm bg-white overflow-hidden">
                <TouchableOpacity
                  onPress={() => setShowAllOrders((prev) => !prev)}
                  className="flex-row items-center justify-between px-4 py-3"
                  activeOpacity={0.7}
                >
                  <Text className="text-black font-bold text-sm">
                    All Orders ({String(totalOrders).padStart(2, "0")})
                  </Text>
                  <MaterialCommunityIcons
                    name="unfold-more-horizontal"
                    size={18}
                    color="#7A7A7A"
                    style={{ transform: [{ rotate: "90deg" }] }}
                  />
                </TouchableOpacity>

                {showAllOrders && totalOrders > 0 && (
                  <View>
                    {/* Table header */}
                    <View className="flex-row px-4 py-2 bg-[#FAFAFA] border-t border-[#F0F0F0]">
                      <Text className="flex-1 text-[#7A7A7A] text-xs font-medium">
                        Order ID
                      </Text>
                      <Text className="w-16 text-[#7A7A7A] text-xs font-medium">
                        Method
                      </Text>
                      <Text className="w-20 text-[#7A7A7A] text-xs font-medium text-right">
                        Earnings (Rs.)
                      </Text>
                    </View>

                    {orders.map((order, index) => (
                      <View
                        key={`${order.orderId}-${index}`}
                        className={`flex-row items-center px-4 py-3 ${
                          index !== orders.length - 1
                            ? "border-b border-[#F0F0F0]"
                            : ""
                        }`}
                      >
                        <View className="flex-1">
                          <Text className="text-black font-semibold text-xs">
                            #{order.orderId}
                          </Text>
                          <Text className="text-[#9AA0A6] text-[11px] mt-0.5">
                            {formatOrderTimestamp(order.dateTime)}
                          </Text>
                        </View>

                        <View className="w-16 flex-row items-center">
                          <MaterialCommunityIcons
                            name={
                              order.method === "cash"
                                ? "cash"
                                : "credit-card-outline"
                            }
                            size={14}
                            color={
                              order.method === "cash" ? "#8A6D1D" : "#1E8449"
                            }
                            style={{ marginRight: 4 }}
                          />
                          <Text className="text-black text-xs capitalize">
                            {order.method}
                          </Text>
                        </View>

                        <Text className="w-20 text-black text-xs text-right">
                          Rs. {order.earnings.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {showAllOrders && totalOrders === 0 && (
                  <View className="px-4 py-6 items-center border-t border-[#F0F0F0]">
                    <Text className="text-[#9AA0A6] text-xs">
                      No orders found for this date range.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default MyEarnings;
