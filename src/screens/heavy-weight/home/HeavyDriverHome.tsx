import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { useSelector } from "react-redux";
import { selectUserProfile } from "@/store/authSlice";
import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import HeavyHomeSkeleton from "@/component/common/HeavyHomeSkeleton";

const scanQRImage = require("@/assets/images/home/scan.webp");
const myComplaintImage = require("@/assets/images/home/complaints.webp");
const packsImage = require("@/assets/images/home/packs.webp");
const ongoingImage = require("@/assets/images/home/ongoing.webp");

type HeavyDriverHomeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "HeavyDriverHome"
>;

interface HeavyDriverHomeProps {
  navigation: HeavyDriverHomeNavigationProp;
}

const HeavyDriverHome: React.FC<HeavyDriverHomeProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loadsCount, setLoadsCount] = useState(0);
  const [ongoingLoadsCount, setOngoingLoadsCount] = useState(0);
  const [ongoingLoadCode, setOngoingLoadCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userProfile = useSelector(selectUserProfile);

  const fetchLoadsData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${environment.API_BASE_URL}api/load/get-driver-loads`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data
      ) {
        const todoLoads = response.data.data.todoLoads || [];
        setLoadsCount(todoLoads.length);

        // Find ongoing loads (journeyStatus = "Start")
        const ongoingLoads = todoLoads.filter(
          (load: any) => load.journeyStatus === "Start",
        );
        setOngoingLoadsCount(ongoingLoads.length);

        if (ongoingLoads.length > 0) {
          setOngoingLoadCode(ongoingLoads[0].loadCode || null);
        } else {
          setOngoingLoadCode(null);
        }
      }
    } catch (error) {
      console.warn("Could not fetch heavy driver loads:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLoadsData();
    }, [fetchLoadsData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoadsData();
    setRefreshing(false);
  }, [fetchLoadsData]);

  const buttons = [
    {
      image: scanQRImage,
      label: "Scan Load QR",
      color: "#3B82F6",
      action: () => {
        navigation.navigate("AssignLoadQR");
      },
      disabled: false,
    },
    {
      image: packsImage,
      label: `${loadsCount} ${loadsCount === 1 ? "Load" : "Loads"}`,
      color: "#10B981",
      action: () => {
        navigation.navigate("Loads");
      },
      disabled: loadsCount === 0,
    },
    {
      image: myComplaintImage,
      label: "My Complaints",
      color: "#8B5CF6",
      action: () => {
        navigation.navigate("ComplaintsList");
      },
      disabled: false,
    },
    ...(ongoingLoadsCount > 0
      ? [
          {
            image: ongoingImage,
            label: "Ongoing",
            color: "#FFF2BF",
            action: () => {
              if (ongoingLoadCode) {
                navigation.navigate("LoadSummary", {
                  loadCode: ongoingLoadCode,
                  mode: "journey",
                });
              } else {
                navigation.navigate("Loads");
              }
            },
            disabled: false,
          },
        ]
      : []),
  ];

  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const buttonRows = chunkArray(buttons, 2);

  if (loading && !refreshing) {
    return <HeavyHomeSkeleton />;
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
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
      {/* Profile Header */}
      <View className="bg-white px-4 mt-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center flex-1 mr-3"
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
              className="w-14 h-14 rounded-full border-2 border-yellow-400"
              resizeMode="cover"
            />
          </View>

          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Hi, {userProfile?.firstName || "User"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* QR Code Lottie Button */}
        <TouchableOpacity
          className="w-14 h-14 rounded-full justify-center items-center overflow-hidden"
          activeOpacity={0.8}
          onPress={() => navigation.navigate("MyQRCode")}
        >
          <LottieView
            source={require("@/assets/json/heavyweight-driver/home/scan-qr-code.json")}
            autoPlay
            loop
            style={{ width: 34, height: 34 }}
          />
        </TouchableOpacity>
      </View>

      {/* Action Buttons Grid */}
      <View className="px-4 pt-6 pb-6">
        {buttonRows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between mb-4">
            {row.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={button.disabled ? undefined : button.action}
                activeOpacity={button.disabled ? 1 : 0.7}
                disabled={button.disabled}
                style={{
                  width: "48%",
                  backgroundColor:
                    button.label === "Ongoing" ? button.color : "#fff",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  ...(button.disabled
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
                }}
              >
                <View className="w-28 h-28 rounded-lg justify-center items-center mb-3 overflow-hidden">
                  <Image
                    source={button.image}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>

                <View className="flex-row items-center justify-center">
                  {button.label === "Ongoing" && (
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
                  <Text className="text-sm font-bold text-gray-800 text-center">
                    {button.label}
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

export default HeavyDriverHome;
