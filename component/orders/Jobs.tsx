import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  BackHandler,
  StatusBar,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { formatScheduleTime } from "@/utils/formatScheduleTime";
import LottieView from "lottie-react-native";
import MarqueeText from "@/component/common/MarqueeText";
import { useFocusEffect } from "@react-navigation/native";
import LoadingPage from "../common/LoadingPage";

type JobsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Jobs">;

interface JobsScreenProp {
  navigation: JobsScreenNavigationProp;
}

interface HoldReason {
  driverOrderId: number;
  holdReasonId: number;
  indexNo: number;
  rsnEnglish: string;
  rsnSinhala: string;
  rsnTamil: string;
}

interface DriverOrder {
  driverOrderId: number;
  processOrderId: number;
  marketOrderId: number;
  drvStatus: string;
  isHandOver: boolean;
  title: string;
  fullName: string;
  sheduleTime: string;
  jobCount: number;
  allDriverOrderIds: number[];
  allOrderIds: number[];
  allScheduleTimes: string[];
  primaryScheduleTime: string;
  sequenceNumber: string;
  allProcessOrderIds?: number[];
  processOrderIds?: number[];
  holdReasons?: HoldReason[] | null;
  completeTime?: string | Date;
  allCompleteTimes?: (string | Date)[];
}

interface OrderStatistics {
  Todo: number;
  Completed: number;
  Hold: number;
  Return: number;
  Total: number;
}

const Jobs: React.FC<JobsScreenProp> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"todo" | "completed">("todo");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todoOrders, setTodoOrders] = useState<DriverOrder[]>([]);
  const [holdOrders, setHoldOrders] = useState<DriverOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<DriverOrder[]>([]);
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setCurrentDate(todayStr);

    fetchDriverOrders(todayStr);
  }, []);

  const isToday = (dateInput: string | Date): boolean => {
    if (!dateInput) return false;

    try {
      const inputDate = new Date(dateInput);
      const today = new Date();

      return (
        inputDate.getDate() === today.getDate() &&
        inputDate.getMonth() === today.getMonth() &&
        inputDate.getFullYear() === today.getFullYear()
      );
    } catch (error) {
      console.error("Error in isToday:", error);
      return false;
    }
  };

  const fetchDriverOrders = async (dateStr?: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      let todayDate = dateStr;
      if (!todayDate) {
        const now = new Date();
        todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(now.getDate()).padStart(2, "0")}`;
        setCurrentDate(todayDate);
      }

      const todoHoldResponse = await axios.get(
        `${environment.API_BASE_URL}api/order/get-driver-orders?status=Todo,Hold,On%20the%20way&isHandOver=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (todoHoldResponse.data.status === "success") {
        const allOrders = todoHoldResponse.data.data.orders;

        const todo = allOrders.filter(
          (order: DriverOrder) =>
            order.drvStatus === "Todo" || order.drvStatus === "On the way",
        );
        const hold = allOrders.filter(
          (order: DriverOrder) => order.drvStatus === "Hold",
        );

        setTodoOrders(todo);
        setHoldOrders(hold);
        setStatistics(todoHoldResponse.data.data.statistics);
      }

      const completedResponse = await axios.get(
        `${environment.API_BASE_URL}api/order/get-driver-orders?status=Completed&date=${todayDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (completedResponse.data.status === "success") {
        const allCompleted = completedResponse.data.data.orders;
        setCompletedOrders(() => allCompleted);
      }
    } catch (error: any) {
      console.error("Error fetching driver orders:", error);
      setError("Failed to load jobs. Please try again.");

      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setCurrentDate(todayStr);
    fetchDriverOrders(todayStr);
  };

  const getHoldReasonText = (orderData: DriverOrder): string => {
    if (!orderData.holdReasons || orderData.holdReasons.length === 0) {
      return "Hold reason not specified";
    }

    const reason = orderData.holdReasons[0];
    return reason.rsnEnglish || "Hold reason not specified";
  };

  const getScheduleTimePriority = (time?: string) => {
    if (!time) return Number.MAX_SAFE_INTEGER;

    const lowerTime = time.toLowerCase();

    if (
      lowerTime.includes("8:00") ||
      lowerTime.includes("8 am") ||
      lowerTime.includes("8:00am") ||
      lowerTime.includes("8:00 am") ||
      lowerTime.includes("morning") ||
      lowerTime.includes("early")
    ) {
      return 1;
    }

    if (
      lowerTime.includes("2:00") ||
      lowerTime.includes("2 pm") ||
      lowerTime.includes("2:00pm") ||
      lowerTime.includes("2:00 pm") ||
      lowerTime.includes("afternoon") ||
      lowerTime.includes("evening") ||
      lowerTime.includes("late")
    ) {
      return 2;
    }

    const match = time.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const period = match[2].toUpperCase();

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      return hour;
    }

    return Number.MAX_SAFE_INTEGER;
  };

  // ✅ NEW HELPER: always returns the earliest time slot among allScheduleTimes
  const getEarliestScheduleTime = (order: DriverOrder): string => {
    const allTimes = order.allScheduleTimes || [];

    if (allTimes.length === 0) {
      return order.primaryScheduleTime || "Not Scheduled";
    }

    if (allTimes.length === 1) {
      return allTimes[0];
    }

    // Sort by priority (lowest priority number = earliest slot) and return first
    const sorted = [...allTimes].sort(
      (a, b) => getScheduleTimePriority(a) - getScheduleTimePriority(b),
    );

    return sorted[0];
  };

  const getTodoDisplayOrders = () => {
    const allOrders = [...todoOrders, ...holdOrders];

    const sortedOrders = allOrders.sort((a, b) => {
      const isHoldA = a.drvStatus.toLowerCase() === "hold";
      const isHoldB = b.drvStatus.toLowerCase() === "hold";

      if (isHoldA && !isHoldB) return 1;
      if (!isHoldA && isHoldB) return -1;

      // ✅ use earliest time slot for sorting
      const timeA = getEarliestScheduleTime(a);
      const timeB = getEarliestScheduleTime(b);

      const priorityA = getScheduleTimePriority(timeA);
      const priorityB = getScheduleTimePriority(timeB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.processOrderId - b.processOrderId;
    });

    return sortedOrders.map((order, index) => ({
      id: (index + 1).toString().padStart(2, "0"),
      title: order.title || "",
      name: order.fullName || "Customer",
      // ✅ FIX: display earliest time slot
      time: formatScheduleTime(getEarliestScheduleTime(order)),
      count: order.jobCount || 1,
      status: order.drvStatus,
      orderData: order,
    }));
  };

  const getCompletedDisplayOrders = () => {
    console.log(
      "completedOrders full data:",
      JSON.stringify(
        completedOrders.map((o) => ({
          driverOrderId: o.driverOrderId,
          processOrderId: o.processOrderId,
          fullName: o.fullName,
          completeTime: o.completeTime,
          allCompleteTimes: o.allCompleteTimes,
          drvStatus: o.drvStatus,
        })),
        null,
        2,
      ),
    );

    const todayCompletedOrders = completedOrders.filter((order) => {
      if (!order.completeTime) {
        return false;
      }

      return isToday(order.completeTime);
    });

    const sortedOrders = [...todayCompletedOrders].sort((a, b) => {
      // ✅ FIX: use earliest time slot for sorting
      const timeA = getEarliestScheduleTime(a);
      const timeB = getEarliestScheduleTime(b);

      const priorityA = getScheduleTimePriority(timeA);
      const priorityB = getScheduleTimePriority(timeB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.processOrderId - b.processOrderId;
    });

    const displayOrders = sortedOrders.map((order, index) => {
      let todayCompletedCount = 1;

      if (order.allCompleteTimes && order.allCompleteTimes.length > 0) {
        todayCompletedCount = order.allCompleteTimes.filter((completeTime) =>
          isToday(completeTime),
        ).length;
      }

      return {
        id: (index + 1).toString().padStart(2, "0"),
        title: order.title || "",
        name: order.fullName || "Customer",
        // ✅ FIX: display earliest time slot
        time: formatScheduleTime(getEarliestScheduleTime(order)),
        count: todayCompletedCount,
        status: "Completed",
        orderData: order,
      };
    });

    return displayOrders;
  };

  const formatCount = (count: number) => {
    return count === 0 ? "0" : count.toString().padStart(2, "0");
  };

  const getTodoTabCount = () => {
    return formatCount(todoOrders.length + holdOrders.length);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Home");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const getCompletedCount = () => {
    return formatCount(completedOrders.length);
  };

  const dataToShow =
    activeTab === "todo" ? getTodoDisplayOrders() : getCompletedDisplayOrders();

  const navigateToOrderDetails = (orderData: DriverOrder) => {
    const processOrderId = orderData.processOrderId;
    const primaryOrderId = processOrderId || orderData.marketOrderId;
    const orderIds = orderData.allOrderIds || [orderData.marketOrderId];
    const processOrderIds =
      orderData.allProcessOrderIds ||
      orderData.processOrderIds || [primaryOrderId];

    navigation.navigate("OrderDetails", {
      processOrderIds: processOrderIds,
    });
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Jobs"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
          onBackPress={() => navigation.navigate("Home")}
        />
        <LoadingPage message="Loading Jobs..." fullScreen={true} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <CustomHeader
        title="Jobs"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.navigate("Home")}
      />

      {error && (
        <View className="mx-4 mt-4 p-3 bg-red-100 rounded-lg">
          <Text className="text-red-700 text-center">{error}</Text>
          <TouchableOpacity
            onPress={() => {
              const now = new Date();
              const todayStr = `${now.getFullYear()}-${String(
                now.getMonth() + 1,
              ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
              fetchDriverOrders(todayStr);
            }}
            className="mt-2 bg-red-600 py-2 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        className="flex-row mt-2 bg-white"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("todo")}
          className={`
            flex-1 flex-row items-center justify-center gap-x-2 
            ${activeTab === "todo" ? " bg-[#F6F9FF]" : ""}
            py-3
          `}
        >
          <View className="w-7 h-7 rounded-full bg-black justify-center items-center">
            <Text className="text-white font-bold">{getTodoTabCount()}</Text>
          </View>
          <Text
            className={`text-md ${
              activeTab === "todo" ? "font-bold" : "font-medium"
            }`}
          >
            To Do
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("completed")}
          className={`
            flex-1 flex-row items-center justify-center gap-x-2 
            ${activeTab === "completed" ? "bg-[#F6F9FF] " : ""}
            py-2
          `}
        >
          <View className="w-7 h-7 rounded-full bg-black justify-center items-center">
            <Text className="text-white font-bold">{getCompletedCount()}</Text>
          </View>
          <Text
            className={`text-md ${
              activeTab === "completed" ? "font-bold" : "font-medium"
            }`}
          >
            Delivered
          </Text>
        </TouchableOpacity>
      </View>

      {dataToShow.length > 0 ? (
        <ScrollView
          className="mt-6 px-5"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#F7CA21"]}
              tintColor="#F7CA21"
            />
          }
        >
          {dataToShow.map((item, index) => {
            const isOnHold = item.status === "Hold";
            const isOnTheWay = item.status === "On the way";
            const holdReasonText = isOnHold
              ? getHoldReasonText(item.orderData)
              : "";

            return (
              <TouchableOpacity
                disabled={activeTab === "completed"}
                style={
                  activeTab === "todo" && {
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 2,
                  }
                }
                key={index}
                className={`rounded-xl px-5 py-2 mb-5 shadow-sm border flex-row justify-between items-center ${
                  isOnTheWay && activeTab === "todo"
                    ? "bg-[#FFFBEA] border-[#F7CA21]"
                    : isOnHold
                    ? "bg-white border-[#FF0000]"
                    : "bg-white border-[#A4AAB7]"
                }`}
                onPress={() => {
                  if (activeTab === "todo") {
                    navigateToOrderDetails(item.orderData);
                  }
                }}
              >
                <View className="flex-1">
                  <View className="flex-row items-center">
                    {isOnTheWay && activeTab === "todo" ? (
                      <View className="bg-[#F7CA21] w-2 h-2 rounded-full mr-1" />
                    ) : null}
                    <Text className="text-sm font-bold">#{item.id} </Text>
                    {isOnHold && (
                      <Text className="text-[#FF0000] text-sm font-semibold mr-2">
                        (On Hold)
                      </Text>
                    )}
                  </View>

                  <Text className="text-base font-bold mt-1">
                    {item.title}. {item.name}
                  </Text>
                  <Text className="text-sm mt-1">{item.time}</Text>
                  {isOnHold && (
                    <View className="flex flex-row items-center gap-2 mt-0.5">
                      <FontAwesome6
                        name="circle-exclamation"
                        size={18}
                        color="#FF0000"
                      />
                      <View style={{ flex: 1, height: 20 }}>
                        <MarqueeText
                          text={holdReasonText}
                          style={{
                            fontSize: 12,
                            color: "#647B94",
                            lineHeight: 16,
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center">
                  <View
                    className={`w-7 h-7 justify-center items-center rounded-full ${
                      isOnHold
                        ? "bg-[#FF0000]"
                        : activeTab === "todo"
                        ? "bg-yellow-400"
                        : "bg-[#F3F3F3]"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        isOnHold ? "text-white" : "text-black"
                      }`}
                    >
                      {item.count}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center px-5">
          <LottieView
            source={require("@/assets/json/no-data.json")}
            autoPlay
            loop
            style={{ width: 160, height: 160 }}
          />

          {activeTab === "todo" ? (
            <>
              <Text className="text-gray-500 text-lg text-center" style={{ marginTop: -15 }}>
                No pending jobs
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-10">
                Scan QR codes to assign jobs to your list
              </Text>
            </>
          ) : (
            <>
              <Text className="text-gray-500 text-lg text-center" style={{ marginTop: -15 }}>
                No completed jobs today
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-10">
                Today's completed jobs will appear here
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default Jobs;