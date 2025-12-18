import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  PermissionsAndroid,
  StatusBar,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "../common/AlertModal";

type AssignOrderQRNavigationProp = StackNavigationProp<RootStackParamList, "AssignOrderQR">;

interface AssignOrderQRProps {
  navigation: AssignOrderQRNavigationProp;
}

const AssignOrderQR: React.FC<AssignOrderQRProps> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  // Timer states for 4-second timeout
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState<string | React.ReactElement>(
    ""
  );
  const [modalType, setModalType] = useState<"error" | "success">("error");

  useEffect(() => {
    checkCameraPermission();
    startScanAnimation();
    startTimeoutTimer();

    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Start 4-second timeout timer
  const startTimeoutTimer = () => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer for 4 seconds
    timerRef.current = setTimeout(() => {
      if (!scanned && !loading) {
        setModalTitle("Scan Timeout");
        setModalMessage(
          "The QR code is not identified. Please check and try again."
        );
        setModalType("error");
        setShowTimeoutModal(true);
      }
    }, 4000);
  };

  // Reset timer and scanning
  const resetScanning = () => {
    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset states
    setScanned(false);
    setShowTimeoutModal(false);
    setShowErrorModal(false);
    setShowSuccessModal(false);

    // Restart timer
    startTimeoutTimer();
  };

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

  // Extract invoice number from QR data
  const extractInvoiceNumber = (qrData: string): string | null => {
    try {
      console.log("Raw QR Data:", qrData);

      // Method 1: Check if QR contains invoice pattern (INV followed by numbers)
      const invoicePattern = /INV[0-9]+/gi;
      const match = qrData.match(invoicePattern);
      if (match) {
        console.log("Found invoice pattern:", match[0]);
        return match[0];
      }

      // Method 2: Check if QR is JSON containing invoice
      if (qrData.startsWith("{") && qrData.endsWith("}")) {
        try {
          const parsed = JSON.parse(qrData);
          console.log("Parsed JSON:", parsed);
          if (
            parsed.invoiceNo ||
            parsed.invNo ||
            parsed.invoiceNumber ||
            parsed.invoice
          ) {
            const invoice =
              parsed.invoiceNo ||
              parsed.invNo ||
              parsed.invoiceNumber ||
              parsed.invoice;
            console.log("Found invoice in JSON:", invoice);
            return invoice;
          }
        } catch (e) {
          console.log("Not valid JSON");
        }
      }

      // Method 3: Check if it's just the invoice number (alphanumeric, 6-20 chars)
      const simplePattern = /^[A-Z0-9]{6,20}$/;
      if (simplePattern.test(qrData)) {
        console.log("Simple pattern matched:", qrData);
        return qrData;
      }

      // Method 4: Try to extract any alphanumeric code (6+ characters)
      const alphanumericPattern = /[A-Z0-9]{6,}/gi;
      const alphanumericMatches = qrData.match(alphanumericPattern);
      if (alphanumericMatches && alphanumericMatches.length > 0) {
        console.log("Alphanumeric matches:", alphanumericMatches);
        // Return the longest match (likely to be the invoice)
        const longestMatch = alphanumericMatches.reduce((a, b) =>
          a.length > b.length ? a : b
        );
        return longestMatch;
      }

      console.log("No invoice number found in QR data");
      return null;
    } catch (error) {
      console.error("Error extracting invoice:", error);
      return null;
    }
  };

  // API call to assign order
  const assignOrderToDriver = async (invoiceNo: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Construct the full API URL using environment
      const apiUrl = `${environment.API_BASE_URL}api/order/assign-driver-order`;
      console.log("Making API call to:", apiUrl);
      console.log("Invoice:", invoiceNo);
      console.log("Token:", token.substring(0, 20) + "...");

      const response = await axios.post(
        apiUrl,
        {
          invNo: invoiceNo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("API Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error
          throw {
            message: error.response.data?.message || "Failed to assign order",
            status: error.response.status,
            data: error.response.data,
          };
        } else if (error.request) {
          // Request made but no response
          throw new Error("Network error. Please check your connection.");
        } else {
          // Other errors
          throw new Error(error.message || "Failed to assign order");
        }
      } else {
        throw new Error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || loading) return;

    setScanned(true);

    // Clear the 4-second timer when scan is detected
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      // Extract invoice number from QR
      const invoiceNo = extractInvoiceNumber(data);

      if (!invoiceNo) {
        setModalTitle("Invalid QR Code");
        setModalMessage(
          "The scanned QR code does not contain a valid invoice number."
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      console.log("Extracted invoice:", invoiceNo);

      // Call API to assign order
      const result = await assignOrderToDriver(invoiceNo);

      if (result.status === "success") {
        setModalTitle("Successful!");
        // Create rich text with bold invoice number
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
              Order:{" "}
              <Text className="font-bold text-[#000000]">{invoiceNo}</Text> has
              been successfully assigned to you.
            </Text>
          </View>
        );
        setModalType("success");
        setShowSuccessModal(true);
      } else {
        // Set modal title based on the specific error message from backend
        let title = "Error";
        const message = result.message || "Failed to assign order";

        if (message.includes("already in your target list")) {
          title = "Already got this!";
        } else if (
          message.includes("already been assigned to another driver")
        ) {
          title = "Order Unavailable!";
        }

        setModalTitle(title);
        setModalMessage(message);
        setModalType("error");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error("Error processing QR scan:", error);

      // Handle specific error cases
      let title = "Error";
      let message = error.message || "Failed to process QR code";
      let type: "error" | "success" = "error";

      // Set modal title based on the specific error message from backend
      if (message.includes("already in your target list")) {
        title = "Already got this!";
      } else if (message.includes("already been assigned to another driver")) {
        title = "Order Unavailable!";
      } else if (
        message.includes("not found") ||
        message.includes("Invoice number not found")
      ) {
        title = "Invoice Not Found";
        message = "The invoice number was not found in the system.";
      } else if (message.includes("Network error")) {
        title = "Network Error";
        message = "Please check your internet connection and try again.";
      } else if (message.includes("Unauthorized")) {
        title = "Session Expired";
        message = "Please login again to continue.";
      } else if (error.status === 404) {
        title = "Server Error";
        message = "The server endpoint was not found. Please contact support.";
      } else if (error.status === 500) {
        title = "Server Error";
        message = "Internal server error. Please try again later.";
      }

      setModalTitle(title);
      setModalMessage(message);
      setModalType(type);
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
    navigation.goBack();
  };

  const handleTimeoutModalClose = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  const handleTimeoutRescan = () => {
    setShowTimeoutModal(false);
    resetScanning();
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

      {/* Loading Overlays */}
      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 z-50 justify-center items-center">
          <View className="bg-black/80 p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#F7CA21" />
            <Text className="text-white text-lg font-semibold mt-4">
              Assigning Order...
            </Text>
          </View>
        </View>
      )}

      {/* Timeout Modal - Shows after 4 seconds if no scan (with Re-Scan button) */}
      <AlertModal
        visible={showTimeoutModal}
        title="Scan Timeout"
        message="The QR code is not identified. Please check and try again."
        type="error"
        onClose={handleTimeoutModalClose}
        showRescanButton={true}
        onRescan={handleTimeoutRescan}
        duration={4000}
        autoClose={true}
      />

      {/* Error Modal - For API errors (without Re-Scan button) */}
      <AlertModal
        visible={showErrorModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleErrorModalClose}
        showRescanButton={false}
        duration={4000}
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
            {/* Scan Frame with Camera */}
            <View
              style={{
                width: wp(80),
                height: wp(80),
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
                onBarcodeScanned={
                  scanned || loading ? undefined : handleBarCodeScanned
                }
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

export default AssignOrderQR;
