import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { selectUserProfile } from "../store/authSlice";
import axios from "axios";
import { environment } from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";

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
  onTheWayOrders: number;
  holdOrders: number;
  returnOrders: number;
  returnReceivedOrders: number;
  cashOrders: number;
}

// Default values for amountData
const defaultAmountData: AmountData = {
  totalOrders: 0,
  totalCashAmount: 0,
  todoOrders: 0,
  completedOrders: 0,
  onTheWayOrders: 0,
  holdOrders: 0,
  returnOrders: 0,
  returnReceivedOrders: 0,
  cashOrders: 0,
};

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amountData, setAmountData] = useState<AmountData>(defaultAmountData);
  const [error, setError] = useState<string | null>(null);

  // Get user profile from Redux
  const userProfile = useSelector(selectUserProfile);

  // Fetch amount data from API - always fetch when component mounts
  const fetchAmountData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true); // Always show loading when fetching

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setError("No authentication token found");
        setAmountData(defaultAmountData);
        return;
      }

      // Replace with your actual API endpoint
      const response = await axios.get(
        `${environment.API_BASE_URL}api/home/get-amount`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
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

  // Fetch data when component mounts
  useEffect(() => {
    fetchAmountData();
  }, [fetchAmountData]);

  // Fetch data when the screen comes into focus
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

  // Safe function to get cash amount
  const getCashAmount = () => {
    const cash = amountData?.totalCashAmount;
    if (cash === undefined || cash === null || isNaN(cash)) {
      return 0;
    }
    return cash;
  };

  // Check if should show End My Shift button
  const shouldShowEndShiftButton = () => {
    const totalOrders = amountData?.totalOrders || 0;
    const cashAmount = getCashAmount();
    const returnOrders = amountData?.returnOrders || 0;

    // Show End My Shift if:
    // 1. No packs (totalOrders === 0) AND cash > 0
    // OR
    // 2. No packs (totalOrders === 0) AND return orders > 0
    return totalOrders === 0 && (cashAmount > 0 || returnOrders > 0);
  };

  // Handle End My Shift button press
  const handleEndShiftPress = () => {
    const cashAmount = getCashAmount();
    const returnOrders = amountData?.returnOrders || 0;

    if (cashAmount > 0) {
      // Navigate to ReceivedCash page
      navigation.navigate("ReceivedCash");
    } else if (returnOrders > 0) {
      // Navigate to ReturnOrders page
      navigation.navigate("ReturnOrders");
    }
  };

  // Determine the motivational message based on progress
  const getMotivationalMessage = () => {
    // Don't show motivational message if End My Shift button should be shown
    if (shouldShowEndShiftButton()) {
      return null;
    }

    const total = amountData?.totalOrders || 0;
    const completed = amountData?.completedOrders || 0;
    const todo = amountData?.todoOrders || 0;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    // If no orders at all - Style 1 (Light yellow with target icon)
    if (total === 0) {
      return {
        title: "Have a nice Day!",
        subtitle: "Scan packages to start..",
        bgColor: "#FFF2BF", // Very light yellow
        showPercentage: false,
        percentage: 0,
        style: 1, // First style
      };
    }

    // If there are orders but all completed
    if (total > 0 && todo === 0) {
      return {
        title: "Great Work!",
        subtitle: "Click on Close button to end the shift.",
        bgColor: "#FFF8E1", // Very light yellow
        showPercentage: false,
        percentage: 100,
        style: 1, // First style
      };
    }

    // If there are orders to complete - Style 2 (Bright yellow with percentage)
    return {
      title: "Way more to go!",
      subtitle: `${todo} Location${todo > 1 ? "s" : ""} to go..`,
      bgColor: "#F7CA21", // Bright yellow like in the image
      showPercentage: true,
      percentage: completionRate,
      style: 2, // Second style
    };
  };

  const motivationalMsg = getMotivationalMessage();

  const getPacksCount = () => {
    const todoOrders = amountData?.todoOrders || 0;
    const holdOrders = amountData?.holdOrders || 0;
    return todoOrders + holdOrders;
  };

  // Build quick actions dynamically
  const buildQuickActions = () => {
    const packsCount = getPacksCount();
    const actions = [
      {
        image: scanQRImage,
        label: "Scan",
        color: "#3B82F6",
        action: () => navigation.navigate("AssignOrderQR"),
      },
      {
        image: packsImage,
        label: `${packsCount} Packs`, // Changed to use packsCount
        color: "#10B981",
        action: () => navigation.navigate("Jobs"),
      },
      {
        image: myComplaintImage,
        label: "My Complaints",
        color: "#8B5CF6",
        action: () => navigation.navigate("ComplaintsList"),
      },
    ];

    // Add Ongoing if there are "On the way" orders
    if ((amountData?.onTheWayOrders || 0) > 0) {
      actions.push({
        image: ongoingImage,
        label: "Ongoing",
        color: "#FFF2BF",
        action: () => navigation.navigate("ReturnOrders"),
      });
    }

    // Add Return if there are return orders
    if ((amountData?.returnOrders || 0) > 0) {
      actions.push({
        image: returnImage,
        label: `${amountData?.returnOrders || 0} Return`,
        color: "#F59E0B",
        action: () => navigation.navigate("ReturnOrders"),
      });
    }

    return actions;
  };

  const quickActions = buildQuickActions();

  // Function to split array into chunks of 2 for rows
  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const actionRows = chunkArray(quickActions, 2);

  // Handle cash received navigation
  const handleCashReceivedPress = () => {
    const cashAmount = getCashAmount();
    if (cashAmount > 0) {
      navigation.navigate("ReceivedCash");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FFC83D" />
        <Text className="mt-4 text-gray-600">Loading data...</Text>
      </View>
    );
  }

  // If there's an error, show error state
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
      {/* Header */}
      <View className="bg-white px-4 shadow-sm mt-4">
        <TouchableOpacity
          className="flex-row items-center"
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Profile")}
        >
          {/* User Image */}
          <View className="mr-4">
            <Image
              source={
                userProfile?.profileImg
                  ? { uri: userProfile.profileImg }
                  : require("@/assets/images/home/profile.webp")
              }
              className="w-14 h-14 rounded-full border-2 border-yellow-400"
              resizeMode="cover"
            />
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Hi, {userProfile?.firstName || "User"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering: Either motivational message OR End My Shift button */}
      {showEndShiftButton ? (
        // END MY SHIFT BUTTON SECTION
        <TouchableOpacity
          className="mx-4 mt-8 mb-4 rounded-2xl p-5 flex-row items-center justify-center"
          style={{ backgroundColor: "#FF0000" }} // Red background
          onPress={handleEndShiftPress}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Feather name="log-out" size={24} color="white" />
            <Text className="text-lg font-bold text-white ml-3">
              END MY SHIFT
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        // MOTIVATIONAL MESSAGE SECTION (only show if not showing End My Shift)
        motivationalMsg &&
        (motivationalMsg.style === 1 ? (
          // Style 1: Light yellow background with target icon (no percentage)
          <TouchableOpacity
            className="mx-4 mt-8 mb-4 rounded-2xl p-5 flex-row items-center"
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
          // Style 2: Bright yellow background with circular progress
          <TouchableOpacity
            className="mx-4 mt-8 mb-4 rounded-2xl p-5 flex-row items-center"
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
              {/* Circular progress indicator */}
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
        className="mx-4 mb-6 bg-white rounded-2xl p-5 border border-gray-200 flex-row items-center"
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
            <Text className="text-sm text-gray-500">Cash Received</Text>
            <Text className="text-xl font-bold text-gray-900">
              Rs. {cashAmount}
            </Text>
          </View>
        </View>
        <View className="ml-4">
          {/* Right arrow icon - only visible if amount > 0 */}
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
        {/* Grid layout with 2 items per row */}
        {actionRows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between mb-6">
            {row.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.action}
                activeOpacity={0.7}
                style={{
                  width: "48%",
                  backgroundColor:
                    action.label === "Ongoing" ? action.color : "#fff",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                {/* Image Container */}
                <View className="w-24 h-24 rounded-lg justify-center items-center mb-3 overflow-hidden">
                  <Image
                    source={action.image}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-sm font-medium text-gray-800 text-center">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Add empty view if row has only 1 item to maintain layout */}
            {row.length === 1 && <View className="w-[48%]" />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default Home;
