import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import CustomHeader from "@/component/common/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { AlertModal } from "@/component/common/AlertModal";
import socketService, { LoadDeliveredData } from "@/services/socket/socket.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";

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
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const isDeliveredRef = useRef(false);

  const handleDelivered = useCallback(() => {
    if (isDeliveredRef.current) return;
    isDeliveredRef.current = true;
    setShowDeliveredModal(true);
  }, []);

  const handleCloseModal = () => {
    setShowDeliveredModal(false);
    navigation.navigate("Loads");
  };

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

  // Initialize Socket connection and real-time listening
  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      // Connect to socket and join specific load room
      await socketService.connect();
      await socketService.joinLoadRoom(loadCode);

      // Listen for real-time socket load_delivered event
      const unsubscribe = socketService.onLoadDelivered((data: LoadDeliveredData) => {
        const targetCode = data.transferCode || data.loadCode;
        if (targetCode === loadCode) {
          console.log("📦 [LoadQR] Real-time delivery notification received for:", loadCode);
          if (isMounted) {
            handleDelivered();
          }
        }
      });

      // One-time status check on mount in case it was already scanned before opening
      try {
        const token = await AsyncStorage.getItem("token");
        if (token && !isDeliveredRef.current) {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/load/check-status?transferCode=${encodeURIComponent(loadCode)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (
            response.data &&
            response.data.status === "success" &&
            response.data.data?.isDelivered
          ) {
            console.log("📦 [LoadQR] Load status verified as delivered on mount:", loadCode);
            if (isMounted) {
              handleDelivered();
            }
          }
        }
      } catch (err) {
        // Silent catch during initial mount status check
      }

      return () => {
        unsubscribe();
      };
    };

    let cleanupPromise = setupSocket();

    return () => {
      isMounted = false;
      socketService.leaveLoadRoom(loadCode);
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
    };
  }, [loadCode, handleDelivered]);

  return (
    <View className="flex-1 bg-white">
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

      {/* Delivery Success Modal */}
      <AlertModal
        visible={showDeliveredModal}
        title="Successful!"
        type="success"
        message={
          <Text className="text-center text-[#4E4E4E] mb-5 mt-2 text-sm leading-5">
            <Text className="font-extrabold text-black">{loadCode}</Text>
            {"\n"}has been delivered successfully.
          </Text>
        }
        onClose={handleCloseModal}
        duration={3500}
        autoClose={true}
      />
    </View>
  );
};

export default LoadQR;
