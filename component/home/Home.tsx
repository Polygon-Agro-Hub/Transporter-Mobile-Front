import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { selectUserProfile } from "../../store/authSlice";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";
import LoadingPage from "../common/LoadingPage";

const scanQRImage = require("@/assets/images/home/scan.webp");
const myComplaintImage = require("@/assets/images/home/complaints.webp");
const ongoingImage = require("@/assets/images/home/ongoing.webp");
const packsImage = require("@/assets/images/home/packs.webp");
const returnImage = require("@/assets/images/home/return.webp");
const smallImage = require("@/assets/images/home/target.webp");
const moneyImage = require("@/assets/images/home/money.webp");

type HomeNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface HomeProps {
  navigation: HomeNavigationProp;
}

interface AmountData {
  totalOrders: number;
  totalCashAmount: number;
  todoOrders: number;
  completedOrders: number;
  todayCompletedOrders: number;
  todayReturnOrders: number;
  onTheWayOrders: number;
  holdOrders: number;
  returnOrders: number;
  returnReceivedOrders: number;
  cashOrders: number;
  ongoingProcessOrderIds?: number[];
  pendingLocationsCount?: number;
  todayCompletedLocationsCount?: number;
}

const defaultAmountData: AmountData = {
  totalOrders: 0,
  totalCashAmount: 0,
  todoOrders: 0,
  completedOrders: 0,
  todayCompletedOrders: 0,
  todayReturnOrders: 0,
  onTheWayOrders: 0,
  holdOrders: 0,
  returnOrders: 0,
  returnReceivedOrders: 0,
  cashOrders: 0,
  ongoingProcessOrderIds: [],
  pendingLocationsCount: 0,
  todayCompletedLocationsCount: 0,
};

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amountData, setAmountData] = useState<AmountData>(defaultAmountData);
  const [error, setError] = useState<string | null>(null);

  const userProfile = useSelector(selectUserProfile);

  const fetchAmountData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setError("No authentication token found");
        setAmountData(defaultAmountData);
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/home/get-amount`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status === "success" && response.data.data) {
        setAmountData({
          ...defaultAmountData,
          ...response.data.data,
        });
      } else {
        setError("Invalid response format");
        setAmountData(defaultAmountData);
      }
    } catch (error) {
      console.error("Error fetching amount data:", error);
      setError("Failed to load data");
      setAmountData(defaultAmountData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmountData();
  }, [fetchAmountData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAmountData();
    });

    return unsubscribe;
  }, [navigation, fetchAmountData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAmountData();
    setRefreshing(false);
  };

  const getCashAmount = () => {
    const cash = amountData?.totalCashAmount;
    if (cash === undefined || cash === null || isNaN(cash)) {
      return 0;
    }
    return cash;
  };

  const getPacksCount = () => {
    const todoOrders = amountData?.todoOrders || 0;
    const holdOrders = amountData?.holdOrders || 0;
    const ongoingOrders = amountData?.onTheWayOrders || 0;
    return todoOrders + holdOrders + ongoingOrders;
  };

  const shouldShowEndShiftButton = () => {
    const packsCount = getPacksCount();
    const cashAmount = getCashAmount();
    const returnOrders = amountData?.returnOrders || 0;

    return packsCount === 0 && (cashAmount > 0 || returnOrders > 0);
  };

  const handleEndShiftPress = () => {
    const cashAmount = getCashAmount();
    const returnOrders = amountData?.returnOrders || 0;

    if (cashAmount > 0) {
      navigation.navigate("ReceivedCash");
    } else if (returnOrders > 0) {
      navigation.navigate("ReturnOrders");
    }
  };

  const getMotivationalMessage = () => {
    if (shouldShowEndShiftButton()) {
      return null;
    }

    const pendingLocations = amountData?.pendingLocationsCount || 0;
    const todayCompletedLocations =
      amountData?.todayCompletedLocationsCount || 0;
    const todayReturns = amountData?.todayReturnOrders || 0;

    if (pendingLocations === 0) {
      return {
        title: "Have a nice Day!",
        subtitle: "Scan packages to start..",
        bgColor: "#FFF2BF",
        showPercentage: false,
        percentage: 0,
        style: 1,
      };
    }

    const todayFinished = todayCompletedLocations;

    const totalWork = pendingLocations + todayFinished;

    const completionRate =
      totalWork > 0
        ? Math.round((todayCompletedLocations / totalWork) * 100)
        : 0;

    return {
      title: "Way more to go!",
      subtitle: `${pendingLocations} Location${pendingLocations !== 1 ? "s" : ""} to go..`,
      bgColor: "#F7CA21",
      showPercentage: true,
      percentage: completionRate,
      style: 2,
    };
  };

  const motivationalMsg = getMotivationalMessage();

  const buildQuickActions = () => {
    const packsCount = getPacksCount();
    const showEndShift = shouldShowEndShiftButton();
    const actions = [
      {
        image: scanQRImage,
        label: "Scan",
        color: "#3B82F6",
        action: () => navigation.navigate("AssignOrderQR"),

      },
      {
        image: packsImage,
        label: `${packsCount} Packs`,
        color: "#10B981",
        action: () => navigation.navigate("Jobs"),
        disabled: packsCount === 0 && (amountData?.completedOrders || 0) === 0,
      },
      {
        image: myComplaintImage,
        label: "My Complaints",
        color: "#8B5CF6",
        action: () => navigation.navigate("ComplaintsList"),
        disabled: false,
      },
    ];

    if ((amountData?.onTheWayOrders || 0) > 0) {
      const ongoingProcessOrderIds = amountData?.ongoingProcessOrderIds || [];

      actions.push({
        image: ongoingImage,
        label: "Ongoing",
        color: "#FFF2BF",
        action: () => {
          if (ongoingProcessOrderIds.length > 0) {
            navigation.navigate("OrderDetails", {
              processOrderIds: ongoingProcessOrderIds,
            });
          } else {
            navigation.navigate("Jobs");
          }
        },
        disabled: false,
      });
    }

    if ((amountData?.returnOrders || 0) > 0) {
      actions.push({
        image: returnImage,
        label: `${amountData?.returnOrders || 0} Return`,
        color: "#F59E0B",
        action: () => navigation.navigate("ReturnOrders"),
        disabled: false,
      });
    }

    return actions;
  };

  const quickActions = buildQuickActions();

  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const actionRows = chunkArray(quickActions, 2);

  const handleCashReceivedPress = () => {
    const cashAmount = getCashAmount();
    if (cashAmount > 0) {
      navigation.navigate("ReceivedCash");
    }
  };

  if (loading) {
    return <LoadingPage message="Loading Data..." fullScreen={true} />;
  }

  if (error && !loading) {
    return (
      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-1 items-center justify-center p-4 mt-20">
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-lg font-bold text-gray-900 mt-4">
            Unable to Load Data
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            {error}. Pull down to refresh.
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const cashAmount = getCashAmount();
  const showEndShiftButton = shouldShowEndShiftButton();

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      {/* Header */}
      <View className="bg-white px-4 shadow-sm mt-4">
        <TouchableOpacity
          className="flex-row items-center"
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Profile")}
        >
          <View className="mr-4">
            <Image
              source={
                userProfile?.profileImg
                  ? { uri: userProfile.profileImg }
                  : require("@/assets/images/home/profile.webp")
              }
              className="w-10 h-10 rounded-full border-2 border-yellow-400"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Hi, {userProfile?.firstName || "User"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering: Either motivational message OR End My Shift button */}
      {showEndShiftButton ? (
        <TouchableOpacity
          className="mx-4 mt-8 mb-4 rounded-2xl px-5 py-3 flex-col items-center justify-center border"
          style={{
            backgroundColor: "#FFFBEA",
            borderColor: "#F7CA21",
          }}
          onPress={handleEndShiftPress}
          activeOpacity={0.7}
        >
          <View className="flex">
            <Text className="text-lg font-bold text-black text-center">
              Great Work!
            </Text>
            <Text className="text-black mt-1 text-center">
              Click on Close button to end the shift.
            </Text>
          </View>
          <View className="ml-4">
            <TouchableOpacity
              className="bg-[#F7CA21] px-14 py-3 rounded-full mt-2"
              onPress={handleEndShiftPress}
              activeOpacity={0.7}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <View className="flex-row items-center">
                <Text className="font-bold text-black">End My Shift</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : (
        motivationalMsg &&
        (motivationalMsg.style === 1 ? (
          <TouchableOpacity
            className="mx-4 mt-8 mb-4 rounded-2xl px-5 py-3 flex-row items-center"
            style={{ backgroundColor: motivationalMsg.bgColor }}
          >
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {motivationalMsg.title}
              </Text>
              <Text className="text-gray-700 mt-1">
                {motivationalMsg.subtitle}
              </Text>
            </View>
            <View className="ml-4">
              <Image
                source={smallImage}
                className="w-20 h-20"
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="mx-4 mt-8 mb-4 rounded-2xl px-5 py-3 flex-row items-center"
            style={{ backgroundColor: motivationalMsg.bgColor }}
          >
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {motivationalMsg.title}
              </Text>
              <Text className="text-gray-900 mt-1">
                {motivationalMsg.subtitle}
              </Text>
            </View>
            <View className="ml-4 relative items-center justify-center">
              <Progress.Circle
                size={56}
                progress={motivationalMsg.percentage / 100}
                thickness={4}
                color="#FFFFFF"
                unfilledColor="#49454F29"
                borderWidth={0}
                showsText={true}
                formatText={() => `${motivationalMsg.percentage}%`}
                textStyle={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#000000",
                }}
              />
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Box 2: Cash Received box */}
      <TouchableOpacity
        className="mx-4 mb-2 bg-white rounded-2xl px-5 py-1 border border-[#EBEBEB] flex-row items-center"
        style={
          cashAmount > 0
            ? {
              shadowColor: "#000",
              shadowOffset: { width: 4, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }
            : {}
        }
        onPress={handleCashReceivedPress}
        activeOpacity={cashAmount > 0 ? 0.7 : 1}
        disabled={cashAmount === 0}
      >
        <View className="flex-row items-center flex-1">
          <Image
            source={moneyImage}
            className="w-20 h-20 mr-4"
            resizeMode="contain"
          />
          <View>
            <Text className="text-sm text-black">Cash Received :</Text>
            <Text className="text-xl font-bold text-black">
              Rs. {formatNumberWithCommas(cashAmount)}
            </Text>
          </View>
        </View>
        <View className="ml-4">
          {cashAmount > 0 ? (
            <View className="w-8 h-8 items-center justify-center">
              <Feather name="chevron-right" size={30} color="black" />
            </View>
          ) : (
            <View className="w-8 h-8 items-center justify-center">
              <Feather name="chevron-right" size={30} color="#EBEBEB" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View className="px-4 pt-2 pb-6">
        {actionRows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between mb-4">
            {row.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.disabled ? undefined : action.action}
                activeOpacity={action.disabled ? 1 : 0.7}
                disabled={action.disabled}
                style={{
                  width: "48%",
                  backgroundColor:
                    action.label === "Ongoing" ? action.color : "#fff",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 2,
                  alignItems: "center",
                  justifyContent: "center",

                  ...(action.disabled
                    ? {
                      borderWidth: 1,
                      borderColor: "#EBEBEB",
                    }
                    : {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }),

                  opacity: 1,
                }}
              >
                <View className="w-32 h-32 rounded-lg justify-center items-center mb-3 overflow-hidden">
                  <Image
                    source={action.image}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-row items-center justify-center">
                  {action.label === "Ongoing" && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#F7CA21",
                        marginRight: 6,
                      }}
                    />
                  )}

                  <Text className="text-sm font-bold text-gray-800 ">
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {row.length === 1 && <View className="w-[48%]" />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default Home;
