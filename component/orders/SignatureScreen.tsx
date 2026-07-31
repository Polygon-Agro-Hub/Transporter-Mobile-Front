import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Signature from "react-native-signature-canvas";
import { Svg, Rect } from "react-native-svg";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import * as ScreenOrientation from "expo-screen-orientation";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import CustomHeader from "../common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";
import { AlertModal } from "@/component/common/AlertModal";

type SignatureScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SignatureScreen"
>;

type SignatureScreenRouteProp = RouteProp<
  RootStackParamList,
  "SignatureScreen"
>;

interface SignatureScreenProps {
  navigation: SignatureScreenNavigationProp;
  route: SignatureScreenRouteProp;
}

interface DashedBorderProps {
  children: React.ReactNode;
  style?: any;
  borderColor?: string;
  dashWidth?: number;
  gapWidth?: number;
  borderWidth?: number;
  borderRadius?: number;
  backgroundColor?: string;
}

const DashedBorder = ({
  children,
  style,
  borderColor = "#2D7BFF",
  dashWidth = 10,
  gapWidth = 5,
  borderWidth = 2,
  borderRadius = 12,
  backgroundColor = "#DFEDFC",
}: DashedBorderProps) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={[style, { position: "relative" }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Rect
            x={borderWidth / 2}
            y={borderWidth / 2}
            width={size.width - borderWidth}
            height={size.height - borderWidth}
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            stroke={borderColor}
            strokeWidth={borderWidth}
            strokeDasharray={`${dashWidth}, ${gapWidth}`}
          />
        </Svg>
      )}

      <View
        style={{
          flex: 1,
          margin: borderWidth,
          backgroundColor,
          borderRadius: borderRadius - borderWidth,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default function SignatureScreen({
  route,
  navigation,
}: SignatureScreenProps) {
  const signatureRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<
    string | React.ReactNode
  >("");

  const {
    processOrderIds = [],
    allProcessOrderIds = [],
    remainingOrders = [],
    onOrderComplete,
  } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const [isOrientationLocked, setIsOrientationLocked] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const setupOrientation = async () => {
        if (!isActive) return;

        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
        );
        if (isActive) {
          setIsOrientationLocked(true);
        }
      };

      setupOrientation();

      return () => {
        isActive = false;
        setIsOrientationLocked(false);
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      };
    }, []),
  );

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureDrawn(false);
  };

  const saveSignature = async (signatureBase64: string) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        navigation.navigate("Login");
        return;
      }

      if (!processOrderIds || processOrderIds.length === 0) {
        Alert.alert("Error", "No order IDs provided");
        return;
      }

      // ── Get current GPS location ──────────────────────────────────────────
      let latitude: string = "";
      let longitude: string = "";
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = location.coords.latitude.toString();
          longitude = location.coords.longitude.toString();
        } else {
          console.warn("Location permission denied – coordinates will not be saved.");
        }
      } catch (locErr) {
        console.warn("Could not fetch location:", locErr);
      }

      const base64Data = signatureBase64.includes(",")
        ? signatureBase64.split(",")[1]
        : signatureBase64;

      const fileName = `signature_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      const parameters: Record<string, string> = {};
      processOrderIds.forEach((id, index) => {
        parameters[`processOrderIds[${index}]`] = id.toString();
      });

      // Attach GPS coordinates if available
      if (latitude) parameters["latitude"] = latitude;
      if (longitude) parameters["longitude"] = longitude;

      const uploadResult = await FileSystem.uploadAsync(
        `${environment.API_BASE_URL}api/order/save-signature`,
        fileUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'signature',
          mimeType: 'image/png',
          parameters,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = { data: JSON.parse(uploadResult.body) };

      if (response.data.status === "success") {
        if (onOrderComplete) {
          onOrderComplete(processOrderIds[0]);
        }

        const invoiceNumbers: string[] =
          response.data.data?.invoiceNumbers || [];

        let message: string | React.ReactNode;

        if (invoiceNumbers.length === 0) {
          message = "Signature saved successfully and order completed!";
        } else if (invoiceNumbers.length === 1) {
          message = (
            <View className="items-center">
              <Text className="text-center text-[#4E4E4E] mb-5 mt-2">
                Order:{" "}
                <Text className="font-bold text-[#000000]">
                  {invoiceNumbers[0]}
                </Text>{" "}
                has been completed successfully!
              </Text>
            </View>
          );
        } else {
          message = (
            <View className="items-center">
              <Text className="text-center text-[#4E4E4E] mb-2">Orders:</Text>
              {invoiceNumbers.map((invNo: string, index: number) => (
                <Text
                  key={index}
                  className="text-center font-bold text-[#000000] mb-1"
                >
                  {invNo}
                </Text>
              ))}
              <Text className="text-center text-[#4E4E4E] mt-2">
                have been completed successfully!
              </Text>
            </View>
          );
        }

        setSuccessMessage(message);
        setShowSuccessModal(true);

        setTimeout(() => {
          if (showSuccessModal) {
            setShowSuccessModal(false);
            handleNavigationAfterSuccess();
          }
        }, 4000);
      } else {
        throw new Error(response.data.message || "Failed to save signature");
      }
    } catch (error: any) {
      console.error("Error saving signature:", error);

      let errorMessage = "Failed to save signature. Please try again.";

      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        console.error("Server error response:", error.response.data);
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationAfterSuccess = () => {
    navigation.navigate("Jobs");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    handleNavigationAfterSuccess();
  };

  const handleOK = async (signature: string) => {
    if (!signature) {
      Alert.alert("Warning", "Please draw a signature before submitting");
      return;
    }

    if (!processOrderIds || processOrderIds.length === 0) {
      Alert.alert("Error", "No order IDs available");
      return;
    }

    Alert.alert(
      "Confirm Signature",
      "Are you sure you want to save this signature and mark the order as delivered?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Save",
          onPress: async () => {
            await saveSignature(signature);
          },
        },
      ],
    );
  };

  const handleSignatureChange = () => {
    setSignatureDrawn(true);
  };

  const signatureStyle = `
    .m-signature-pad {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      box-shadow: none;
    }
    .m-signature-pad--body {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      border: none;
      width: 100% !important;
      height: 100% !important;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #DFEDFC;
    }
    canvas {
      background-color: #DFEDFC;
      width: 100% !important;
      height: 100% !important;
      touch-action: none;
    }
  `;

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Customer's Digital Signature"
        showBackButton={true}
        showLanguageSelector={false}
        navigation={navigation}
        onBackPress={handleBackPress}
      />

      {/* SIGNATURE AREA */}
      <View className="flex-1 mx-10 mb-4 mt-2">
        <View style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}>
          <DashedBorder
            style={{ flex: 1 }}
            backgroundColor="#DFEDFC"
            borderColor="#2D7BFF"
            dashWidth={15}
            gapWidth={8}
            borderWidth={3}
            borderRadius={12}
          >
            {/* CLEAR BUTTON */}
            <TouchableOpacity
              onPress={handleClear}
              className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg flex-row items-center z-10"
              style={{
                elevation: 10,
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}
              disabled={loading}
            >
              <FontAwesome6 name="eraser" size={16} color="#2D7BFF" />
              <Text className="ml-2 text-[#2D7BFF] font-semibold">Clear</Text>
            </TouchableOpacity>

            {/* SIGNATURE CANVAS */}
            <View style={{ flex: 1 }}>
              {isOrientationLocked ? (
                <Signature
                  ref={signatureRef}
                  onOK={handleOK}
                  onEnd={handleSignatureChange}
                  webStyle={signatureStyle}
                  autoClear={false}
                  descriptionText=""
                  style={{
                    flex: 1,
                    backgroundColor: "#DFEDFC",
                  }}
                />
              ) : (
                <View className="flex-1 justify-center items-center bg-[#DFEDFC]">
                  <ActivityIndicator size="large" color="#2D7BFF" />
                  <Text className="mt-2 text-[#2D7BFF] font-semibold">Preparing signature canvas...</Text>
                </View>
              )}
            </View>
          </DashedBorder>
        </View>
      </View>

      {/* BOTTOM BUTTONS */}
      <View className="flex-row justify-between items-center px-4 pb-4">
        <TouchableOpacity
          onPress={handleBackPress}
          className="flex-row items-center bg-[#DFE5F2] border border-[#DFE5F2] px-6 py-3 rounded-full"
          disabled={loading}
        >
          <Ionicons name="close" size={20} color="black" />
          <Text className="text-black font-medium ml-2">Cancel</Text>
        </TouchableOpacity>

        {loading ? (
          <View className="flex-row items-center bg-gray-300 px-6 py-3 rounded-full">
            <ActivityIndicator size="small" color="#000" />
            <Text className="font-semibold text-black ml-2">Saving...</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {
              if (!signatureDrawn) {
                Alert.alert(
                  "Warning",
                  "Please draw a signature before submitting",
                );
                return;
              }

              if (signatureRef.current) {
                signatureRef.current.readSignature();
              }
            }}
            className="flex-row items-center bg-[#F7CA21] px-6 py-3 rounded-full"
            disabled={!signatureDrawn || loading}
            style={{ opacity: signatureDrawn ? 1 : 0.5 }}
          >
            <FontAwesome6 name="check" size={18} color={"black"} />
            <Text className="font-semibold text-black ml-2">Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Success Alert Modal */}
      <AlertModal
        visible={showSuccessModal}
        title="Successful!"
        message={successMessage}
        type="success"
        onClose={handleSuccessModalClose}
        autoClose={true}
        duration={3000}
      />
    </View>
  );
}