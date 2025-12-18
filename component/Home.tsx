import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { selectUserProfile } from "../store/authSlice";

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

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Get user profile from Redux
  const userProfile = useSelector(selectUserProfile);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const quickActions = [
    {
      image: scanQRImage,
      label: "Scan QR",
      color: "#3B82F6",
      action: () => navigation.navigate("AssignOrderQR"),
    },
    {
      image: packsImage,
      label: "3 Packs",
      color: "#10B981",
      action: () => navigation.navigate("Splash"),
    },
    {
      image: myComplaintImage,
      label: "My Complaints",
      color: "#8B5CF6",
      action: () => navigation.navigate("ComplaintsList"),
    },
    {
      image: ongoingImage,
      label: "Ongoing",
      color: "#F59E0B",
      action: () => navigation.navigate("ReturnOrders"),
    },
    {
      image: returnImage,
      label: "2 Return",
      color: "#F59E0B",
      action: () => navigation.navigate("ReturnOrders"),
    }
  ];

  // Function to split array into chunks of 2 for rows
  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const actionRows = chunkArray(quickActions, 2);

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
        {/* Make whole user section clickable */}
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
              Hi, {userProfile?.firstName || "User"}{" "}
              {userProfile?.lastName || ""}
            </Text>
            <Text className="text-sm text-gray-500">View Profile</Text>
          </View>

          {/* Optional arrow icon */}
          <Feather name="chevron-right" size={22} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Box 1: Have a nice day box */}
      <TouchableOpacity className="mx-4 mt-8 mb-4 bg-[#FFF2BF] rounded-2xl p-5 flex-row items-center">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            Have a nice Day!
          </Text>
          <Text className="text-gray-700 mt-1">Scan packages to start..</Text>
        </View>
        <View className="ml-4">
          <Image
            source={smallImage}
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Box 2: Cash Received box */}
      <TouchableOpacity className="mx-4 mb-6 bg-white rounded-2xl p-5 border border-gray-200 flex-row items-center"
      onPress={()=> navigation.navigate("Jobs")}
      >
        <View className="flex-row items-center flex-1">
          <Image
            source={moneyImage}
            className="w-20 h-20 mr-4"
            resizeMode="contain"
          />
          <View>
            <Text className="text-sm text-gray-500">Cash Received</Text>
            <Text className="text-xl font-bold text-gray-900">Rs. 0.00</Text>
          </View>
        </View>
        <View className="ml-4">
          {/* Right arrow icon */}
          <View className="w-8 h-8 items-center justify-center">
            <Feather name="chevron-right" size={30} color="#EBEBEB" />
          </View>
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
                  backgroundColor: "#fff",
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
