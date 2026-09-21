import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";

interface LoadingPageProps {
  message?: string;
  containerStyle?: StyleProp<ViewStyle>;
  messageStyle?: StyleProp<ViewStyle>;
  size?: "small" | "large" | number;
  color?: string;
  fullScreen?: boolean;
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  message,
  containerStyle,
  messageStyle,
  size = "large",
  color = "#F7CA21",
  fullScreen = false,
}) => {
  return (
    <View
      className={`${fullScreen ? "flex-1" : ""} justify-center items-center bg-white`}
      style={[
        fullScreen ? { minHeight: 300 } : { paddingVertical: 40 },
        containerStyle,
      ]}
    >
      <ActivityIndicator size={size} color={color} />
      <Text className="mt-4 text-[#F7CA21] text-center" style={messageStyle}>
        {message || "Loading..."}
      </Text>
    </View>
  );
};

export default LoadingPage;
