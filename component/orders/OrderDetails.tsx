import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
  Platform,
  Animated,
  StatusBar,
  BackHandler,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome6,
  FontAwesome,
} from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "@/component/common/AlertModal";
import { formatScheduleTime } from "@/utils/formatScheduleTime";
import LoadingPage from "../common/LoadingPage";

type OrderDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "OrderDetails"
>;

type OrderDetailsRouteProp = RouteProp<RootStackParamList, "OrderDetails">;

interface OrderDetailsProp {
  navigation: OrderDetailsNavigationProp;
  route: OrderDetailsRouteProp;
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
  billingName: string;
  billingTitle: string;
  billingPhoneCode: string;
  billingPhone: string;
  billingPhoneCode2: string | null;
  billingPhone2: string | null;
  buildingType: string;
  deliveryMethod: string;
}

interface ProcessOrder {
  id: number;
  invNo: string;
  paymentMethod: string;
  amount: string;
  isPaid: boolean;
  status: string;
}

interface OrderItem {
  orderId: number;
  sheduleTime: string;
  fullName: string;
  title: string;
  phonecode1: string;
  phone1: string;
  phonecode2: string | null;
  phone2: string | null;
  longitude: string | null;
  latitude: string | null;
  address: string;
  processOrder: ProcessOrder;
  pricing: string;
}

interface OrderDetailsResponse {
  user: UserDetails;
  orders: OrderItem[];
}

const formatAddressWithLabels = (address: string) => {
  if (!address || address === "Address not specified") {
    return address;
  }

  const parts = address.split(", ");

  const labelMappings: { [key: string]: string } = {
    "B.No": "B.No :",
    "B.Name": "B.Name :",
    "Unit.No": "F.No :",
    "Floor.No": "Floor.No :",
    "House.No": "House.No :",
    Street: "Street :",
    City: "City :",
  };

  return parts.map((part, index) => {
    for (const [key, label] of Object.entries(labelMappings)) {
      if (part.startsWith(key)) {
        const value = part.substring(key.length).trim();

        const cleanValue = value.startsWith(":")
          ? value.substring(1).trim()
          : value;

        return (
          <Text key={index}>
            <Text style={{ color: "#5E6982" }}>{label} </Text>
            <Text style={{ color: "#000000" }}>{cleanValue}</Text>
            {index < parts.length - 1 ? ", " : ""}
          </Text>
        );
      }
    }

    // If no label found, return as black text
    return (
      <Text key={index} style={{ color: "#000000" }}>
        {part}
        {index < parts.length - 1 ? ", " : ""}
      </Text>
    );
  });
};

const OrderDetails: React.FC<OrderDetailsProp> = ({ navigation, route }) => {
  const { processOrderIds = [] } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startingJourney, setStartingJourney] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as "success" | "error",
    showOpenOngoingButton: false,
    ongoingProcessOrderIds: [] as number[],
  });

  const prevProcessOrderIdsRef = useRef<number[]>([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const hasParamsChanged =
      JSON.stringify(processOrderIds) !==
      JSON.stringify(prevProcessOrderIdsRef.current);

    if (hasParamsChanged) {
      fetchOrderUserDetails();
      prevProcessOrderIdsRef.current = processOrderIds;
    }
  }, [processOrderIds]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchOrderUserDetails();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (orders.length > 0) {
      const timeText = getScheduleTimeDisplay();
      const textLength = timeText.length;

      if (textLength > 15) {
        const scrollDistance = textLength * 8;

        Animated.loop(
          Animated.sequence([
            Animated.delay(1000),
            Animated.timing(scrollX, {
              toValue: -scrollDistance,
              duration: textLength * 200,
              useNativeDriver: true,
            }),
            Animated.timing(scrollX, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }
    }

    return () => {
      scrollX.setValue(0);
    };
  }, [orders]);

  const fetchOrderUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      if (!processOrderIds || processOrderIds.length === 0) {
        throw new Error("No process order IDs provided");
      }

      const processOrderIdsString = Array.isArray(processOrderIds)
        ? processOrderIds.join(",")
        : String(processOrderIds);

      const response = await axios.get(
        `${environment.API_BASE_URL}api/order/get-order-user-details`,
        {
          params: {
            orderIds: processOrderIdsString,
            isProcessOrderIds: 1,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.status === "success") {
        const data: OrderDetailsResponse = response.data.data;

        if (!data.user || !data.orders || data.orders.length === 0) {
          throw new Error("No data found");
        }

        const getScheduleTimePriority = (time: string) => {
          if (!time) return 999;

          const lowerTime = time.toLowerCase();

          if (
            lowerTime.includes("8:00") ||
            lowerTime.includes("8 am") ||
            lowerTime.includes("8:00am") ||
            lowerTime.includes("8:00 am") ||
            lowerTime.includes("morning") ||
            lowerTime.includes("early")
          ) {
            return 1;
          }

          if (
            lowerTime.includes("2:00") ||
            lowerTime.includes("2 pm") ||
            lowerTime.includes("2:00pm") ||
            lowerTime.includes("2:00 pm") ||
            lowerTime.includes("afternoon") ||
            lowerTime.includes("evening") ||
            lowerTime.includes("late")
          ) {
            return 2;
          }

          const match = time.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
          if (match) {
            let hour = parseInt(match[1], 10);
            const period = match[2].toUpperCase();

            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;

            return hour;
          }

          return 999;
        };

        const sortedOrders = [...data.orders].sort((a, b) => {
          const priorityA = getScheduleTimePriority(a.sheduleTime);
          const priorityB = getScheduleTimePriority(b.sheduleTime);

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          return a.orderId - b.orderId;
        });

        setUserDetails(data.user);
        setOrders(sortedOrders);

        const completed = sortedOrders
          .filter(
            (order) =>
              order.processOrder.status.toLowerCase() === "completed" ||
              order.processOrder.status.toLowerCase() === "return",
          )
          .map((order) => order.processOrder.id);

        setCompletedOrders(completed);

        const pendingOrders = sortedOrders.filter(
          (order) => !completed.includes(order.processOrder.id),
        );

        if (pendingOrders.length > 0 && completed.length > 0) {
          setShowContinueButton(true);
        } else {
          setShowContinueButton(false);
        }
      } else {
        throw new Error(
          response.data.message || "Failed to fetch order details",
        );
      }
    } catch (error: any) {
      console.error("Error fetching order user details:", error);
      setError("Failed to load order details. Please try again.");

      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenOngoingActivity = () => {
    setAlertModal({
      ...alertModal,
      visible: false,
    });

    const ongoingIds = alertModal.ongoingProcessOrderIds;

    if (ongoingIds && ongoingIds.length > 0) {
      navigation.replace("OrderDetails", {
        processOrderIds: ongoingIds,
      });
    } else {
      navigation.navigate("EndJourneyConfirmation", {
        processOrderIds: processOrderIds,
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderUserDetails();
  };

  const handlePhoneCall = (phoneCode: string, phoneNumber: string) => {
    if (phoneCode && phoneNumber) {
      const phone = `${phoneCode}${phoneNumber}`;
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenLocation = (
    latitude: string | null,
    longitude: string | null,
    address?: string,
  ) => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for this order.",
      );
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Error",
        "Could not open Google Maps. Please make sure it is installed.",
      );
    });
  };

  const formatCurrency = (amount: string) => {
    if (!amount) return "Rs. 0.00";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "Rs. 0.00";
    return `Rs. ${numAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const getFullName = () => {
    if (!userDetails) return "Customer";

    const { title, firstName, lastName } = userDetails;
    return (
      `${title || ""}. ${firstName || ""} ${lastName || ""}`.trim() ||
      "Customer"
    );
  };

  const getTotalPackCount = () => {
    return orders.length;
  };

  const getScheduleTimeDisplay = () => {
    if (!orders || orders.length === 0) return "Not Scheduled";

    const firstOrder = orders[0];
    return firstOrder?.sheduleTime || "Not Scheduled";
  };

  const getJourneyButtonText = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "todo") {
      return "Start Journey";
    }

    if (normalizedStatus === "on the way") {
      return "Continue";
    }

    if (normalizedStatus === "hold") {
      return "Restart Journey";
    }

    return "Start Journey";
  };

  const isButtonEnabled = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    return (
      normalizedStatus === "todo" ||
      normalizedStatus === "on the way" ||
      normalizedStatus === "hold"
    );
  };

  const getCardStyle = (status: string) => {
    const normalizedStatus = status?.toLowerCase();

    if (
      normalizedStatus === "todo" ||
      normalizedStatus === "completed" ||
      normalizedStatus === "hold"
    ) {
      return {
        backgroundColor: "#FFFFFF",
        borderColor: "#A4AAB7",
        borderWidth: 1,
      };
    }

    return {
      backgroundColor: "#FFF2BF",
      borderColor: "#F7CA21",
      borderWidth: 1,
    };
  };

  const findOrdersWithSameLocation = (orderId: number) => {
    const currentOrder = orders.find((order) => order.orderId === orderId);
    if (!currentOrder || !currentOrder.longitude || !currentOrder.latitude) {
      return [currentOrder];
    }

    return orders.filter(
      (order) =>
        order.longitude === currentOrder.longitude &&
        order.latitude === currentOrder.latitude,
    );
  };

  const goToLoadingAndMap = (targetOrder: OrderItem) => {
    const remainingOrders = orders
      .filter((o) => o.processOrder.id !== targetOrder.processOrder.id)
      .map((o) => o.processOrder.id);

    navigation.navigate("OrderDetailsLoadingScreen", {
      processOrderIds: [targetOrder.processOrder.id],
      allProcessOrderIds: processOrderIds,
      remainingOrders,
      orderData: targetOrder,
      onOrderComplete: (completedId: number) => {
        handleOrderComplete(completedId);
      },
      latitude: targetOrder.latitude,
      longitude: targetOrder.longitude,
      address: targetOrder.address,
    });
  };

  const handleStartJourneyForOrder = async (orderId: number) => {
    try {
      setStartingJourney(orderId.toString());
      setError(null);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const currentOrder = orders.find((order) => order.orderId === orderId);
      if (!currentOrder || !currentOrder.processOrder?.id) {
        throw new Error("Order not found");
      }

      const processOrderId = currentOrder.processOrder.id;
      const currentStatus = currentOrder.processOrder.status.toLowerCase();
      const latitude = currentOrder.latitude;
      const longitude = currentOrder.longitude;
      const address = currentOrder.address;

      if (currentStatus === "on the way") {
        goToLoadingAndMap(currentOrder);
        return;
      }

      if (currentStatus === "hold") {
        const payload = {
          orderIds: processOrderId.toString(),
          isProcessOrderIds: 1,
        };

        const response = await axios.post(
          `${environment.API_BASE_URL}api/order/re-start-journey`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data.status === "success") {
          setOrders((prevOrders) =>
            prevOrders.map((order) => {
              if (order.processOrder.id === processOrderId) {
                return {
                  ...order,
                  processOrder: { ...order.processOrder, status: "On the Way" },
                };
              }
              return order;
            }),
          );

          const updatedOrder = {
            ...currentOrder,
            processOrder: {
              ...currentOrder.processOrder,
              status: "On the Way",
            },
          };
          goToLoadingAndMap(updatedOrder);
          return;
        } else {
          throw new Error(response.data.message || "Failed to restart journey");
        }
        return;
      }

      const payload = {
        orderIds: processOrderId.toString(),
        isProcessOrderIds: 1,
      };

      const response = await axios.post(
        `${environment.API_BASE_URL}api/order/start-journey`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.status === "success") {
        setOrders((prevOrders) =>
          prevOrders.map((order) => {
            if (order.processOrder.id === processOrderId) {
              return {
                ...order,
                processOrder: { ...order.processOrder, status: "On the Way" },
              };
            }
            return order;
          }),
        );

        const updatedOrder = {
          ...currentOrder,
          processOrder: { ...currentOrder.processOrder, status: "On the Way" },
        };
        goToLoadingAndMap(updatedOrder);
      } else {
        throw new Error(response.data.message || "Failed to start journey");
      }
    } catch (error: any) {
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to start journey";
      const hasOngoingActivity =
        errorMessage.includes("ongoing activity") ||
        errorMessage.includes("ongoing") ||
        errorMessage.includes("Ongoing");

      const ongoingProcessOrderIds =
        error.response?.data?.ongoingProcessOrderIds || [];

      if (hasOngoingActivity) {
        setAlertModal({
          visible: true,
          title: "Already Have Active Journey",
          message: errorMessage,
          type: "error",
          showOpenOngoingButton: true,
          ongoingProcessOrderIds: ongoingProcessOrderIds,
        });
      } else {
        setAlertModal({
          visible: true,
          title: "Error",
          message: errorMessage,
          type: "error",
          showOpenOngoingButton: false,
          ongoingProcessOrderIds: [],
        });
      }
    } finally {
      setStartingJourney(null);
    }
  };

  const handleOrderComplete = (completedId: number) => {
    setCompletedOrders((prev) => {
      const newCompleted = [...prev, completedId];

      // Check if all orders are completed
      const allOrderIds = orders.map((order) => order.processOrder.id);
      const allCompleted = allOrderIds.every((id) => newCompleted.includes(id));

      if (!allCompleted) {
        setShowContinueButton(true);
      }

      return newCompleted;
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Jobs");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const hasOnTheWayOrder = () => {
    return orders.some(
      (order) => order.processOrder.status.toLowerCase() === "on the way",
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <CustomHeader
          title="Order Details"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
        />
        <LoadingPage message="Loading Order Details..." fullScreen={true} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <CustomHeader
          title="Order Details"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
        />
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={60} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg mt-4 text-center">
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchOrderUserDetails}
            className="mt-6 bg-[#F7CA21] py-3 px-6 rounded-full"
          >
            <Text className="text-black font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!userDetails || orders.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <CustomHeader
          title="Order Details"
          navigation={navigation}
          showBackButton={true}
          showLanguageSelector={false}
        />
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">No order details available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <CustomHeader
        title="Order Details"
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.navigate("Jobs")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F7CA21"]}
            tintColor="#F7CA21"
          />
        }
      >
        {/* Avatar and User Details */}
        <View className="items-center mt-4">
          {userDetails.image ? (
            <Image
              source={{ uri: userDetails.image }}
              className="w-20 h-20 rounded-full"
              defaultSource={require("@/assets/images/auth/profilecustomer.webp")}
            />
          ) : (
            <Image
              source={require("@/assets/images/auth/profilecustomer.webp")}
              className="w-20 h-20 rounded-full"
            />
          )}
          <Text className="text-lg font-bold mt-4 max-w-[90%] text-center">
            {getFullName()}
          </Text>

          {userDetails.address &&
            userDetails.address !== "Address not specified" && (
              <View className="flex-row mt-1 max-w-[90%] justify-center text-center">
                <Text className="text-base max-w-[90%] text-center">
                  <Ionicons name="location-sharp" size={18} color="black" />
                  {formatAddressWithLabels(userDetails.address)}
                </Text>
                =
              </View>
            )}
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between mt-6">
          <View className="w-[48%] rounded-xl bg-[#F3F3F3] p-3 items-center">
            <FontAwesome6 name="bag-shopping" size={30} color="black" />
            <Text className="mt-2 text-md font-semibold text-center">
              {getTotalPackCount()}{" "}
              {getTotalPackCount() === 1 ? "Pack" : "Packs"}
            </Text>
          </View>

          <View className="w-[48%] rounded-xl bg-[#F3F3F3] p-3 items-center">
            <Ionicons name="time" size={30} color="black" />
            <View className="mt-2 max-w-full overflow-hidden">
              <Animated.Text
                className="text-md font-semibold whitespace-nowrap"
                style={{
                  transform: [{ translateX: scrollX }],
                }}
                numberOfLines={1}
              >
                {formatScheduleTime(getScheduleTimeDisplay())}
              </Animated.Text>
            </View>
          </View>
        </View>

        {/* Orders List */}
        <View className="mt-6 gap-y-4">
          {orders.map((order, index) => {
            const hasPhone2 = order.phonecode2 && order.phone2;
            const hasLocation = order.latitude && order.longitude;
            const status = order.processOrder.status;
            const normalizedStatus = status.toLowerCase();
            const isCompleted =
              normalizedStatus === "completed" || normalizedStatus === "return";
            const isTodo = normalizedStatus === "todo";
            const isOnTheWay = normalizedStatus === "on the way";
            const isHold = normalizedStatus === "hold";

            const buttonText = getJourneyButtonText(status);
            const isButtonActive = isButtonEnabled(status);

            const shouldDisableButton =
              (!isOnTheWay && hasOnTheWayOrder()) ||
              isCompleted ||
              !isButtonActive;

            // ✅ Must be inside the map callback where `order` is in scope
            const sameLocationOrders = findOrdersWithSameLocation(
              order.orderId,
            );
            const showSameLocationNotice = sameLocationOrders.length > 1;

            return (
              <View
                key={`${order.orderId}-${index}`}
                style={getCardStyle(status)}
                className="rounded-xl p-4"
              >
                {/* Header with Invoice, Name and Status */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="font-bold text-sm text-black">
                      #{order.processOrder.invNo || "N/A"}
                    </Text>
                    <Text className="font-bold text-base mt-2">
                      {order.title || ""}. {order.fullName || "Customer"}
                    </Text>
                  </View>
                </View>

                {/* Schedule Time */}
                <View className="flex-row justify-between">
                  <View className="flex-row items-center mb-4">
                    <Ionicons name="time" size={16} color="#000" />
                    <Text className="ml-2 text-sm text-black">
                      {formatScheduleTime(order.sheduleTime)}
                    </Text>
                  </View>

                  {/* Payment Info */}
                  <View className="flex-row items-center mb-4">
                    {order.processOrder.isPaid ? (
                      <FontAwesome
                        name="check-circle"
                        size={16}
                        color="#F7CA21"
                      />
                    ) : (
                      <FontAwesome6 name="coins" size={16} color="#F7CA21" />
                    )}
                    <Text className="ml-2 text-sm text-black">
                      {order.processOrder.isPaid ? (
                        <Text className="text-black">Already Paid!</Text>
                      ) : (
                        <Text>{formatCurrency(order.pricing)}</Text>
                      )}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View className="flex-row justify-between items-center mb-4">
                  {/* Phone 1 Button */}
                  <TouchableOpacity
                    className="items-center"
                    onPress={() =>
                      handlePhoneCall(order.phonecode1, order.phone1)
                    }
                    disabled={isCompleted}
                  >
                    <View className="w-12 h-12 rounded-full items-center justify-center bg-[#F7CA21]">
                      <Ionicons name="call" size={24} color="black" />
                    </View>
                    <Text className="mt-2 font-semibold">Num 1</Text>
                  </TouchableOpacity>

                  {/* Phone 2 Button (only if available) */}
                  {hasPhone2 && (
                    <TouchableOpacity
                      className="items-center"
                      onPress={() =>
                        order.phone2 &&
                        handlePhoneCall(order.phonecode2!, order.phone2!)
                      }
                      disabled={isCompleted}
                    >
                      <View className="w-12 h-12 rounded-full items-center justify-center bg-[#F7CA21]">
                        <Ionicons name="call" size={24} color="black" />
                      </View>
                      <Text className="mt-2 font-semibold">Num 2</Text>
                    </TouchableOpacity>
                  )}

                  {/* Location Button - Updated to open menu */}
                  <TouchableOpacity
                    className="items-center"
                    onPress={() =>
                      handleOpenLocation(order.latitude, order.longitude)
                    }
                    disabled={isCompleted}
                  >
                    <View className="w-12 h-12 rounded-full items-center justify-center relative bg-[#F7CA21]">
                      <Ionicons name="location-sharp" size={24} color="black" />
                    </View>
                    <Text className="mt-2 font-semibold">Location</Text>
                  </TouchableOpacity>
                </View>

                {/* Journey Button */}
                <TouchableOpacity
                  className={`rounded-full py-3 items-center ${
                    !shouldDisableButton ? "bg-[#F7CA21]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: !shouldDisableButton ? 0.2 : 0,
                    shadowRadius: 5,
                    elevation: !shouldDisableButton ? 4 : 0,
                  }}
                  onPress={() => handleStartJourneyForOrder(order.orderId)}
                  disabled={
                    startingJourney === order.orderId.toString() ||
                    shouldDisableButton
                  }
                >
                  {startingJourney === order.orderId.toString() ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text
                      className="text-base font-bold"
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                    >
                      {buttonText}
                    </Text>
                  )}
                </TouchableOpacity>
                {showSameLocationNotice && (
                  <View className="w-full items-center mt-2 mb-1">
                    <Text className="text-xs text-[#898989] font-medium text-center">
                      All orders are for exact same location
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        autoClose={false}
        onClose={() => setAlertModal({ ...alertModal, visible: false })}
        showOpenOngoingButton={alertModal.showOpenOngoingButton}
        onOpenOngoing={
          alertModal.showOpenOngoingButton
            ? handleOpenOngoingActivity
            : undefined
        }
      />
    </View>
  );
};

export default OrderDetails;
