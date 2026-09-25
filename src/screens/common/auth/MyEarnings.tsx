import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { useSelector } from "react-redux";
import { selectAuthToken } from "@/store/authSlice";
import environment from "@/environment/environment";
import LottieView from "lottie-react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

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
  dateTime: string;
  method: "cash" | "card";
  earnings: number;
}

const screenWidth = Dimensions.get("window").width;
const PICKER_WIDTH = Math.min(screenWidth - 40, 340);

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

  const [tempFromDate, setTempFromDate] = useState<Date>(new Date());
  const [tempToDate, setTempToDate] = useState<Date>(new Date());

  const [isLoading, setIsLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);

  const canApply = !!fromDate && !!toDate;

  const handleOpenFromPicker = () => {
    setTempFromDate(fromDate || new Date());
    setShowFromPicker((prev) => !prev);
    setShowToPicker(false);
  };

  const handleOpenToPicker = () => {
    if (!fromDate) return;
    setTempToDate(toDate || fromDate || new Date());
    setShowToPicker((prev) => !prev);
    setShowFromPicker(false);
  };

  const onChangeFromDateAndroid = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowFromPicker(false);
    if (event.type === "set" && selectedDate) {
      setFromDate(selectedDate);
      if (toDate && selectedDate > toDate) {
        setToDate(null);
      }
    }
  };

  const onChangeToDateAndroid = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowToPicker(false);
    if (event.type === "set" && selectedDate) {
      setToDate(selectedDate);
    }
  };

  const onConfirmFromDateIOS = () => {
    setFromDate(tempFromDate);
    if (toDate && tempFromDate > toDate) {
      setToDate(null);
    }
    setShowFromPicker(false);
  };

  const onConfirmToDateIOS = () => {
    setToDate(tempToDate);
    setShowToPicker(false);
  };

  const handleApply = async () => {
    if (!canApply || !token) return;

    setShowFromPicker(false);
    setShowToPicker(false);

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

      setShowAllOrders(false);
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
      setShowAllOrders(false);
    } finally {
      setIsLoading(false);
    }
  };

  const totalOrders = orders.length;

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleBackPress = () => {
    navigation.navigate("Profile");
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Profile");
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <CustomHeader
          title="My Earnings History"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
          onBackPress={handleBackPress}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Date range card */}
          <View className="mx-4 mt-4 bg-white rounded-2xl border border-[#EFEFEF] p-4 shadow-sm">
            <Text className="text-black font-bold text-base mb-3">
              Select Date Range
            </Text>

            <Text className="text-[#000000] text-xs mb-1">From</Text>
            <TouchableOpacity
              onPress={handleOpenFromPicker}
              className="border border-[#D5D9E4] rounded-3xl px-4 mb-4 justify-center"
              style={{ height: 50 }}
              activeOpacity={0.7}
            >
              <Text
                className={
                  fromDate
                    ? "text-black font-semibold text-sm"
                    : "text-[#000000] text-sm"
                }
              >
                {fromDate ? formatLongDate(fromDate) : "--Select Here--"}
              </Text>
            </TouchableOpacity>

            <Text className="text-[#000000] text-xs mb-1">To</Text>
            <TouchableOpacity
              onPress={handleOpenToPicker}
              disabled={!fromDate}
              className={`border rounded-3xl px-4 mb-4 justify-center ${
                fromDate ? "border-[#D5D9E4]" : "border-[#EFEFEF] bg-[#F5F5F5]"
              }`}
              style={{ height: 50 }}
              activeOpacity={fromDate ? 0.7 : 1}
            >
              <Text
                className={
                  toDate
                    ? "text-black font-semibold text-sm"
                    : fromDate
                      ? "text-[#000000] text-sm"
                      : "text-[#B0B0B0] text-sm"
                }
              >
                {toDate
                  ? formatLongDate(toDate)
                  : fromDate
                    ? "--Select Here--"
                    : "--Select From Date First--"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              disabled={!canApply || isLoading}
              className={`rounded-full items-center justify-center ${
                canApply ? "bg-[#F7CA21]" : "bg-[#D9D9D9]"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
                height: 50,
              }}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text className="font-semibold text-black">Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* From Date Picker  */}
          {Platform.OS === "android" ? (
            showFromPicker && (
              <DateTimePicker
                value={fromDate || new Date()}
                mode="date"
                display="default"
                onChange={onChangeFromDateAndroid}
                maximumDate={new Date()}
              />
            )
          ) : (
            <Modal
              transparent
              visible={showFromPicker}
              animationType="fade"
              onRequestClose={() => setShowFromPicker(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowFromPicker(false)}
                className="flex-1 bg-black/50 justify-center items-center"
              >
                <TouchableWithoutFeedback>
                  <View
                    className="bg-white rounded-2xl shadow-lg"
                    style={{
                      width: PICKER_WIDTH,
                      paddingTop: 16,
                      paddingBottom: 16,
                    }}
                  >
                    <Text className="text-black font-bold text-base mb-2 px-4">
                      Select From Date
                    </Text>
                    <DateTimePicker
                      value={tempFromDate}
                      mode="date"
                      display="inline"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) setTempFromDate(selectedDate);
                      }}
                      maximumDate={new Date()}
                      themeVariant="light"
                      style={{ width: PICKER_WIDTH, alignSelf: "center" }}
                    />
                    <View
                      className="flex-row justify-end mt-3 px-4"
                      style={{ gap: 12 }}
                    >
                      <TouchableOpacity
                        onPress={() => setShowFromPicker(false)}
                        className="px-4 py-2 rounded-lg"
                      >
                        <Text className="text-[#007AFF] font-semibold text-sm">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={onConfirmFromDateIOS}
                        className="bg-[#F7CA21] px-5 py-2 rounded-full"
                      >
                        <Text className="text-black font-semibold text-sm">
                          OK
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          )}

          {/* To Date Picker  */}
          {Platform.OS === "android" ? (
            showToPicker && (
              <DateTimePicker
                value={toDate || new Date()}
                mode="date"
                display="default"
                onChange={onChangeToDateAndroid}
                minimumDate={fromDate || undefined}
                maximumDate={new Date()}
              />
            )
          ) : (
            <Modal
              transparent
              visible={showToPicker}
              animationType="fade"
              onRequestClose={() => setShowToPicker(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowToPicker(false)}
                className="flex-1 bg-black/50 justify-center items-center"
              >
                <TouchableWithoutFeedback>
                  <View
                    className="bg-white rounded-2xl shadow-lg"
                    style={{
                      width: PICKER_WIDTH,
                      paddingTop: 16,
                      paddingBottom: 16,
                    }}
                  >
                    <Text className="text-black font-bold text-base mb-2 px-4">
                      Select To Date
                    </Text>
                    <DateTimePicker
                      value={tempToDate}
                      mode="date"
                      display="inline"
                      onChange={(_, selectedDate) => {
                        if (selectedDate) setTempToDate(selectedDate);
                      }}
                      minimumDate={fromDate || undefined}
                      maximumDate={new Date()}
                      themeVariant="light"
                      style={{ width: PICKER_WIDTH, alignSelf: "center" }}
                    />
                    <View
                      className="flex-row justify-end mt-3 px-4"
                      style={{ gap: 12 }}
                    >
                      <TouchableOpacity
                        onPress={() => setShowToPicker(false)}
                        className="px-4 py-2 rounded-lg"
                      >
                        <Text className="text-[#007AFF] font-semibold text-sm">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={onConfirmToDateIOS}
                        className="bg-[#F7CA21] px-5 py-2 rounded-full"
                      >
                        <Text className="text-black font-semibold text-sm">
                          OK
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          )}

          {hasApplied && summary && (
            <>
              {/* Earnings summary highlight */}
              <View className="mx-4 mt-4 bg-[#FFFBE9] rounded-xl px-4 py-3">
                <Text className="text-black font-bold text-sm mb-1">
                  Earnings Summery
                </Text>
                <Text className=" text-sm">
                  {formatLongDate(fromDate)} - {formatLongDate(toDate)}
                </Text>
              </View>

              {/* Info note */}
              <View className="flex-row items-start mx-4 mt-3">
                <FontAwesome6
                  name="circle-info"
                  size={14}
                  color="#5A6580"
                  style={{ marginTop: 2, marginRight: 4 }}
                />
                <Text className="text-[#5A6580] text-sm flex-1">
                  Your earnings will be transferred within 7 days after the
                  delivered date.
                </Text>
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
                  <FontAwesome6
                    name="arrows-up-down"
                    size={16}
                    color="#000000"
                  />
                </TouchableOpacity>

                {showAllOrders && totalOrders > 0 && (
                  <View>
                    {/* Table header */}
                    <View className="flex-row items-center px-4 py-2 bg-[#FAFAFA] border-t border-[#F0F0F0]">
                      <Text className="flex-1 text-[#7A7A7A] text-xs font-medium text-left">
                        Order ID
                      </Text>
                      <Text
                        className="w-16 text-[#7A7A7A] text-xs font-medium text-left"
                        numberOfLines={1}
                      >
                        Method
                      </Text>
                      <Text
                        className="w-24 text-[#7A7A7A] text-xs font-medium text-left"
                        numberOfLines={1}
                      >
                        Earnings (Rs)
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
                          <Text className="text-black text-[11px] mt-0.5">
                            {formatOrderTimestamp(order.dateTime)}
                          </Text>
                        </View>

                        <View className="w-16 flex-row items-center">
                          <FontAwesome6
                            name={
                              order.method === "cash" ? "coins" : "credit-card"
                            }
                            size={14}
                            style={{ marginRight: 4 }}
                          />
                          <Text className="text-black text-xs capitalize">
                            {order.method}
                          </Text>
                        </View>

                        <Text
                          className="w-24 text-black text-xs text-left"
                          numberOfLines={1}
                        >
                          Rs. {formatCurrency(order.earnings)}
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
