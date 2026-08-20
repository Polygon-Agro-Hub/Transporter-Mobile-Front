import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { AlertModal } from "../common/AlertModal";
import { CameraPermissionView } from "../common/CameraPermissionView";
import { useFocusEffect } from "@react-navigation/native";

type ReturnOrderQRNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReturnOrderQR"
>;

type ReturnOrderQRRouteProp = RouteProp<RootStackParamList, "ReturnOrderQR">;

interface ReturnOrderQRProps {
  navigation: ReturnOrderQRNavigationProp;
  route: ReturnOrderQRRouteProp;
}

const ReturnOrderQR: React.FC<ReturnOrderQRProps> = ({ navigation, route }) => {
  const { orderId } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState<string | React.ReactElement>(
    "",
  );
  const [modalType, setModalType] = useState<"error" | "success">("error");

  const [scannedInvoices, setScannedInvoices] = useState<string[]>([]);
  const [orderInvoiceNumber, setOrderInvoiceNumber] = useState<string>("");

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
    // Fetch order details to get invoice number
    fetchOrderDetails();
  }, [orderId]);

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

  // Fetch order details to get the invoice number
  const fetchOrderDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/return/get-driver-return-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.status === "success") {
        const orders = response.data.data.returnOrders;
        const currentOrder = orders.find(
          (order: any) => order.orderId === orderId,
        );

        if (currentOrder) {
          setOrderInvoiceNumber(currentOrder.invoiceNumber);
        } else {
          setModalTitle("Order Not Found");
          setModalMessage("Unable to find the order details.");
          setModalType("error");
          setShowErrorModal(true);
        }
      }
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      setModalTitle("Error");
      setModalMessage("Failed to load order details. Please try again.");
      setModalType("error");
      setShowErrorModal(true);
    }
  };

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

  const extractInvoiceNumber = (qrData: string): string | null => {
    try {
      // Method 1: Check if QR contains invoice pattern (INV followed by numbers)
      const invoicePattern = /INV[0-9]+/gi;
      const match = qrData.match(invoicePattern);
      if (match) {
        return match[0];
      }

      // Method 2: Check if QR is JSON containing invoice
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

      // Method 3: Check if it's just the invoice number (alphanumeric, 6-20 chars)
      const simplePattern = /^[A-Z0-9]{6,20}$/;
      if (simplePattern.test(qrData)) {
        return qrData;
      }

      // Method 4: Try to extract any alphanumeric code (6+ characters)
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

  // API call to update return order to "Return Received"
  const updateReturnOrder = async (invoiceNumbers: string[]) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const apiUrl = `${environment.API_BASE_URL}api/return/update-return-received`;

      const response = await axios.post(
        apiUrl,
        {
          invoiceNumbers: invoiceNumbers,
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
            message:
              error.response.data?.message || "Failed to update return order",
            status: error.response.status,
            data: error.response.data,
          };
        } else if (error.request) {
          throw new Error("Network error. Please check your connection.");
        } else {
          throw new Error(error.message || "Failed to update return order");
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
    if (scanned || loading || !isFocusedRef.current) return;

    setScanned(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const scannedInvoiceNo = extractInvoiceNumber(data);

      if (!scannedInvoiceNo) {
        setModalTitle("Error");
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-2">
              The QR code is not identified please check and try again
            </Text>
          </View>,
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      // CRITICAL VALIDATION: Check if scanned invoice matches the order's invoice
      if (scannedInvoiceNo.toUpperCase() !== orderInvoiceNumber.toUpperCase()) {
        setModalTitle("Error");
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-2">
              The QR code is not identified please check and try again
            </Text>
          </View>,
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      const updatedInvoices = [...scannedInvoices, scannedInvoiceNo];
      setScannedInvoices(updatedInvoices);

      // Call API to update return order
      const result = await updateReturnOrder([scannedInvoiceNo]);

      if (result.status === "success") {
        const updatedCount = result.data.driverOrdersUpdated || 0;

        setModalTitle("Successful!");
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
              Order :{" "}
              <Text className="font-bold text-[#000000]">
                {scannedInvoiceNo}
              </Text>{" "}
              has been successfully returned to the centre.
            </Text>
          </View>,
        );
        setModalType("success");
        setShowSuccessModal(true);
      } else {
        // Set modal title based on the specific error message from backend
        let title = "Error";
        let modalMsg = result.message || "Failed to update return order";

        if (modalMsg.includes("No return orders found")) {
          title = "Order Not Found";
        } else if (modalMsg.includes("does not have permission")) {
          title = "Permission Denied";
        } else if (modalMsg.includes("already marked as Return Received")) {
          title = "Already Already Returned!";
          modalMsg = "This order has already been returned to the center and cannot proceed again!";
        }

        setModalTitle(title);
        setModalMessage(modalMsg);
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
      if (message.includes("No return orders found")) {
        title = "Order Not Found";
        message = "This order is not in 'Return' status or doesn't exist.";
      } else if (message.includes("does not have permission")) {
        title = "Permission Denied";
        message = "You don't have permission to update this order.";
      } else if (message.includes("already marked as Return Received")) {
        title = "Already Already Returned!";
        message = "This order has already been returned to the center and cannot proceed again!";
      } else if (message.includes("Network error")) {
        title = "Network Error";
        message = "Please check your internet connection and try again.";
      } else if (message.includes("Unauthorized")) {
        title = "Session Expired";
        message = "Please login again to continue.";
      } else if (error.status === 404) {
        title = "Endpoint Not Found";
        message = "The server endpoint was not found. Please contact support.";
      } else if (error.status === 500) {
        title = "Server Error";
        message = "Internal server error. Please try again later.";
      } else if (error.status === 400) {
        title = "Validation Error";
        message = error.data?.message || "Invalid invoice number format.";
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
    navigation.navigate("ReturnOrders");
  };

  const handleTimeoutModalClose = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  const handleTimeoutRescan = () => {
    setShowTimeoutModal(false);
    resetScanning();
  };

  // Show loading while permission is being checked
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <View className="bg-black/50 p-8 rounded-full">
          <ActivityIndicator size="large" color="#F7CA21" />
        </View>
        <Text className="text-white text-lg mt-4">Loading camera...</Text>
      </SafeAreaView>
    );
  }

  // Show permission denied screen
  if (!permission.granted) {
    return (
      <CameraPermissionView
        onRequestPermission={requestPermission}
        onBack={() => navigation.goBack()}
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
              Updating Return Order...
            </Text>
          </View>
        </View>
      )}

      {/* Timeout Modal */}
      <AlertModal
        visible={showTimeoutModal}
        title="Scan Timeout"
        message="The QR code could not be detected within the time limit.Please check and try again."
        type="error"
        onClose={handleTimeoutModalClose}
        showRescanButton={true}
        onRescan={handleTimeoutRescan}
        duration={4000}
        autoClose={true}
      />

      {/* Error Modal */}
      <AlertModal
        visible={showErrorModal}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleErrorModalClose}
        showRescanButton={true}
        onRescan={handleErrorModalClose}
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
          {/* Header with back button */}
          <View className="flex-row items-center justify-between px-4 py-3 relative">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="items-start mr-3"
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

export default ReturnOrderQR;
