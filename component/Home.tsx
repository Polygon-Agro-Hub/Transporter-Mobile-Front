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
import { Feather } from "@expo/vector-icons";

const scanQRImage = require("@/assets/images/home/scan.png");
const myComplaintImage = require("@/assets/images/home/complaints.png");
const ongoingImage = require("@/assets/images/home/ongoing.png");
const packsImage = require("@/assets/images/home/packs.png");
const returnImage = require("@/assets/images/home/return.png");
const smallImage = require("@/assets/images/home/target.png");
const moneyImage = require("@/assets/images/home/money.png");

type HomeNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface HomeProps {
  navigation: HomeNavigationProp;
}

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

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
      action: () => navigation.navigate("Splash"),
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
      action: () => navigation.navigate("Splash"),
    },
    {
      image: ongoingImage,
      label: "Ongoing",
      color: "#F59E0B",
      action: () => navigation.navigate("Splash"),
    },
    {
      image: returnImage,
      label: "2 Return",
      color: "#F59E0B",
      action: () => navigation.navigate("Splash"),
    },
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
      <View className="bg-white px-6 shadow-sm mt-4">
        <View className="flex-row items-center">
          {/* User Image */}
          <View className="mr-4">
            <Image
              source={require("@/assets/images/home/profile.png")}
              className="w-14 h-14 rounded-full border-2 border-yellow-400"
              resizeMode="cover"
            />
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Hi, Lashan</Text>
          </View>
        </View>
      </View>
      {/* Box 1: Have a nice day box */}
      <TouchableOpacity className="mx-6 mt-8 mb-4 bg-[#FFF2BF] rounded-2xl p-5 flex-row items-center">
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
      <TouchableOpacity className="mx-6 mb-6 bg-white rounded-2xl p-5 border border-gray-200 flex-row items-center">
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
      <View className="px-6 pt-2 pb-6">
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
