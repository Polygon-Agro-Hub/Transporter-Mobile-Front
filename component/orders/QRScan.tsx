import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  PermissionsAndroid,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import AlertModal from "@/component/common/AlertModal";

type QRScanNavigationProp = StackNavigationProp<RootStackParamList, "QRScan">;

interface QRScanProps {
  navigation: QRScanNavigationProp;
}

const QRScan: React.FC<QRScanProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanLineAnim] = useState(new Animated.Value(0));

  // Modal states
  const [showAlreadyReturnedModal, setShowAlreadyReturnedModal] =
    useState(false);
  const [showSuccessfulReturnModal, setShowSuccessfulReturnModal] =
    useState(false);

  useEffect(() => {
    checkCameraPermission();
    startScanAnimation();
  }, []);

  const checkCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        setHasPermission(false);
      }
    } else {
      if (!permission) {
        requestPermission();
      }
      setHasPermission(permission?.granted || false);
    }
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (!scanned) {
      setScanned(true);

      // Check if this order was already returned
      const isAlreadyReturned = data.includes("251201001");

      if (isAlreadyReturned) {
        setShowAlreadyReturnedModal(true);
      } else {
        setShowSuccessfulReturnModal(true);
      }
    }
  };

  const handleAlreadyReturnedClose = () => {
    setShowAlreadyReturnedModal(false);
    setScanned(false);
    // Navigate to ReturnOrders after modal closes
    // navigation.navigate("ReturnOrders");
    navigation.goBack();
  };

  const handleSuccessfulReturnClose = () => {
    setShowSuccessfulReturnModal(false);
    setScanned(false);
    // Navigate to ReturnOrders after modal closes
    //  navigation.navigate("ReturnOrders");
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <View className="bg-black/50 p-8 rounded-full">
          <Ionicons name="camera" size={wp(20)} color="#F7CA21" />
        </View>
        <Text className="text-white text-lg mt-4">
          Requesting camera permission...
        </Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
        <StatusBar barStyle="light-content" />
        <View className="bg-red-500/20 p-6 rounded-full mb-6">
          <Ionicons name="camera" size={wp(15)} color="#EF4444" />
        </View>
        <Text className="text-white text-2xl font-bold mb-3 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-gray-400 text-center mb-8 px-4">
          Please grant camera permission to scan QR codes.
        </Text>
        <TouchableOpacity
          className="bg-[#F7CA21] py-4 px-12 rounded-xl"
          onPress={checkCameraPermission}
        >
          <Text className="text-black font-bold text-base">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, wp(70)],
  });

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />

      {/* Already Returned Modal */}
      <AlertModal
        visible={showAlreadyReturnedModal}
        title="Already Returned!"
        message="You have already returned this order to the centre."
        type="error"
        onClose={handleAlreadyReturnedClose}
        duration={4000}
        autoClose={true}
      />

      {/* Successful Return Modal */}
      <AlertModal
        visible={showSuccessfulReturnModal}
        title="Successful!"
        message="Order: 251201001 has been successfully returned to the centre."
        type="success"
        onClose={handleSuccessfulReturnClose}
        duration={4000}
        autoClose={true}
      />

      <View className="flex-1">
        {/* Semi-transparent overlay */}
        <View className="flex-1 bg-black/50">
          {/* Back Button */}
          <View className="flex-row items-center justify-between px-4 py-3 relative">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="items-start"
            >
              <Entypo
                name="chevron-left"
                size={25}
                color="black"
                style={{
                  backgroundColor: "#F7FAFF",
                  borderRadius: 50,
                  padding: wp(2.5),
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Scan Frame Container */}
          <View className="flex-1 justify-center items-center">
            {/* Scan Frame with Camera */}
            <View
              style={{
                width: wp(70),
                height: wp(70),
                borderRadius: 24,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Camera View inside the frame */}
              <CameraView
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />

              {/* Animated Scan Line */}
              <Animated.View
                style={{
                  width: "100%",
                  height: 3,
                  backgroundColor: "#F7CA21",
                  transform: [{ translateY: scanLineTranslateY }],
                  position: "relative",
                  zIndex: 10,
                }}
              />

              {/* Corner Markers - Top Left */}
              <View
                style={{
                  position: "absolute",
                  top: -3,
                  left: -3,
                  width: 50,
                  height: 50,
                  zIndex: 20,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 12,
                    backgroundColor: "#F7CA21",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 12,
                    height: 38,
                    backgroundColor: "#F7CA21",
                    borderBottomLeftRadius: 20,
                  }}
                />
              </View>

              {/* Corner Markers - Top Right */}
              <View
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 50,
                  height: 50,
                  zIndex: 20,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 12,
                    backgroundColor: "#F7CA21",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 12,
                    height: 38,
                    backgroundColor: "#F7CA21",
                    borderBottomRightRadius: 20,
                    alignSelf: "flex-end",
                  }}
                />
              </View>

              {/* Corner Markers - Bottom Left */}
              <View
                style={{
                  position: "absolute",
                  bottom: -3,
                  left: -3,
                  width: 50,
                  height: 50,
                  zIndex: 20,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 38,
                    backgroundColor: "#F7CA21",
                    borderTopLeftRadius: 20,
                  }}
                />
                <View
                  style={{
                    width: 50,
                    height: 12,
                    backgroundColor: "#F7CA21",
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                />
              </View>

              {/* Corner Markers - Bottom Right */}
              <View
                style={{
                  position: "absolute",
                  bottom: -3,
                  right: -3,
                  width: 50,
                  height: 50,
                  zIndex: 20,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 38,
                    backgroundColor: "#F7CA21",
                    borderTopRightRadius: 20,
                    alignSelf: "flex-end",
                  }}
                />
                <View
                  style={{
                    width: 50,
                    height: 12,
                    backgroundColor: "#F7CA21",
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default QRScan;
