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
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "@/component/common/CustomHeader";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";

type CashHandOverNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CashHandOver"
>;

interface OrderCashItem {
  orderId: string;
  received: number;
  earned: number;
}

const MOCK_ORDERS: OrderCashItem[] = [
  { orderId: "22123100001", received: 1000, earned: 237.5 },
  { orderId: "22123100002", received: 2000, earned: 250 },
  { orderId: "22123100003", received: 3000, earned: 250 },
  { orderId: "22123100004", received: 4000, earned: 250 },
];

const USE_MOCK_DATA = true;

const CashHandOver: React.FC = () => {
  const navigation = useNavigation<CashHandOverNavigationProp>();

  const [loading, setLoading] = useState<boolean>(!USE_MOCK_DATA);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderCashItem[]>(
    USE_MOCK_DATA ? MOCK_ORDERS : [],
  );
  const [uploading, setUploading] = useState<boolean>(false);

  const totalReceived = orders.reduce((sum, o) => sum + o.received, 0);
  const totalEarnings = orders.reduce((sum, o) => sum + o.earned, 0);
  const amountToTransfer = totalReceived - totalEarnings;
  const perOrderEarning = orders.length > 0 ? orders[0].earned : 0;

  const fetchCashHandOverData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setOrders(MOCK_ORDERS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${environment.API_BASE_URL}/rider/cash-hand-over/today`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = response?.data?.orders ?? [];
      setOrders(data);
    } catch (error) {
      console.log("Error fetching cash hand over data:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!USE_MOCK_DATA) {
      fetchCashHandOverData();
    }
  }, [fetchCashHandOverData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCashHandOverData();
  };

  const handleUploadSlip = async () => {
    // try {
    //   const permission =
    //     await ImagePicker.requestMediaLibraryPermissionsAsync();

    //   if (!permission.granted) {
    //     Alert.alert(
    //       "Permission required",
    //       "Please allow access to your photos to upload the transfer slip.",
    //     );
    //     return;
    //   }

    //   const result = await ImagePicker.launchImageLibraryAsync({
    //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //     quality: 0.8,
    //   });

    //   if (result.canceled) return;

    //   const asset = result.assets[0];
    //   setUploading(true);

    //   const token = await AsyncStorage.getItem("token");
    //   const formData = new FormData();
    //   formData.append("slip", {
    //     uri: asset.uri,
    //     name: "transfer-slip.jpg",
    //     type: "image/jpeg",
    //   } as any);
    //   formData.append("amount", String(amountToTransfer));

    //   await axios.post(
    //     `${environment.API_BASE_URL}/rider/cash-hand-over/upload-slip`,
    //     formData,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         "Content-Type": "multipart/form-data",
    //       },
    //     },
    //   );

    //   Alert.alert("Success", "Transfer slip uploaded successfully.");
    //   fetchCashHandOverData();
    // } catch (error) {
    //   console.log("Error uploading transfer slip:", error);
    //   Alert.alert("Upload failed", "Please try again.");
    // } finally {
    //   setUploading(false);
    // }
    navigation.navigate("UploadBankTransferSlip" as any);
  };

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Received Cash"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F5C518" />
        </View>
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
                    width: 40,
                    height: 40,
                  }}
                  autoPlay
                  loop
                />
                <Text className="text-sm">Total Received</Text>
                <Text className="text-xl font-bold mt-1">
                  Rs. {formatNumberWithCommas(totalReceived)}
                </Text>
                <View className=" bg-[#FEF3D4] rounded-md  px-2 py-0.5 mt-2">
                  <Text className="text-[11px] text-[#7A4A0E]">
                    Total : {orders.length} Orders
                  </Text>
                </View>
              </View>

              <View className="flex-1 rounded-2xl border border-[#D5D9E4] items-center justify-center p-3">
                <LottieView
                  source={require("@/assets/json/coin.json")}
                  style={{
                    width: 40,
                    height: 40,
                  }}
                  autoPlay
                  loop
                />
                <Text className="text-sm ">Your Earnings</Text>
                <Text className="text-xl font-bold mt-1">
                  Rs. {formatNumberWithCommas(totalEarnings)}
                </Text>
                <View className=" bg-[#D4FEE0] rounded-md px-2 py-0.5 mt-2">
                  <Text className="text-[11px] text-[#076734]">
                    Rs. {formatNumberWithCommas(perOrderEarning)}.00 x{" "}
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
              style={{ gap: 8 }}
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
    </View>
  );
};

export default CashHandOver;
