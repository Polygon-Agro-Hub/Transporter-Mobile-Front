import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome6,
  FontAwesome,
} from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/component/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "@/component/common/AlertModal";
import { formatScheduleTime } from "@/utils/formatScheduleTime";

type OrderDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderDetails"
>;

type OrderDetailsRouteProp = RouteProp<RootStackParamList, "OrderDetails">;

interface OrderDetailsProp {
  navigation: OrderDetailsNavigationProp;
  route: OrderDetailsRouteProp;
}

interface UserDetails {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  image: string | null;
  address: string;
  billingName: string;
  billingTitle: string;
  billingPhoneCode: string;
  billingPhone: string;
  billingPhoneCode2: string | null;
  billingPhone2: string | null;
  buildingType: string;
  deliveryMethod: string;
}

interface ProcessOrder {
  id: number;
  invNo: string;
  paymentMethod: string;
  amount: string;
  isPaid: boolean;
  status: string;
}

interface OrderItem {
  orderId: number;
  sheduleTime: string;
  fullName: string;
  title: string;
  phonecode1: string;
  phone1: string;
  phonecode2: string | null;
  phone2: string | null;
  longitude: string | null;
  latitude: string | null;
  address: string;
  processOrder: ProcessOrder;
  pricing: string;
}

interface OrderDetailsResponse {
  user: UserDetails;
  orders: OrderItem[];
}

// Helper function to format address with colored labels
const formatAddressWithLabels = (address: string) => {
  if (!address || address === "Address not specified") {
    return address;
  }

  // Split the address by comma
  const parts = address.split(", ");

  // Define label mappings
  const labelMappings: { [key: string]: string } = {
    "B.No": "B.No :",
    "B.Name": "B.Name :",
    "Unit.No": "F.No :", // Changed from Unit.No to F.No based on your requirement
    "Floor.No": "Floor.No :",
    "House.No": "House.No :",
    Street: "Street :",
    City: "City :",
  };

  // Process each part
  return parts.map((part, index) => {
    // Find the label in the part
    for (const [key, label] of Object.entries(labelMappings)) {
      if (part.startsWith(key)) {
        // Extract the value after the label
        const value = part.substring(key.length).trim();

        // Check if value starts with ":" and remove it
        const cleanValue = value.startsWith(":")
          ? value.substring(1).trim()
          : value;

        return (
          <Text key={index}>
            <Text style={{ color: "#5E6982" }}>{label} </Text>
            <Text style={{ color: "#000000" }}>{cleanValue}</Text>
            {index < parts.length - 1 ? ", " : ""}
          </Text>
        );
      }
    }

    // If no label found, return as black text
    return (
      <Text key={index} style={{ color: "#000000" }}>
        {part}
        {index < parts.length - 1 ? ", " : ""}
      </Text>
    );
  });
};

const OrderDetails: React.FC<OrderDetailsProp> = ({ navigation, route }) => {
  const { processOrderIds = [] } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startingJourney, setStartingJourney] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as "success" | "error",
    showOpenOngoingButton: false,
    ongoingProcessOrderIds: [] as number[],
  });

  // Add a ref to track previous processOrderIds
  const prevProcessOrderIdsRef = useRef<number[]>([]);

  // Fetch data when component mounts or when route params change
  useEffect(() => {
    // Check if processOrderIds have changed
    const hasParamsChanged =
      JSON.stringify(processOrderIds) !==
      JSON.stringify(prevProcessOrderIdsRef.current);

    if (hasParamsChanged) {
      console.log("Process order IDs changed, fetching new data...");
      fetchOrderUserDetails();
      prevProcessOrderIdsRef.current = processOrderIds;
    }
  }, [processOrderIds]);

  // Also listen for screen focus to refresh data
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("Screen focused, refreshing data...");
      fetchOrderUserDetails();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchOrderUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      if (!processOrderIds || processOrderIds.length === 0) {
        throw new Error("No process order IDs provided");
      }

      const processOrderIdsString = Array.isArray(processOrderIds)
        ? processOrderIds.join(",")
        : String(processOrderIds);

      console.log(
        "Fetching order details with Process Order IDs:",
        processOrderIdsString
      );

      const response = await axios.get(
        `${environment.API_BASE_URL}api/order/get-order-user-details`,
        {
          params: {
            orderIds: processOrderIdsString,
            isProcessOrderIds: 1,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Order details response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data.status === "success") {
        const data: OrderDetailsResponse = response.data.data;

        if (!data.user || !data.orders || data.orders.length === 0) {
          throw new Error("No data found");
        }

        // Helper function to get sort priority for schedule time
        const getScheduleTimePriority = (time: string) => {
          if (!time) return 999; // Put undefined times at the end

          const lowerTime = time.toLowerCase();

          // Check for "8:00 AM – 2:00 PM" or similar morning/early afternoon slots
          if (
            lowerTime.includes("8:00") ||
            lowerTime.includes("8 am") ||
            lowerTime.includes("8:00am") ||
            lowerTime.includes("8:00 am") ||
            lowerTime.includes("morning") ||
            lowerTime.includes("early")
          ) {
            return 1; // Highest priority
          }

          // Check for "2:00 PM – 8:00 PM" or similar afternoon/evening slots
          if (
            lowerTime.includes("2:00") ||
            lowerTime.includes("2 pm") ||
            lowerTime.includes("2:00pm") ||
            lowerTime.includes("2:00 pm") ||
            lowerTime.includes("afternoon") ||
            lowerTime.includes("evening") ||
            lowerTime.includes("late")
          ) {
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

          return 999; // Default: put at the end
        };

        // Sort orders by schedule time priority
        const sortedOrders = [...data.orders].sort((a, b) => {
          const priorityA = getScheduleTimePriority(a.sheduleTime);
          const priorityB = getScheduleTimePriority(b.sheduleTime);

          // First sort by time priority
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // If same priority, sort by order ID as tie-breaker
          return a.orderId - b.orderId;
        });

        console.log(
          "Sorted orders by schedule time:",
          sortedOrders.map((order) => ({
            orderId: order.orderId,
            scheduleTime: order.sheduleTime,
            priority: getScheduleTimePriority(order.sheduleTime),
          }))
        );

        setUserDetails(data.user);
        setOrders(sortedOrders); // Use sorted orders instead of original

        // Debug: Log each order's status
        console.log("Orders with status:");
        sortedOrders.forEach((order, index) => {
          console.log(
            `Order ${index + 1}: ID=${order.processOrder.id}, Status=${
              order.processOrder.status
            }, Time=${order.sheduleTime}`
          );
        });

        // Initialize completed orders based on status
        const completed = sortedOrders
          .filter(
            (order) =>
              order.processOrder.status.toLowerCase() === "completed" ||
              order.processOrder.status.toLowerCase() === "return"
          )
          .map((order) => order.processOrder.id);

        console.log("Completed orders IDs:", completed);
        setCompletedOrders(completed);

        // Show continue button if there are pending orders
        const pendingOrders = sortedOrders.filter(
          (order) => !completed.includes(order.processOrder.id)
        );

        console.log("Pending orders count:", pendingOrders.length);
        console.log("Completed orders count:", completed.length);

        if (pendingOrders.length > 0 && completed.length > 0) {
          setShowContinueButton(true);
        } else {
          setShowContinueButton(false);
        }
      } else {
        throw new Error(
          response.data.message || "Failed to fetch order details"
        );
      }
    } catch (error: any) {
      console.error("Error fetching order user details:", error);
      setError("Failed to load order details. Please try again.");

      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update the handleOpenOngoingActivity function to use navigation.replace instead of navigate
  const handleOpenOngoingActivity = () => {
    console.log("DEBUG - handleOpenOngoingActivity called");
    console.log("  Current alertModal state:", alertModal);
    console.log("  ongoingProcessOrderIds:", alertModal.ongoingProcessOrderIds);

    setAlertModal({
      ...alertModal,
      visible: false,
    });

    // Use ongoing process order IDs from the alert modal state
    const ongoingIds = alertModal.ongoingProcessOrderIds;

    if (ongoingIds && ongoingIds.length > 0) {
      console.log("DEBUG - Navigating to OrderDetails with IDs:", ongoingIds);

      // Use navigation.replace instead of navigate to force a fresh instance
      navigation.replace("OrderDetails", {
        processOrderIds: ongoingIds,
      });
    } else {
      console.log(
        "DEBUG - No ongoing IDs, navigating to EndJourneyConfirmation"
      );
      // Fallback: Navigate to EndJourneyConfirmation with the current process order IDs
      navigation.navigate("EndJourneyConfirmation", {
        processOrderIds: processOrderIds,
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderUserDetails();
  };

  const handlePhoneCall = (phoneCode: string, phoneNumber: string) => {
    if (phoneCode && phoneNumber) {
      const phone = `${phoneCode}${phoneNumber}`;
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenLocation = (
    latitude: string | null,
    longitude: string | null,
    address?: string
  ) => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for this order."
      );
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Error",
        "Could not open Google Maps. Please make sure it is installed."
      );
    });
  };

  // NEW FUNCTION: Open Google Maps Navigation
  const openGoogleMapsNavigation = (
    latitude: string | null,
    longitude: string | null,
    address?: string
  ) => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for navigation."
      );
      return;
    }

    // Construct the Google Maps navigation URL
    // Using "daddr" for destination address
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;

    // Alternative URL format that directly opens in Google Maps app
    const urlAlt = `https://maps.google.com/?q=${latitude},${longitude}`;

    // Check if we can open Google Maps
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Try alternative URL
          return Linking.openURL(urlAlt);
        }
      })
      .catch(() => {
        Alert.alert(
          "Error",
          "Could not open Google Maps. Please make sure Google Maps is installed on your device."
        );
      });
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return "Rs. 0.00";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "Rs. 0.00";
    return `Rs. ${numAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const getFullName = () => {
    if (!userDetails) return "Customer";

    const { title, firstName, lastName } = userDetails;
    return (
      `${title || ""}. ${firstName || ""} ${lastName || ""}`.trim() ||
      "Customer"
    );
  };

  const getTotalPackCount = () => {
    return orders.length;
  };

  const getScheduleTimeDisplay = () => {
    if (!orders || orders.length === 0) return "Not Scheduled";

    const firstOrder = orders[0];
    return firstOrder?.sheduleTime || "Not Scheduled";
  };

  const getJourneyButtonText = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "todo") {
      return "Start Journey";
    }

    if (normalizedStatus === "on the way") {
      return "Continue";
    }

    if (normalizedStatus === "hold") {
      return "Restart Journey";
    }

    // completed / return / others
    return "Start Journey";
  };

  const isButtonEnabled = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    return (
      normalizedStatus === "todo" ||
      normalizedStatus === "on the way" ||
      normalizedStatus === "hold"
    );
  };

  const getCardStyle = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    // WHITE THEME
    if (
      normalizedStatus === "todo" ||
      normalizedStatus === "completed" ||
      normalizedStatus === "hold"
    ) {
      return {
        backgroundColor: "#FFFFFF",
        borderColor: "#A4AAB7",
        borderWidth: 1,
      };
    }

    // YELLOW THEME (on the way, others)
    return {
      backgroundColor: "#FFF2BF",
      borderColor: "#F7CA21",
      borderWidth: 1,
    };
  };

  const findOrdersWithSameLocation = (orderId: number) => {
    const currentOrder = orders.find((order) => order.orderId === orderId);
    if (!currentOrder || !currentOrder.longitude || !currentOrder.latitude) {
      return [currentOrder];
    }

    return orders.filter(
      (order) =>
        order.longitude === currentOrder.longitude &&
        order.latitude === currentOrder.latitude
    );
  };

  const handleStartJourneyForOrder = async (orderId: number) => {
    try {
      setStartingJourney(orderId.toString());
      setError(null);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const currentOrder = orders.find((order) => order.orderId === orderId);
      if (!currentOrder || !currentOrder.processOrder?.id) {
        throw new Error("Order not found");
      }

      const processOrderId = currentOrder.processOrder.id;
      const currentStatus = currentOrder.processOrder.status.toLowerCase();
      const latitude = currentOrder.latitude;
      const longitude = currentOrder.longitude;
      const address = currentOrder.address;

      console.log(
        `handleStartJourneyForOrder: orderId=${orderId}, processOrderId=${processOrderId}, status=${currentStatus}`
      );

      // OPEN GOOGLE MAPS FOR BOTH "Start Journey" AND "Continue"
      if (latitude && longitude) {
        console.log("Opening Google Maps navigation to destination");
        setTimeout(() => {
          openGoogleMapsNavigation(latitude, longitude, address);
        }, 300);
      }

      // If status is already "On the way" or "Hold", navigate directly to EndJourneyConfirmation
      if (currentStatus === "on the way" || currentStatus === "hold") {
        console.log(
          "Status is already on the way or hold, navigating directly"
        );
        const remainingOrders = orders
          .filter((order) => order.processOrder.id !== processOrderId)
          .map((order) => order.processOrder.id);

        // Add a small delay to ensure maps opens before navigation
        setTimeout(() => {
          navigation.navigate("EndJourneyConfirmation", {
            processOrderIds: [processOrderId],
            allProcessOrderIds: processOrderIds,
            remainingOrders: remainingOrders,
            orderData: currentOrder, // Pass the entire order data
            onOrderComplete: (completedId: number) => {
              handleOrderComplete(completedId);
            },
          });
        }, 500);
        return;
      }

      // Only start journey for "Todo" status (API call)
      console.log("Starting journey for process order:", processOrderId);

      const payload = {
        orderIds: processOrderId.toString(),
        isProcessOrderIds: 1,
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/order/start-journey`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Start journey response:", response.data);

      if (response.data.status === "success") {
        setOrders((prevOrders) =>
          prevOrders.map((order) => {
            if (order.processOrder.id === processOrderId) {
              return {
                ...order,
                processOrder: {
                  ...order.processOrder,
                  status: "On the Way",
                },
              };
            }
            return order;
          })
        );

        const remainingOrders = orders
          .filter((order) => order.processOrder.id !== processOrderId)
          .map((order) => order.processOrder.id);

        // Navigate after a delay to ensure maps opens
        setTimeout(() => {
          navigation.navigate("EndJourneyConfirmation", {
            processOrderIds: [processOrderId],
            allProcessOrderIds: processOrderIds,
            remainingOrders: remainingOrders,
            orderData: currentOrder, // Pass the entire order data
            onOrderComplete: (completedId: number) => {
              handleOrderComplete(completedId);
            },
          });
        }, 500);
      } else {
        throw new Error(response.data.message || "Failed to start journey");
      }
    } catch (error: any) {
      console.error("Error starting journey:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

        // DEBUG: Log the exact response structure
        console.log(
          "Full error response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to start journey";
      const hasOngoingActivity =
        errorMessage.includes("ongoing activity") ||
        errorMessage.includes("ongoing") ||
        errorMessage.includes("Ongoing");

      // Get ongoing process order IDs from response (if available)
      const ongoingProcessOrderIds =
        error.response?.data?.ongoingProcessOrderIds || [];

      console.log("DEBUG - Setting alert modal with:");
      console.log("  hasOngoingActivity:", hasOngoingActivity);
      console.log("  ongoingProcessOrderIds:", ongoingProcessOrderIds);
      console.log("  errorMessage:", errorMessage);

      if (hasOngoingActivity) {
        setAlertModal({
          visible: true,
          title: "Already Have Active Journey",
          message: errorMessage,
          type: "error",
          showOpenOngoingButton: true,
          ongoingProcessOrderIds: ongoingProcessOrderIds,
        });
      } else {
        setAlertModal({
          visible: true,
          title: "Error",
          message: errorMessage,
          type: "error",
          showOpenOngoingButton: false,
          ongoingProcessOrderIds: [],
        });
      }
    } finally {
      setStartingJourney(null);
    }
  };

  const handleOrderComplete = (completedId: number) => {
    console.log(`handleOrderComplete: completedId=${completedId}`);
    setCompletedOrders((prev) => {
      const newCompleted = [...prev, completedId];

      // Check if all orders are completed
      const allOrderIds = orders.map((order) => order.processOrder.id);
      const allCompleted = allOrderIds.every((id) => newCompleted.includes(id));

      console.log(`All orders completed: ${allCompleted}`);

      // Even if all orders are completed, DO NOT navigate to Home
      // Stay on OrderDetails screen
      if (allCompleted) {
        console.log("✓ All orders completed - Staying on OrderDetails screen");
      } else {
        setShowContinueButton(true);
      }

      return newCompleted;
    });
  };

  const hasOnTheWayOrder = () => {
    return orders.some(
      (order) => order.processOrder.status.toLowerCase() === "on the way"
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Order Details"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F7CA21" />
          <Text className="mt-4 text-gray-600">Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Order Details"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
        />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={60} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg mt-4 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchOrderUserDetails}
            className="mt-6 bg-[#F7CA21] py-3 px-6 rounded-full"
          >
            <Text className="text-black font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!userDetails || orders.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Order Details"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
        />
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">No order details available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Order Details"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.navigate("Jobs")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F7CA21"]}
            tintColor="#F7CA21"
          />
        }
      >
        {/* Avatar and User Details */}
        <View className="items-center mt-4">
          {userDetails.image ? (
            <Image
              source={{ uri: userDetails.image }}
              className="w-20 h-20 rounded-full"
              defaultSource={require("@/assets/images/auth/profilecustomer.webp")}
            />
          ) : (
            <Image
              source={require("@/assets/images/auth/profilecustomer.webp")}
              className="w-20 h-20 rounded-full"
            />
          )}
          <Text className="text-lg font-bold mt-4 max-w-[90%] text-center">
            {getFullName()}
          </Text>

          {userDetails.address &&
            userDetails.address !== "Address not specified" && (
              <View className="flex-row mt-1 max-w-[90%] justify-center text-center">
                <Text className="text-base max-w-[90%] text-center">
                  <Ionicons name="location-sharp" size={18} color="black" />
                  {formatAddressWithLabels(userDetails.address)}
                </Text>
                =
              </View>
            )}
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between mt-6">
          <View className="w-[48%] rounded-xl bg-[#F3F3F3] p-3 items-center">
            <FontAwesome6 name="bag-shopping" size={30} color="black" />
            <Text className="mt-2 text-md font-semibold">
              {getTotalPackCount()}{" "}
              {getTotalPackCount() === 1 ? "Pack" : "Packs"}
            </Text>
          </View>

          <View className="w-[48%] rounded-xl bg-[#F3F3F3] p-3 items-center">
            <Ionicons name="time" size={30} color="black" />
            <Text className="mt-2 text-md font-semibold">
              {formatScheduleTime(getScheduleTimeDisplay())}
            </Text>
          </View>
        </View>

        {/* Orders List */}
        <View className="mt-6 space-y-4">
          {orders.map((order, index) => {
            const hasPhone2 = order.phonecode2 && order.phone2;
            const hasLocation = order.latitude && order.longitude;
            const status = order.processOrder.status;
            const normalizedStatus = status.toLowerCase();
            const isCompleted =
              normalizedStatus === "completed" || normalizedStatus === "return";
            const isTodo = normalizedStatus === "todo";
            const isOnTheWay = normalizedStatus === "on the way";
            const isHold = normalizedStatus === "hold";

            const buttonText = getJourneyButtonText(status);
            const isButtonActive = isButtonEnabled(status);

            // Check if we should disable this button
            // Disable if:
            // 1. This is not the "On the way" order AND there is an "On the way" order
            // 2. OR if this is already completed
            // 3. OR if button is not active for other reasons
            const shouldDisableButton =
              (!isOnTheWay && hasOnTheWayOrder()) ||
              isCompleted ||
              !isButtonActive;

            console.log(`Rendering order ${index + 1}:`);
            console.log(`  Status: ${status}`);
            console.log(`  Normalized: ${normalizedStatus}`);
            console.log(`  Is On the way: ${isOnTheWay}`);
            console.log(
              `  Has On the way order in list: ${hasOnTheWayOrder()}`
            );
            console.log(`  Button Text: "${buttonText}"`);
            console.log(`  Should Disable: ${shouldDisableButton}`);

            return (
              <View
                key={`${order.orderId}-${index}`}
                style={getCardStyle(status)}
                className="rounded-xl p-4"
              >
                {/* Header with Invoice, Name and Status */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-sm text-black">
                      #{order.processOrder.invNo || "N/A"}
                    </Text>
                    <Text className="font-bold text-base mt-2">
                      {order.title || ""}. {order.fullName || "Customer"}
                    </Text>
                  </View>
                </View>

                {/* Schedule Time */}
                <View className="flex-row justify-between">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time" size={16} color="#000" />
                    <Text className="ml-2 text-sm text-black">
                      {formatScheduleTime(order.sheduleTime)}
                    </Text>
                  </View>

                  {/* Payment Info */}
                  <View className="flex-row items-center mb-4">
                    {order.processOrder.isPaid ? (
                      <FontAwesome
                        name="check-circle"
                        size={16}
                        color="#F7CA21"
                      />
                    ) : (
                      <FontAwesome6 name="coins" size={16} color="#F7CA21" />
                    )}
                    <Text className="ml-2 text-sm text-black">
                      {order.processOrder.isPaid ? (
                        <Text className="text-black">Already Paid!</Text>
                      ) : (
                        <Text>{formatCurrency(order.pricing)}</Text>
                      )}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View className="flex-row justify-between items-center mb-4">
                  {/* Phone 1 Button */}
                  <TouchableOpacity
                    className="items-center"
                    onPress={() =>
                      handlePhoneCall(order.phonecode1, order.phone1)
                    }
                    disabled={isCompleted}
                  >
                    <View className="w-12 h-12 rounded-full items-center justify-center bg-[#F7CA21]">
                      <Ionicons name="call" size={24} color="black" />
                    </View>
                    <Text className="mt-2 font-semibold">Num 1</Text>
                  </TouchableOpacity>

                  {/* Phone 2 Button (only if available) */}
                  {hasPhone2 && (
                    <TouchableOpacity
                      className="items-center"
                      onPress={() =>
                        order.phone2 &&
                        handlePhoneCall(order.phonecode2!, order.phone2!)
                      }
                      disabled={isCompleted}
                    >
                      <View className="w-12 h-12 rounded-full items-center justify-center bg-[#F7CA21]">
                        <Ionicons name="call" size={24} color="black" />
                      </View>
                      <Text className="mt-2 font-semibold">Num 2</Text>
                    </TouchableOpacity>
                  )}

                  {/* Location Button - Updated to open menu */}
                  <TouchableOpacity
                    className="items-center"
                    onPress={() =>
                      handleOpenLocation(order.latitude, order.longitude)
                    }
                    disabled={isCompleted}
                  >
                    <View className="w-12 h-12 rounded-full items-center justify-center relative bg-[#F7CA21]">
                      <Ionicons name="location-sharp" size={24} color="black" />
                    </View>
                    <Text className="mt-2 font-semibold">Location</Text>
                  </TouchableOpacity>
                </View>

                {/* Journey Button */}
                <TouchableOpacity
                  className={`rounded-full py-3 items-center ${
                    !shouldDisableButton ? "bg-[#F7CA21]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: !shouldDisableButton ? 0.2 : 0,
                    shadowRadius: 5,
                    elevation: !shouldDisableButton ? 4 : 0,
                  }}
                  onPress={() => handleStartJourneyForOrder(order.orderId)}
                  disabled={
                    startingJourney === order.orderId.toString() ||
                    shouldDisableButton // Use shouldDisableButton here
                  }
                >
                  {startingJourney === order.orderId.toString() ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-base font-bold">{buttonText}</Text>
                  )}
                </TouchableOpacity>

                {/* Info Text for same location orders */}
                {findOrdersWithSameLocation(order.orderId).length > 1 && (
                  <Text className="text-xs text-gray-500 text-center mt-2">
                    All orders are for exact same location
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        autoClose={false}
        onClose={() => setAlertModal({ ...alertModal, visible: false })}
        showOpenOngoingButton={alertModal.showOpenOngoingButton}
        onOpenOngoing={
          alertModal.showOpenOngoingButton
            ? handleOpenOngoingActivity
            : undefined
        }
      />
    </View>
  );
};

export default OrderDetails;
