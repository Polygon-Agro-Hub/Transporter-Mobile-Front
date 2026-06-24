import React from "react";
import { View, Text } from "react-native";
import LottieView from "lottie-react-native";

interface NoDataProps {
  text: string;
}

const NoData: React.FC<NoDataProps> = ({ text }) => {
  return (
    <View className="flex-1 justify-center items-center py-10 w-full min-h-[350px]">
      <LottieView
        source={require("@/assets/json/no-data.json")}
        autoPlay
        loop
        style={{ width: 160, height: 160 }}
      />
      <Text className="text-[#7A9BC9] text-base text-center mt-[-3] px-4">
        {text}
      </Text>
    </View>
  );
};

export default NoData;