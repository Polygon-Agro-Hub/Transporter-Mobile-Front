import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  BackHandler,
  StyleSheet,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
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

  const extractDcmEmpId = (qrData: string): string | null => {
    try {
      if (!qrData || typeof qrData !== "string") return null;
      const trimmed = qrData.trim();

      // Check if QR is JSON containing DCM empId
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const emp =
            parsed.empId ||
            parsed.empid ||
            parsed.officerEmpId ||
            parsed.dcmEmpId;
          if (emp && String(emp).toUpperCase().startsWith("DCM")) {
            return String(emp).trim().toUpperCase();
          }
        } catch (e) {}
      }

      // Check if QR matches DCM pattern
      const dcmMatch = trimmed.match(/DCM[A-Za-z0-9]+/i);
      if (dcmMatch) {
        return dcmMatch[0].toUpperCase();
      }

      if (trimmed.toUpperCase().startsWith("DCM")) {
        return trimmed.toUpperCase();
      }

      return null;
    } catch (error) {
      console.error("Error extracting DCM empId:", error);
      return null;
    }
  };

  const extractInvoiceNumber = (qrData: string): string | null => {
    try {
      if (!qrData || typeof qrData !== "string") return null;
      const trimmed = qrData.trim();

      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const inv =
            parsed.invNo ||
            parsed.invoiceNo ||
            parsed.invoiceNumber ||
            parsed.orderId ||
            parsed.id;
          if (inv) return String(inv).trim();
        } catch (e) {}
      }

      const alphanumericMatches = trimmed.match(/[A-Za-z0-9]+/g);
      if (alphanumericMatches && alphanumericMatches.length > 0) {
        return alphanumericMatches[0];
      }

      return trimmed;
    } catch (error) {
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
      const dcmEmpId = extractDcmEmpId(data);
      const scannedInvoice = extractInvoiceNumber(data);

      const targetDcm = dcmEmpId || "";

      // If neither DCM nor valid scan data:
      if (!dcmEmpId && !scannedInvoice && !data) {
        setModalTitle("Error!");
        setModalMessage(
          "The QR code is not identified. Please check and try again.",
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      // If scanned data is an order/package invoice code, verify it matches this order if known
      if (!dcmEmpId && scannedInvoice && orderInvoiceNumber) {
        const cleanScanned = scannedInvoice
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase();
        const cleanExpected = orderInvoiceNumber
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase();
        const cleanOrderId = String(orderId).toUpperCase();

        if (
          !cleanScanned.includes(cleanExpected) &&
          !cleanExpected.includes(cleanScanned) &&
          !cleanScanned.includes(cleanOrderId)
        ) {
          setModalTitle("Error!");
          setModalMessage(
            "The QR code does not match this return order. Please scan the correct package QR or Centre Manager QR.",
          );
          setModalType("error");
          setShowErrorModal(true);
          return;
        }
      }

      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setModalTitle("Error!");
        setModalMessage("Authentication token not found. Please login again.");
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      const response = await axios.post(
        `${environment.API_BASE_URL}api/return/scan-dcm-generate-otp`,
        {
          orderId,
          invoiceNumber: orderInvoiceNumber || scannedInvoice || data,
          dcmEmpId: targetDcm,
        },
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
        setScanned(false);
        navigation.navigate("ReturnOrderOTPVerification", {
          orderId,
          invoiceNumber: response.data.data?.invoiceNumber || orderInvoiceNumber,
          dcmEmpId: response.data.data?.dcmEmpId || targetDcm || "Manager",
          drvOrderId: response.data.data?.drvOrderId,
        });
      } else {
        setModalTitle("Error!");
        setModalMessage(
          response.data?.message || "Failed to verify QR code",
        );
        setModalType("error");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      setLoading(false);
      console.error("Error processing QR scan:", error);
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to process QR code";
      setModalTitle("Error!");
      setModalMessage(errMsg);
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
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <View className="bg-black/50 p-8 rounded-full">
          <ActivityIndicator size="large" color="#F7CA21" />
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
              Align the QR code within the frame to scan
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ReturnOrderQR;
