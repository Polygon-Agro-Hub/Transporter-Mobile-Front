import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Entypo } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "../common/AlertModal";
import { CameraPermissionView } from "../common/CameraPermissionView";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { formatNumberWithCommas } from "@/utils/formatNumberWithCommas";

type ReceivedCashQRNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReceivedCashQR"
>;

type OrderReturnRouteProp = RouteProp<RootStackParamList, "ReceivedCashQR">;

interface ReceivedCashQRProps {
  navigation: ReceivedCashQRNavigationProp;
  route: OrderReturnRouteProp;
}

const ReceivedCashQR: React.FC<ReceivedCashQRProps> = ({
  navigation,
  route,
}) => {
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
        setModalTitle("Error!");
        setModalMessage(
          "The QR code is not identified.\nPlease check and try again.",
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

  const validateOfficerType = (officerId: string): boolean => {
    return officerId.toUpperCase().startsWith("DCM");
  };

  const extractOfficerId = (qrData: string): string | null => {
    try {
      const trimmed = qrData.trim();

      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);

          if (parsed.empId) return String(parsed.empId);
          if (parsed.officerId) return String(parsed.officerId);
          if (parsed.officer_id) return String(parsed.officer_id);
          if (parsed.officerID) return String(parsed.officerID);
          if (parsed.employeeId) return String(parsed.employeeId);
          if (parsed.employee_id) return String(parsed.employee_id);
          if (parsed.userId) return String(parsed.userId);
          if (parsed.user_id) return String(parsed.user_id);
          if (parsed.id) return String(parsed.id);
        } catch (e) {
          console.error(e);
        }
      }

      const simplePattern = /^[A-Z0-9]{3,20}$/i;
      if (simplePattern.test(trimmed)) {
        return trimmed;
      }

      const dcmPattern = /\b(DCM[A-Z0-9]+)\b/i;
      const dcmMatch = trimmed.match(dcmPattern);
      if (dcmMatch) return dcmMatch[1];

      return null;
    } catch (error) {
      console.error("Error extracting officer ID:", error);
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
      const officerId = extractOfficerId(data);

      if (!officerId) {
        setModalTitle("Error!");
        setModalMessage(
          "The QR code is not identified.\nPlease check and try again.",
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      if (!validateOfficerType(officerId)) {
        setModalTitle("Error!");
        setModalMessage(
          "Cash can be received only by a Distribution Centre Manager. Please scan a valid Centre Manager's QR code.",
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      setLoading(true);

      const storedItems = await AsyncStorage.getItem("selectedCashItems");

      if (!storedItems) {
        throw new Error("No items selected");
      }

      const selectedItems = JSON.parse(storedItems);
      const totalAmount = selectedItems.reduce(
        (sum: number, item: any) => sum + (item.amount || 0),
        0,
      );

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const driverId = (await AsyncStorage.getItem("empid")) || "";
      const formattedAmount = formatNumberWithCommas(totalAmount);

      const orderIds = selectedItems.map((item: any) => item.id);

      const officerRes = await axios.get(
        `${environment.API_BASE_URL}api/home/get-officer-details/${officerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (officerRes.data.status !== "success") {
        throw new Error(
          officerRes.data.message || "Failed to validate officer",
        );
      }

      const {
        mobileNumber,
        empId: validatedEmpId,
        firstNameEnglish,
        lastNameEnglish,
      } = officerRes.data.data;

      if (!mobileNumber) {
        throw new Error("Officer does not have a registered mobile number");
      }

      const otpRes = await axios.post(
        "https://api.getshoutout.com/otpservice/send",
        {
          source: "PolygonAgro",
          transport: "sms",
          content: {
            sms: `${driverId} has sent you Rs. ${formattedAmount}. Enter OTP {{code}} to confirm the payment.`,
          },
          destination: mobileNumber,
        },
        {
          headers: {
            Authorization: `Apikey ${environment.SHOUTOUT_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      if (!otpRes.data.referenceId) {
        throw new Error("Failed to send OTP to officer");
      }

      await AsyncStorage.setItem("referenceId", otpRes.data.referenceId);
      await AsyncStorage.setItem("isNavigatingToQR", "true");

      setLoading(false);

      navigation.navigate("CashHandOverOTP", {
        orderIds,
        officerId: validatedEmpId,
        totalAmount,
        mobileNumber,
        officerName:
          `${firstNameEnglish || ""} ${lastNameEnglish || ""}`.trim(),
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to verify officer. Please try again.";

      let errorTitle = "Error!";
      if (errorMessage.includes("not assigned to this centre")) {
        errorTitle = "Centre Mismatch";
      } else if (errorMessage.includes("not in an approved status")) {
        errorTitle = "Manager Not Approved";
      } else if (errorMessage.includes("Officer not found")) {
        errorTitle = "Officer Not Found";
      } else if (errorMessage.includes("No orders")) {
        errorTitle = "No Orders Found";
      } else if (errorMessage.includes("mobile number")) {
        errorTitle = "No Mobile Number";
      } else if (
        errorMessage.includes("Network") ||
        error.code === "ECONNABORTED"
      ) {
        errorTitle = "Network Error";
      }

      setModalTitle(errorTitle);
      setModalMessage(errorMessage);
      setModalType("error");
      setShowErrorModal(true);
      setLoading(false);
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
      {/* Loading Overlay */}
      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/70 z-50 justify-center items-center">
          <View className="bg-black/80 p-6 rounded-xl items-center">
            <ActivityIndicator size="large" color="#F7CA21" />
            <Text className="text-white text-lg font-semibold mt-4">
              Verifying Officer...
            </Text>
          </View>
        </View>
      )}

      {/* Timeout Modal */}
      <AlertModal
        visible={showTimeoutModal}
        title="Error!"
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
        type="error"
        onClose={handleErrorModalClose}
        onRescan={handleTimeoutRescan}
        showRescanButton={true}
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

          {/* Scan Frame */}
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
              {/* Camera */}
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

              {/* Corner - Top Left */}
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

              {/* Corner - Top Right */}
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

              {/* Corner - Bottom Left */}
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

              {/* Corner - Bottom Right */}
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

export default ReceivedCashQR;
