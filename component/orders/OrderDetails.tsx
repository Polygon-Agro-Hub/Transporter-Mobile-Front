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
import React, { useState, useEffect } from "react";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome6,
} from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/component/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "@/component/common/AlertModal";

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
  });

  useEffect(() => {
    fetchOrderUserDetails();
  }, []);

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

        setUserDetails(data.user);
        setOrders(data.orders);

        // Debug: Log each order's status
        console.log("Orders with status:");
        data.orders.forEach((order, index) => {
          console.log(
            `Order ${index + 1}: ID=${order.processOrder.id}, Status=${
              order.processOrder.status
            }`
          );
        });

        // Initialize completed orders based on status
        const completed = data.orders
          .filter(
            (order) =>
              order.processOrder.status.toLowerCase() === "completed" ||
              order.processOrder.status.toLowerCase() === "return"
          )
          .map((order) => order.processOrder.id);

        console.log("Completed orders IDs:", completed);
        setCompletedOrders(completed);

        // Show continue button if there are pending orders
        const pendingOrders = data.orders.filter(
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

  const formatPaymentMethod = (paymentMethod: string) => {
    switch (paymentMethod?.toLowerCase()) {
      case "cash":
        return "Cash";
      case "card":
        return "Card";
      case "online":
        return "Online";
      default:
        return paymentMethod || "Cash";
    }
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

    if (normalizedStatus === "todo") return "Start Journey";
    if (normalizedStatus === "on the way" || normalizedStatus === "hold")
      return "Continue";

    // FOR COMPLETED / RETURN
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
    console.log(
      `getCardStyle: status=${status}, normalized=${normalizedStatus}`
    );

    // If status is "Todo", use white background
    if (normalizedStatus === "todo" || normalizedStatus === "completed") {
      console.log("Card style: White background");
      return {
        backgroundColor: "#FFFFFF",
        borderColor: "#A4AAB7",
        borderWidth: 1,
      };
    }

    // For all other statuses, use yellow background
    console.log("Card style: Yellow background");
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
            orderData: currentOrder,
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
            orderData: currentOrder,
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
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to start journey";
      const hasOngoingActivity =
        errorMessage.includes("ongoing activity") ||
        errorMessage.includes("ongoing") ||
        errorMessage.includes("Ongoing");

      if (hasOngoingActivity) {
        setAlertModal({
          visible: true,
          title: "Already Have Active Journey",
          message: errorMessage,
          type: "error",
          showOpenOngoingButton: true,
        });
      } else {
        setAlertModal({
          visible: true,
          title: "Error",
          message: errorMessage,
          type: "error",
          showOpenOngoingButton: false,
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

  const handleOpenOngoingActivity = () => {
    setAlertModal({
      ...alertModal,
      visible: false,
    });

    navigation.navigate("EndJourneyConfirmation", {
      processOrderIds: processOrderIds,
    });
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
              defaultSource={require("@/assets/ProfileCustomer.webp")}
            />
          ) : (
            <Image
              source={require("@/assets/ProfileCustomer.webp")}
              className="w-20 h-20 rounded-full"
            />
          )}
          <Text className="text-lg font-bold mt-4 max-w-[90%] text-center">
            {getFullName()}
          </Text>

          {userDetails.address &&
            userDetails.address !== "Address not specified" && (
              <View className="flex-row mt-1 max-w-[90%]">
                <Ionicons name="location-sharp" size={18} color="black" />
                <Text className="ml-1 text-base max-w-[90%]">
                  {userDetails.address}
                </Text>
              </View>
            )}
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between mt-6">
          <View className="w-[48%] rounded-xl bg-[#F3F3F3] p-5 items-center">
            <FontAwesome6 name="bag-shopping" size={30} color="black" />
            <Text className="mt-2 text-lg font-semibold">
              {getTotalPackCount()}{" "}
              {getTotalPackCount() === 1 ? "Pack" : "Packs"}
            </Text>
          </View>

          <View className="w-[48%] rounded-xl bg-[#F3F3F3] p-5 items-center">
            <Ionicons name="time" size={30} color="black" />
            <Text className="mt-2 text-lg font-semibold">
              {getScheduleTimeDisplay()}
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
            const buttonText = getJourneyButtonText(status);
            const isButtonActive = isButtonEnabled(status);

            console.log(`Rendering order ${index + 1}:`);
            console.log(`  Status: ${status}`);
            console.log(`  Normalized: ${normalizedStatus}`);
            console.log(`  Button Text: "${buttonText}"`);
            console.log(`  Button Active: ${isButtonActive}`);
            console.log(`  Is Completed: ${isCompleted}`);
            console.log(`  Is Todo: ${isTodo}`);

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
                      {order.fullName || "Customer"}
                    </Text>
                  </View>
                </View>

                {/* Schedule Time */}
                <View className="flex-row justify-between">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time" size={16} color="#000" />
                    <Text className="ml-2 text-sm text-black">
                      {order.sheduleTime || "Not Scheduled"}
                    </Text>
                  </View>

                  {/* Payment Info */}
                  <View className="flex-row items-center mb-4">
                    {order.processOrder.isPaid ? (
                      <FontAwesome6
                        name="circle-check"
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
                        <Text>
                          {formatPaymentMethod(
                            order.processOrder.paymentMethod
                          )}{" "}
                          : {formatCurrency(order.pricing)}
                        </Text>
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

                {/* Journey Button - Only show if there's a button text */}
                <TouchableOpacity
                  className={`rounded-full py-3 items-center ${
                    isButtonActive ? "bg-[#F7CA21]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: isButtonActive ? 0.2 : 0,
                    shadowRadius: 5,
                    elevation: isButtonActive ? 4 : 0,
                  }}
                  onPress={() => handleStartJourneyForOrder(order.orderId)}
                  disabled={
                    startingJourney === order.orderId.toString() ||
                    !isButtonActive
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
                    This order shares location with{" "}
                    {findOrdersWithSameLocation(order.orderId).length - 1} other
                    order(s)
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
