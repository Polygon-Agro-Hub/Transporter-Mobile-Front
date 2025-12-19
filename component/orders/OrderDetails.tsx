import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  RefreshControl,
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
  address: string;
  processOrder: ProcessOrder;
  pricing: string;
}

interface OrderDetailsResponse {
  user: UserDetails;
  orders: OrderItem[];
}

const OrderDetails: React.FC<OrderDetailsProp> = ({ navigation, route }) => {
  // ONLY use processOrderIds parameter
  const { processOrderIds = [] } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);
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

      // Check if we have processOrderIds
      if (!processOrderIds || processOrderIds.length === 0) {
        throw new Error("No process order IDs provided");
      }

      // Convert processOrderIds array to comma-separated string
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
            isProcessOrderIds: 1, // Always send this as 1 since we're using processOrderIds
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "success") {
        const data: OrderDetailsResponse = response.data.data;

        if (!data.user || !data.orders || data.orders.length === 0) {
          throw new Error("No data found");
        }

        setUserDetails(data.user);
        setOrders(data.orders);
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

    // Return the first order's schedule time
    const firstOrder = orders[0];
    return firstOrder?.sheduleTime || "Not Scheduled";
  };

  // Check if any order has Hold status
  const hasHoldOrder = () => {
    return orders.some(
      (order) => order.processOrder.status?.toLowerCase() === "hold"
    );
  };

  // Get button text based on order status
  const getJourneyButtonText = () => {
    return hasHoldOrder() ? "Restart the Journey" : "Start Journey";
  };

  const handleStartJourney = async () => {
    try {
      setStartingJourney(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      // Use processOrderIds
      const processOrderIdsString = Array.isArray(processOrderIds)
        ? processOrderIds.join(",")
        : String(processOrderIds);

      console.log(
        "Starting journey with Process Order IDs:",
        processOrderIdsString
      );

      const response = await axios.post(
        `${environment.API_BASE_URL}api/order/start-journey`,
        {
          orderIds: processOrderIdsString,
          isProcessOrderIds: 1, // Always send as process order IDs
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        // Pass only processOrderIds to MyJourney
        navigation.navigate("MyJourney", {
          processOrderIds: processOrderIds,
        });

        // No need to refresh order details since we're navigating away
      } else {
        throw new Error(response.data.message || "Failed to start journey");
      }
    } catch (error: any) {
      console.error("Error starting journey:", error);

      // Check if this is the "ongoing activity" error
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
      setStartingJourney(false);
    }
  };

  const handleOpenOngoingActivity = () => {
    // Close the modal
    setAlertModal({
      ...alertModal,
      visible: false,
    });

    // Navigate to MyJourney with processOrderIds
    navigation.navigate("MyJourney", {
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
    <View className="flex-1 bg-white justify-center items-center">
      <CustomHeader
        title="Order Details"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
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
        <View className="items-center">
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

          {/* Address Display */}
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
        <View className="mt-6 space-y-5">
          {orders.map((order, index) => (
            <View
              key={`${order.orderId}-${index}`}
              className="rounded-xl border border-[#A4AAB7] py-3 px-4 flex-row items-center justify-between bg-white"
            >
              <View className="flex-1">
                {/* Full Name Row */}
                <View className="flex mb-0.5">
                  <Text className="font-bold text-sm text-black">
                    #{order.processOrder.invNo || "N/A"}
                  </Text>
                  <Text className="font-bold text-sm flex-1">
                    {order.fullName || "Customer"}
                  </Text>
                  {order.processOrder.status?.toLowerCase() === "hold" && (
                    <Text className="text-[#FF0000] text-xs font-semibold ml-2">
                      (On Hold)
                    </Text>
                  )}
                </View>

                <View className="flex-row items-center mb-1">
                  <Ionicons name="time" size={14} color="#000" />
                  <Text className="ml-2 text-xs text-black">
                    {order.sheduleTime || "Not Scheduled"}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  {order.processOrder.isPaid ? (
                    <FontAwesome6
                      name="circle-check"
                      size={14}
                      color="#F7CA21"
                    />
                  ) : (
                    <FontAwesome6 name="coins" size={14} color="#F7CA21" />
                  )}
                  <Text className="ml-2 text-xs text-black">
                    {order.processOrder.isPaid ? (
                      <Text className="text-black">Already Paid!</Text>
                    ) : (
                      <Text>
                        {formatPaymentMethod(order.processOrder.paymentMethod)}{" "}
                        : {formatCurrency(order.pricing)}
                      </Text>
                    )}
                  </Text>
                </View>
              </View>

              {/* Call Button on the right side (replacing QR code) */}
              <TouchableOpacity
                className="ml-2 p-1 bg-[#F7CA21] rounded-full border border-gray-200 items-center justify-center"
                onPress={() => handlePhoneCall(order.phonecode1, order.phone1)}
                disabled={!order.phone1}
                style={{
                  width: 40,
                  height: 40,
                }}
              >
                <Ionicons name="call" size={20} color="black" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action Button (Only Start Journey) */}
      <View className="absolute bottom-0 w-full mx-3 px-8 mb-6">
        {/* Start/Restart Journey Button */}
        <TouchableOpacity
          className="rounded-full bg-[#F7CA21] py-4 items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 4,
          }}
          onPress={handleStartJourney}
          disabled={startingJourney}
        >
          {startingJourney ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text className="text-base font-bold">
              {getJourneyButtonText()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
