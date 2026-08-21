import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "@/component/common/CustomHeader";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import LoadingPage from "../common/LoadingPage";
import LottieView from "lottie-react-native";
import { AlertModal } from "../common/AlertModal";

type CashHandOverNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CashHandOver"
>;

interface OrderCashItem {
  id: string;
  orderId: string;
  received: number;
  earned: number;
}

const CashHandOver: React.FC = () => {
  const navigation = useNavigation<CashHandOverNavigationProp>();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderCashItem[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const [returnOrders, setReturnOrders] = useState<number>(0);
  const [todoOrders, setTodoOrders] = useState<number>(0);
  const [holdOrders, setHoldOrders] = useState<number>(0);
  const [onTheWayOrders, setOnTheWayOrders] = useState<number>(0);

  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertType, setAlertType] = useState<"success" | "error">("error");

  const totalReceived = orders.reduce((sum, o) => sum + o.received, 0);
  const totalEarnings = orders.reduce((sum, o) => sum + o.earned, 0);
  const amountToTransfer = totalReceived - totalEarnings;
  const perOrderEarning = orders.length > 0 ? orders[0].earned : 0;

  
  const pendingCategories = [
    { key: "todo", count: todoOrders, label: "Pending Orders" },
    { key: "hold", count: holdOrders, label: "Hold Orders" },
    { key: "ongoing", count: onTheWayOrders, label: "On The Way Orders" },
    { key: "return", count: returnOrders, label: "Return Orders" },
  ].filter((c) => c.count > 0);

  const hasPendingOrders = pendingCategories.length > 0;

  const fetchCashHandOverData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please login again");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/home/get-received-cash`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.status === "success") {
        const validItems = (response.data.data || [])
          .filter((item: any) => {
            const hasValidAmount =
              item.amount != null &&
              !isNaN(parseFloat(item.amount)) &&
              parseFloat(item.amount) > 0;
            return hasValidAmount;
          })
          .map((item: any) => ({
            id: String(item.id),
            orderId: item.invoNo || `#${item.orderId}`,
            received: parseFloat(item.amount) || 0,
            earned: parseFloat(item.earned) || 0,
          }));

        setOrders(validItems);
      } else {
        Alert.alert("Error", "Failed to fetch received cash");
      }
    } catch (error: any) {
      console.log("Error fetching cash hand over data:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch data",
      );
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchAmountStatusData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${environment.API_BASE_URL}api/home/get-amount`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.status === "success") {
        const data = response.data.data || {};
        setReturnOrders(data.returnOrders || 0);
        setTodoOrders(data.todoOrders || 0);
        setHoldOrders(data.holdOrders || 0);
        setOnTheWayOrders(data.onTheWayOrders || 0);
      }
    } catch (error: any) {
      console.log("Error fetching amount status data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCashHandOverData();
      fetchAmountStatusData();
    }, [fetchCashHandOverData, fetchAmountStatusData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCashHandOverData();
    fetchAmountStatusData();
  };

  const onAlertClose = () => {
    setAlertVisible(false);
  };

  const handleUploadSlip = () => {
    if (hasPendingOrders) {
      const summary = pendingCategories
        .map((c) => `${c.count} ${c.label}`)
        .join(", ");
      setAlertType("error");
      setAlertTitle("Pending Orders");
      setAlertMessage(
        `You still have ${summary}. Please complete, receive, or clear these first before uploading the transfer slip.`,
      );
      setAlertVisible(true);
      return;
    }

    navigation.navigate("UploadBankTransferSlip", { amount: amountToTransfer });
  };

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Received Cash"
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      {loading ? (
        <LoadingPage
          message="Loading Cash Received Details"
          fullScreen={true}
        />
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-400 text-sm">
            --No Cash Received Today--
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Summary cards */}
            <View className="flex-row " style={{ gap: 12 }}>
              <View className="flex-1 rounded-2xl border border-[#D5D9E4] items-center justify-center p-3">
                <LottieView
                  source={require("@/assets/json/coin.json")}
                  style={{
                    width: 60,
                    height: 60,
                  }}
                  autoPlay
                  loop
                />
                <Text className="text-sm">Total Received</Text>
                <Text className="text-xl font-bold mt-1">
                  Rs. {formatNumberWithCommas(totalReceived)}
                </Text>
                <View className=" bg-[#FEF3D4] rounded-md  px-2 mb-6 py-0.5 mt-2">
                  <Text className="text-[11px] text-[#7A4A0E]">
                    Total : {orders.length} Orders
                  </Text>
                </View>
              </View>

              <View className="flex-1 rounded-2xl border border-[#D5D9E4] items-center justify-center p-3">
                <LottieView
                  source={require("@/assets/json/coin.json")}
                  style={{
                    width: 60,
                    height: 60,
                  }}
                  autoPlay
                  loop
                />
                <Text className="text-sm ">Your Earnings</Text>
                <Text className="text-xl font-bold mt-1">
                  Rs. {formatNumberWithCommas(totalEarnings)}
                </Text>
                <View className=" bg-[#D4FEE0] rounded-md px-2 mb-6 py-0.5 mt-2">
                  <Text className="text-[11px] text-[#076734]">
                    Rs. {formatNumberWithCommas(perOrderEarning)} x{" "}
                    {orders.length} Orders
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount to transfer */}
            <View className="bg-[#FFFBE9] rounded-2xl items-center py-4 mt-4 ">
              <Text className="text-xs text-[#000000]">Amount to Transfer</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                Rs. {formatNumberWithCommas(amountToTransfer)}
              </Text>
              <Text className="text-[11px] text-[#415069] mt-1">
                (Total Received - Your Earnings)
              </Text>
            </View>

            {/* Order list */}
            <View className="mt-4" style={{ gap: 12 }}>
              {orders.map((order) => {
                const toTransfer = order.received - order.earned;
                return (
                  <View
                    key={order.orderId}
                    className="rounded-2xl border border-[#D5D9E4] overflow-hidden"
                  >
                    <View className="px-3 pt-3 pb-2">
                      <Text className="text-sm text-[#4E4E4E]">
                        Order ID : #{order.orderId}
                      </Text>
                    </View>

                    <View className="h-px bg-[#D5D9E4]" />

                    <View className="flex-row items-center justify-between px-3 py-3">
                      <View>
                        <Text className="text-sm text-[#415069]">
                          Received :
                        </Text>
                        <Text className="text-base font-semibold text-gray-900">
                          Rs. {formatNumberWithCommas(order.received)}
                        </Text>
                      </View>

                      <Text className="">-</Text>

                      <View>
                        <Text className="text-sm text-[#415069]">
                          You Earned :
                        </Text>
                        <Text className="text-base font-semibold">
                          Rs. {formatNumberWithCommas(order.earned)}
                        </Text>
                      </View>

                      <Text className="">=</Text>

                      <View>
                        <Text className="text-sm text-[#415069]">
                          To Transfer :
                        </Text>
                        <Text className="text-base font-extrabold ">
                          Rs. {formatNumberWithCommas(toTransfer)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Upload button */}
          <View className="px-4 pb-6 pt-2 bg-white">
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={uploading}
              onPress={handleUploadSlip}
              className="bg-[#F7CA21] rounded-full py-3.5 flex-row items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#1f2937" />
              ) : (
                <>
                  <FontAwesome6 name="upload" size={18} color="#1f2937" />
                  <Text className="text-gray-900 font-semibold ">
                    Upload Transfer Slip
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={onAlertClose}
        autoClose={true}
      />
    </View>
  );
};

export default CashHandOver;
