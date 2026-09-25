import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  BackHandler,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { useFocusEffect } from "@react-navigation/native";
import NoDataScreen from "@/component/common/NoDataScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";

type LoadsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Loads"
>;

interface LoadsScreenProps {
  navigation: LoadsScreenNavigationProp;
}

interface LoadItem {
  id: string; // e.g. "#01"
  loadId: number;
  loadCode: string; // e.g. "L-DRV00025260916001"
  destination: string; // e.g. "Colombo - Colombo"
  status: "todo" | "delivered";
  journeyStatus?: string; // e.g. "End"
  totalWeightKg?: number;
  totalCrates?: number;
  totalItemsCount?: number;
}

const Loads: React.FC<LoadsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"todo" | "delivered">("todo");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todoLoads, setTodoLoads] = useState<LoadItem[]>([]);
  const [deliveredLoads, setDeliveredLoads] = useState<LoadItem[]>([]);

  const fetchLoads = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/load/get-driver-loads`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("data", response.data.data);

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.data
      ) {
        const { todoLoads: fetchedTodo, deliveredLoads: fetchedDelivered } =
          response.data.data;
        setTodoLoads(fetchedTodo || []);
        setDeliveredLoads(fetchedDelivered || []);
      }
    } catch (error) {
      console.warn("Could not fetch loads:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLoads();
    }, [fetchLoads]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoads();
  }, [fetchLoads]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("HeavyDriverHome");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const formatCount = (count: number) => {
    return count === 0 ? "0" : count.toString().padStart(2, "0");
  };

  const dataToShow = activeTab === "todo" ? todoLoads : deliveredLoads;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <CustomHeader
        title="Loads"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.navigate("HeavyDriverHome")}
      />

      {/* Tabs (To Do & Delivered) */}
      <View className="mt-2 bg-white relative">
        <View
          className="mt-2 bg-white relative"
          style={{
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflow: "hidden",
          }}
        >
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab("todo")}
              className={`
              flex-1 flex-row items-center justify-center gap-x-2 
              ${activeTab === "todo" ? "bg-[#F6F9FF]" : ""}
              py-3
            `}
              activeOpacity={0.8}
            >
              <View className="w-7 h-7 rounded-full bg-black justify-center items-center">
                <Text className="text-white font-bold text-xs">
                  {formatCount(todoLoads.length)}
                </Text>
              </View>
              <Text
                className={`text-md ${
                  activeTab === "todo"
                    ? "font-bold text-black"
                    : "font-medium text-gray-700"
                }`}
              >
                To Do
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("delivered")}
              className={`
              flex-1 flex-row items-center justify-center gap-x-2 
              ${activeTab === "delivered" ? "bg-[#F6F9FF]" : ""}
              py-3
            `}
              activeOpacity={0.8}
            >
              <View className="w-7 h-7 rounded-full bg-black justify-center items-center">
                <Text className="text-white font-bold text-xs">
                  {formatCount(deliveredLoads.length)}
                </Text>
              </View>
              <Text
                className={`text-md ${
                  activeTab === "delivered"
                    ? "font-bold text-black"
                    : "font-medium text-gray-700"
                }`}
              >
                Delivered
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom-only shadow */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: Platform.OS === "android" ? 3 : 1,
              backgroundColor: "#fff",
              ...(Platform.OS === "ios"
                ? {
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                  }
                : { elevation: 4 }),
            }}
          />
        </View>

        {Platform.OS === "ios" && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 1,
              backgroundColor: "#fff",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          />
        )}
      </View>

      {/* Loading state */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F7CA21" />
        </View>
      ) : dataToShow.length > 0 ? (
        /* Loads List */
        <ScrollView
          className="flex-1 mt-6 px-5"
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
          {dataToShow.map((item, index) => {
            const isDelivered =
              activeTab === "delivered" || item.status === "delivered";

            if (isDelivered) {
              return (
                <View
                  key={index}
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    backgroundColor: "#FFFFFF",
                  }}
                  className="px-5 py-4 mb-4"
                >
                  <Text className="text-xs font-bold text-gray-800 mb-1">
                    {item.id}
                  </Text>
                  <Text className="text-sm font-extrabold text-black mb-1">
                    {item.loadCode}
                  </Text>
                  <Text className="text-xs font-normal text-gray-600">
                    To : {item.destination}
                  </Text>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.journeyStatus === "End") {
                    navigation.navigate("LoadQR", {
                      loadCode: item.loadCode,
                    });
                  } else {
                    navigation.navigate("LoadSummary", {
                      loadCode: item.loadCode,
                      mode: "journey",
                    });
                  }
                }}
                style={[
                  {
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    backgroundColor: "#FFFFFF",
                  },
                  {
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 3,
                    elevation: 3,
                  },
                ]}
                className="px-5 py-4 mb-4"
              >
                <Text className="text-xs font-bold text-gray-800 mb-1">
                  {item.id}
                </Text>
                <Text className="text-sm font-extrabold text-black mb-1">
                  {item.loadCode}
                </Text>
                <Text className="text-xs font-normal text-gray-600">
                  To : {item.destination}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#F7CA21"]}
              tintColor="#F7CA21"
            />
          }
        >
          <NoDataScreen
            text={`-- No ${activeTab === "todo" ? "To Do" : "Delivered"} Loads Yet --`}
          />
        </ScrollView>
      )}
    </View>
  );
};

export default Loads;
