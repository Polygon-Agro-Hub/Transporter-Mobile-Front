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
import { Entypo, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { AlertModal } from "@/component/common/AlertModal";
import CameraAccess from "@/screens/common/permission/CameraAccess";
import { useFocusEffect } from "@react-navigation/native";

type AssignOrderQRNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AssignOrderQR"
>;

interface AssignOrderQRProps {
  navigation: AssignOrderQRNavigationProp;
}

const AssignOrderQR: React.FC<AssignOrderQRProps> = ({ navigation }) => {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
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

  const isFocusedRef = useRef(true);
  const isProcessingRef = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      isFocusedRef.current = true;
      isProcessingRef.current = false;

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
        isProcessingRef.current = false;

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

    isProcessingRef.current = false;
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

  const extractInvoiceNumber = (qrData: string): string | null => {
    try {
      const invoicePattern = /INV[0-9]+/gi;
      const match = qrData.match(invoicePattern);
      if (match) {
        return match[0];
      }

      if (qrData.startsWith("{") && qrData.endsWith("}")) {
        try {
          const parsed = JSON.parse(qrData);

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

            return invoice;
          }
        } catch (e) {
          // Silent catch for non-JSON QR scan formats
        }
      }

      const simplePattern = /^[A-Z0-9]{6,20}$/;
      if (simplePattern.test(qrData)) {
        return qrData;
      }

      const alphanumericPattern = /[A-Z0-9]{6,}/gi;
      const alphanumericMatches = qrData.match(alphanumericPattern);
      if (alphanumericMatches && alphanumericMatches.length > 0) {
        const longestMatch = alphanumericMatches.reduce((a, b) =>
          a.length > b.length ? a : b,
        );
        return longestMatch;
      }

      return null;
    } catch (error) {
      console.error("Error extracting invoice:", error);
      return null;
    }
  };

  const assignOrderToDriver = async (invoiceNo: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const apiUrl = `${environment.API_BASE_URL}api/order/assign-driver-order`;

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
        },
      );

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
          throw {
            message: error.response.data?.message || "Failed to assign order",
            status: error.response.status,
            data: error.response.data,
          };
        } else if (error.request) {
          throw new Error("Network error. Please check your connection.");
        } else {
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
    if (isProcessingRef.current || scanned || loading || !isFocusedRef.current) return;

    isProcessingRef.current = true;
    setScanned(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const invoiceNo = extractInvoiceNumber(data);

      if (!invoiceNo) {
        setModalTitle("Error!");
        setModalMessage(
          "The QR code is not identified.\nPlease check and try again.",
        );
        setShowRescanButton(true);
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      const result = await assignOrderToDriver(invoiceNo);

      if (result.status === "success") {
        setModalTitle("Successful!");
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
              Order:{" "}
              <Text className="font-bold text-[#000000]">{invoiceNo}</Text> has
              been successfully assigned to you.
            </Text>
          </View>,
        );
        setModalType("success");
        setShowSuccessModal(true);
      } else {
        let title = "Error";
        const message = result.message || "Failed to assign order";

        if (message.includes("already in your target list")) {
          title = "Already got this!";
        } else if (
          message.includes("already been collected") ||
          message.includes("already been assigned to another driver")
        ) {
          title = "Order Unavailable!";
        } else if (
          message.includes("Still processing this order") ||
          message.includes("Scanning will be available")
        ) {
          title = "Order Not Ready!";
        }

        setModalTitle(title);
        setModalMessage(message);
        setModalType("error");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error("Error processing QR scan:", error);

      let title = "Error";
      let message = error.message || "Failed to process QR code";
      let type: "error" | "success" = "error";

      const errorMessage =
        error.response?.data?.message || error.message || message;
      const statusCode = error.response?.status || error.status;
      const currentStatus =
        error.response?.data?.currentStatus || error.data?.currentStatus;

      if (currentStatus === "Return" || currentStatus === "Return Received") {
        title = "Already Returned!";
        message =
          "This order has already been returned to the center and cannot proceed again!";
      } else if (currentStatus === "Ready to Pickup") {
        title = "Cannot Proceed!";
        message =
          "This order is designated for customer pickup. Kindly hand it over to the officers to proceed further.";
      } else if (
        currentStatus === "Delivered" ||
        currentStatus === "Picked up"
      ) {
        title = "Cannot Proceed!";
        message =
          "This order has already been successfully handed over to the customer. Please scan an active order to proceed.";
      } else if (
        statusCode === 409 &&
        (errorMessage.includes("already in your target list") ||
          errorMessage.toLowerCase().includes("already got"))
      ) {
        title = "Already got this!";
        message = errorMessage;
      } else if (
        statusCode === 409 &&
        (errorMessage.includes("already been collected") ||
          errorMessage.includes("already been assigned to another driver") ||
          errorMessage.toLowerCase().includes("collected by another Driver") ||
          errorMessage.toLowerCase().includes("assigned to another") ||
          errorMessage.toLowerCase().includes("Driver id:"))
      ) {
        title = "Order Unavailable!";
        message = errorMessage
          .replace(/officer/gi, "Driver")
          .replace(/Officer ID:/gi, "Driver ID:");
      } else if (
        statusCode === 400 &&
        (errorMessage.includes("Still processing this order") ||
          errorMessage.includes("Scanning will be available") ||
          errorMessage.toLowerCase().includes("not ready") ||
          errorMessage.toLowerCase().includes("processing"))
      ) {
        title = "Order Not Ready!";
        message = errorMessage.includes("Scanning will be available")
          ? errorMessage
          : "Still processing this order. Scanning will be available after it's set to Out For Delivery.";
      } else if (
        statusCode === 404 ||
        errorMessage.includes("not found") ||
        errorMessage.includes("Invoice number not found") ||
        errorMessage.toLowerCase().includes("invalid invoice")
      ) {
        title = "Error!";
        message = "The QR code is not identified. Please check and try again.";
      } else if (
        errorMessage.includes("Network error") ||
        errorMessage.includes("Network Error")
      ) {
        title = "Network Error";
        message = "Please check your internet connection and try again.";
      } else if (statusCode === 401 || errorMessage.includes("Unauthorized")) {
        title = "Session Expired";
        message = "Please login again to continue.";
      } else if (statusCode === 500) {
        title = "Server Error";
        message = "Internal server error. Please try again later.";
      } else if (statusCode === 400) {
        title = "Invalid Request";
        message = errorMessage || "Invalid request. Please try again.";
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
    navigation.navigate("Home");
  };

  const handleTimeoutModalClose = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  const handleTimeoutRescan = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <View className="bg-black/50 p-8 rounded-full">
          <ActivityIndicator size="large" color="#F7CA21" />
        </View>
        <Text className="text-white text-lg mt-4">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <CameraAccess
        navigation={navigation as any}
        onRequestPermission={requestPermission}
        onPermissionGranted={async () => {
          if (getPermission) {
            await getPermission();
          }
        }}
        returnScreen="AssignOrderQR"
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
            <ActivityIndicator size="large" color="#F7CA21" />
            <Text className="text-white text-lg font-semibold mt-4">
              Checking Order...
            </Text>
          </View>
        </View>
      )}

      {/* Timeout Modal - Shows after 15 seconds if no scan (with Re-Scan button) */}
      <AlertModal
        visible={showTimeoutModal}
        title="Scan Timeout"
        message="The QR code could not be detected within the time limit.Please check and try again."
        type="error"
        onClose={handleTimeoutModalClose}
        showRescanButton={true}
        onRescan={handleTimeoutRescan}
        duration={7000}
        autoClose={true}
      />

      {/* Error Modal - For API errors (without Re-Scan button) */}
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
          {/* Scan Frame */}
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
                backgroundColor: "#F7CA21",
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

          {/* Subtitle helper badge */}
          <View className="mt-8 bg-black/60 px-5 py-2.5 rounded-full">
            <Text className="text-white text-xs font-semibold text-center">
              Align the Order QR code within the frame to scan
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default AssignOrderQR;
