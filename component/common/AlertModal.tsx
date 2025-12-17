import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Animated,
  TouchableOpacity,
} from "react-native";
import { FontAwesome5, Ionicons, FontAwesome6 } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

// Alert Modal with multiple button options
interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string | React.ReactNode;
  type?: "success" | "error";
  onClose: () => void;
  showRescanButton?: boolean;
  onRescan?: () => void;
  showOpenOngoingButton?: boolean;
  onOpenOngoing?: () => void;
  duration?: number;
  autoClose?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  type = "error",
  onClose,
  showRescanButton = false,
  onRescan,
  showOpenOngoingButton = false,
  onOpenOngoing,
  duration = 4000,
  autoClose = true,
}) => {
  const loadingBarWidth = new Animated.Value(300);

  useEffect(() => {
    if (visible && autoClose) {
      // Reset bar to full width
      loadingBarWidth.setValue(300);

      Animated.timing(loadingBarWidth, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Auto close modal
      const closeTimer = setTimeout(() => {
        onClose();
      }, duration - 200); // Close slightly before animation ends

      return () => clearTimeout(closeTimer);
    }
  }, [visible, duration, autoClose]);

  // Get content based on type
  const getContent = () => {
    switch (type) {
      case "success":
        return (
          <LottieView
            source={require("@/assets/json/delivery-successful.json")}
            autoPlay
            loop={false}
            style={{ width: 120, height: 120 }}
          />
        );
      case "error":
      default:
        return (
          <LottieView
            source={require("@/assets/json/error.json")}
            autoPlay
            loop={false}
            style={{ width: 120, height: 120 }}
          />
        );
    }
  };

  // Function to render message (handles both string and ReactNode)
  const renderMessage = () => {
    if (typeof message === "string") {
      return (
        <Text className="text-center text-[#4E4E4E] mb-5 mt-2">{message}</Text>
      );
    }
    return message;
  };

  // Determine which title to show
  const getModalTitle = () => {
    if (showOpenOngoingButton) {
      return "Cannot Proceed!";
    }
    return title;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        {/* POPUP CONTAINER */}
        <View className="bg-white p-6 rounded-2xl items-center shadow-lg w-full max-w-md relative">
          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-[#F7FAFF] items-center justify-center"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#000000" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="font-bold text-lg mb-4 text-center">
            {getModalTitle()}
          </Text>

          {/* Icon/Animation - based on type */}
          {getContent()}

          {/* Message - supports rich text */}
          {renderMessage()}

          {/* Button Container */}
          <View className="w-full space-y-3">
            {/* Re-Scan Button (only shown when showRescanButton is true) */}
            {showRescanButton && onRescan && (
              <TouchableOpacity
                onPress={onRescan}
                activeOpacity={0.8}
                className="bg-[#F7CA21] py-3 px-6 rounded-full flex-row items-center justify-center space-x-2 shadow-md"
              >
                <FontAwesome5 name="undo" size={18} color="black" />
                <Text className="text-black font-bold text-base">Re-Scan</Text>
              </TouchableOpacity>
            )}

            {/* Open Ongoing Activity Button (only shown when showOpenOngoingButton is true) */}
            {showOpenOngoingButton && onOpenOngoing && (
              <TouchableOpacity
                onPress={onOpenOngoing}
                activeOpacity={0.8}
                className="bg-[#F7CA21] py-3 px-6 rounded-full flex-row items-center justify-center space-x-2 shadow-md"
              >
                <Text className="text-black font-bold text-base">
                  Open Ongoing Activity
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Loading Bar - only show if autoClose is true */}
          {autoClose && (
            <View
              className="absolute bottom-0 left-0 right-0 h-3"
              style={{
                overflow: "hidden",
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
              }}
            >
              <Animated.View
                className="h-full rounded-b-3xl"
                style={{
                  width: loadingBarWidth,
                  backgroundColor: "#F7CA21",
                }}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};