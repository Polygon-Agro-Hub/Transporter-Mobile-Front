import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Entypo } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { AlertModal } from "@/component/common/AlertModal";
import CameraAccess from "@/screens/common/permission/CameraAccess";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";

type AssignLoadQRNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AssignLoadQR"
>;

interface AssignLoadQRProps {
  navigation: AssignLoadQRNavigationProp;
}

const PRIMARY_COLOR = "#F7CA21";

const AssignLoadQR: React.FC<AssignLoadQRProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [showRescanButton, setShowRescanButton] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | React.ReactElement>(
    "",
  );
  const [modalType, setModalType] = useState<"error" | "success">("error");
  const [scannedLoadCode, setScannedLoadCode] = useState<string>("");

  const isFocusedRef = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      isFocusedRef.current = true;

      setScanned(false);
      setLoading(false);
      setShowTimeoutModal(false);
      setShowErrorModal(false);
      setShowSuccessModal(false);

      if (permission?.granted) {
        startTimeoutTimer();
      }

      return () => {
        isFocusedRef.current = false;

        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [permission?.granted]),
  );

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }

    startScanAnimation();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (permission?.granted && !scanned && !loading && isFocusedRef.current) {
      startTimeoutTimer();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [permission?.granted, scanned, loading]);

  const startTimeoutTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (!scanned && !loading && isFocusedRef.current) {
        setModalTitle("Scan Timeout");
        setModalMessage(
          "The QR code is not identified. Please check and try again.",
        );
        setShowRescanButton(true);
        setModalType("error");
        setShowTimeoutModal(true);
      }
    }, 15000);
  };

  const resetScanning = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setScanned(false);
    setShowTimeoutModal(false);
    setShowErrorModal(false);
    setShowSuccessModal(false);

    if (isFocusedRef.current) {
      startTimeoutTimer();
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
      ]),
    ).start();
  };

  const extractLoadCode = (qrData: string): string | null => {
    try {
      if (!qrData || typeof qrData !== "string") {
        return null;
      }

      // Check if it's already a clean string format
      const trimmedData = qrData.trim();

      // Check for JSON string format
      if (trimmedData.startsWith("{") && trimmedData.endsWith("}")) {
        try {
          const parsedData = JSON.parse(trimmedData);
          if (parsedData.transferCode) {
            return parsedData.transferCode;
          }
          if (parsedData.loadCode) {
            return parsedData.loadCode;
          }
          if (parsedData.code) {
            return parsedData.code;
          }
        } catch (jsonError) {
          // If JSON parsing fails, continue to other patterns
        }
      }

      // Check for L-DRV pattern (e.g., L-DRV00001260911001)
      const loadCodePattern = /L-DRV\d+/i;
      const match = trimmedData.match(loadCodePattern);
      if (match) {
        return match[0].toUpperCase();
      }

      // Check for plain format (e.g., DRV00001260911001)
      const plainPattern = /DRV\d+/i;
      const plainMatch = trimmedData.match(plainPattern);
      if (plainMatch) {
        return `L-${plainMatch[0].toUpperCase()}`;
      }

      return null;
    } catch (error) {
      console.error("Error extracting load code:", error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || loading || !isFocusedRef.current) return;

    setScanned(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const loadCode = extractLoadCode(data);

      if (!loadCode) {
        setModalTitle("Error!");
        setModalMessage(
          "The QR code is not identified. Please check and try again.",
        );
        setShowRescanButton(true);
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setModalTitle("Error!");
        setModalMessage("Authentication token not found. Please login again.");
        setShowRescanButton(true);
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      // Validate QR with backend
      const response = await axios.post(
        `${environment.API_BASE_URL}api/load/validate-load-qr`,
        { transferCode: loadCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      setLoading(false);

      if (response.data && response.data.status === "success") {
        setScannedLoadCode(loadCode);
        setScanned(false);
        // Navigate directly to LoadSummary screen
        navigation.navigate("LoadSummary", {
          loadCode: loadCode,
          mode: "accept",
        });
      } else {
        const errorMsg =
          response.data?.message || "Failed to validate Load QR code";
        setModalTitle("Error!");
        setModalMessage(errorMsg);
        setShowRescanButton(false);
        setModalType("error");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setLoading(false);
      console.error("Error processing QR scan:", error);

      const responseData = error.response?.data;
      const errorMessage =
        responseData?.message ||
        error.message ||
        "Failed to process QR code. Please try again.";

      setModalTitle("Error!");
      setModalMessage(errorMessage);
      setShowRescanButton(false);
      setModalType("error");
      setShowErrorModal(true);
    }
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    resetScanning();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setScanned(false);
    navigation.navigate("LoadSummary", {
      loadCode: scannedLoadCode,
      mode: "accept",
    });
  };

  const handleTimeoutModalClose = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  const handleTimeoutRescan = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  // Show loading while permission is being checked
  if (!permission) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <View className="bg-black/50 p-8 rounded-full">
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
        <Text className="text-white text-lg mt-4">Loading camera...</Text>
      </View>
    );
  }

  // Show permission denied screen
  if (!permission.granted) {
    return (
      <CameraAccess
        navigation={navigation as any}
        onRequestPermission={requestPermission}
        onClose={() => navigation.goBack()}
      />
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, wp(70)],
  });

  return (
    <View className="flex-1">
      {/* Loading Overlays */}
      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 z-50 justify-center items-center">
          <View className="bg-black/80 p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text className="text-white text-lg font-semibold mt-4">
              Validating Load...
            </Text>
          </View>
        </View>
      )}

      {/* Timeout Modal */}
      <AlertModal
        visible={showTimeoutModal}
        title="Scan Timeout"
        message="The QR code could not be detected within the time limit. Please check and try again."
        type="error"
        onClose={handleTimeoutModalClose}
        showRescanButton={true}
        onRescan={handleTimeoutRescan}
        duration={7000}
        autoClose={true}
      />

      {/* Error Modal */}
      <AlertModal
        visible={showErrorModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleErrorModalClose}
        showRescanButton={showRescanButton}
        onRescan={resetScanning}
        duration={7000}
        autoClose={true}
      />

      {/* Success Modal */}
      <AlertModal
        visible={showSuccessModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleSuccessModalClose}
        showRescanButton={false}
        duration={7000}
        autoClose={true}
      />

      {/* Full-Screen Camera View */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={
          scanned || loading ? undefined : handleBarCodeScanned
        }
      />

      {/* Dark overlay with clear scan frame in center */}
      <View className="flex-1 bg-black/35">
        {/* Top Header with Back Button */}
        <View className="flex-row items-center justify-between px-4 py-3 relative">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="items-start"
            disabled={loading}
          >
            <Entypo
              name="chevron-left"
              size={25}
              color="black"
              style={{
                backgroundColor: loading ? "#666" : "#F7FAFF",
                borderRadius: 50,
                padding: wp(2.5),
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Scan Frame Container */}
        <View className="flex-1 justify-center items-center">
          <View
            style={{
              width: wp(80),
              height: wp(80),
              borderRadius: 24,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Animated Yellow Scan Line */}
            <Animated.View
              style={{
                width: "100%",
                height: 3,
                backgroundColor: PRIMARY_COLOR,
                transform: [{ translateY: scanLineTranslateY }],
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                opacity: scanned || loading ? 0 : 1,
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
                  backgroundColor: PRIMARY_COLOR,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              />
              <View
                style={{
                  width: 12,
                  height: 38,
                  backgroundColor: PRIMARY_COLOR,
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
                  backgroundColor: PRIMARY_COLOR,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              />
              <View
                style={{
                  width: 12,
                  height: 38,
                  backgroundColor: PRIMARY_COLOR,
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
                  backgroundColor: PRIMARY_COLOR,
                  borderTopLeftRadius: 20,
                }}
              />
              <View
                style={{
                  width: 50,
                  height: 12,
                  backgroundColor: PRIMARY_COLOR,
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
                  backgroundColor: PRIMARY_COLOR,
                  borderTopRightRadius: 20,
                  alignSelf: "flex-end",
                }}
              />
              <View
                style={{
                  width: 50,
                  height: 12,
                  backgroundColor: PRIMARY_COLOR,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
              />
            </View>
          </View>

          {/* Subtitle helper badge */}
          <View className="mt-8 bg-black/60 px-5 py-2.5 rounded-full">
            <Text className="text-white text-xs font-semibold text-center">
              Align the Load QR code within the frame to scan
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AssignLoadQR;
