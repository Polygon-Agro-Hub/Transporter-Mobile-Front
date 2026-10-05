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
import { Entypo } from "@expo/vector-icons";
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

const GENERIC_QR_ERROR =
  "The QR code is not identified. Please check and try again.";
const ALREADY_RETURNED_MSG =
  "This order has already been returned to the center and cannot proceed again!";
const DCM_QR_REQUIRED_MSG =
  "Invalid QR. Please scan your Distribution Centre Manager's QR code.";
const CENTER_MISMATCH_MSG =
  "This manager belongs to a different distribution center. Please scan your own center's DCM QR code.";

const ReturnOrderQR: React.FC<ReturnOrderQRProps> = ({ navigation, route }) => {
  const { orderId, invoiceNumber: routeInvoiceNumber } = (route.params ||
    {}) as any;

  const [permission, requestPermission, getPermission] = useCameraPermissions();
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

  const [orderInvoiceNumber, setOrderInvoiceNumber] = useState<string>(
    routeInvoiceNumber || "",
  );

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
    if (routeInvoiceNumber) {
      setOrderInvoiceNumber(routeInvoiceNumber);
    }
    if (!orderId) return;

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
        const orders = response.data.data.returnOrders || [];
        const currentOrder = orders.find(
          (order: any) => order.orderId === orderId,
        );

        if (currentOrder) {
          setOrderInvoiceNumber(currentOrder.invoiceNumber);
        }
      }
    } catch (error: any) {
      console.error("Error fetching order details:", error);
    }
  };

  const startTimeoutTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (!scanned && !loading && isFocusedRef.current) {
        setModalTitle("Scan Timeout");
        setModalMessage(GENERIC_QR_ERROR);
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

  // Extracts a DCM officer empId from the QR payload.
  const extractDcmEmpId = (qrData: string): string | null => {
    try {
      if (!qrData || typeof qrData !== "string") return null;
      const trimmed = qrData.trim();

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
        return null;
      }

      const dcmMatch = trimmed.match(/DCM[-_]?[A-Za-z0-9]{2,20}/i);
      if (dcmMatch) {
        return dcmMatch[0].replace(/[-_]/g, "").toUpperCase();
      }

      return null;
    } catch (error) {
      console.error("Error extracting DCM empId:", error);
      return null;
    }
  };

  // Extracts an order/invoice number from the QR payload.
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
        return null;
      }

      const numericMatch = trimmed.match(/\b[0-9]{6,15}\b/);
      if (numericMatch) {
        return numericMatch[0];
      }

      const invMatch = trimmed.match(/INV[-_]?[0-9]{4,15}/i);
      if (invMatch) {
        return invMatch[0].replace(/[-_]/g, "").toUpperCase();
      }

      const looseCodePattern = /^[A-Z0-9][A-Z0-9\-_:]{3,29}$/i;
      if (looseCodePattern.test(trimmed)) {
        return trimmed;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Decide which error modal to show from a backend response / error.
  const showScanError = (
    currentStatus?: string,
    message?: string,
    errorType?: string,
  ) => {
    const msg = (message || "").toLowerCase();

    if (errorType === "CENTER_MISMATCH") {
      setModalTitle("Invalid Center!");
      setModalMessage(CENTER_MISMATCH_MSG);
    } else if (errorType === "INVALID_QR") {
      setModalTitle("Invalid QR!");
      setModalMessage(GENERIC_QR_ERROR);
    } else if (errorType === "DCM_QR_REQUIRED") {
      setModalTitle("Invalid QR!");
      setModalMessage(DCM_QR_REQUIRED_MSG);
    } else if (errorType === "DCM_NOT_ACTIVE") {
      setModalTitle("Error!");
      setModalMessage("This Distribution Centre Manager is not active.");
    } else if (
      currentStatus === "Return Received" ||
      currentStatus === "Return" ||
      msg.includes("already been marked as return received") ||
      msg.includes("already been returned") ||
      msg.includes("already returned") ||
      msg.includes("return received") ||
      msg.includes("cannot proceed again")
    ) {
      setModalTitle("Already Returned!");
      setModalMessage(ALREADY_RETURNED_MSG);
    } else {
      setModalTitle("Error!");
      setModalMessage(GENERIC_QR_ERROR);
    }
    setModalType("error");
    setShowErrorModal(true);
  };

  const handleBarCodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (isProcessingRef.current || scanned || loading || !isFocusedRef.current)
      return;

    isProcessingRef.current = true;
    setScanned(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const dcmEmpId = extractDcmEmpId(data);
      const scannedInvoice = extractInvoiceNumber(data);

      const targetDcm = dcmEmpId || "";

      const normInv = (v: any) =>
        String(v || "")
          .replace(/[#\s_-]/g, "")
          .toUpperCase();

      // Accept either a DCM QR, or THIS order's invoice QR. Anything else = error.
      if (!dcmEmpId) {
        const matchesThisOrder =
          !!scannedInvoice &&
          (!orderInvoiceNumber ||
            normInv(scannedInvoice) === normInv(orderInvoiceNumber));

        if (!matchesThisOrder) {
          setModalTitle("Invalid QR!");
          setModalMessage(GENERIC_QR_ERROR);
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
          invoiceNumber: dcmEmpId
            ? orderInvoiceNumber || scannedInvoice || ""
            : scannedInvoice || orderInvoiceNumber,
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

      const confirmedDcm = String(response.data?.data?.dcmEmpId || "")
        .trim()
        .toUpperCase();

      const dcmOk = !targetDcm || confirmedDcm === targetDcm.toUpperCase();

      if (response.data && response.data.status === "success" && dcmOk) {
        setScanned(false);
        navigation.navigate("ReturnOrderOTPVerification", {
          orderId,
          invoiceNumber:
            response.data.data?.invoiceNumber || orderInvoiceNumber,
          dcmEmpId: response.data.data?.dcmEmpId || targetDcm || "Manager",
          drvOrderId: response.data.data?.drvOrderId,
        });
      } else {
        showScanError(
          response.data?.currentStatus,
          response.data?.message,
          response.data?.errorType,
        );
      }
    } catch (error: any) {
      setLoading(false);
      console.error("Error processing QR scan:", error);

      if (error.response?.status === 401 && !error.response?.data?.errorType) {
        navigation.navigate("Login");
        return;
      }

      showScanError(
        error.response?.data?.currentStatus || error.data?.currentStatus,
        error.response?.data?.message || error.message || "",
        error.response?.data?.errorType,
      );
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
        returnScreen="ReturnOrderQR"
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
      {/* Loading Overlay */}
      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 z-50 justify-center items-center">
          <View className="bg-black/80 p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#F7CA21" />
            <Text className="text-white text-lg font-semibold mt-4">
              Checking Return Order
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
        onBarcodeScanned={scanned || loading ? undefined : handleBarCodeScanned}
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
