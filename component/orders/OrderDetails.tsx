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
  const [startingJourney, setStartingJourney] = useState<string | null>(null); // Track which order is being started
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

  const handleOpenLocation = (
    latitude: string | null,
    longitude: string | null
  ) => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for this order."
      );
      return;
    }

    // Open in Google Maps
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Error",
        "Could not open Google Maps. Please make sure it is installed."
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
    return status?.toLowerCase() === "collected" ? "Start Journey" : "Continue";
  };

  const getCardStyle = (status: string) => {
    const isOnTheWay = status?.toLowerCase() === "on the way";
    return {
      backgroundColor: isOnTheWay ? "#FFF2BF" : "#FFFFFF",
      borderColor: isOnTheWay ? "#F7CA21" : "#A4AAB7",
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

      // Find all orders with same location
      const ordersWithSameLocation = findOrdersWithSameLocation(orderId);
      const processOrderIdsToUpdate = ordersWithSameLocation
        .filter(
          (order): order is OrderItem =>
            order != null && order?.processOrder?.id != null
        )
        .map((order) => order.processOrder.id);

      if (processOrderIdsToUpdate.length === 0) {
        throw new Error("No valid process orders found");
      }

      const processOrderIdsString = processOrderIdsToUpdate.join(",");

      console.log(
        "Starting journey for process orders:",
        processOrderIdsString
      );

      const response = await axios.post(
        `${environment.API_BASE_URL}api/order/start-journey`,
        {
          orderIds: processOrderIdsString,
          isProcessOrderIds: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        // Update local state to reflect status change
        setOrders((prevOrders) =>
          prevOrders.map((order) => {
            if (processOrderIdsToUpdate.includes(order.processOrder.id)) {
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

        // Navigate to EndJourneyConfirmation with all processOrderIds
        navigation.navigate("EndJourneyConfirmation", {
          processOrderIds: processOrderIds,
        });
      } else {
        throw new Error(response.data.message || "Failed to start journey");
      }
    } catch (error: any) {
      console.error("Error starting journey:", error);

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

            return (
              <View
                key={`${order.orderId}-${index}`}
                style={getCardStyle(order.processOrder.status)}
                className="rounded-xl p-4"
              >
                {/* Header with Invoice and Name */}
                <View className="flex mb-3">
                  <Text className="font-bold text-sm text-black">
                    #{order.processOrder.invNo || "N/A"}
                  </Text>
                  <Text className="font-bold text-base flex-1">
                    {order.fullName || "Customer"}
                  </Text>
                </View>

                {/* Schedule Time */}
                <View className="flex-row justify-between">
                  <View className="flex-row items-center mb-3">
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
                      handlePhoneCall(orders[0].phonecode1, orders[0].phone1)
                    }
                  >
                    <View className="w-12 h-12 rounded-full bg-[#F7CA21] items-center justify-center">
                      <Ionicons name="call" size={24} color="black" />
                    </View>
                    <Text className="mt-2 font-semibold">Num 1</Text>
                  </TouchableOpacity>

                  {/* Phone 2 Button (only if available) */}
                  {hasPhone2 && (
                    <TouchableOpacity
                      className="items-center"
                      onPress={() =>
                        orders[0].phone2 &&
                        handlePhoneCall(
                          orders[0].phonecode2!,
                          orders[0].phone2!
                        )
                      }
                    >
                      <View className="w-12 h-12 rounded-full bg-[#F7CA21] items-center justify-center">
                        <Ionicons name="call" size={24} color="black" />
                      </View>
                      <Text className="mt-2 font-semibold">Num 2</Text>
                    </TouchableOpacity>
                  )}

                  {/* Location Button */}
                  <TouchableOpacity
                    className="items-center"
                    onPress={() =>
                      handleOpenLocation(
                        orders[0].latitude,
                        orders[0].longitude
                      )
                    }
                  >
                    <View className="w-12 h-12 rounded-full bg-[#F7CA21] items-center justify-center relative">
                      <Ionicons name="location-sharp" size={24} color="black" />
                    </View>
                    <Text className="mt-2 font-semibold">Location</Text>
                  </TouchableOpacity>
                </View>

                {/* Start Journey/Continue Button */}
                <TouchableOpacity
                  className="rounded-full bg-[#F7CA21] py-3 items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                    elevation: 4,
                  }}
                  onPress={() => handleStartJourneyForOrder(order.orderId)}
                  disabled={startingJourney === order.orderId.toString()}
                >
                  {startingJourney === order.orderId.toString() ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-base font-bold">
                      {getJourneyButtonText(order.processOrder.status)}
                    </Text>
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
