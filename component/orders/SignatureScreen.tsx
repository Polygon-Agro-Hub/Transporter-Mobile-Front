import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Signature from "react-native-signature-canvas";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useFocusEffect,
  RouteProp,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/component/types";
import * as ScreenOrientation from "expo-screen-orientation";
import CustomHeader from "../common/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { environment } from "@/environment/environment";

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

// Custom DashedBorder component
interface DashedBorderProps {
  children: React.ReactNode;
  style?: any;
  borderColor?: string;
  dashWidth?: number;
  gapWidth?: number;
  borderWidth?: number;
}

const DashedBorder = ({
  children,
  style,
  borderColor = "#2D7BFF",
  dashWidth = 10,
  gapWidth = 5,
  borderWidth = 2,
}: DashedBorderProps) => {
  return (
    <View style={[style, { position: "relative" }]}>
      {/* Top border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: borderWidth,
          flexDirection: "row",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`top-${i}`}
              style={{
                width: dashWidth,
                height: borderWidth,
                backgroundColor: borderColor,
                marginRight: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Right border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: borderWidth,
          alignItems: "center",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`right-${i}`}
              style={{
                width: borderWidth,
                height: dashWidth,
                backgroundColor: borderColor,
                marginBottom: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Bottom border */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: borderWidth,
          flexDirection: "row",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`bottom-${i}`}
              style={{
                width: dashWidth,
                height: borderWidth,
                backgroundColor: borderColor,
                marginRight: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Left border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: borderWidth,
          alignItems: "center",
        }}
      >
        {Array.from({ length: Math.ceil(1000 / (dashWidth + gapWidth)) }).map(
          (_, i) => (
            <View
              key={`left-${i}`}
              style={{
                width: borderWidth,
                height: dashWidth,
                backgroundColor: borderColor,
                marginBottom: gapWidth,
              }}
            />
          )
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1, margin: borderWidth }}>{children}</View>
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

  // Get processOrderIds from route params
  const { processOrderIds = [] } = route.params;

  // Use useFocusEffect to handle orientation changes
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const setupOrientation = async () => {
        if (!isActive) return;

        // Lock to landscape when screen is focused
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
        );
      };

      setupOrientation();

      // Cleanup function when screen loses focus
      return () => {
        isActive = false;
        // Unlock orientation when leaving this screen
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      };
    }, [])
  );

  // Also handle with useEffect as backup
  useEffect(() => {
    return () => {
      // Ensure we return to portrait when component unmounts
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureDrawn(false);
  };

  // Convert base64 to blob for file upload
  const base64ToBlob = (base64: string) => {
    // Remove data URL prefix if present
    const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: "image/png" });
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

      // Create FormData
      const formData = new FormData();

      // Prepare the signature file
      const base64Data = signatureBase64.includes(",")
        ? signatureBase64.split(",")[1]
        : signatureBase64;

      const fileName = `signature_${Date.now()}.png`;

      // Create file object for React Native
      const file = {
        uri: `data:image/png;base64,${base64Data}`,
        type: "image/png",
        name: fileName,
      };

      // Append the file to FormData
      formData.append("signature", file as any);

      // Append each processOrderId individually
      processOrderIds.forEach((id, index) => {
        formData.append(`processOrderIds[${index}]`, id.toString());
      });

      console.log("Saving signature for process orders:", processOrderIds);

      const response = await axios.post(
        `${environment.API_BASE_URL}api/order/save-signature`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      if (response.data.status === "success") {
        console.log("Signature saved successfully:", response.data);

        // Show success alert and navigate to Home
        Alert.alert(
          "Success",
          `Signature saved successfully for ${
            response.data.data.processOrdersUpdated ||
            response.data.data.totalOrders
          } order(s)`,
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("Home");
              },
            },
          ]
        );
      } else {
        throw new Error(response.data.message || "Failed to save signature");
      }
    } catch (error: any) {
      console.error("Error saving signature:", error);

      let errorMessage = "Failed to save signature. Please try again.";

      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || errorMessage;
        console.error("Server error response:", error.response.data);
      } else if (error.request) {
        // Request made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else if (error.message) {
        // Other errors
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
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
      "Are you sure you want to save this signature and mark the orders as delivered?",
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
      ]
    );
  };

  // Handle signature change (when user starts drawing)
  const handleSignatureChange = () => {
    setSignatureDrawn(true);
  };

  // CSS style for full canvas in landscape
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
      />

      {/* Order Info */}
      <View className="px-4 py-2 bg-blue-50 mx-4 mt-2 rounded-lg">
        <Text className="text-center text-sm text-gray-700">
          Signature for {processOrderIds.length} order
          {processOrderIds.length !== 1 ? "s" : ""}
          {processOrderIds.length > 0 &&
            ` (ID${
              processOrderIds.length !== 1 ? "s" : ""
            }: ${processOrderIds.join(", ")})`}
        </Text>
      </View>

      {/* SIGNATURE AREA */}
      <View className="flex-1 mx-4 mb-4 mt-2">
        <DashedBorder
          style={{
            backgroundColor: "#DFEDFC",
            flex: 1,
            borderRadius: 16,
            overflow: "hidden",
          }}
          borderColor="#2D7BFF"
          dashWidth={12}
          gapWidth={8}
          borderWidth={2}
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
          </View>
        </DashedBorder>
      </View>

      {/* BOTTOM BUTTONS */}
      <View className="flex-row justify-between items-center px-4 pb-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-row items-center bg-white border border-gray-300 px-6 py-3 rounded-full"
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
                  "Please draw a signature before submitting"
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
    </View>
  );
}
