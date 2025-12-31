import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { formatScheduleTime } from "@/utils/formatScheduleTime";
import LottieView from "lottie-react-native"; 

type JobsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Jobs">;

interface JobsScreenProp {
  navigation: JobsScreenNavigationProp;
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

  useEffect(() => {
    fetchDriverOrders();
  }, []);

  const fetchDriverOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fetch Todo and Hold orders for "To Do" tab
      const todoHoldResponse = await axios.get(
        `${environment.API_BASE_URL}api/order/get-driver-orders?status=Todo,Hold,On%20the%20way&isHandOver=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "FINAL ORDERS RESPONSE:",
        JSON.stringify(todoHoldResponse.data.data.orders, null, 2)
      );

      if (todoHoldResponse.data.status === "success") {
        const allOrders = todoHoldResponse.data.data.orders;

        // Separate Todo and Hold orders
        const todo = allOrders.filter(
          (order: DriverOrder) =>
            order.drvStatus === "Todo" || order.drvStatus === "On the way"
        );
        const hold = allOrders.filter(
          (order: DriverOrder) => order.drvStatus === "Hold"
        );

        setTodoOrders(todo);
        setHoldOrders(hold);
        setStatistics(todoHoldResponse.data.data.statistics);
      }

      // Fetch Completed orders for "Completed" tab
      const completedResponse = await axios.get(
        `${environment.API_BASE_URL}api/order/get-driver-orders?status=Completed&isHandOver=0`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (completedResponse.data.status === "success") {
        setCompletedOrders(completedResponse.data.data.orders);
      }
    } catch (error: any) {
      console.error("Error fetching driver orders:", error);
      setError("Failed to load jobs. Please try again.");

      // If unauthorized, navigate to login
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
    fetchDriverOrders();
  };

  // Helper function to get schedule time priority
  const getScheduleTimePriority = (time?: string) => {
    if (!time) return Number.MAX_SAFE_INTEGER;

    const lowerTime = time.toLowerCase();
    
    // Check for "8:00 AM – 2:00 PM" or similar morning/early afternoon slots
    if (lowerTime.includes("8:00") || 
        lowerTime.includes("8 am") || 
        lowerTime.includes("8:00am") ||
        lowerTime.includes("8:00 am") ||
        lowerTime.includes("morning") ||
        lowerTime.includes("early")) {
      return 1; // Highest priority
    }
    
    // Check for "2:00 PM – 8:00 PM" or similar afternoon/evening slots
    if (lowerTime.includes("2:00") || 
        lowerTime.includes("2 pm") || 
        lowerTime.includes("2:00pm") ||
        lowerTime.includes("2:00 pm") ||
        lowerTime.includes("afternoon") ||
        lowerTime.includes("evening") ||
        lowerTime.includes("late")) {
      return 2; // Second priority
    }
    
    // For other time formats, try to parse and prioritize earlier times
    const match = time.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const period = match[2].toUpperCase();
      
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
      
      return hour; // Earlier hours get lower numbers (higher priority)
    }
    
    return Number.MAX_SAFE_INTEGER; // Default: put at the end
  };

  // Combine todo and hold orders for display with proper sorting
  const getTodoDisplayOrders = () => {
    const allOrders = [...todoOrders, ...holdOrders];

    // Sort by schedule time priority first, then by order ID
    const sortedOrders = allOrders.sort((a, b) => {
      const timeA = a.primaryScheduleTime || a.allScheduleTimes?.[0] || "";
      const timeB = b.primaryScheduleTime || b.allScheduleTimes?.[0] || "";
      
      const priorityA = getScheduleTimePriority(timeA);
      const priorityB = getScheduleTimePriority(timeB);
      
      // First sort by time priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort by order ID as tie-breaker
      return a.processOrderId - b.processOrderId;
    });

    console.log("Sorted ToDo orders:", sortedOrders.map(order => ({
      processOrderId: order.processOrderId,
      scheduleTime: order.primaryScheduleTime || order.allScheduleTimes?.[0],
      priority: getScheduleTimePriority(order.primaryScheduleTime || order.allScheduleTimes?.[0])
    })));

    // Map with correct sequence numbers
    return sortedOrders.map((order, index) => ({
      id: (index + 1).toString().padStart(2, "0"), // Always generate #01, #02, #03 based on sorted order
      title: order.title || "",
      name: order.fullName || "Customer",
      time: formatScheduleTime(
        order.primaryScheduleTime ||
          order.allScheduleTimes[0] ||
          "Not Scheduled"
      ),
      count: order.jobCount || 1,
      status: order.drvStatus,
      orderData: order,
    }));
  };

  // Get completed orders for display with proper sorting
  const getCompletedDisplayOrders = () => {
    // Sort by schedule time priority first, then by order ID
    const sortedOrders = [...completedOrders].sort((a, b) => {
      const timeA = a.primaryScheduleTime || a.allScheduleTimes?.[0] || "";
      const timeB = b.primaryScheduleTime || b.allScheduleTimes?.[0] || "";
      
      const priorityA = getScheduleTimePriority(timeA);
      const priorityB = getScheduleTimePriority(timeB);
      
      // First sort by time priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort by order ID as tie-breaker
      return a.processOrderId - b.processOrderId;
    });

    console.log("Sorted Completed orders:", sortedOrders.map(order => ({
      processOrderId: order.processOrderId,
      scheduleTime: order.primaryScheduleTime || order.allScheduleTimes?.[0],
      priority: getScheduleTimePriority(order.primaryScheduleTime || order.allScheduleTimes?.[0])
    })));

    // Map with correct sequence numbers
    return sortedOrders.map((order, index) => ({
      id: (index + 1).toString().padStart(2, "0"), // Always generate #01, #02, #03 based on sorted order
      title: order.title || "",
      name: order.fullName || "Customer",
      time: formatScheduleTime(
        order.primaryScheduleTime ||
          order.allScheduleTimes[0] ||
          "Not Scheduled"
      ),
      count: order.jobCount || 1,
      status: "Completed",
      orderData: order,
    }));
  };

  const formatCount = (count: number) => {
    return count === 0 ? "0" : count.toString().padStart(2, "0");
  };

  const getTodoTabCount = () => {
    return formatCount(todoOrders.length + holdOrders.length);
  };

  const getCompletedCount = () => {
    return formatCount(completedOrders.length);
  };

  const dataToShow =
    activeTab === "todo" ? getTodoDisplayOrders() : getCompletedDisplayOrders();

  const navigateToOrderDetails = (orderData: DriverOrder) => {
    console.log("Navigating with order data:", orderData);

    // Get processOrderId from the orderData - THIS IS THE KEY CHANGE
    const processOrderId = orderData.processOrderId;

    // If processOrderId exists, use it; otherwise fall back to marketOrderId
    const primaryOrderId = processOrderId || orderData.marketOrderId;

    // Get order IDs array
    const orderIds = orderData.allOrderIds || [orderData.marketOrderId];

    // Get process order IDs array if available
    const processOrderIds = orderData.allProcessOrderIds ||
      orderData.processOrderIds || [primaryOrderId];

    console.log("Passing to OrderDetails:", {
      primaryOrderId,
      processOrderIds,
      orderIds,
      processOrderId: processOrderId,
    });

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
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F7CA21" />
          <Text className="mt-4 text-gray-600">Loading jobs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
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
            onPress={fetchDriverOrders}
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
            flex-1 flex-row items-center justify-center space-x-2 
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
            flex-1 flex-row items-center justify-center space-x-2 
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
            Completed
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
                    <Text className="text-sm font-bold">#{item.id} </Text>{" "}
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
                      <Text className="text-[#647B94] text-xs mr-2">
                        Need Add Hold Reason here
                      </Text>
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
        // Center-aligned empty state with Lottie animation
        <View className="flex-1 justify-center items-center px-5">
          {/* Lottie Animation */}
          <LottieView
            source={require("@/assets/json/no-data.json")}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          
          {activeTab === "todo" ? (
            <>
              <Text className="text-gray-500 text-lg text-center">
                No pending jobs
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-10">
                Scan QR codes to assign jobs to your list
              </Text>
            </>
          ) : (
            <>
              <Text className="text-gray-500 text-lg text-center">
                No completed jobs
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-10">
                Completed jobs will appear here
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};
export default Jobs;