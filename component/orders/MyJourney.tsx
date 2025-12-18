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
  orderId?: number;
  processOrderId?: number;
  marketOrderId?: number;
}

interface OrderDetails {
  orderId: number;
  processOrderId?: number;
  marketOrderId?: number;
  customerName: string;
  scheduleTime: string;
  packCount: number;
  address: string;
  payment: string;
  status?: string;
}

interface UserDetails {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  image: string | null;
  address: string;
}

interface OrderItem {
  orderId: number;
  processOrderId?: number;
  marketOrderId?: number;
  sheduleTime: string;
  pricing: string;
  status?: string;
}

interface APIResponse {
  user: UserDetails;
  orders: OrderItem[];
}

const MyJourney: React.FC<MyJourneyProps> = ({ navigation, route }) => {
  // Extract all parameters from route
  const { 
    orderIds, 
    processOrderIds = [], 
    primaryProcessOrderId,
    marketOrderIds = [] 
  } = route.params;
  
  console.log("Received in MyJourney:", {
    orderIds,
    processOrderIds,
    primaryProcessOrderId,
    marketOrderIds
  });
  
  // Use processOrderIds if available, otherwise fall back to orderIds
  const activeOrderIds = processOrderIds.length > 0 ? processOrderIds : orderIds;
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

  // Simulate trip data from backend (you can replace this with real data)
  const [todoJobs, setTodoJobs] = useState<TripData[]>([]);

  // Current active trip
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<
    "not_started" | "starting" | "in_progress"
  >("not_started");

  // Fetch order details when component mounts
  useEffect(() => {
    if (activeOrderIds && activeOrderIds.length > 0) {
      fetchOrderDetails();
    }
  }, [activeOrderIds]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const orderIdsString = Array.isArray(activeOrderIds)
        ? activeOrderIds.join(",")
        : String(activeOrderIds);

      console.log("Fetching order details with IDs:", orderIdsString);

      // Add parameter to indicate if these are process order IDs
      const isProcessOrder = processOrderIds.length > 0;
      
      const response = await axios.get(
        `${environment.API_BASE_URL}api/order/get-order-user-details`,
        {
          params: { 
            orderIds: orderIdsString,
            isProcessOrderIds: isProcessOrder ? 1 : 0 
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === "success") {
        const data: APIResponse = response.data.data;
        
        if (data.user) {
          setUserDetails(data.user);
        }
        
        if (data.orders && data.orders.length > 0) {
          // Transform API data to match your OrderDetails structure
          const formattedOrders: OrderDetails[] = data.orders.map((order: OrderItem, index: number) => {
            // Determine the correct order ID based on what was passed
            const orderId = isProcessOrder ? 
              (order.processOrderId || order.orderId) : 
              order.orderId;
            
            const marketOrderId = marketOrderIds[index] || order.marketOrderId;
            const processOrderId = isProcessOrder ? 
              (processOrderIds[index] || order.processOrderId) : 
              undefined;
            
            return {
              orderId: orderId,
              processOrderId: processOrderId,
              marketOrderId: marketOrderId,
              customerName: data.user?.firstName + " " + data.user?.lastName || "Customer",
              scheduleTime: order.sheduleTime || "Not Scheduled",
              packCount: 1, // You might need to adjust this based on your data
              address: data.user?.address || "Address not specified",
              payment: order.pricing ? `Cash : ${order.pricing}` : "Cash : 0.00",
              status: order.status || "Pending",
            };
          });
          
          setOrders(formattedOrders);
          
          // Update todoJobs with real data
          if (formattedOrders.length > 0) {
            const updatedJobs = formattedOrders.map((order, index) => ({
              id: (index + 1).toString().padStart(2, "0"),
              name: order.customerName,
              time: order.scheduleTime,
              count: order.packCount,
              status: order.status === "Hold" ? "Pending" : 
                     order.status === "InProgress" ? "InProgress" as const :
                     order.status === "Completed" ? "Completed" as const :
                     "Pending" as const,
              address: order.address,
              payment: order.payment,
              distanceToGo: `${Math.floor(Math.random() * 5) + 1}km`, // Random distance for demo
              orderId: order.orderId,
              processOrderId: order.processOrderId,
              marketOrderId: order.marketOrderId,
            }));
            
            setTodoJobs(updatedJobs);
            
            // Find first non-completed trip
            const firstPendingTrip = updatedJobs.find((job) => 
              job.status === "Pending" || job.status === "InProgress"
            );
            
            if (firstPendingTrip) {
              setCurrentTrip(firstPendingTrip);
              setCurrentOrderIndex(updatedJobs.findIndex(job => job.id === firstPendingTrip.id));
              
              // Set journey status based on trip status
              if (firstPendingTrip.status === "InProgress") {
                setJourneyStatus("in_progress");
              } else {
                setJourneyStatus("not_started");
              }
            }
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
      setCurrentOrderIndex(currentIndex + 1);
      setJourneyStatus("not_started");
    } else {
      // If this was the last trip, navigate to OrderDetailsAfterJourney
      navigation.navigate("OrderDetailsAfterJourney", { 
        orderIds: activeOrderIds,
        processOrderIds: processOrderIds,
        primaryProcessOrderId: primaryProcessOrderId,
        marketOrderIds: marketOrderIds
      });
      setCurrentTrip(null);
      setJourneyStatus("not_started");
    }
  };

  // Function to navigate directly to OrderDetailsAfterJourney (for testing)
  const handleGoToAfterJourney = () => {
    navigation.navigate("OrderDetailsAfterJourney", { 
      orderIds: activeOrderIds,
      processOrderIds: processOrderIds,
      primaryProcessOrderId: primaryProcessOrderId,
      marketOrderIds: marketOrderIds
    });
  };

  // Handle phone call
  const handlePhoneCall = () => {
    if (userDetails?.phoneCode && userDetails?.phoneNumber) {
      const phoneNumber = `${userDetails.phoneCode}${userDetails.phoneNumber}`;
      Alert.alert(
        "Call Customer",
        `Do you want to call ${userDetails.firstName} ${userDetails.lastName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Call",
            onPress: () => {
              // You would use Linking.openURL here
              // Linking.openURL(`tel:${phoneNumber}`);
              Alert.alert("Calling", `Would call: ${phoneNumber}`);
            },
          },
        ]
      );
    }
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
                      <Text className="text-xs text-gray-500 text-center">
                        Order ID: {currentTrip.orderId}
                        {currentTrip.processOrderId && ` | Process Order: ${currentTrip.processOrderId}`}
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
                      <Text className="text-xs text-gray-500 text-center">
                        Order ID: {currentTrip.orderId}
                        {currentTrip.processOrderId && ` | Process Order: ${currentTrip.processOrderId}`}
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
                      <Text className="text-xs text-gray-500">
                        Order ID: {currentTrip.orderId}
                        {currentTrip.processOrderId && ` | Process Order: ${currentTrip.processOrderId}`}
                      </Text>
                    </View>

                    <TouchableOpacity
                      className="bg-[#FFD700] w-12 h-12 rounded-full items-center justify-center"
                      onPress={handlePhoneCall}
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
                  {primaryProcessOrderId && (
                    <Text className="text-xs text-gray-500 text-center">
                      Primary Process Order ID: {primaryProcessOrderId}
                    </Text>
                  )}
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