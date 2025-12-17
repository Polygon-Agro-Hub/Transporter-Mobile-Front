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
  processOrder: ProcessOrder;
  pricing: string;
}

interface OrderDetailsResponse {
  user: UserDetails;
  orders: OrderItem[];
}

const OrderDetails: React.FC<OrderDetailsProp> = ({ navigation, route }) => {
  const { orderIds } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

      // Convert orderIds array to comma-separated string
      const orderIdsString = Array.isArray(orderIds)
        ? orderIds.join(",")
        : String(orderIds);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/order/get-order-user-details`,
        {
          params: {
            orderIds: orderIdsString,
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

  const handlePhoneCall = () => {
    if (userDetails?.phoneCode && userDetails?.phoneNumber) {
      const phoneNumber = `${userDetails.phoneCode}${userDetails.phoneNumber}`;
      Linking.openURL(`tel:${phoneNumber}`);
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
              className="rounded-xl border border-[#A4AAB7] py-2 px-4 bg-white"
            >
              <Text className="font-bold text-sm">
                #{order.processOrder.invNo || `ORD${order.orderId}`}
              </Text>

              <View className="flex-row items-center mt-1">
                <Ionicons name="time" size={16} color="black" />
                <Text className="ml-2 text-sm">
                  {order.sheduleTime || "Not Scheduled"}
                </Text>
              </View>

              <View className="flex-row items-center mt-1">
                {order.processOrder.isPaid ? (
                  <FontAwesome6 name="circle-check" size={16} color="#4CAF50" />
                ) : (
                  <FontAwesome6 name="coins" size={16} color="#F7CA21" />
                )}
                <Text className="ml-2 text-sm">
                  {order.processOrder.isPaid ? (
                    <Text className="text-green-600">Already Paid!</Text>
                  ) : (
                    <Text>
                      {formatPaymentMethod(order.processOrder.paymentMethod)} :{" "}
                      {formatCurrency(order.pricing)}
                      {order.processOrder.status?.toLowerCase() === "hold" &&
                        " (On Hold)"}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="absolute bottom-0 w-full mx-3 px-8 mb-6">
        <TouchableOpacity
          className="rounded-full bg-white border border-[#CBD7E8] py-6 px-6 w-full justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 1, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
          onPress={handlePhoneCall}
          disabled={!userDetails?.phoneNumber}
        >
          <Text className="text-base font-bold text-center absolute left-0 right-0">
            Make Phone Call
          </Text>

          <View className="absolute right-2 bg-[#F7CA21] w-10 h-10 rounded-full items-center justify-center">
            <Ionicons name="call" size={24} color="#000" />
          </View>
        </TouchableOpacity>

        {/* Start/Restart Journey Button */}
        <TouchableOpacity
          className="rounded-full bg-[#F7CA21] py-3 mt-5 items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 4,
          }}
          // onPress={() => navigation.navigate("MyJourney", { orderIds })}
        >
          <Text className="text-base font-bold">{getJourneyButtonText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderDetails;
