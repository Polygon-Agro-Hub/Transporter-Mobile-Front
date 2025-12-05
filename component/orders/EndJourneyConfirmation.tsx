import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { Feather } from "@expo/vector-icons";
import CustomHeader from "@/component/common/CustomHeader";
import Foundation from "@expo/vector-icons/Foundation";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const locationImage = require("@/assets/images/orders/location.webp");

type EndJourneyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EndJourneyConfirmation"
>;

interface EndJourneyProps {
  navigation: EndJourneyNavigationProp;
}

const EndJourneyConfirmation: React.FC<EndJourneyProps> = ({ navigation }) => {
  const handleHoldOrder = () => {
    console.log("Hold Order pressed");
  };

  const handleReturnOrder = () => {
    console.log("Return Order pressed");
  };

  const handleGetSignature = () => {
    console.log("Get Digital Signature");
    // navigation.navigate("DigitalSignature");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <CustomHeader
          title="End of the Journey"
          showBackButton={true}
          showLanguageSelector={false}
          navigation={navigation}
        />

        {/* Icon Section */}
        <View className="items-center mb-6">
          <Image
            source={locationImage}
            className="w-40 h-40"
            resizeMode="contain"
          />
        </View>

        {/* Trouble Section */}
        <View className="items-center px-6">
          <Text className="text-xl font-semibold text-black mb-1">
            Having trouble?
          </Text>
          <Text className="text-xs text-[#808080] mb-8">
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
            <Foundation name="refresh" size={24} color="black" />
            <Text className="ml-4 text-base font-semibold text-black">
              Return Order
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="items-center my-8 border-t border-[#DFE5F2] pt-4">
          <Text className="text-black text-lg font-medium">Or..</Text>
        </View>

        {/* Signature Section */}
        <View className="items-center px-6 mb-10">
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
            <Feather name="edit" size={18} color="#000" />
            <Text className="ml-2 text-base font-semibold text-black">
              Get Digital Signature
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EndJourneyConfirmation;
