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
import MarqueeText from "@/component/common/MarqueeText";

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
  allCompleteTimes?: (string | Date)[]; // ✅ ADD THIS LINE
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

  // Helper function to check if a date is today
  const isToday = (dateInput: string | Date): boolean => {
    if (!dateInput) {
      console.log("isToday: Empty dateInput");
      return false;
    }
    
    try {
      let date: Date;
      
      // Handle both Date objects and strings
      if (dateInput instanceof Date) {
        date = dateInput;
        console.log("isToday: Received Date object:", dateInput.toISOString());
      } else if (typeof dateInput === 'string') {
        // Parse string format: "2026-01-05 05:14:48" or "2026-01-05T05:14:48.000Z"
        const datePart = dateInput.split(' ')[0].split('T')[0]; // "2026-01-05"
        const [year, month, day] = datePart.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
        console.log("isToday: Parsed string to date:", datePart);
      } else {
        console.log("isToday: Invalid input type:", typeof dateInput);
        return false;
      }
      
      // Get today's date in local timezone
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      
      // Get the date components in local timezone
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      const dateDay = date.getDate();
      
      const matches = dateYear === todayYear && dateMonth === todayMonth && dateDay === todayDay;
      
      console.log(`isToday comparison:`, {
        input: dateInput instanceof Date ? dateInput.toISOString() : dateInput,
        orderDate: `${dateYear}-${dateMonth + 1}-${dateDay}`,
        todayDate: `${todayYear}-${todayMonth + 1}-${todayDay}`,
        matches: matches
      });
      
      return matches;
    } catch (error) {
      console.error('Error parsing date:', dateInput, error);
      return false;
    }
  };

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
      // const completedResponse = await axios.get(
      //   `${environment.API_BASE_URL}api/order/get-driver-orders?status=Completed&isHandOver=0`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );
      // Fetch Completed orders for "Completed" tab (both handed over and not handed over)
const completedResponse = await axios.get(
  `${environment.API_BASE_URL}api/order/get-driver-orders?status=Completed`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

// In your fetchDriverOrders function, replace this section:
if (completedResponse.data.status === "success") {
  const allCompleted = completedResponse.data.data.orders;
  
  console.log("=== COMPLETED ORDERS DEBUG ===");
  console.log("Total completed orders FROM API:", allCompleted.length);
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  console.log("Today's date string:", todayStr);
  
  const todayCompleted = allCompleted.filter((order: DriverOrder) => {
    if (!order.completeTime) {
      console.log(`❌ Order ${order.driverOrderId}: NO completeTime - EXCLUDED`);
      return false;
    }
    
    const isTodayOrder = isToday(order.completeTime);
    console.log(`${isTodayOrder ? '✅' : '❌'} Order ${order.driverOrderId}: completeTime="${order.completeTime}" isToday=${isTodayOrder}`);
    
    return isTodayOrder;
  });
  
  console.log("\n--- FILTER RESULTS ---");
  console.log("✅ Today's completed orders count:", todayCompleted.length);
  console.log("✅ Filtered order IDs:", todayCompleted.map((o: DriverOrder) => o.driverOrderId));
  console.log("=== END DEBUG ===\n");
  
  // CRITICAL: Use a callback to ensure state is set correctly
  setCompletedOrders((prevState) => {
    console.log("🔄 Updating completedOrders from", prevState.length, "to", todayCompleted.length);
    return todayCompleted;
  });
  
  // ADD THIS: Force a re-render verification
  console.log("🔄 completedOrders will be set to count:", todayCompleted.length);
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

  // Helper function to get hold reason text (can be made language-aware)
  const getHoldReasonText = (orderData: DriverOrder): string => {
    if (!orderData.holdReasons || orderData.holdReasons.length === 0) {
      return "Hold reason not specified";
    }

    // Get the first hold reason (or you can concatenate multiple reasons)
    const reason = orderData.holdReasons[0];
    
    // Return English reason by default
    // You can make this dynamic based on user's language preference
    return reason.rsnEnglish || "Hold reason not specified";
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
      id: (index + 1).toString().padStart(2, "0"),
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
  // const getCompletedDisplayOrders = () => {
  //   // Sort by schedule time priority first, then by order ID
  //   const sortedOrders = [...completedOrders].sort((a, b) => {
  //     const timeA = a.primaryScheduleTime || a.allScheduleTimes?.[0] || "";
  //     const timeB = b.primaryScheduleTime || b.allScheduleTimes?.[0] || "";
      
  //     const priorityA = getScheduleTimePriority(timeA);
  //     const priorityB = getScheduleTimePriority(timeB);
      
  //     // First sort by time priority
  //     if (priorityA !== priorityB) {
  //       return priorityA - priorityB;
  //     }
      
  //     // If same priority, sort by order ID as tie-breaker
  //     return a.processOrderId - b.processOrderId;
  //   });

  //   console.log("Sorted Completed orders:", sortedOrders.map(order => ({
  //     processOrderId: order.processOrderId,
  //     scheduleTime: order.primaryScheduleTime || order.allScheduleTimes?.[0],
  //     priority: getScheduleTimePriority(order.primaryScheduleTime || order.allScheduleTimes?.[0])
  //   })));

  //   // Map with correct sequence numbers
  //   return sortedOrders.map((order, index) => ({
  //     id: (index + 1).toString().padStart(2, "0"),
  //     title: order.title || "",
  //     name: order.fullName || "Customer",
  //     time: formatScheduleTime(
  //       order.primaryScheduleTime ||
  //         order.allScheduleTimes[0] ||
  //         "Not Scheduled"
  //     ),
  //     count: order.jobCount || 1,
  //     status: "Completed",
  //     orderData: order,
  //   }));
  // };
  // Get completed orders for display with proper sorting
const getCompletedDisplayOrders = () => {
  console.log("\n🎯 ===== getCompletedDisplayOrders START =====");
  console.log("🎯 completedOrders state length:", completedOrders.length);
  console.log("🎯 completedOrders full data:", JSON.stringify(completedOrders.map(o => ({
    driverOrderId: o.driverOrderId,
    processOrderId: o.processOrderId,
    fullName: o.fullName,
    completeTime: o.completeTime,
    allCompleteTimes: o.allCompleteTimes, // ✅ Log this
    drvStatus: o.drvStatus
  })), null, 2));
  
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

  console.log("🎯 After sorting, orders count:", sortedOrders.length);

  const displayOrders = sortedOrders.map((order, index) => {
    // Count how many orders in this group were completed today
    let todayCompletedCount = 1; // Default to 1
    
    if (order.allCompleteTimes && order.allCompleteTimes.length > 0) {
      todayCompletedCount = order.allCompleteTimes.filter(completeTime => {
        const isTodayCompleted = isToday(completeTime);
        console.log(`  📅 Checking completeTime: ${completeTime}, isToday: ${isTodayCompleted}`);
        return isTodayCompleted;
      }).length;
    }

    console.log(`📊 Order ${order.driverOrderId}: Total jobs=${order.jobCount}, Completed today=${todayCompletedCount}, allCompleteTimes=${order.allCompleteTimes?.length || 0}`);

    return {
      id: (index + 1).toString().padStart(2, "0"),
      title: order.title || "",
      name: order.fullName || "Customer",
      time: formatScheduleTime(
        order.primaryScheduleTime ||
          order.allScheduleTimes[0] ||
          "Not Scheduled"
      ),
      count: todayCompletedCount, // ✅ Show count of orders completed today
      status: "Completed",
      orderData: order,
    };
  });
  
  console.log("🎯 Final display orders count:", displayOrders.length);
  console.log("🎯 Display orders with counts:", displayOrders.map(o => ({
    id: o.id,
    name: o.name,
    count: o.count,
    driverOrderId: o.orderData.driverOrderId
  })));
  console.log("🎯 ===== getCompletedDisplayOrders END =====\n");
  
  return displayOrders;
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

    // Get processOrderId from the orderData
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
            const holdReasonText = isOnHold ? getHoldReasonText(item.orderData) : "";

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
                  {/* {isOnHold && (
                    <View className="flex flex-row items-center gap-2 mt-0.5">
                      <FontAwesome6
                        name="circle-exclamation"
                        size={18}
                        color="#FF0000"
                      />
                      <Text className="text-[#647B94] text-xs mr-2" numberOfLines={2}>
                        {holdReasonText}
                      </Text>
                    </View>
                  )} */}
                  {isOnHold && (
  <View className="flex flex-row items-center gap-2 mt-0.5">
    <FontAwesome6
      name="circle-exclamation"
      size={18}
      color="#FF0000"
    />
    {/* Use FixedMarqueeText for hold reason */}
    <View style={{ flex: 1, height: 20 }}>
      <MarqueeText
        text={holdReasonText}
        style={{ 
          fontSize: 12,
          color: '#647B94',
          lineHeight: 16,
        }}
    //    speed={50}
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