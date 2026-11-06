import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import { MaterialIcons, Ionicons, FontAwesome6 } from "@expo/vector-icons";
import CustomHeader from "@/component/common/CustomHeader";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as ScreenOrientation from "expo-screen-orientation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
const locationImage = require("@/assets/images/orders/location.webp");

type EndJourneyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EndJourneyConfirmation"
>;

type EndJourneyRouteProp = RouteProp<
  RootStackParamList,
  "EndJourneyConfirmation"
>;

interface EndJourneyProps {
  navigation: EndJourneyNavigationProp;
  route: EndJourneyRouteProp;
}

const EndJourneyConfirmation: React.FC<EndJourneyProps> = ({
  navigation,
  route,
}) => {
  const {
    processOrderIds = [],
    allProcessOrderIds = [],
    remainingOrders = [],
    orderData,
    onOrderComplete,
  } = route.params;

  const currentOrderId = processOrderIds[0]; // Single order
  const invoiceNumber = orderData?.processOrder?.invNo || "";

  // Get latitude and longitude from orderData
  const latitude = orderData?.latitude;
  const longitude = orderData?.longitude;
  const address = orderData?.address || "";

  // Payment status state (may be enriched via fallback fetch)
  const [currentOrderData, setCurrentOrderData] = useState(orderData ?? null);

  useEffect(() => {
    // If orderData was not passed (e.g. navigated from OrderDetails quick path), fetch it
    if (!currentOrderData && currentOrderId) {
      (async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;
          const res = await axios.get(
            `${environment.API_BASE_URL}api/order/get-order-user-details`,
            {
              params: { orderIds: currentOrderId, isProcessOrderIds: 1 },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (
            res.data.status === "success" &&
            res.data.data?.orders?.length > 0
          ) {
            setCurrentOrderData(res.data.data.orders[0]);
          }
        } catch (_) {
          // silently ignore – payment card simply won't render
        }
      })();
    }
  }, []);

  // Currency formatter
  const formatCurrency = (val: string | number | null | undefined): string => {
    const num =
      typeof val === "number" ? val : parseFloat((val as string) || "0");
    if (isNaN(num)) return "Rs. 0.00";
    return `Rs. ${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  // Determine payment display
  const paymentMethod =
    currentOrderData?.processOrder?.paymentMethod?.toLowerCase() ?? "";
  const isPaid = currentOrderData?.processOrder?.isPaid ?? false;
  const cashAmountDue = currentOrderData?.processOrder?.cashAmountDue ?? null;
  const pricing = currentOrderData?.pricing ?? null;

  // "Already Paid" when method is not cash AND isPaid flag is true, OR non-cash with no amount due
  const isAlreadyPaid =
    paymentMethod !== "cash" && (isPaid || (cashAmountDue === null && !pricing));

  // Amount to display for collect-cash case
  const amountDue =
    paymentMethod === "cash"
      ? cashAmountDue ?? pricing ?? 0
      : cashAmountDue ?? pricing ?? 0;

  const showPaymentCard = !!currentOrderData?.processOrder;

  // Function to open Google Maps with directions
  const openGoogleMapsNavigation = () => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for navigation.",
      );
      return;
    }

    // Construct the Google Maps navigation URL
    // Using "daddr" for destination address with navigation mode
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving&dir_action=navigate`;

    // Alternative URL format that directly opens in Google Maps app
    const urlAlt = `https://maps.google.com/?q=${latitude},${longitude}`;

    // Check if we can open Google Maps
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Try alternative URL
          return Linking.openURL(urlAlt);
        }
      })
      .catch(() => {
        Alert.alert(
          "Error",
          "Could not open Google Maps. Please make sure Google Maps is installed on your device.",
        );
      });
  };

  const handleHoldOrder = () => {
    navigation.navigate("HoldOrder", {
      orderIds: [currentOrderId],
      allProcessOrderIds,
      remainingOrders,
      onOrderComplete,
    });
  };

  const handleReturnOrder = () => {
    navigation.navigate("OrderReturn", {
      orderIds: [currentOrderId],
      allProcessOrderIds,
      remainingOrders,
      onOrderComplete,
    });
  };

  const [isNavigating, setIsNavigating] = useState(false);

  const handleGetSignature = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigation.navigate("SignatureScreen", {
      processOrderIds: [currentOrderId],
      allProcessOrderIds,
      remainingOrders,
      onOrderComplete,
    });
  };

  // Custom header title with invoice number
  const headerTitle = invoiceNumber
    ? `#${invoiceNumber}`
    : "End of the Journey";

  const handleBackPress = React.useCallback(() => {
    navigation.navigate("OrderDetails", {
      processOrderIds: allProcessOrderIds || remainingOrders || processOrderIds,
    });
  }, [navigation, allProcessOrderIds, remainingOrders, processOrderIds]);

  useFocusEffect(
    React.useCallback(() => {
      setIsNavigating(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      const onBackPress = () => {
        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [handleBackPress])
  );

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title={headerTitle}
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
        onBackPress={handleBackPress}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        {/* Icon Section - Reduced size */}
        <View className="items-center mt-6">
          <Image
            source={locationImage}
            className="w-32 h-32"
            resizeMode="contain"
          />
        </View>

        {/* Trouble Section */}
        <View className="items-center px-4">
          <Text className="text-sm text-[#808080] mb-8">
            Select what happened with the order.
          </Text>

          {/* Hold Order */}
          <TouchableOpacity
            onPress={handleHoldOrder}
            className="w-full mb-4 py-4 rounded-full flex-row justify-center items-center bg-[#FFF2BF]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <FontAwesome5 name="pause" size={24} color="black" />
            <Text className="ml-4 text-base font-semibold text-black">
              Hold Order
            </Text>
          </TouchableOpacity>

          {/* Return Order */}
          <TouchableOpacity
            onPress={handleReturnOrder}
            className="w-full py-4 rounded-full flex-row justify-center items-center bg-[#DFE5F2]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <FontAwesome5 name="undo" size={24} color="black" />
            <Text className="ml-4 text-base font-semibold text-black">
              Return Order
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="items-center my-4 pt-4">
          <Text className="text-black text-lg font-medium">Or..</Text>
        </View>

        {/* Signature Section */}
        <View className="items-center px-4 mb-10">
          <Text className="text-lg font-semibold text-black mb-1">
            Ready to complete the order?
          </Text>
          <Text className="text-xs text-[#808080] mb-6 text-center">
            Collect digital signature to confirm delivery.
          </Text>

          {/* Payment Status Card */}
          {showPaymentCard && (
            <View
              className="w-full mb-4 py-4 px-6 rounded-2xl bg-[#FFFDF0] border border-[#F7CA21] flex-row items-center justify-center"
            >
              {isAlreadyPaid ? (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={26}
                    color="#F7CA21"
                  />
                  <Text className="ml-3 text-lg font-bold text-black">
                    Already Paid!
                  </Text>
                </>
              ) : (
                <>
                  <FontAwesome6 name="coins" size={24} color="#F7CA21" />
                  <Text className="ml-3 text-lg font-bold text-black">
                    {formatCurrency(amountDue)}
                  </Text>
                </>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={handleGetSignature}
            className="w-full py-4 rounded-full bg-[#F7CA21] flex-row items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <MaterialIcons name="draw" size={24} color="black" />
            <Text className="ml-2 text-base font-semibold text-black">
              Get Digital Signature
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center px-4 border-t border-gray-300 pt-6">
          <TouchableOpacity
            onPress={openGoogleMapsNavigation}
            className="w-full py-4 rounded-full bg-[#F7CA21] flex-row items-center justify-center mt-1"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <FontAwesome5 name="map-marked-alt" size={20} color="black" />
            <Text className="ml-2 text-base font-bold text-black">
              Continue to map
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EndJourneyConfirmation;
