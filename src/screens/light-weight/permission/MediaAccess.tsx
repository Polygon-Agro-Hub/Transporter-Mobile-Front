import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  BackHandler,
  Linking,
  ScrollView,
  Platform,
  StatusBar,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

type MediaAccessNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MediaAccess"
>;

interface MediaAccessProps {
  navigation?: MediaAccessNavigationProp;
  route?: {
    params?: {
      returnScreen?: keyof RootStackParamList;
    };
  };
  onRequestPermission?: () => Promise<any> | void;
  onPermissionGranted?: () => void;
  onClose?: () => void;
  onNotNow?: () => void;
  returnScreen?: keyof RootStackParamList;
  onBackPress?: () => void;
}

const mediaImage = require("@/assets/images/permission/media.webp");

const MediaAccess: React.FC<MediaAccessProps> = ({
  navigation,
  route,
  onRequestPermission,
  onPermissionGranted,
  onClose,
  onNotNow,
  returnScreen = "Profile",
  onBackPress,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const targetReturnScreen = route?.params?.returnScreen || returnScreen;

  const isScreenTooLong =
    scrollViewHeight > 0 &&
    contentHeight > 0 &&
    scrollViewHeight >= contentHeight + 20;

  const handleDenyOrClose = () => {
    if (onNotNow) {
      onNotNow();
    } else if (onClose) {
      onClose();
    } else if (onBackPress) {
      onBackPress();
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate(targetReturnScreen as any);
    }
  };

  useEffect(() => {
    const handleHardwareBackPress = () => {
      handleDenyOrClose();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBackPress
    );
    return () => subscription.remove();
  }, [navigation, onClose, onNotNow, onBackPress, targetReturnScreen]);

  const requestMediaPermission = async () => {
    setIsLoading(true);
    try {
      let isGranted = false;
      let isDenied = false;

      if (onRequestPermission) {
        const response = await onRequestPermission();
        if (response && typeof response === "object") {
          isGranted = Boolean(response.granted || response.status === "granted");
          isDenied = !isGranted && response.status === "denied";
        } else {
          const check = await ImagePicker.getMediaLibraryPermissionsAsync();
          isGranted = Boolean(check.granted || check.status === "granted");
          isDenied = check.status === "denied";
        }
      } else {
        const current = await ImagePicker.getMediaLibraryPermissionsAsync();
        let status = current.status;
        let granted = current.granted;

        if (!granted && status !== "granted") {
          const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
          status = response.status;
          granted = response.granted;
        }

        isGranted = Boolean(granted || status === "granted");
        isDenied = !isGranted && status === "denied";
      }

      if (isGranted) {
        if (onPermissionGranted) {
          onPermissionGranted();
        } else if (navigation) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(targetReturnScreen as any);
          }
        }
      } else if (isDenied) {
        Alert.alert(
          "Permission Denied",
          "File and media access is required to select photos and documents. Please enable it in settings.",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: handleDenyOrClose,
            },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting media permission:", error);
      Alert.alert(
        "Error",
        "Unable to request media permission. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView
        className="flex-1 px-5"
        onLayout={(e: LayoutChangeEvent) =>
          setScrollViewHeight(e.nativeEvent.layout.height)
        }
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: isScreenTooLong ? "center" : "flex-start",
          paddingBottom: isScreenTooLong
            ? 20
            : Platform.OS === "android"
              ? 75
              : 55,
          paddingTop: isScreenTooLong ? 0 : 20,
        }}
        showsVerticalScrollIndicator={false}
        bounces={!isScreenTooLong}
      >
        <View
          onLayout={(e: LayoutChangeEvent) =>
            setContentHeight(e.nativeEvent.layout.height)
          }
          className="w-full"
        >
          {/* Centered Image */}
          <View className="items-center justify-center mt-2 mb-4">
            <Image
              source={mediaImage}
              className="w-32 h-32"
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Why GoVi-Trans Uses Files & Media
          </Text>

          {/* Intro */}
          <Text className="text-gray-300 text-sm text-center mb-5 leading-5">
            GoVi-Trans requires file and media access to enable the following operational features:
          </Text>

          {/* Feature 1: Profile Picture Customization */}
          <View className="bg-[#1E1E1E] p-4 rounded-xl mb-3 border border-gray-800 flex-row items-start">
            <View className="bg-[#F7CA21]/15 p-2.5 rounded-lg mr-3 mt-0.5 border border-[#F7CA21]/30">
              <MaterialCommunityIcons
                name="image-edit-outline"
                size={24}
                color="#F7CA21"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base mb-1">
                Profile Picture Customization
              </Text>
              <Text className="text-gray-400 text-xs leading-4">
                Select and upload your driver profile photo directly from your device's photo gallery to personalize and verify your account.
              </Text>
            </View>
          </View>

          {/* Feature 2: Proof & Document Attachments */}
          <View className="bg-[#1E1E1E] p-4 rounded-xl mb-4 border border-gray-800 flex-row items-start">
            <View className="bg-[#F7CA21]/15 p-2.5 rounded-lg mr-3 mt-0.5 border border-[#F7CA21]/30">
              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color="#F7CA21"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-base mb-1">
                Proof & Document Attachments
              </Text>
              <Text className="text-gray-400 text-xs leading-4">
                Attach delivery handover photos, return condition proofs, and bank transfer payment slips stored on your device.
              </Text>
            </View>
          </View>

          {/* Privacy Note */}
          <View className="bg-[#1F1E1A] p-3 rounded-lg mb-6 border border-[#F7CA21]/30 flex-row items-start">
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#F7CA21"
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <Text className="text-gray-300 text-xs flex-1 leading-4">
              GoVi-Trans only accesses the specific photos or documents you choose to select. We never browse, collect, or store private personal media without your permission.
            </Text>
          </View>

          {/* Action Buttons */}
          <View
            className={`items-center w-full mt-4 ${
              isScreenTooLong ? "mb-2" : "mb-8"
            }`}
          >
            <TouchableOpacity
              onPress={requestMediaPermission}
              activeOpacity={0.8}
              disabled={isLoading}
              className="w-full mb-3"
              style={{ borderRadius: 999, overflow: "hidden" }}
            >
              <LinearGradient
                colors={["#F7CA21", "#FBBA2F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 52,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialCommunityIcons
                    name="image-multiple-outline"
                    size={20}
                    color="#000000"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-black font-extrabold text-base tracking-wide">
                    {isLoading ? "Requesting..." : "Agree & Continue"}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDenyOrClose}
              activeOpacity={0.7}
              className="py-3 px-6 items-center justify-center"
            >
              <Text className="text-gray-400 font-semibold text-sm">
                Not Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MediaAccess;
