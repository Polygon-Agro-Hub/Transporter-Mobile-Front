import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  BackHandler,
  StatusBar,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { useFocusEffect } from "@react-navigation/native";

type LoadsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Loads"
>;

interface LoadsScreenProps {
  navigation: LoadsScreenNavigationProp;
}

interface LoadItem {
  id: string; // e.g. "#01"
  loadCode: string; // e.g. "L-DRV00001260911001"
  destination: string; // e.g. "Colombo Distribution Centre"
  status: "todo" | "delivered";
}

const MOCK_TODO_LOADS: LoadItem[] = [
  {
    id: "#01",
    loadCode: "L-DRV00001260911001",
    destination: "Colombo Distribution Centre",
    status: "todo",
  },
  {
    id: "#02",
    loadCode: "L-DRV00001260911001",
    destination: "Colombo Distribution Centre",
    status: "todo",
  },
];

const MOCK_DELIVERED_LOADS: LoadItem[] = [];

const Loads: React.FC<LoadsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<"todo" | "delivered">("todo");
  const [refreshing, setRefreshing] = useState(false);
  const [todoLoads, setTodoLoads] = useState<LoadItem[]>(MOCK_TODO_LOADS);
  const [deliveredLoads, setDeliveredLoads] =
    useState<LoadItem[]>(MOCK_DELIVERED_LOADS);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

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
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

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
          className="flex-row"
          style={Platform.OS === "android" ? { elevation: 5 } : undefined}
        >
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
                activeTab === "todo" ? "font-bold text-black" : "font-medium text-gray-700"
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
                activeTab === "delivered" ? "font-bold text-black" : "font-medium text-gray-700"
              }`}
            >
              Delivered
            </Text>
          </TouchableOpacity>
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

      {/* Loads List */}
      {dataToShow.length > 0 ? (
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
          {dataToShow.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate("LoadSummary", {
                  loadCode: item.loadCode,
                  mode: "journey",
                });
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
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-400 text-base font-medium">
            No {activeTab === "todo" ? "to do" : "delivered"} loads available
          </Text>
        </View>
      )}
    </View>
  );
};

export default Loads;
