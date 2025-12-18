import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import {
  AntDesign,
  Feather,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "@/component/common/CustomHeader";

type ReturnOrdersNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReturnOrders"
>;

interface ReturnOrdersProps {
  navigation: ReturnOrdersNavigationProp;
}

// Mock data matching the image content
const returnOrdersData = [
  {
    id: "22123100002",
    orderId: "#22123100002",
    customerName: "Mr. Gimhan Nayanajith Kariyawa..",
    status: "Call Confirmed, But the customer wasn't there",
    paymentStatus: "Cash",
    amount: "Rs. 1,000.00",
    statusType: "confirmed",
    date: "Dec 31, 2022",
  },
  {
    id: "22123100001",
    orderId: "#22123100001",
    customerName: "Mr. Gimhan Nayanajith Kariyawa..",
    status: "Call Confirmed, But the customer wasn't there",
    paymentStatus: "Cash",
    amount: "Rs. 1,000.00",
    statusType: "confirmed",
    date: "Dec 31, 2022",
  },
  {
    id: "22122100001",
    orderId: "#22122100001",
    customerName: "Ms. Hashini Herath",
    status: "Phone switched off & the customer wasn't there",
    paymentStatus: "Already Paid!",
    amount: "",
    statusType: "failed",
    date: "Dec 21, 2022",
  },
  {
    id: "22123100002",
    orderId: "#22123100002",
    customerName: "Mr. Gimhan Nayanajith Kariyawa..",
    status: "Call Confirmed, But the customer wasn't there",
    paymentStatus: "Cash",
    amount: "Rs. 1,000.00",
    statusType: "confirmed",
    date: "Dec 31, 2022",
  },
  {
    id: "22123100001",
    orderId: "#22123100001",
    customerName: "Mr. Gimhan Nayanajith Kariyawa..",
    status: "Call Confirmed, But the customer wasn't there",
    paymentStatus: "Cash",
    amount: "Rs. 1,000.00",
    statusType: "confirmed",
    date: "Dec 31, 2022",
  },
  {
    id: "22122100001",
    orderId: "#22122100001",
    customerName: "Ms. Hashini Herath",
    status: "Phone switched off & the customer wasn't there",
    paymentStatus: "Already Paid!",
    amount: "",
    statusType: "failed",
    date: "Dec 21, 2022",
  },
];

const ReturnOrders: React.FC<ReturnOrdersProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState(returnOrdersData);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(returnOrdersData);
      setRefreshing(false);
    }, 1500);
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case "confirmed":
        return "text-[#000000]";
      case "failed":
        return "text-[#000000]";
      default:
        return "text-[#000000]";
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case "confirmed":
        return (
          <FontAwesome name="exclamation-circle" size={wp(5)} color="black" />
        );
      case "failed":
        return (
          <FontAwesome name="exclamation-circle" size={wp(5)} color="black" />
        );
      default:
        return (
          <MaterialCommunityIcons name="phone" size={wp(5)} color="#4b5563" />
        );
    }
  };

  const getPaymentIcon = (paymentStatus: string) => {
    if (paymentStatus === "Cash") {
      return <FontAwesome6 name="coins" size={wp(4.5)} color="#F7CA21" />;
    } else if (paymentStatus.includes("Paid")) {
      return (
        <FontAwesome5 name="check-circle" size={wp(4.5)} color="#F7CA21" />
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Orders List */}
        <View className="mb-20">
          {orders.map((order, index) => (
            <TouchableOpacity
              key={order.id}
              className="bg-white rounded-xl p-4 mb-4 border border-[#A4AAB7] "
              activeOpacity={0.7}
              // onPress={() => navigation.navigate("OrderDetails", { orderId: order.id })}
            >
              {/* Order Header */}
              <View className="flex-row justify-between items-start mb-1">
                <View className="flex-1">
                  <Text className="text-[#4E4E4E] font-semibold">
                    Order ID : {order.orderId}
                  </Text>
                  <Text className="text-black font-bold text-base mt-1">
                    {order.customerName}
                  </Text>
                </View>
              </View>

              {/* Status */}
              <View className="flex-row items-center ">
                <View className="mt-[-5%]">
                  {getStatusIcon(order.statusType)}
                </View>
                <Text
                  className={`ml-2  flex-1 text-sm ${getStatusColor(
                    order.statusType
                  )}`}
                >
                  {order.status}
                </Text>
              </View>

              {/* Payment Info */}
              <View className="flex-row justify-between items-center pt-3 ">
                <View className="flex-row items-center">
                  {getPaymentIcon(order.paymentStatus)}
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      order.paymentStatus === "Cash"
                        ? "text-[#8A8A8A]"
                        : "text-[#8A8A8A]"
                    }`}
                  >
                    {order.paymentStatus}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-4 right-4 bg-[#F7CA21] w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate("AssignOrderQR")}
      >
        {/* <AntDesign name="plus" size={24} color="white" /> */}
        <Image
          source={require("@/assets/images/ReturnOrders/qr.webp")}
          className="w-auto h-[65%]"
          resizeMode="contain"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ReturnOrders;
