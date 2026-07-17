import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Entypo from "@expo/vector-icons/Entypo";

interface CameraPermissionViewProps {
  onRequestPermission: () => void;
  onBack?: () => void;
}

export const CameraPermissionView: React.FC<CameraPermissionViewProps> = ({
  onRequestPermission,
  onBack,
}) => {
  return (
    <View className="flex-1 bg-black px-4">
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          className="self-start mt-3"
          activeOpacity={0.7}
        >
          <Entypo
            name="chevron-left"
            size={30}
            color="white"
            style={{
              backgroundColor: "#1F1F1F",
              borderRadius: 50,
              padding: 8,
            }}
          />
        </TouchableOpacity>
      )}

      {/* Main Content Area */}
      <View className="flex-1 justify-center items-center px-2 -mt-10">
        {/* Camera Image from permission folder */}
        <View className="mb-8">
          <Image
            source={require("@/assets/images/permission/camera.png")}
            className="w-44 h-44"
            resizeMode="contain"
          />
        </View>

        <Text className="text-white text-3xl font-extrabold mb-3 text-center tracking-wide">
          Camera Access
        </Text>

        <Text className="text-gray-400 text-center mb-10 px-6 text-base leading-6">
          Enable access to the camera to take photos.
        </Text>

        <TouchableOpacity
          className="w-full max-w-xs rounded-full overflow-hidden"
          onPress={onRequestPermission}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#FBBA2F", "#F6D630"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center justify-center"
          >
            <Text className="text-black font-extrabold text-lg tracking-wider">
              Allow
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CameraPermissionView;
