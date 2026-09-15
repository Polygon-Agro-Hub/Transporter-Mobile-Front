import React from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

type LoadQRNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LoadQR"
>;

type LoadQRRouteProp = RouteProp<RootStackParamList, "LoadQR">;

interface LoadQRProps {
  navigation: LoadQRNavigationProp;
  route: LoadQRRouteProp;
}

const LoadQR: React.FC<LoadQRProps> = ({ navigation, route }) => {
  const loadCode = route.params?.loadCode || "L-DRV00001260914001";

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Loads");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header with Load Code as Title */}
      <CustomHeader
        title={loadCode}
        navigation={navigation}
        showBackButton={true}
        showLanguageSelector={false}
        onBackPress={() => navigation.navigate("Loads")}
      />

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Prompt Banner */}
        <View
          className="w-full rounded-2xl p-4 flex-row items-center mb-8"
          style={{ backgroundColor: "#17262C" }}
        >
          <View className="mr-3 p-2 border-r border-gray-600">
            <Ionicons name="qr-code" size={32} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold mb-1">
              Scan QR Immediately
            </Text>
            <Text className="text-gray-300 text-xs font-normal">
              Show this QR to the relevant officer.
            </Text>
          </View>
        </View>

        {/* QR Code Container with Yellow Border */}
        <View className="items-center justify-center mb-8">
          <View
            className="bg-white p-6 rounded-3xl items-center justify-center"
            style={{
              borderWidth: 2,
              borderColor: "#FFE066",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <QRCode
              value={loadCode}
              size={240}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Info / Notice Footer Box */}
        <View className="w-full bg-[#F5F7FA] rounded-2xl p-4 flex-row items-center border border-gray-100">
          <View className="mr-3 p-1.5 border-r border-gray-300">
            <View className="w-7 h-7 rounded-full bg-black items-center justify-center">
              <Text className="text-white font-extrabold text-sm">!</Text>
            </View>
          </View>
          <Text className="flex-1 text-xs text-gray-700 font-medium leading-4">
            Please scan the QR immediately to avoid delays in load assignment.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LoadQR;
