import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/component/types";
import { Feather } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import CustomHeader from "@/component/common/CustomHeader";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";

type MyJourneyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyJourney"
>;

type MyJourneyRouteProp = RouteProp<RootStackParamList, "MyJourney">;

interface MyJourneyProps {
  navigation: MyJourneyNavigationProp;
  route: MyJourneyRouteProp;
}

interface TripData {
  id: string;
  name: string;
  time: string;
  count: number;
  status: "Pending" | "Started" | "InProgress" | "Completed";
  address?: string;
  payment?: string;
  distanceToGo?: string;
}

interface OrderDetails {
  orderId: number;
  customerName: string;
  scheduleTime: string;
  packCount: number;
  address: string;
  payment: string;
}

const MyJourney: React.FC<MyJourneyProps> = ({ navigation, route }) => {
  const { orderIds } = route.params;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

  // Simulate trip data from backend (you can replace this with real data)
  const [todoJobs, setTodoJobs] = useState<TripData[]>([
    {
      id: "01",
      name: "Mr. Kusal Dias",
      time: "8:00AM - 2:00PM",
      count: 2,
      status: "Pending",
      address: "11/A, Galle Rd, Dehiwala",
      payment: "Cash : LKR 1,800.00",
      distanceToGo: "2km",
    },
    {
      id: "02",
      name: "Mrs. Anjali Perera",
      time: "2:00PM - 8:00PM",
      count: 1,
      status: "Pending",
      address: "45, Main Street, Colombo 05",
      payment: "Cash : LKR 1,200.00",
      distanceToGo: "3.5km",
    },
  ]);

  // Current active trip
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<
    "not_started" | "starting" | "in_progress"
  >("not_started");

  // Fetch order details when component mounts
  useEffect(() => {
    if (orderIds && orderIds.length > 0) {
      fetchOrderDetails();
    }
    
    // Initialize with first pending trip
    const pendingTrip = todoJobs.find((job) => job.status === "Pending");
    if (pendingTrip) {
      setCurrentTrip(pendingTrip);
    }
  }, [orderIds]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const orderIdsString = Array.isArray(orderIds)
        ? orderIds.join(",")
        : String(orderIds);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/order/get-order-user-details`,
        {
          params: { orderIds: orderIdsString },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        const data = response.data.data;
        if (data.orders && data.orders.length > 0) {
          // Transform API data to match your TripData structure
          const formattedOrders: OrderDetails[] = data.orders.map((order: any, index: number) => ({
            orderId: order.orderId,
            customerName: data.user?.firstName + " " + data.user?.lastName || "Customer",
            scheduleTime: order.sheduleTime || "Not Scheduled",
            packCount: 1, // You might need to adjust this based on your data
            address: data.user?.address || "Address not specified",
            payment: `Cash : ${order.pricing || "0.00"}`,
          }));
          
          setOrders(formattedOrders);
          
          // Update todoJobs with real data
          if (formattedOrders.length > 0) {
            const updatedJobs = formattedOrders.map((order, index) => ({
              id: (index + 1).toString().padStart(2, "0"),
              name: order.customerName,
              time: order.scheduleTime,
              count: order.packCount,
              status: "Pending" as const,
              address: order.address,
              payment: order.payment,
              distanceToGo: `${Math.floor(Math.random() * 5) + 1}km`, // Random distance for demo
            }));
            
            setTodoJobs(updatedJobs);
            setCurrentTrip(updatedJobs[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // Function to start journey
  const handleStartJourney = () => {
    if (!currentTrip) return;

    Alert.alert(
      "Start Journey",
      `Are you sure you want to start journey to ${currentTrip.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            const updatedJobs = todoJobs.map((job) =>
              job.id === currentTrip.id
                ? { ...job, status: "Started" as const }
                : job
            );
            setTodoJobs(updatedJobs);
            setCurrentTrip((prev) =>
              prev ? { ...prev, status: "Started" as const } : null
            );
            setJourneyStatus("starting");
          },
        },
      ]
    );
  };

  // Function to continue journey
  const handleContinueJourney = () => {
    if (!currentTrip) return;

    const updatedJobs = todoJobs.map((job) =>
      job.id === currentTrip.id
        ? { ...job, status: "InProgress" as const }
        : job
    );
    setTodoJobs(updatedJobs);
    setCurrentTrip((prev) =>
      prev ? { ...prev, status: "InProgress" as const } : null
    );
    setJourneyStatus("in_progress");
  };

  // Function to end journey
  const handleEndJourney = () => {
    if (!currentTrip) return;

    // Find next trip
    const currentIndex = todoJobs.findIndex(job => job.id === currentTrip.id);
    const nextTrip = currentIndex < todoJobs.length - 1 ? todoJobs[currentIndex + 1] : null;

    // Mark current trip as completed
    const updatedJobs = todoJobs.map((job) =>
      job.id === currentTrip.id
        ? { ...job, status: "Completed" as const }
        : job
    );
    
    setTodoJobs(updatedJobs);
    
    if (nextTrip) {
      // If there's another trip, move to it
      setCurrentTrip(nextTrip);
      setJourneyStatus("not_started");
    } else {
      // If this was the last trip, navigate to OrderDetailsAfterJourney
      navigation.navigate("OrderDetailsAfterJourney", { orderIds });
      setCurrentTrip(null);
      setJourneyStatus("not_started");
    }
  };

  // Function to navigate directly to OrderDetailsAfterJourney (for testing)
  const handleGoToAfterJourney = () => {
    navigation.navigate("OrderDetailsAfterJourney", { orderIds });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black">
        <CustomHeader
          title="My Journey"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
          dark={true}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#F7CA21" />
          <Text className="text-white mt-4">Loading journey details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CustomHeader
        title="My Journey"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
        dark={true}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: hp("0%") }}>
        {/* MAP IMAGE */}
        <View className="w-full relative">
          <Image
            source={require("@/assets/images/map.png")}
            resizeMode="cover"
            className="rounded-t-3xl h-screen w-full"
          />

          {/* Direction Floating BTN - Only show when journey is in progress */}
          {journeyStatus === "in_progress" && (
            <TouchableOpacity
              className="absolute bottom-4 left-4 bg-[#FFD700] p-3 rounded-full"
              style={{ elevation: 5 }}
            >
              <Feather name="navigation" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM CARD - ABSOLUTE */}
      {currentTrip ? (
        <View className="mx-6">
          <View
            className="absolute w-full pb-4"
            style={{
              bottom: 0,
            }}
          >
            {journeyStatus === "not_started" ? (
              // NOT STARTED VIEW - Next Destination
              <>
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
                  style={{ elevation: 4 }}
                >
                  <View className="flex-row justify-center items-center mb-4">
                    <View>
                      <Text className="text-xs text-black font-semibold">
                        Your Next Destination{" "}
                        <Text className="font-extrabold text-black">
                          ({currentTrip?.distanceToGo || "0 km"})
                        </Text>
                      </Text>
                      <Text className="text-sm text-black mt-1 text-center font-semibold">
                        No: #{currentTrip.id} (Order {currentOrderIndex + 1} of {orders.length})
                      </Text>
                    </View>
                  </View>

                  {/* Start Journey Button */}
                  <TouchableOpacity
                    onPress={handleStartJourney}
                    className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-black">
                      Start Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : journeyStatus === "starting" ? (
              // STARTING VIEW - Continue Journey
              <>
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
                  style={{ elevation: 4 }}
                >
                  <View className="flex-row justify-center items-center mb-4">
                    <View>
                      <Text className="text-xs text-black font-semibold">
                        Your Next Destination{" "}
                        <Text className="font-extrabold text-black">
                          ({currentTrip?.distanceToGo || "0 km"})
                        </Text>
                      </Text>
                      <Text className="text-sm text-black mt-1 text-center font-semibold">
                        No: #{currentTrip.id} (Order {currentOrderIndex + 1} of {orders.length})
                      </Text>
                    </View>
                  </View>

                  {/* Continue Journey Button */}
                  <TouchableOpacity
                    onPress={handleContinueJourney}
                    className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-black">
                      Continue Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // IN PROGRESS VIEW - Full Details with End Journey
              <>
                <View className="bg-[#F7CA21] rounded-full shadow-lg p-3 mb-2 w-10 h-10">
                  <FontAwesome5 name="location-arrow" size={14} color="black" />
                </View>
                {/* ------------ TOP WHITE CARD ------------ */}
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
                  style={{ elevation: 4 }}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-xs text-[#4E4E4E]">
                        {currentTrip.count}{" "}
                        {currentTrip.count === 1 ? "Pack" : "Packs"}
                      </Text>
                      <Text className="text-base font-semibold text-black">
                        {currentTrip.name}
                      </Text>
                    </View>

                    <TouchableOpacity
                      className="bg-[#FFD700] w-12 h-12 rounded-full items-center justify-center"
                      onPress={() => {
                        Alert.alert("Call", `Call ${currentTrip.name}`);
                      }}
                    >
                      <FontAwesome5 name="phone-alt" size={20} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ------------ BOTTOM WHITE CARD ------------ */}
                <View
                  className="bg-white w-full rounded-2xl shadow-lg px-5 pt-4 pb-6"
                  style={{ elevation: 4 }}
                >
                  <Text className="text-sm text-black mb-1 text-center">
                    More{" "}
                    <Text className="text-black font-bold">
                      {currentTrip.distanceToGo?.replace("km", "")}km To Go
                    </Text>
                  </Text>

                  <View className="flex-row items-center mb-2 justify-center">
                    <Entypo name="location-pin" size={18} color="black" />
                    <Text className="text-xs text-black">
                      {currentTrip.address}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-4 justify-center">
                    <FontAwesome5 name="coins" size={14} color="#F7CA21" />
                    <Text className="text-xs text-black ml-2 font-semibold">
                      {currentTrip.payment}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleEndJourney}
                    className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
                  >
                    <Text className="text-base font-semibold text-black">
                      End Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      ) : (
        // No current trip - Show "Go to After Journey" button
        <View className="mx-6">
          <View
            className="absolute w-full pb-4"
            style={{
              bottom: 0,
            }}
          >
            <View
              className="bg-white w-full rounded-2xl shadow-lg px-5 py-4 mb-3"
              style={{ elevation: 4 }}
            >
              <View className="flex-row justify-center items-center mb-4">
                <View>
                  <Text className="text-sm text-black text-center font-semibold">
                    All Orders Completed!
                  </Text>
                  <Text className="text-xs text-gray-600 mt-1 text-center">
                    Ready for scanning {orders.length} order{orders.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Go to After Journey Button */}
              <TouchableOpacity
                onPress={handleGoToAfterJourney}
                className="bg-[#F7CA21] py-4 rounded-full items-center justify-center"
              >
                <Text className="text-base font-semibold text-black">
                  Go to Scanning ({orders.length} orders)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MyJourney;