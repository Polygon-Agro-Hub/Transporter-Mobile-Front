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
import { Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/component/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "@/component/common/AlertModal";

type OrderDetailsAfterJourneyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderDetailsAfterJourney"
>;

type OrderDetailsAfterJourneyRouteProp = RouteProp<
  RootStackParamList,
  "OrderDetailsAfterJourney"
>;

interface OrderDetailsAfterJourneyProp {
  navigation: OrderDetailsAfterJourneyNavigationProp;
  route: OrderDetailsAfterJourneyRouteProp;
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

const OrderDetailsAfterJourney: React.FC<OrderDetailsAfterJourneyProp> = ({
  navigation,
  route,
}) => {
  // ONLY use processOrderIds parameter
  const { processOrderIds = [] } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as "success" | "error",
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
            isProcessOrderIds: 1, // Always send as 1 since we're using processOrderIds
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
      const fullPhoneNumber = `${phoneCode}${phoneNumber}`;
      Linking.openURL(`tel:${fullPhoneNumber}`);
    }
  };

  const handleScanOrder = (order: OrderItem) => {
    if (order.processOrder.invNo) {
      // Get the index of this order in the orders array
      const orderIndex = orders.findIndex((o) => o.orderId === order.orderId);

      // Navigate to QR scanning screen with processOrderIds
      navigation.navigate("VerifyOrderQR", {
        invNo: order.processOrder.invNo,
        orderId: order.orderId,
        allOrderIds: processOrderIds, // Pass processOrderIds as allOrderIds
        totalToScan: orders.length,
      });
    } else {
      // Show error if no invoice number
      setAlertModal({
        visible: true,
        title: "No Invoice Number",
        message: "This order doesn't have an invoice number to scan.",
        type: "error",
      });
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

    const firstOrder = orders[0];
    return firstOrder?.sheduleTime || "Not Scheduled";
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
        {/* Great Work! Message Box */}
        <View className="mt-4 mb-6 p-5 rounded-xl bg-white border border-[#F7CA21]">
          <View className="flex text-center justify-center items-center">
            <Text className="text-lg text-black font-semibold">
              Great Work!
            </Text>
            <Text className="text-sm text-black mt-1">
              Tap on any order card to scan QR code
            </Text>
          </View>
        </View>

        {/* Avatar and User Details */}
        <View className="items-center mb-6">
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
        <View className="flex-row justify-between mb-6">
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

        {/* Orders List - Entire cards are clickable */}
        <View className="mb-6 space-y-4">
          {orders.map((order, index) => (
            <View
              key={`${order.orderId}-${index}`}
              className="rounded-xl border border-[#F7CA21] overflow-hidden bg-[#FFF2BF]"
            >
              {/* Main Order Card (Clickable for QR scan) */}
              <TouchableOpacity
                className="py-3 px-4 flex-row items-center justify-between"
                onPress={() => handleScanOrder(order)}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  {/* Full Name and Invoice Row */}
                  <View className="flex mb-0.5">
                    <Text className="font-bold text-sm text-black">
                      #{order.processOrder.invNo || "N/A"}
                    </Text>
                    <Text className="font-bold text-sm text-black">
                      {order.fullName || "Customer"}
                    </Text>

                    {order.processOrder.status?.toLowerCase() === "hold" && (
                      <Text className="text-[#FF0000] text-xs font-semibold ml-2">
                        (Hold)
                      </Text>
                    )}
                  </View>

                  <View className="flex ">
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
                            {formatPaymentMethod(
                              order.processOrder.paymentMethod
                            )}{" "}
                            : {formatCurrency(order.pricing)}
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* QR Code Icon on the right */}
                <View className=" w-10 h-10  bg-white rounded-full items-center justify-center">
                  <FontAwesome6 name="qrcode" size={20} color="black" />
                </View>
              </TouchableOpacity>

              {/* Divider Line */}
              <View className="border-t border-[#F7CA21] mx-4" />

              {/* Make Phone Call Button for this specific order */}
              <TouchableOpacity
                className="flex-row justify-between items-center py-2 px-4"
                onPress={() => handlePhoneCall(order.phonecode1, order.phone1)}
                disabled={!order.phone1}
              >
                <View className="flex-row items-center">
                  <Text className="ml-2 text-sm font-semibold">
                    Make Phone Call
                  </Text>
                </View>

                <View className="bg-[#F7CA21] w-10 h-10 rounded-full items-center justify-center">
                  <Ionicons name="call" size={18} color="#000" />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        autoClose={false}
        onClose={() => setAlertModal({ ...alertModal, visible: false })}
      />
    </View>
  );
};

export default OrderDetailsAfterJourney;
