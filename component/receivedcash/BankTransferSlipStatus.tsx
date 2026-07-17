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
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomHeader from "@/component/common/CustomHeader";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import { Ionicons, FontAwesome6, FontAwesome5 } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import LoadingPage from "../common/LoadingPage";

type BankTransferSlipStatusNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BankTransferSlipStatus"
>;

type BankTransferSlipStatusRouteProp = RouteProp<
  RootStackParamList,
  "BankTransferSlipStatus"
>;

type SlipStatus = "pending" | "approved" | "rejected";

interface StatusData {
  status: SlipStatus;
  submittedAt: string;
  rejectedAt?: string;
  amount: number;
  rejectionReason?: string;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const time = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;

  const day = date.getDate();
  const ordinal =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${time} on ${day}${ordinal} ${month}, ${year}`;
};

const BankTransferSlipStatus: React.FC = () => {
  const navigation = useNavigation<BankTransferSlipStatusNavigationProp>();
  const route = useRoute<BankTransferSlipStatusRouteProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<StatusData | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${environment.API_BASE_URL}api/home/get-latest-transaction-status`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.status === "success" && response.data.data) {
        const result = response.data.data;
        let mappedStatus: SlipStatus = "pending";
        if (result.transStatus === "Approved") mappedStatus = "approved";
        else if (result.transStatus === "Rejected") mappedStatus = "rejected";

        setData({
          status: mappedStatus,
          submittedAt: result.createdAt,
          rejectedAt: result.transStatus === "Rejected" ? result.createdAt : undefined,
          amount: parseFloat(result.transAmount) || 0,
          rejectionReason: result.transStatus === "Rejected" ? "Transfer slip is unclear or details mismatch." : undefined,
        });
      } else {
        throw new Error("No transaction found");
      }
    } catch (error) {
      const fallbackStatus: SlipStatus =
        (route.params as any)?.status ?? "rejected";

      setData({
        status: fallbackStatus,
        submittedAt: new Date().toISOString(),
        rejectedAt:
          fallbackStatus === "rejected" ? new Date().toISOString() : undefined,
        amount: 9000.0,
        rejectionReason: "Transfer slip is unclear.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" as keyof RootStackParamList }],
    });
  };

  const reUpload = () => {
    navigation.navigate("UploadBankTransferSlip", { amount: data?.amount });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Waiting for Approval"
          navigation={navigation}
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <LoadingPage message="Fetching Status Details..." fullScreen={true} />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-center text-sm text-gray-500">
          Something went wrong loading your submission status.
        </Text>
        <TouchableOpacity
          onPress={fetchStatus}
          activeOpacity={0.8}
          className="mt-4 rounded-full bg-amber-400 px-6 py-3"
        >
          <Text className="text-sm font-bold text-gray-900">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRejected = data.status === "rejected";

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title={isRejected ? "Rejected" : "Waiting for Approval"}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Icon */}
        <View className=" items-center">
          {isRejected ? (
            <View className="mt-10 mb-10">
              <LottieView
                source={require("@/assets/json/error-bankdetailsupload.json")}
                style={{
                  width: 100,
                  height: 100,
                }}
                autoPlay
                loop
              />
            </View>
          ) : (
            <View className="">
              <LottieView
                source={require("@/assets/json/pending.json")}
                style={{
                  width: 150,
                  height: 150,
                }}
                autoPlay
                loop
              />
            </View>
          )}
        </View>

        {/* Title & Subtitle */}
        <View className=" items-center px-4">
          <Text className="text-lg font-bold text-gray-900">
            {isRejected ? "Submission Rejected" : "Approval Pending"}
          </Text>
          <Text className="mt-2 text-center text-sm text-[#32445C]">
            {isRejected
              ? "The finance team has reviewed your submission and rejected the uploaded transfer slip."
              : "Your shift closing request has been submitted and is now waiting for finance team approval."}
          </Text>
        </View>

        {/* Info / Warning Banner */}
        <View
          className={`mt-5 flex-row items-center rounded-xl px-4 py-3 ${
            isRejected ? "bg-[#FEF8F8]" : "bg-[#F3F7FE]"
          }`}
        >
          <Ionicons
            name={isRejected ? "alert-circle" : "information-circle"}
            size={16}
            color={isRejected ? "#FF0000" : "#32445C"}
          />
          <Text
            className={`ml-2 flex-1 text-xs font-medium ${
              isRejected ? "text-[#FF0000]" : "text-[#32445C]"
            }`}
          >
            {isRejected
              ? "Please check the reason below and upload a valid slip."
              : "You will be notified if the submission is rejected."}
          </Text>
        </View>

        {/* Summary / Rejection Details Card */}
        <View className="mt-5 rounded-2xl border border-[#D2D2D2] bg-white px-4 py-4">
          <Text className="mb-3 text-xl font-semibold text-[#000000]">
            {isRejected ? "Rejection Details" : "Summary"}
          </Text>

          <DetailRow
            icon="calendar"
            label="Submitted At"
            value={formatDateTime(data.submittedAt)}
          />
          <View className="h-px mt-1 mb-1 bg-[#D5D9E4]" />

          {isRejected ? (
            <>
              <DetailRow
                icon="calendar"
                label="Rejected At"
                value={formatDateTime(data.rejectedAt)}
              />
              <View className="h-px mt-1 mb-1 bg-[#D5D9E4]" />
              <View className="mt-1 border-gray-100 pt-3">
                <Text className="text- font-bold text-[#CF0000]">
                  Reason for Rejection
                </Text>
                <Text className="mt-1 text-xs text-[#32445C]">
                  {data.rejectionReason ?? "No reason provided."}
                </Text>
              </View>
            </>
          ) : (
            <>
              <DetailRow
                icon="money-bills"
                label="Transferred Amount"
                value={`Rs. ${formatNumberWithCommas(data.amount.toFixed(2))}`}
                boldValue
              />
              <View className="h-px mt-1 mb-1 bg-[#D5D9E4]" />
              <View className="flex-row items-center py-1">
                <View className="w-10 h-10 bg-[#F3F3F3] rounded-full items-center justify-center">
                  <FontAwesome6 name="note-sticky" size={14} color="#000000" />
                </View>
                <Text className="ml-2 flex-1 text-xs text-[#32445C]">
                  Transfer Slip
                </Text>

                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={14} color="#0CB353" />
                  <Text className="ml-1 text-xs font-medium text-[#0CB353]">
                    Submitted
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-5 pb-6 pt-2">
        <TouchableOpacity
          onPress={isRejected ? reUpload : goHome}
          activeOpacity={0.8}
          className="flex-row items-center justify-center rounded-full bg-[#F7CA21] py-4"
        >
          {isRejected && (
            <FontAwesome5
              name="upload"
              size={18}
              color="#111827"
              style={{ marginRight: 8 }}
            />
          )}
          <Text className="text-base font-bold text-gray-900">
            {isRejected ? "Re Upload" : "Go to Home"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DetailRow: React.FC<{
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  label: string;
  value: string;
  boldValue?: boolean;
}> = ({ icon, label, value, boldValue }) => (
  <View className="flex-row items-center py-1.5">
    <View className="w-10 h-10 bg-[#F3F3F3] rounded-full items-center justify-center">
      <FontAwesome6 name={icon} size={14} color="#000000" />
    </View>
    <Text className="ml-2 flex-1 text-xs text-[#32445C]">{label}</Text>
    <Text
      className={`text-xs ${
        boldValue ? "font-bold text-[#32445C]" : "font-bold text-[#32445C]"
      }`}
    >
      {value}
    </Text>
  </View>
);

export default BankTransferSlipStatus;
