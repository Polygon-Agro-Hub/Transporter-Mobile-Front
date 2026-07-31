import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  BackHandler,
} from "react-native";

import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import LottieView from "lottie-react-native";
import { useFocusEffect } from "@react-navigation/core";
import FixedMarqueeText from "@/component/common/MarqueeText";
import LoadingPage from "../common/LoadingPage";

type ReturnOrdersNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReturnOrders"
>;

interface ReturnOrdersProps {
  navigation: ReturnOrdersNavigationProp;
}

interface ReturnOrder {
  driverOrderId: number;
  processOrderId: number;
  orderId: number;
  invoiceNumber: string;
  amount: string;
  totalAmount: string;
  cashAmountDue: number | null;   // ✅ ADDED
  isPaid: boolean;
  paymentMethod: string;
  customer: {
    title: string;
    fullName: string;
    nameWithTitle: string;
    phoneCode: string;
    phoneNumber: string;
    image: string | null;
  };
  returnDetails: {
    reason: string;
    reasonEnglish: string;
    note: string;
    returnReasonId: number;
    createdAt: string;
  };
  scheduleTime: string;
  address: string;
  buildingType: string;
  drvStatus: string;
  isHandOver: boolean;
  driverOrderCreatedAt: string;
}

interface ApiResponse {
  status: string;
  data: {
    returnOrders: ReturnOrder[];
    totalReturnOrders: number;
  };
}

const ReturnOrders: React.FC<ReturnOrdersProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([]);

  useEffect(() => {
    fetchReturnOrders();
  }, []);

  const fetchReturnOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const response = await axios.get<ApiResponse>(
        `${environment.API_BASE_URL}api/return/get-driver-return-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.status === "success") {
        setReturnOrders(response.data.data.returnOrders);
      } else {
        throw new Error("Failed to fetch return orders");
      }
    } catch (error: any) {
      console.error("Error fetching return orders:", error);
      setError("Failed to load return orders. Please try again.");

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
    fetchReturnOrders();
  };

  const getStatusColor = (returnReason: string) => {
    if (returnReason.toLowerCase().includes("confirmed")) {
      return "#000000";
    } else if (
      returnReason.toLowerCase().includes("switched off") ||
      returnReason.toLowerCase().includes("failed")
    ) {
      return "#000000";
    }
    return "#000000";
  };

  // isPaid is checked FIRST, regardless of payment method,
  // so a paid cash order shows the check icon, not the coin icon.
  const getPaymentIcon = (isPaid: boolean, paymentMethod: string) => {
    if (isPaid) {
      return <FontAwesome name="check-circle" size={20} color="#F7CA21" />;
    }
    return <FontAwesome6 name="coins" size={20} color="#F7CA21" />;
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "";
    return `Rs. ${numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Cash: (fullTotal - deliveryCharge) + todaysCityDeliveryCharge - creditPaid  (computed on backend, returned as cashAmountDue)
  // Non-cash unpaid: falls back to amount, then totalAmount
  // Paid: no amount shown
  const getAmountText = (order: ReturnOrder) => {
    if (order.isPaid) return "";

    const paymentMethod = (order.paymentMethod || "").toLowerCase();

    if (paymentMethod === "cash") {
      return formatCurrency(order.cashAmountDue ?? 0);
    }

    if (order.amount && parseFloat(order.amount) > 0) {
      return formatCurrency(order.amount);
    }

    return formatCurrency(order.totalAmount);
  };

  const getReturnReasonDisplay = (
    returnDetails: ReturnOrder["returnDetails"],
  ) => {
    const isOtherReason =
      returnDetails.reasonEnglish?.toLowerCase() === "other" ||
      returnDetails.reason?.toLowerCase() === "other";

    if (isOtherReason && returnDetails.note && returnDetails.note.trim()) {
      return returnDetails.note.trim();
    }

    const reason =
      returnDetails.reasonEnglish ||
      returnDetails.reason ||
      "No reason specified";

    return reason.replace(/\.{3,}$/, "").trim();
  };

  const handleCardPress = (order: ReturnOrder) => {
    navigation.navigate("ReturnOrderQR", {
      invoiceNumber: order.invoiceNumber,
      orderId: order.orderId,
    });
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

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Return Orders"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />
        <LoadingPage message="Loading Return Orders..." fullScreen={true} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Return Orders"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />
        <View className="flex-1 justify-center items-center px-6">
          <FontAwesome name="exclamation-circle" size={60} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg mt-4 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchReturnOrders}
            className="mt-6 bg-[#F7CA21] py-3 px-6 rounded-full"
          >
            <Text className="text-black font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Return Orders"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
        onBackPress={() => navigation.navigate("Home")}
      />

      {returnOrders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <LottieView
            source={require("@/assets/json/no-data.json")}
            autoPlay
            loop
            style={{ width: 160, height: 160 }}
          />
          <Text className="text-[#495D86] text-base" style={{ marginTop: -15 }}>
            -- No return orders found --
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#F7CA21"]}
              tintColor="#F7CA21"
            />
          }
        >
          <View>
            {returnOrders.map((order, index) => (
              <TouchableOpacity
                key={`${order.driverOrderId}-${index}`}
                className="bg-white rounded-xl p-4 mb-4 border border-[#A4AAB7]"
                activeOpacity={0.7}
                onPress={() => handleCardPress(order)}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                {/* Order Header */}
                <View className="flex-row justify-between items-start mb-1">
                  <View className="flex-1">
                    <Text className="text-[#4E4E4E] font-semibold">
                      Order ID : #{order.invoiceNumber || `ORD${order.orderId}`}
                    </Text>
                    <Text className="text-black font-bold text-base mt-1">
                      {order.customer.nameWithTitle || order.customer.fullName}
                    </Text>
                  </View>
                </View>

                {/* Return Reason with Scrolling Text */}
                <View className="flex-row items-center mb-2">
                  <FontAwesome
                    name="exclamation-circle"
                    size={20}
                    color="black"
                    style={{ marginRight: 8 }}
                  />
                  <View style={{ flex: 1, height: 24 }}>
                    <FixedMarqueeText
                      text={getReturnReasonDisplay(order.returnDetails)}
                      style={{
                        fontSize: 14,
                        color: getStatusColor(order.returnDetails.reason),
                      }}
                      speed={50}
                    />
                  </View>
                </View>

                {/* Payment Info */}
                <View className="flex-row items-center pt-1">
                  <View className="flex-row items-center">
                    {getPaymentIcon(order.isPaid, order.paymentMethod)}

                    <Text className="ml-2 mr-1 text-sm text-[#8A8A8A]">
                      {order.isPaid
                        ? "Already Paid!"
                        : order.paymentMethod || "Cash"}
                    </Text>

                    {!order.isPaid && (
                      <Text className="text-sm text-[#8A8A8A]">:</Text>
                    )}
                  </View>

                  {!order.isPaid && (
                    <Text className="text-sm text-[#8A8A8A] ml-1">
                      {getAmountText(order)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default ReturnOrders;