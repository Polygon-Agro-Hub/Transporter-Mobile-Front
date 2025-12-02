// components/AlertModal.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" ;
  onClose: () => void;
  duration?: number; 
  autoClose?: boolean; 
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  type = "error",
  onClose,
  duration = 3000,
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

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return require("@/assets/success.webp"); 
      case "error":
      default:
        return require("@/assets/Alert.webp");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        {/* POPUP CONTAINER */}
        <View className="bg-white p-6 rounded-2xl items-center shadow-lg relative w-11/12 mx-10">
          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-[#F7FAFF] items-center justify-center"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#000000" />
          </TouchableOpacity>

          {/* Title */}
          <Text className="items-center font-bold text-lg mb-4 text-center">
            {title}
          </Text>

          {/* Icon - based on type */}
          <Image
            source={getIcon()}
            className="w-24 h-24"
            resizeMode="contain"
          />

          {/* Message */}
          <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
            {message}
          </Text>

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

export default AlertModal;