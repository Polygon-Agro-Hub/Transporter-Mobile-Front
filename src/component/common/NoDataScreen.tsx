import React from "react";
import { View, Text } from "react-native";
import LottieView from "lottie-react-native";

interface NoDataScreenProps {
  text: string;
}

const NoDataScreen: React.FC<NoDataScreenProps> = ({ text }) => {
  return (
    <View className="justify-center items-center w-full">
      <LottieView
        source={require("@/assets/json/no-data.json")}
        autoPlay
        loop
        style={{ width: 160, height: 160 }}
      />
      <Text className="text-[#7A9BC9] text-base text-center font-medium  px-4">
        {text}
      </Text>
    </View>
  );
};

export default NoDataScreen;
export { NoDataScreen };