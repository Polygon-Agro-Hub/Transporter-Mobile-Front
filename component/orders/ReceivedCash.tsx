import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { AntDesign } from "@expo/vector-icons";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { environment } from "@/environment/environment";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

type ReceivedCashNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReceivedCash"
>;

interface ReceivedCashProps {
  navigation: ReceivedCashNavigationProp;
  route?: any;
}

interface CashItem {
  id: string;
  orderId: number;
  invoNo: string;
  amount: number;
  selected: boolean;
  createdAt?: string;
}

const ReceivedCash: React.FC<ReceivedCashProps> = ({ navigation, route }) => {
  const [cashItems, setCashItems] = useState<CashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchReceivedCash();
    }, [])
  );

  useEffect(() => {
    fetchReceivedCash();
  }, []);

  const fetchReceivedCash = async () => {
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("API Response:", JSON.stringify(response.data, null, 2));

      if (response.data.status === "success") {
        // Filter and format items
        const validItems = (response.data.data || [])
          .filter((item: any) => {
            const hasValidAmount =
              item.amount != null &&
              !isNaN(parseFloat(item.amount)) &&
              parseFloat(item.amount) > 0;
            console.log(
              `Item ${item.id}: amount=${item.amount}, valid=${hasValidAmount}`
            );
            return hasValidAmount;
          })
          .map((item: any) => ({
            id: String(item.id),
            orderId: item.orderId,
            invoNo: item.invoNo || `#${item.orderId}`,
            amount: parseFloat(item.amount),
            selected: false,
            createdAt: item.createdAt,
          }));

        console.log("Valid items:", validItems);
        setCashItems(validItems);
      } else {
        Alert.alert("Error", "Failed to fetch received cash");
      }
    } catch (error: any) {
      console.error("Error fetching received cash:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceivedCash();
  };

  const toggleSelectAll = () => {
    const allSelected = cashItems.every((item) => item.selected);
    setCashItems(
      cashItems.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  const toggleItem = (id: string) => {
    setCashItems(
      cashItems.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Navigate to QR scanner when Hand Over is clicked
  const handleHandOverClick = () => {
    const selectedItems = cashItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one order");
      return;
    }

    // Calculate total amount from selected items
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    // Store selected items in AsyncStorage
    AsyncStorage.setItem("selectedCashItems", JSON.stringify(selectedItems));

    // Navigate to QR scanner
    navigation.navigate("ReceivedCashQR", {
      amount: totalAmount,
      selectedCount: selectedItems.length,
    });
  };

  const allSelected =
    cashItems.length > 0 && cashItems.every((item) => item.selected);
  const anySelected = cashItems.some((item) => item.selected);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-600">Loading received cash...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Received Cash"
        navigation={navigation}
        onBackPress={() => navigation.navigate("Home")}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {cashItems.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-500 text-base">
              No received cash found
            </Text>
          </View>
        ) : (
          <>
            {/* Select All */}
            {/* <TouchableOpacity
              onPress={toggleSelectAll}
              className="flex-row items-center px-4 py-4 border-b border-gray-100"
            >
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                  allSelected
                    ? "bg-black border-black"
                    : "bg-white border-gray-300"
                }`}
              >
                {allSelected && (
                  <AntDesign name="check" size={14} color="#fff" />
                )}
              </View>
              <Text className="text-sm font-medium text-black">Select All</Text>
            </TouchableOpacity> */}
            {/* Select All / Deselect All */}
            {/* Select All / Deselect All */}
            <TouchableOpacity
              onPress={toggleSelectAll}
              className="flex-row items-center px-4 py-4 "
            >
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                  allSelected
                    ? "bg-[#FF0000] border-[#FF0000]"
                    : "bg-white border-gray-300"
                }`}
              >
                {allSelected ? (
                  <AntDesign name="minus" size={14} color="#fff" />
                ) : (
                  <AntDesign name="check" size={14} color="#fff" />
                )}
              </View>
              <Text className="text-sm font-medium text-black underline">
                {allSelected ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>

            {/* Cash Items */}
            <View className="px-4 pb-4 mt-2">
              {cashItems.map((item) => (
                // <TouchableOpacity
                //   key={item.id}
                //   onPress={() => toggleItem(item.id)}
                //   className="flex-row items-center px-4 py-4 bg-white border border-[#A4AAB7] rounded-lg mb-3 shadow-sm"
                //   activeOpacity={0.7}
                // >
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  className="flex-row items-center px-4 py-4 bg-white border border-[#A4AAB7] rounded-lg mb-3"
                  activeOpacity={0.7}
                  style={{
                    shadowColor: "#0000001A",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 3, // For Android
                  }}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                      item.selected
                        ? "bg-black border-[#000000]"
                        : "bg-white border-[#000000]"
                    }`}
                  >
                    {item.selected && (
                      <AntDesign name="check" size={14} color="#fff" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">
                      Order ID : {item.invoNo}
                    </Text>
                    <Text className="text-base font-semibold text-black">
                      Rs. {item.amount.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Hand Over Button */}
      {anySelected && (
        <View className="px-4 py-4 bg-white ">
          <TouchableOpacity
            onPress={handleHandOverClick}
            className="bg-[#F7CA21] py-3 mx-5 rounded-full flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <View className="w-6 h-6 items-center justify-center mr-2">
              <Image
                source={require("@/assets/images/home/handOver.webp")}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-base font-semibold text-black">
              Hand Over
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ReceivedCash;
