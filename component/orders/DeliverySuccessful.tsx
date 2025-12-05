import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import LottieView from "lottie-react-native";
import { RootStackParamList } from "@/component/types";

const successAnimation = require("@/assets/json/delivery-successful.json");

type DeliverySuccessfulNavigationProp = StackNavigationProp<
  RootStackParamList,
  "DeliverySuccessful"
>;

interface DeliverySuccessfulProps {
  navigation: DeliverySuccessfulNavigationProp;
}

const DeliverySuccessful: React.FC<DeliverySuccessfulProps> = ({
  navigation,
}) => {
  const handleContinue = () => {
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* Lottie Success Animation */}
        <LottieView
          source={successAnimation}
          autoPlay
          loop={true}
          style={{ width: 200, height: 200, marginBottom: 24 }}
        />

        {/* Success Message */}
        <View className="items-center mb-10">
          <Text className="text-2xl font-bold text-black mb-2 text-center">
            Great Job!
          </Text>
          <Text className="text-base text-[#4E4E4E] mb-1 text-center">
            The delivery was completed successfully.
          </Text>
          <Text className="text-base text-[#4E4E4E] mb-6 text-center">
            Thank you for your hard work and reliable service.
          </Text>

          {/* Continue Button */}
          <View className="items-center px-6 mt-10">
            <TouchableOpacity
              onPress={handleContinue}
              className="min-w-full py-4 rounded-full bg-[#F7CA21]"
            >
              <Text className="text-base font-semibold text-black text-center">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeliverySuccessful;
