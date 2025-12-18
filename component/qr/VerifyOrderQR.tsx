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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/component/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { AlertModal } from "../common/AlertModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

type VerifyOrderQRNavigationProp = StackNavigationProp<
  RootStackParamList,
  "VerifyOrderQR"
>;

interface VerifyOrderQRProps {
  navigation: VerifyOrderQRNavigationProp;
  route: RouteProp<RootStackParamList, "VerifyOrderQR">;
}

// Define interface for stored scan data
interface ScanData {
  orderId: number;
  invNo: string;
  scannedAt: string;
}

const SCAN_STORAGE_KEY = "@order_qr_scans";

const VerifyOrderQR: React.FC<VerifyOrderQRProps> = ({ navigation, route }) => {
  const { invNo, orderId, allOrderIds, totalToScan } = route.params;
  // Note: allOrderIds here are actually processOrderIds

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanLineAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  // Scan tracking states
  const [completedScans, setCompletedScans] = useState<number[]>([]);
  const [scanCount, setScanCount] = useState(0);

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
    loadCompletedScans();

    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Load previously completed scans
  const loadCompletedScans = async () => {
    try {
      const storedScans = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
      if (storedScans) {
        const scans: ScanData[] = JSON.parse(storedScans);
        // Filter scans for current order IDs (which are actually processOrderIds)
        const relevantScans = scans.filter((scan) =>
          allOrderIds.includes(scan.orderId)
        );
        const completedOrderIds = relevantScans.map((scan) => scan.orderId);
        setCompletedScans(completedOrderIds);
        setScanCount(completedOrderIds.length);
      }
    } catch (error) {
      console.error("Error loading completed scans:", error);
    }
  };

  // Save a successful scan
  const saveScan = async (scannedInvoice: string) => {
    try {
      const scanData: ScanData = {
        orderId,
        invNo: scannedInvoice,
        scannedAt: new Date().toISOString(),
      };

      // Get existing scans
      const storedScans = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
      let allScans: ScanData[] = [];

      if (storedScans) {
        allScans = JSON.parse(storedScans);
        // Remove any existing scan for this orderId
        allScans = allScans.filter((scan) => scan.orderId !== orderId);
      }

      // Add new scan
      allScans.push(scanData);

      // Save back to storage
      await AsyncStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(allScans));

      // Update state
      const newCompletedScans = [...completedScans, orderId];
      setCompletedScans(newCompletedScans);
      setScanCount(newCompletedScans.length);

      return true;
    } catch (error) {
      console.error("Error saving scan:", error);
      return false;
    }
  };

  // Check if all scans are completed
  const checkAllScansCompleted = () => {
    return allOrderIds.every((id) => completedScans.includes(id));
  };

  // Navigate to confirmation if all scans are done
  const navigateIfAllScanned = () => {
    if (checkAllScansCompleted()) {
      // Clear stored scans for these orders after a short delay
      setTimeout(async () => {
        try {
          const storedScans = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
          if (storedScans) {
            const allScans: ScanData[] = JSON.parse(storedScans);
            // Remove scans for these order IDs
            const remainingScans = allScans.filter(
              (scan) => !allOrderIds.includes(scan.orderId)
            );
            await AsyncStorage.setItem(
              SCAN_STORAGE_KEY,
              JSON.stringify(remainingScans)
            );
          }
        } catch (error) {
          console.error("Error clearing scans:", error);
        }
      }, 1000);

      // Navigate to confirmation screen with processOrderIds
      navigation.replace("EndJourneyConfirmation", {
        processOrderIds: allOrderIds, // Pass as processOrderIds
      });
    }
  };

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
    setLoading(false);

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

  // Verify scanned QR against provided invNo
  const verifyQRCode = async (scannedInvoice: string) => {
    setLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      console.log("Comparing:", {
        invoiceIdFromParams: invNo,
        scannedInvoice: scannedInvoice,
      });

      // Normalize both invoice IDs for comparison
      const normalizeInvoice = (invoice: string): string => {
        return invoice.toUpperCase().trim();
      };

      const normalizedParam = normalizeInvoice(invNo);
      const normalizedScanned = normalizeInvoice(scannedInvoice);

      console.log("Normalized comparison:", {
        param: normalizedParam,
        scanned: normalizedScanned,
      });

      // Check if they match
      if (normalizedParam === normalizedScanned) {
        return {
          status: "success",
          message: "QR code verified successfully",
          match: true,
        };
      } else {
        return {
          status: "error",
          message: "You have scanned the wrong package.",
          match: false,
        };
      }
    } catch (error) {
      console.error("Verification error:", error);
      return {
        status: "error",
        message: "An error occurred during verification",
        match: false,
      };
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
      const scannedInvoiceNo = extractInvoiceNumber(data);

      if (!scannedInvoiceNo) {
        setModalTitle("Invalid QR Code");
        setModalMessage(
          "The scanned QR code does not contain a valid invoice number."
        );
        setModalType("error");
        setShowErrorModal(true);
        return;
      }

      console.log("Extracted invoice from QR:", scannedInvoiceNo);
      console.log("Expected invoice from params:", invNo);

      // Verify the QR code against the provided invNo
      const result = await verifyQRCode(scannedInvoiceNo);

      if (result.status === "success" && result.match) {
        // Check if this order was already scanned
        if (completedScans.includes(orderId)) {
          setModalTitle("Already Scanned");
          setModalMessage(
            <View className="items-center">
              <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
                Package:{" "}
                <Text className="font-bold text-[#000000]">{invNo}</Text> has
                already been scanned.
              </Text>
              <Text className="text-center text-[#4E4E4E] mb-5">
                Scanned: {scanCount} of {totalToScan}
              </Text>
            </View>
          );
          setModalType("success");
          setShowSuccessModal(true);
          navigateIfAllScanned();
          return;
        }

        // Save the successful scan
        const saveSuccess = await saveScan(scannedInvoiceNo);

        if (!saveSuccess) {
          setModalTitle("Error");
          setModalMessage("Failed to save scan. Please try again.");
          setModalType("error");
          setShowErrorModal(true);
          return;
        }

        const newScanCount = scanCount + 1;

        setModalTitle("Successful!");
        // Create rich text with progress
        setModalMessage(
          <View className="items-center">
            <Text className="text-center text-[#4E4E4E] mb-3 mt-2">
              Package: <Text className="font-bold text-[#000000]">{invNo}</Text>{" "}
              has been successfully verified.
            </Text>
            <Text className="text-center text-[#4E4E4E]">
              Scanned: {newScanCount} of {totalToScan}
            </Text>
          </View>
        );
        setModalType("success");
        setShowSuccessModal(true);

        // Check if all scans are completed
        if (newScanCount === totalToScan) {
          // Navigate after a short delay to show success message
          setTimeout(() => {
            navigation.replace("EndJourneyConfirmation", {
              processOrderIds: allOrderIds, // Pass as processOrderIds
            });
          }, 2000);
        }
      } else {
        setModalTitle("Verification Failed");
        setModalMessage(
          result.message || "You have scanned the wrong package."
        );
        setModalType("error");
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error("Error processing QR scan:", error);

      setModalTitle("Error");
      setModalMessage(error.message || "Failed to verify QR code");
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
    // If not all scans are completed, go back to scan next QR
    if (!checkAllScansCompleted()) {
      navigation.goBack();
    }
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
          Please grant camera permission to verify QR codes.
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
              Verifying Package...
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

      {/* Error Modal - For verification errors (without Re-Scan button) */}
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

export default VerifyOrderQR;
