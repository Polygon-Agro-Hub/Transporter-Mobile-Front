import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { FontAwesome, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";

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
        }
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
      return "text-[#000000]";
    } else if (
      returnReason.toLowerCase().includes("switched off") ||
      returnReason.toLowerCase().includes("failed")
    ) {
      return "text-[#000000]";
    }
    return "text-[#000000]";
  };

  const getPaymentIcon = (isPaid: boolean, paymentMethod: string) => {
    if (!isPaid && paymentMethod === "Cash") {
      return <FontAwesome6 name="coins" size={wp(4.5)} color="#F7CA21" />;
    } else if (isPaid) {
      return (
        <FontAwesome5 name="check-circle" size={wp(4.5)} color="#F7CA21" />
      );
    }
    return null;
  };

  const getAmountText = (
    isPaid: boolean,
    amount: string,
    totalAmount: string
  ) => {
    if (!isPaid && amount && parseFloat(amount) > 0) {
      return `Rs. ${parseFloat(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else if (!isPaid && totalAmount && parseFloat(totalAmount) > 0) {
      return `Rs. ${parseFloat(totalAmount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return "";
  };

  const handleCardPress = (order: ReturnOrder) => {
    // Navigate to ReturnOrderQR with invoice number and orderId
    navigation.navigate("ReturnOrderQR", {
      invoiceNumber: order.invoiceNumber,
      orderId: order.orderId,
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Return Orders"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F7CA21" />
          <Text className="mt-4 text-gray-600">Loading return orders...</Text>
        </View>
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
      />

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F7CA21"]}
            tintColor="#F7CA21"
          />
        }
      >
        {/* Orders List */}
        <View className="mb-20">
          {returnOrders.length === 0 ? (
            <View className="flex-1 justify-center items-center py-10">
              <Text className="text-gray-500 text-lg mt-4 text-center">
                No return orders found
              </Text>
            </View>
          ) : (
            returnOrders.map((order, index) => (
              <TouchableOpacity
                key={`${order.driverOrderId}-${index}`}
                className="bg-white rounded-xl p-4 mb-4 border border-[#A4AAB7]"
                activeOpacity={0.7}
                onPress={() => handleCardPress(order)}
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

                {/* Status */}
                <View className="flex-row items-center">
                  <FontAwesome
                    name="exclamation-circle"
                    size={wp(5)}
                    color="black"
                  />

                  <Text
                    className={`ml-2 flex-1 text-sm ${getStatusColor(
                      order.returnDetails.reason
                    )}`}
                  >
                    {order.returnDetails.reason}
                  </Text>
                </View>

                {/* Payment Info */}
                <View className="flex-row items-center pt-1">
                  <View className="flex-row items-center">
                    {getPaymentIcon(order.isPaid, order.paymentMethod)}
                    <Text
                      className={`mx-2 text-sm ${
                        order.isPaid ? "text-[#8A8A8A]" : "text-[#8A8A8A]"
                      }`}
                    >
                      {/* Always show "Already Paid!" if isPaid is true */}
                      {order.isPaid
                        ? "Already Paid!"
                        : order.paymentMethod || "Cash :"}
                    </Text>
                  </View>

                  {/* Show amount only if not paid */}
                  {!order.isPaid && (
                    <Text className="text-sm text-[#8A8A8A]">
                      {getAmountText(
                        order.isPaid,
                        order.amount,
                        order.totalAmount
                      )}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - Keep the same */}
      <TouchableOpacity
        className="absolute bottom-4 right-4 bg-[#F7CA21] w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate("AssignOrderQR")}
      >
        <Image
          source={require("@/assets/images/ReturnOrders/qr.webp")}
          className="w-auto h-[65%]"
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

export default ReturnOrders;
