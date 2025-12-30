import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/component/types";
import { MaterialIcons } from "@expo/vector-icons";
import CustomHeader from "@/component/common/CustomHeader";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
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

  // Function to open Google Maps with directions
  const openGoogleMapsNavigation = () => {
    if (!latitude || !longitude) {
      Alert.alert(
        "Location Not Available",
        "Location coordinates are not available for navigation."
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
          "Could not open Google Maps. Please make sure Google Maps is installed on your device."
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

  const handleGetSignature = () => {
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

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <CustomHeader
          title={headerTitle}
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />

        {/* Icon Section */}
        <View className="items-center my-6">
          <Image
            source={locationImage}
            className="w-40 h-40"
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
            style={{ elevation: 3 }}
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
          >
            <FontAwesome5 name="undo" size={24} color="black" />
            <Text className="ml-4 text-base font-semibold text-black">
              Return Order
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="items-center my-4  pt-4">
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

          <TouchableOpacity
            onPress={handleGetSignature}
            className="w-full py-4 rounded-full bg-[#F7CA21] flex-row items-center justify-center"
          >
            <MaterialIcons name="draw" size={24} color="black" />
            <Text className="ml-2 text-base font-semibold text-black">
              Get Digital Signature
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button - Continue to Map */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          onPress={openGoogleMapsNavigation}
          className="w-full py-4 rounded-full bg-[#F7CA21] flex-row items-center justify-center"
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
    </View>
  );
};

export default EndJourneyConfirmation;
